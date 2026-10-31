import { useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  collection,
  database,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from '../services/backend';
import { mensagemDados } from '../domain/errosDados';

// A paginação acontece no Firestore. Cada busca lê no máximo tamanho + 1 documentos.
export function usePaginaEscola(nome, escola, filtros = [], tamanho = 12) {
  const focada = useIsFocused(),
    geracao = useRef(0),
    trava = useRef(false);
  const [estado, setEstado] = useState({
    dados: [],
    carregando: false,
    erro: null,
    temMais: false,
  });
  const [cursores, setCursores] = useState([null]),
    [pagina, setPagina] = useState(0),
    [tentativa, setTentativa] = useState(0);
  const chave = JSON.stringify([nome, escola, filtros, tamanho]);
  const chaveAtual = useRef(chave);
  useEffect(() => {
    setCursores([null]);
    setPagina(0);
  }, [chave]);
  useEffect(() => {
    if (!focada || !escola) return;
    const atual = ++geracao.current;
    const mudou = chaveAtual.current !== chave;
    chaveAtual.current = chave;
    const cursor = mudou ? null : cursores[pagina];
    trava.current = true;
    setEstado({
      dados: [],
      carregando: true,
      erro: null,
      temMais: false,
    });
    const termos = [
      where('escola', '==', escola),
      ...filtros.map((filtroConsulta) => where(...filtroConsulta)),
      orderBy(documentId()),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(tamanho + 1),
    ];
    getDocs(query(collection(database, nome), ...termos))
      .then((documentoConsultado) => {
        if (geracao.current !== atual) return;
        const documentos = documentoConsultado.docs.slice(0, tamanho);
        setEstado({
          dados: documentos.map((documento) => ({
            ...documento.data(),
            id: documento.id,
          })),
          carregando: false,
          erro: null,
          temMais: documentoConsultado.size > tamanho,
          ultimo: documentos.at(-1),
        });
      })
      .catch((erro) => {
        if (geracao.current === atual)
          setEstado({
            dados: [],
            carregando: false,
            erro: mensagemDados(erro),
            temMais: false,
          });
      })
      .finally(() => {
        if (geracao.current === atual) trava.current = false;
      });
    return () => {
      geracao.current += 1;
      trava.current = false;
    };
  }, [chave, pagina, tentativa, focada]);
  return {
    ...estado,
    pagina: pagina + 1,
    tentarNovamente: () => setTentativa((valor) => valor + 1),
    proxima: () => {
      if (!trava.current && estado.temMais) {
        setCursores((cursoresAtuais) => [...cursoresAtuais.slice(0, pagina + 1), estado.ultimo]);
        setPagina((paginaAtual) => paginaAtual + 1);
      }
    },
    anterior: () => {
      if (!trava.current) setPagina((paginaAtual) => Math.max(0, paginaAtual - 1));
    },
  };
}
