import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged } from '../services/backend';

const ContextoSessao = createContext(null);
export function ProvedorSessao({ children }) {
  const [sessao, setSessao] = useState({ usuario: null, carregando: true, erro: null });
  useEffect(() => onAuthStateChanged(auth,
    usuario => setSessao({ usuario, carregando: false, erro: null }),
    () => setSessao({ usuario: null, carregando: false, erro: 'Não foi possível restaurar sua sessão.' }),
  ), []);
  return <ContextoSessao.Provider value={sessao}>{children}</ContextoSessao.Provider>;
}
export function useSessao() {
  return useContext(ContextoSessao) || { usuario: auth.currentUser, carregando: false, erro: null };
}