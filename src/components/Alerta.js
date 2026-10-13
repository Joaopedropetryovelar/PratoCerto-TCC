import { Alert as AlertaNativo, Platform } from 'react-native';

export const Alert = {
  alert(titulo, mensagem, botoes) {
    if (Platform.OS !== 'web') return AlertaNativo.alert(titulo, mensagem, botoes);
    const texto = `${titulo}\n\n${mensagem || ''}`;
    if (!botoes?.length) { window.alert(texto); return; }
    const confirmar = botoes.find((botao) => botao.style !== 'cancel');
    const cancelar = botoes.find((botao) => botao.style === 'cancel');
    if (cancelar) {
      if (window.confirm(texto)) confirmar?.onPress?.();
      else cancelar.onPress?.();
    } else {
      window.alert(texto);
      confirmar?.onPress?.();
    }
  },
};
