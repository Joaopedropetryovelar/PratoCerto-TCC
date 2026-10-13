const { test } = require('node:test');
const assert = require('node:assert/strict');
const A = require('firebase/auth'), F = require('firebase/firestore');
const { deleteApp } = require('firebase/app');
const { prepararContasTeste } = require('../../scripts/sementeTeste.cjs');
const { criarRuntime } = require('../runtime.cjs');

test('contas locais prontas acessam painel e menus com as regras efetivas', async () => {
  await prepararContasTeste();
  const anterior = process.env.EXPO_PUBLIC_USAR_EMULADORES;
  process.env.EXPO_PUBLIC_USAR_EMULADORES = '1';
  const rt = criarRuntime({ firestore:F, firebaseAuth:A });
  const cliente = rt.carregar('firebaseClient.js');
  const contas = rt.carregar('src/services/contas.js');
  try {
    assert.equal(cliente.app.options.projectId,'demo-pratocerto');
    const adm = await contas.entrarConta({ email:'equipe.teste@exemplo.invalid', senha:'EquipeTeste123!', escola:'Satc' });
    assert.equal(adm.perfil.tipoConta,'admin'); assert.equal(adm.verificado,true);
    const perfis = await F.getDocs(F.query(F.collection(cliente.database,'usuarios'),F.where('escola','==','Satc'),F.where('tipoConta','==','aluno')));
    const saude = await F.getDocs(F.query(F.collection(cliente.database,'restricoesAlimentares'),F.where('escola','==','Satc')));
    assert.equal(perfis.size,4); assert.equal(saude.size,3);
    await A.signOut(cliente.auth);
    const aluno = await contas.entrarConta({ email:'aluno.teste@exemplo.invalid',senha:'AlunoTeste123!',escola:'Satc' });
    assert.equal(aluno.perfil.tipoConta,'aluno');
    const menus = await F.getDocs(F.query(F.collection(cliente.database,'NomePratos'),F.where('escola','==','Satc')));
    assert.ok(menus.size>0);
    assert.equal((await F.getDoc(F.doc(cliente.database,'restricoesAlimentares',cliente.auth.currentUser.uid))).exists(),true);
    await assert.rejects(F.getDocs(F.collection(cliente.database,'restricoesAlimentares')),e=>e.code==='permission-denied');
  } finally {
    await A.signOut(cliente.auth); await F.terminate(cliente.database); await deleteApp(cliente.app);
    if(anterior===undefined)delete process.env.EXPO_PUBLIC_USAR_EMULADORES;else process.env.EXPO_PUBLIC_USAR_EMULADORES=anterior;
  }
});
