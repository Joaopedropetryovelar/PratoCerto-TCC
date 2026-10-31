import React from 'react';
import { Image } from 'react-native';

// Imagens locais preservam os desenhos sem depender de um componente SVG nativo.
const icones = {
  menu: require('../../assets/icones/menu.png'),
  calendario: require('../../assets/icones/calendario.png'),
  seta: require('../../assets/icones/seta.png'),
  sino: require('../../assets/icones/sino.png'),
  folha: require('../../assets/icones/folha.png'),
  inicio: require('../../assets/icones/inicio.png'),
  cardapio: require('../../assets/icones/cardapio.png'),
  confirmar: require('../../assets/icones/confirmar.png'),
  feedback: require('../../assets/icones/feedback.png'),
  perfil: require('../../assets/icones/perfil.png'),
  matriculas: require('../../assets/icones/matriculas.png'),
  producao: require('../../assets/icones/producao.png'),
  relatorios: require('../../assets/icones/relatorios.png'),
};
export default function Icone({ nome, tamanho = 24, cor = '#23624B' }) {
  const numero = Number(tamanho);
  const lado = Number.isFinite(numero) && numero > 0 ? numero : 24;
  const imagem = Object.hasOwn(icones, nome) ? icones[nome] : icones.cardapio;
  return <Image source={imagem} resizeMode="contain" fadeDuration={0} accessible={false}
    style={{ width: lado, height: lado, tintColor: cor, flexShrink: 0 }} />;
}