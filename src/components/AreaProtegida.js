import React, { useEffect } from 'react';
import { auth, signOut } from '../services/backend';
import { usePerfil } from '../hooks/useDados';
import { Botao, Carregando, Falha, Pagina } from './Interface';
export default function AreaProtegida({ tipoConta, navigation, children }) {
  const perfil=usePerfil(),usuario=auth.currentUser;
  useEffect(()=>{
    if(!usuario)navigation.reset({index:0,routes:[{name:'Inicial'}]});
    else if(!usuario.emailVerified)navigation.reset({index:0,routes:[{name:'VerificarEmail'}]});
    else if(perfil.perfil&&perfil.perfil.tipoConta!==tipoConta&&['aluno','admin'].includes(perfil.perfil.tipoConta))navigation.reset({index:0,routes:[{name:perfil.perfil.tipoConta==='admin'?'HomeAdmin':'HomeAluno'}]});
  },[usuario?.uid,usuario?.emailVerified,perfil.perfil?.tipoConta,tipoConta]);
  if(!usuario||(!usuario.emailVerified))return <Pagina titulo="Conferindo acesso"><Carregando/></Pagina>;
  if(perfil.carregando)return <Pagina titulo="Carregando sua conta"><Carregando/></Pagina>;
  if(perfil.perfil?.acessoAtivo===false)return <Pagina titulo="Acesso desativado"><Botao onPress={()=>signOut(auth)}>Sair da conta</Botao></Pagina>;
  if(perfil.erro)return <Pagina titulo="Confira sua conta"><Falha mensagem={perfil.erro} tentarNovamente={perfil.tentarNovamente}/><Botao secundario onPress={()=>navigation.reset({index:0,routes:[{name:'Inicial'}]})}>Voltar à tela inicial</Botao></Pagina>;
  if(perfil.perfil?.tipoConta!==tipoConta)return <Pagina titulo="Conferindo acesso"><Carregando/></Pagina>;
  return children;
}