import React from 'react';
import { Image } from 'react-native';

// A ilustração é local e usa apenas o componente de imagem do React Native.
export default function PratoIlustrado({ tamanho = 158 }) {
  return <Image source={require('../../assets/prato-ilustrado.png')} resizeMode="contain"
    fadeDuration={0} accessible={false} style={{ width: tamanho, height: tamanho }} />;
}