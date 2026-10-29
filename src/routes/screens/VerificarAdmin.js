import React from 'react';
import { Text, View } from 'react-native';
import { Botao, Pagina, ui } from '../../components/Interface';
export default function VerificarAdmin({ navigation }) {
  return <Pagina titulo="Cadastro da equipe" subtitulo="O acesso administrativo precisa de autorização.">
    <View style={ui.card}><Text style={ui.texto}>Peça a um integrante da direção para abrir Equipe da direção e autorizar seu nome e e-mail. Você receberá um link para definir a senha. Alunos não podem transformar a própria conta em administrador.</Text></View>
    <Botao onPress={()=>navigation.navigate('Login')}>Entrar com acesso autorizado</Botao><Botao secundario onPress={()=>navigation.goBack()}>Voltar</Botao>
  </Pagina>;
}