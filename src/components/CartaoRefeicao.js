import React from 'react';
import { View } from 'react-native';
import { ui } from './Interface';
export default function CartaoRefeicao({ nome, children, style, ...props }) {
  return (
    <View {...props} style={[ui.card, tomRefeicao(nome), style]}>
      {children}
    </View>
  );
}
const tons = [
  ['#FFF7EE', '#D69A61'],
  ['#F8F7EA', '#B8A65B'],
  ['#EFF6F2', '#79A98B'],
  ['#F3F1F8', '#A190BA'],
  ['#EDF5F8', '#7DA8BC'],
];
export function tomRefeicao(nome = '') {
  const texto = String(nome)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  let valor = 0;
  for (let indice = 0; indice < texto.length; indice += 1)
    valor = (valor * 31 + texto.charCodeAt(indice)) >>> 0;
  const [fundo, borda] = tons[valor % tons.length];
  return {
    backgroundColor: fundo,
    borderLeftColor: borda,
    borderLeftWidth: 5,
  };
}
