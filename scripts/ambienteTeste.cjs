const path = require('node:path');
const { createRequire } = require('node:module');
const { spawnSync } = require('node:child_process');
const raiz = path.resolve(__dirname, '..');
const dasFuncoes = createRequire(path.join(raiz, 'functions/package.json'));
if (spawnSync('java', ['-version'], { stdio: 'ignore' }).status !== 0) {
  console.error('Os emuladores exigem Java 17 ou superior. Para testar sem Java, use Testar sem conta na tela inicial.');
  process.exit(1);
}
try { dasFuncoes.resolve('firebase-admin/app'); }
catch {
  const instalado = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci', '--prefix', 'functions'], { cwd: raiz, stdio: 'inherit', shell: process.platform === 'win32' });
  if (instalado.status !== 0) process.exit(instalado.status || 1);
}
const resultado = spawnSync(process.execPath, [require.resolve('firebase-tools/lib/bin/firebase.js'), 'emulators:exec', '--only', 'auth,firestore', '--project', 'demo-pratocerto', 'node scripts/iniciarTeste.cjs'], { cwd: raiz, stdio: 'inherit' });
if (resultado.error) console.error(resultado.error.message);
process.exitCode = resultado.status || (resultado.error ? 1 : 0);
