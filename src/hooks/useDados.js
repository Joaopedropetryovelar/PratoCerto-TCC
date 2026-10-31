import { escolaValida } from '../domain/escolas';
import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useSessao } from './useSessao';
import { auth, database, doc, onSnapshot } from '../services/backend';
import { escutarConsulta } from '../services/consultas';
import { mensagemDados } from '../domain/errosDados';
export function useColecao(nome, filtros = [], habilitado = true) {
  const focada = useIsFocused();
  habilitado = habilitado && focada;
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [tentativa, setTentativa] = useState(0);
  const chaveFiltros = JSON.stringify(filtros);
  useEffect(() => {
    let ativo = true,
      parar = () => {};
    setCarregando(habilitado);
    setErro(null);
    setDados([]);
    if (!habilitado) {
      setDados([]);
      return;
    }
    function falhar(falha) {
      if (ativo) {
        setDados([]);
        setErro(mensagemDados(falha));
        setCarregando(false);
      }
    }
    try {
      parar = escutarConsulta(
        nome,
        filtros,
        (lista) => {
          if (!ativo) return;
          setDados(lista);
          setErro(null);
          setCarregando(false);
        },
        falhar,
        () => {
          if (ativo) {
            setDados([]);
            setCarregando(true);
          }
        },
      );
    } catch (falha) {
      falhar(falha);
    }
    return () => {
      ativo = false;
      parar();
    };
  }, [nome, chaveFiltros, tentativa, habilitado]);
  return {
    dados,
    carregando,
    erro,
    tentarNovamente: () => setTentativa((atual) => atual + 1),
  };
}
export function useDocumento(nome, identificador) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(Boolean(identificador));
  const [erro, setErro] = useState(null);
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    let ativo = true,
      parar = () => {};
    setCarregando(Boolean(identificador));
    setErro(null);
    setDados(null);
    if (!identificador) return;
    function falhar(falha) {
      if (ativo) {
        setDados(null);
        setErro(mensagemDados(falha));
        setCarregando(false);
      }
    }
    try {
      parar = onSnapshot(
        doc(database, nome, identificador),
        (snapshot) => {
          if (!ativo) return;
          setDados(
            snapshot.exists()
              ? {
                  ...snapshot.data(),
                  id: snapshot.id,
                }
              : null,
          );
          setCarregando(false);
        },
        falhar,
      );
    } catch (falha) {
      falhar(falha);
    }
    return () => {
      ativo = false;
      parar();
    };
  }, [nome, identificador, tentativa]);
  return {
    dados,
    carregando,
    erro,
    tentarNovamente: () => setTentativa((atual) => atual + 1),
  };
}
export function usePerfil() {
  const sessao = useSessao();
  const identificadorUsuario = sessao.usuario?.uid;
  const documento = useDocumento('usuarios', identificadorUsuario);
  return {
    perfil: documento.dados,
    carregando: sessao.carregando || documento.carregando,
    erro:
      documento.erro ||
      (documento.dados?.acessoAtivo === false ? 'Seu acesso foi desativado pela direção.' : null) ||
      (documento.dados && !['aluno', 'admin'].includes(documento.dados.tipoConta)
        ? 'Seu tipo de conta precisa ser conferido pela equipe.'
        : null) ||
      (documento.dados && !escolaValida(documento.dados.escola)
        ? 'Seu perfil precisa de uma escola válida. Procure a equipe.'
        : null) ||
      (!documento.carregando && !documento.dados
        ? 'Seu perfil não foi encontrado. Entre novamente.'
        : null),
    tentarNovamente: documento.tentarNovamente,
  };
}
export function useColecaoEscola(nome, perfil, filtros = [], habilitado = true) {
  const escola = perfil?.escola;
  return useColecao(
    nome,
    [['escola', '==', escola || ''], ...filtros],
    Boolean(escola) && habilitado,
  );
}
