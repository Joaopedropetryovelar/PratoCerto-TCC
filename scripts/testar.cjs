const sistemaArquivos = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const raiz = path.resolve(__dirname, '..');
const regras = process.argv.includes('--regras');
const pasta = path.join(raiz, 'tests', ...(regras ? ['regras'] : []));
const arquivos = sistemaArquivos
  .readdirSync(pasta, {
    withFileTypes: true,
  })
  .filter(
    (entradaArquivo) => entradaArquivo.isFile() && /\.test\.(cjs|mjs)$/.test(entradaArquivo.name),
  )
  .map((entradaArquivo) => path.join(pasta, entradaArquivo.name))
  .sort();
if (!arquivos.length) throw new Error('Nenhum teste encontrado.');
const resultado = spawnSync(
  process.execPath,
  ['--test', ...(regras ? ['--test-concurrency=1'] : []), ...arquivos],
  {
    cwd: raiz,
    stdio: 'inherit',
  },
);
if (resultado.error) console.error(resultado.error.message);
process.exitCode = resultado.status ?? 1;
