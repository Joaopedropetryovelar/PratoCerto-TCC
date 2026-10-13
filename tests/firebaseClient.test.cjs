const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { initializeApp, deleteApp, getApps } = require('firebase/app');
const F = require('firebase/firestore');
const { criarRuntime } = require('./runtime.cjs');
const opcoes = { firebaseConfig: { projectId: 'demo-pratocerto', apiKey: 'demo-pratocerto-key' } };

test('inicialização web funciona mesmo quando já existe apenas um app nomeado', async () => {
  const outro = initializeApp(opcoes.firebaseConfig, 'outro-app');
  let cliente;
  try {
    const rt = criarRuntime({ firestore: F, firebaseAuth: require('firebase/auth'), modulos: { './firebaseOptions': opcoes } });
    const backend = rt.backend();
    assert.equal(getApps().length, 1, 'importar serviços mantém a inicialização adiada');
    assert.equal(backend.auth.currentUser, null);
    cliente = rt.carregar('firebaseClient.js');
    assert.equal(cliente.app.name, '[DEFAULT]');
    assert.equal(cliente.auth.app, cliente.app);
    assert.equal(cliente.database.app, cliente.app);
    assert.equal(rt.carregar('firebaseClient.js').auth, cliente.auth);
  } finally {
    if (cliente) { await F.terminate(cliente.database); await deleteApp(cliente.app); }
    await deleteApp(outro);
  }
});

test('inicialização nativa usa o SDK React Native real e reutiliza Auth após recarga', async () => {
  const A = require(path.join(path.dirname(require.resolve('@firebase/auth/package.json')), 'dist/rn/index.js'));
  const criar = () => criarRuntime({ firestore: F, firebaseAuth: A, resolverNativo: true, modulos: { './firebaseOptions': opcoes } });
  const rt = criar();
  const backend = rt.backend();
  assert.equal(getApps().length, 0);
  let cliente;
  try {
    assert.equal(backend.auth.currentUser, null);
    cliente = rt.carregar('firebaseClient.native.js');
    await cliente.auth._initializationPromise;
    assert.equal(cliente.auth.app, cliente.app);
    assert.equal(cliente.database.app, cliente.app);
    assert.equal(cliente.auth.languageCode, 'pt-BR');
    assert.equal(criar().carregar('firebaseClient.native.js').auth, cliente.auth);
    await A.signOut(cliente.auth);
  } finally {
    if (cliente) { await F.terminate(cliente.database); await deleteApp(cliente.app); }
  }
});
