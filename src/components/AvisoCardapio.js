import React from 'react';
import { Text, View } from 'react-native';
import { Botao, ui } from './Interface';

export default function AvisoCardapio({ mensagem, tentarNovamente }) {
  return <View style={ui.card}>
    <Text style={ui.secao}>Não foi possível carregar o cardápio</Text>
    <Text accessibilityRole="alert" style={ui.texto}>{mensagem}</Text>
    <Botao onPress={tentarNovamente}>Tentar novamente</Botao>
  </View>;
}
