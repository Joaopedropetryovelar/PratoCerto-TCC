import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { mensagemAuth } from '../src/domain/contas.js';

test('arquivos do projeto não colidem em sistemas sem distinção de maiúsculas', () => {
  const raiz = new URL('../', import.meta.url);
  function conferir(pasta) {
    const entradas = readdirSync(pasta, { withFileTypes: true }).filter(e => !['node_modules', '.git', 'dist'].includes(e.name));
    const nomes = entradas.map(e => e.name.toLowerCase());
    assert.equal(new Set(nomes).size, nomes.length, `Nomes conflitantes em ${pasta}`);
    for (const e of entradas) if (e.isDirectory()) conferir(new URL(`${e.name}/`, pasta));
  }
  conferir(raiz);
});

test('senha incorreta tem mensagem compreensível sem revelar conta existente', () => {
  for (const code of ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found']) {
    assert.equal(mensagemAuth({ code }), 'E-mail ou senha incorretos.');
  }
});

test('falha interna não aparece como mensagem técnica no login', () => {
  for (const erro of [new TypeError("Cannot read properties of undefined (reading 'app')"), new ReferenceError('auth is not defined'), new Error("Cannot read properties of undefined (reading 'app')")]) {
    assert.equal(mensagemAuth(erro), 'Não foi possível acessar sua conta. Tente novamente. Se continuar, procure a equipe.');
  }
  assert.equal(mensagemAuth(new Error('Confira o e-mail, a senha e a escola.')), 'Confira o e-mail, a senha e a escola.');
});

test('configuração web exporta a instância Auth e Firestore do mesmo aplicativo', async () => {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const { criarRuntime } = require('./runtime.cjs');
  const F = require('firebase/firestore'), A = require('firebase/auth');
  const r = criarRuntime({firestore:F,firebaseAuth:A});
  const config = r.carregar('firebaseClient.js');
  assert.ok(config.auth);assert.equal(config.auth.app,config.app);assert.equal(config.database.app,config.app);
  assert.equal(r.carregar('firebaseClient.js').auth,config.auth);
  await F.terminate(config.database);await require('firebase/app').deleteApp(config.app);
});
