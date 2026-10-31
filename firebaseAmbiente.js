import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
export const ambienteTesteLocal = process.env.EXPO_PUBLIC_USAR_EMULADORES === '1';
export const CONTA_EQUIPE_TESTE = {
  email: 'equipe.teste@exemplo.invalid',
  senha: 'EquipeTeste123!',
  escola: 'Satc',
};
export function opcoesFirebase(configuracao) {
  return ambienteTesteLocal
    ? {
        projectId: 'demo-pratocerto',
        apiKey: 'demo-pratocerto-key',
        appId: 'demo-pratocerto-web',
      }
    : configuracao;
}
export function conectarAmbienteTeste(aplicativoFirebase, auth, database) {
  if (!ambienteTesteLocal) return;
  const host = process.env.EXPO_PUBLIC_EMULADOR_HOST || '127.0.0.1';
  if (aplicativoFirebase.options.projectId !== 'demo-pratocerto')
    throw new Error(
      'O ambiente de teste precisa reiniciar o aplicativo. Feche o Expo e abra novamente.',
    );
  if (
    !/^(localhost|127\.0\.0\.1|10\.(\d{1,3}\.){2}\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/.test(
      host,
    )
  )
    throw new Error('Use um endereço local para os emuladores de teste.');
  if (aplicativoFirebase.__pratoCertoEmulador) {
    if (aplicativoFirebase.__pratoCertoEmulador !== host)
      throw new Error('O endereço do teste mudou. Reinicie o aplicativo.');
    return;
  }
  connectAuthEmulator(auth, `http://${host}:9099`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(database, host, 8080);
  aplicativoFirebase.__pratoCertoEmulador = host;
}
