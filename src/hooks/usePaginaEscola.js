import { useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { collection, database, documentId, getDocs, limit, orderBy, query, startAfter, where } from '../services/backend';
import { mensagemDados } from '../domain/errosDados';

// A paginação acontece no Firestore. Cada busca lê no máximo tamanho + 1 documentos.
export function usePaginaEscola(nome, escola, filtros = [], tamanho = 12) {
  const focada = useIsFocused(), geracao = useRef(0), trava = useRef(false);
  const [estado, setEstado] = useState({ dados: [], carregando: false, erro: null, temMais: false });
  const [cursores, setCursores] = useState([null]), [pagina, setPagina] = useState(0), [tentativa, setTentativa] = useState(0);
  const chave = JSON.stringify([nome, escola, filtros, tamanho]);
  const chaveAtual = useRef(chave);
  useEffect(() => { setCursores([null]); setPagina(0); }, [chave]);
  useEffect(() => {
    if (!focada || !escola) return;
    const atual = ++geracao.current;
    const mudou = chaveAtual.current !== chave;
    chaveAtual.current = chave;
    const cursor = mudou ? null : cursores[pagina];
    trava.current = true;
    setEstado({ dados: [], carregando: true, erro: null, temMais: false });
    const termos = [where('escola', '==', escola), ...filtros.map(f => where(...f)), orderBy(documentId()), ...(cursor ? [startAfter(cursor)] : []), limit(tamanho + 1)];
    getDocs(query(collection(database, nome), ...termos)).then(snap => {
      if (geracao.current !== atual) return;
      const docs = snap.docs.slice(0, tamanho);
      setEstado({ dados: docs.map(d => ({ ...d.data(), id: d.id })), carregando: false, erro: null, temMais: snap.size > tamanho, ultimo: docs.at(-1) });
    }).catch(erro => {
      if (geracao.current === atual) setEstado({ dados: [], carregando: false, erro: mensagemDados(erro), temMais: false });
    }).finally(() => { if (geracao.current === atual) trava.current = false; });
    return () => { geracao.current += 1; trava.current = false; };
  }, [chave, pagina, tentativa, focada]);
  return { ...estado, pagina: pagina + 1, tentarNovamente: () => setTentativa(v => v + 1),
    proxima: () => { if (!trava.current && estado.temMais) { setCursores(c => [...c.slice(0, pagina + 1), estado.ultimo]); setPagina(p => p + 1); } },
    anterior: () => { if (!trava.current) setPagina(p => Math.max(0, p - 1)); },
  };
}