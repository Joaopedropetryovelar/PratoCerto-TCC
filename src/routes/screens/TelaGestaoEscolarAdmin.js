import React from 'react';
import { Text, View } from 'react-native';
import { Botao, Carregando, Falha, Pagina, ui } from '../../components/Interface';
import { usePerfil } from '../../hooks/useDados';

export default function TelaGestaoEscolarAdmin({ navigation }) {
  const perfil = usePerfil();
  return <Pagina titulo="Gestão escolar" subtitulo={`${perfil.perfil?.escola || 'Sua escola'} · Organize o acesso dos alunos e as turmas.`}>
    {perfil.carregando ? <Carregando /> : perfil.erro ? <Falha mensagem={perfil.erro} tentarNovamente={perfil.tentarNovamente} /> : perfil.perfil?.tipoConta !== 'admin' ? <Text style={ui.erro}>Esta área é exclusiva da equipe.</Text> : <>
      <View style={ui.card}>
        <Text style={ui.secao}>Matrículas</Text>
        <Text style={ui.texto}>Autorize matrículas individuais ou libere a lista da escola.</Text>
        <Botao testID="abrir-matriculas-admin" onPress={() => navigation.navigate('MatriculasAdmin')}>Autorizar matrículas</Botao>
      </View>
      <View style={ui.card}>
        <Text style={ui.secao}>Turmas</Text>
        <Text style={ui.texto}>Cadastre, reative ou desative as turmas disponíveis para os alunos.</Text>
        <Botao testID="abrir-turmas-admin" onPress={() => navigation.navigate('TurmasAdmin')}>Gerenciar turmas da escola</Botao>
      </View>
    </>}
    <Botao secundario onPress={() => navigation.goBack()}>Voltar</Botao>
  </Pagina>;
}
