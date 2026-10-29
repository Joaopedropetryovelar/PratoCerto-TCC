import { VERSAO_APP } from '../../domain/versao';
import Icone from '../../components/Icone';
import React, { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useSessao } from '../../hooks/useSessao';
import { auth, database, doc, getDoc, signOut } from '../../services/backend';
import { escolaValida } from '../../domain/escolas';
import { Text, View } from 'react-native';
import { Botao, Carregando, Pagina, ui } from '../../components/Interface';
export default function TelaInicial({ navigation }) {
  const sessao = useSessao(), focada = useIsFocused();
  const [restaurando, setRestaurando] = useState(false), [erro, setErro] = useState(null);
  useEffect(() => {
    let ativa = true;
    if (!focada || sessao.carregando || !sessao.usuario) return;
    setRestaurando(true); setErro(null);
    if (!sessao.usuario.emailVerified) { navigation.reset({index:0,routes:[{name:'VerificarEmail'}]}); return; }
    getDoc(doc(database,'usuarios',sessao.usuario.uid)).then(snap => {
      if (!ativa) return;
      const perfil = snap.exists() ? snap.data() : null;
      if (!perfil || !escolaValida(perfil.escola) || !['admin','aluno'].includes(perfil.tipoConta)) throw new Error('Procure a direção para conferir seu cadastro.');
      if (perfil.acessoAtivo === false) throw new Error('Seu acesso foi desativado pela direção.');
      navigation.reset({index:0,routes:[{name:perfil.tipoConta === 'admin' ? 'HomeAdmin' : 'HomeAluno'}]});
    }).catch(e => { if (ativa) setErro(e.message); }).finally(() => { if (ativa) setRestaurando(false); });
    return () => { ativa = false; };
  }, [sessao.usuario?.uid, sessao.carregando, focada]);
  if (sessao.carregando || (restaurando && !erro)) return <Pagina titulo="Abrindo sua conta"><Carregando /></Pagina>;
  if (erro || sessao.erro) return <Pagina titulo="Confira sua conta"><Text style={ui.erro}>{erro || sessao.erro}</Text><Botao onPress={async () => { await signOut(auth); setErro(null); setRestaurando(false); }}>Voltar ao acesso</Botao></Pagina>;
  function abrir(destino) { navigation.navigate(destino); }
  return <Pagina estreita titulo="Prato Certo" subtitulo="Sua refeição na escola, em poucos toques.">
    <View style={[ui.card, { alignItems: 'center', paddingVertical: 30 }]}><View style={{ backgroundColor: '#EAF2EC', borderRadius: 28, padding: 20 }}><Icone nome="cardapio" tamanho={48} /></View><Text style={[ui.secao, { textAlign: 'center' }]}>Veja. Confirme. Avalie.</Text><Text style={[ui.texto, { textAlign: 'center', maxWidth: 380 }]}>Consulte o cardápio, avise se vai comer e conte como foi a refeição.</Text></View>
    <Botao onPress={() => abrir('Login')}>Entrar</Botao>
    <Botao secundario onPress={() => abrir('EscolhaCadastro')}>Criar conta</Botao>
    <View style={ui.linha}><Botao secundario onPress={() => navigation.navigate('Consentimento', { screen: 'TermosUso' })}>Termos de Uso</Botao><Botao secundario onPress={() => navigation.navigate('Consentimento', { screen: 'PoliticaPrivacidade' })}>Privacidade</Botao></View>
    <Text testID="versao-app" style={ui.pequeno}>Versão {VERSAO_APP}</Text>
  </Pagina>;
}