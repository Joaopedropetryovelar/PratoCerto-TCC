import { VERSAO_APP } from '../../domain/versao';
import Icone from '../../components/Icone';
import React from 'react';
import { Text, View } from 'react-native';
import { Botao, Pagina, ui } from '../../components/Interface';
import { usarFirebase } from '../../services/demo';
export default function TelaInicial({ navigation }) {
  function abrir(destino) { usarFirebase(); navigation.navigate(destino); }
  return <Pagina estreita titulo="Prato Certo" subtitulo="Sua refeição na escola, em poucos toques.">
    <View style={[ui.card, { alignItems: 'center', paddingVertical: 30 }]}><View style={{ backgroundColor: '#EAF2EC', borderRadius: 28, padding: 20 }}><Icone nome="cardapio" tamanho={48} /></View><Text style={[ui.secao, { textAlign: 'center' }]}>Veja. Confirme. Avalie.</Text><Text style={[ui.texto, { textAlign: 'center', maxWidth: 380 }]}>Consulte o cardápio, avise se vai comer e conte como foi a refeição.</Text></View>
    <Botao onPress={() => abrir('Login')}>Entrar</Botao>
    <Botao secundario onPress={() => abrir('EscolhaCadastro')}>Criar conta</Botao>
    <Botao secundario onPress={() => navigation.navigate('Demonstracao')}>Testar sem conta</Botao>
    <View style={ui.linha}><Botao secundario onPress={() => navigation.navigate('Consentimento', { screen: 'TermosUso' })}>Termos de Uso</Botao><Botao secundario onPress={() => navigation.navigate('Consentimento', { screen: 'PoliticaPrivacidade' })}>Privacidade</Botao></View>
    <Text testID="versao-app" style={ui.pequeno}>Versão {VERSAO_APP}</Text>
  </Pagina>;
}
