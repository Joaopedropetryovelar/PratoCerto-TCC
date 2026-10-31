import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, signOut } from '../services/backend';

const ContextoSessao = createContext(null);
export function ProvedorSessao({ children }) {
  const [sessao, setSessao] = useState({ usuario: null, carregando: true, erro: null });
  useEffect(() => {
    let ativo = true, primeiraNotificacao = true;
    function falhar() {
      if (ativo) setSessao({ usuario: null, carregando: false, erro: 'Não foi possível preparar o acesso. Feche e abra o aplicativo.' });
    }
    const parar = onAuthStateChanged(auth, usuario => {
      if (!ativo) return;
      if (primeiraNotificacao) {
        primeiraNotificacao = false;
        // Uma abertura completa exige login. O segundo plano preserva a sessão atual.
        if (usuario) {
          Promise.resolve().then(() => signOut(auth)).catch(falhar);
          return;
        }
      }
      setSessao({ usuario, carregando: false, erro: null });
    }, falhar);
    return () => { ativo = false; parar(); };
  }, []);
  return <ContextoSessao.Provider value={sessao}>{children}</ContextoSessao.Provider>;
}
export function useSessao() {
  return useContext(ContextoSessao) || { usuario: auth.currentUser, carregando: false, erro: null };
}