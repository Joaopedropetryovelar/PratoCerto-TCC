const { spawn } = require('node:child_process');
const { prepararContasTeste } = require('./sementeTeste.cjs');
async function iniciar() {
  const contas = await prepararContasTeste();
  console.log('\nAmbiente local com dados fictícios. Escola: Satc.');
  console.log('Equipe:', contas.equipe.email, '| Senha:', contas.equipe.senha);
  console.log('Aluno:', contas.aluno.email, '| Senha:', contas.aluno.senha);
  const expo = spawn(process.execPath, [require.resolve('expo/bin/cli'), 'start', '--clear'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPO_PUBLIC_USAR_EMULADORES: '1',
      EXPO_PUBLIC_EMULADOR_HOST: '127.0.0.1',
    },
  });
  expo.on('error', (erroCapturado) => {
    console.error(erroCapturado.message);
    process.exitCode = 1;
  });
  expo.on('exit', (code) => {
    process.exitCode = code || 0;
  });
  process.on('SIGINT', () => expo.kill('SIGINT'));
  process.on('SIGTERM', () => expo.kill('SIGTERM'));
}
iniciar().catch((erroCapturado) => {
  console.error(erroCapturado.message);
  process.exitCode = 1;
});
