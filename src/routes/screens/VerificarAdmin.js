import React from 'react';
import { Text, View } from 'react-native';
import { Botao, Pagina, ui } from '../../components/Interface';
export default function VerificarAdmin({ navigation }) {
  return <Pagina titulo="Cadastro da equipe" subtitulo="O acesso administrativo precisa de autorização.">
    <View style={ui.card}><Text style={ui.texto}>Um administrador da sua escola pode autorizar uma nova conta. Alunos não podem transformar seu perfil em administrador.</Text></View>
    <Botao onPress={()=>navigation.navigate('Login',{cadastrarAdmin:true})}>Entrar como administrador autorizado</Botao><Botao secundario onPress={()=>navigation.goBack()}>Voltar</Botao>
  </Pagina>;
}
