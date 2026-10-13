import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
const desenhos = {
  inicio: 'M3 10L12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  cardapio: 'M4 3v6c0 2 4 2 4 0V3M6 3v18M19 3c-4 3-4 7 0 8V3m0 8v10',
  confirmar: 'M5 12l4 4L19 6',
  feedback: 'M21 11a8 8 0 0 1-8 8H9l-6 3v-6a8 8 0 0 1-1-4 9 9 0 0 1 9-9h2a8 8 0 0 1 8 8z',
  perfil: 'M4 21v-2a8 8 0 0 1 16 0v2',
  producao: 'M3 20h18M6 17V9h4v8M14 17V4h4v13',
  relatorios: 'M5 3h14v18H5zM8 16v-4M12 16V8M16 16v-6',
};
export default function Icone({ nome, tamanho = 24, cor = '#23624B' }) {
  return <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" accessible={false}>
    <Path d={desenhos[nome] || desenhos.cardapio} />{nome === 'perfil' ? <Circle cx={12} cy={6} r={4} /> : null}
  </Svg>;
}
