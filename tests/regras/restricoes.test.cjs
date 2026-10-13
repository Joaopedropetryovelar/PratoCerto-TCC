const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const F = require('firebase/firestore');
let env;
const perfil = (uid, escola = 'Satc', tipoConta = 'aluno') => ({ uid, nome: 'Aluno Teste', matricula: '00001', turma: '7º A', turnos: ['manha'], turno: 'manha', escola, email: `${uid}@exemplo.invalid`, tipoConta });
const registro = (alunoId = 'aluno', escola = 'Satc', patch = {}) => ({ alunoId, escola, situacao: 'informadas', itens: ['intolerancia_lactose'], outra: '', declarante: 'responsavel', nomeResponsavel: 'Responsável Teste', autorizou: true, versaoAviso: '2026-10-13-restricoes-1', atualizadoEm: F.serverTimestamp(), ...patch });
const pedidoPrivacidade = (alunoId = 'aluno', escola = 'Satc', patch = {}) => ({ alunoId, alunoNome: 'Aluno Teste', email: `${alunoId}@exemplo.invalid`, escola, matricula: '00001', turma: '7º A', tipo: 'exclusao_dados', status: 'pendente', mensagem: '', versaoPolitica: '2026-10-13', criadoEm: F.serverTimestamp(), atualizadoEm: F.serverTimestamp(), ...patch });
const db = (uid, verificado = true) => env.authenticatedContext(uid, { email: `${uid}@exemplo.invalid`, email_verified: verificado }).firestore();
async function seed(colecao, id, dados) { await env.withSecurityRulesDisabled((c) => F.setDoc(F.doc(c.firestore(), colecao, id), dados)); }
before(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Estes testes usam somente os emuladores locais.');
  env = await initializeTestEnvironment({ projectId: 'demo-pratocerto', firestore: { host: '127.0.0.1', port: 8080, rules: fs.readFileSync('firestore.rules', 'utf8') } });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  for (const [uid, escola, tipo] of [['aluno','Satc','aluno'], ['outro','Satc','aluno'], ['admin','Satc','admin'], ['admin-ags','Antônio Guglielmi Sobrinho','admin']]) await seed('usuarios', uid, perfil(uid, escola, tipo));
});
test('aluno informa seu próprio registro, lê e retira a declaração', async () => {
  const ref = F.doc(db('aluno'), 'restricoesAlimentares', 'aluno');
  await assertSucceeds(F.setDoc(ref, registro()));
  assert.equal((await assertSucceeds(F.getDoc(ref))).data().itens[0], 'intolerancia_lactose');
  await assertSucceeds(F.deleteDoc(ref)); assert.equal((await F.getDoc(ref)).exists(), false);
});
test('aluno não lê, escreve ou exclui dados de outro aluno nem lista a coleção', async () => {
  await seed('restricoesAlimentares', 'outro', { ...registro('outro'), atualizadoEm: F.Timestamp.now() });
  const ref = F.doc(db('aluno'), 'restricoesAlimentares', 'outro');
  await assertFails(F.getDoc(ref)); await assertFails(F.setDoc(ref, registro('outro'))); await assertFails(F.deleteDoc(ref));
  await assertFails(F.getDocs(F.query(F.collection(db('aluno'), 'restricoesAlimentares'), F.where('escola', '==', 'Satc'))));
});
test('equipe vê somente a própria escola e não modifica a declaração', async () => {
  await seed('restricoesAlimentares', 'aluno', { ...registro(), atualizadoEm: F.Timestamp.now() });
  await assertSucceeds(F.getDocs(F.query(F.collection(db('admin'), 'restricoesAlimentares'), F.where('escola', '==', 'Satc'))));
  await assertFails(F.getDocs(F.collection(db('admin'), 'restricoesAlimentares')));
  await assertFails(F.getDoc(F.doc(db('admin-ags'), 'restricoesAlimentares', 'aluno')));
  await assertFails(F.setDoc(F.doc(db('admin'), 'restricoesAlimentares', 'aluno'), registro()));
  await assertFails(F.deleteDoc(F.doc(db('admin'), 'restricoesAlimentares', 'aluno')));
});
test('acesso anônimo e equipe sem e-mail confirmado são bloqueados', async () => {
  await seed('restricoesAlimentares', 'aluno', { ...registro(), atualizadoEm: F.Timestamp.now() });
  await assertFails(F.getDoc(F.doc(env.unauthenticatedContext().firestore(), 'restricoesAlimentares', 'aluno')));
  await assertFails(F.getDocs(F.query(F.collection(db('admin', false), 'restricoesAlimentares'), F.where('escola', '==', 'Satc'))));
});
test('consentimento, versão, tempo do servidor e identidade são exigidos', async () => {
  for (const patch of [{ autorizou: false }, { versaoAviso: 'antiga' }, { atualizadoEm: F.Timestamp.now() }, { alunoId: 'outro' }, { escola: 'Outra' }, { tipoConta: 'admin' }]) await assertFails(F.setDoc(F.doc(db('aluno'), 'restricoesAlimentares', 'aluno'), registro('aluno', 'Satc', patch)));
});
test('listas inválidas, duplicadas e combinações incompatíveis são rejeitadas', async () => {
  for (const patch of [{ itens: ['falso'] }, { itens: ['alergia_ovo','alergia_ovo'] }, { itens: [] }, { situacao: 'nenhuma' }, { outra: 'Dado extra' }, { itens: ['outra'], outra: '' }, { declarante: 'responsavel', nomeResponsavel: '' }, { declarante: 'titular_adulto', nomeResponsavel: 'Outra pessoa' }]) await assertFails(F.setDoc(F.doc(db('aluno'), 'restricoesAlimentares', 'aluno'), registro('aluno','Satc',patch)));
  await assertSucceeds(F.setDoc(F.doc(db('aluno'), 'restricoesAlimentares', 'aluno'), registro('aluno','Satc',{ situacao: 'nenhuma', itens: [] })));
});
test('perfil e declaração podem ser criados no mesmo lote, ainda antes da confirmação de e-mail', async () => {
  const b = db('novo', false), lote = F.writeBatch(b);
  lote.set(F.doc(b, 'usuarios', 'novo'), { ...perfil('novo'), aceitouTermos: true, versaoTermos: '2026-10-13', dataConsentimento: F.serverTimestamp(), dataCadastro: F.serverTimestamp() });
  lote.set(F.doc(b, 'restricoesAlimentares', 'novo'), registro('novo'));
  await assertSucceeds(lote.commit());
  assert.equal((await F.getDoc(F.doc(b,'usuarios','novo'))).exists(), true);
  assert.equal((await F.getDoc(F.doc(b,'restricoesAlimentares','novo'))).exists(), true);
});
test('declaração inválida faz o lote falhar sem deixar perfil parcial', async () => {
  const b = db('novo', false), lote = F.writeBatch(b);
  lote.set(F.doc(b,'usuarios','novo'), { ...perfil('novo'), aceitouTermos:true, versaoTermos:'2026-10-13', dataConsentimento:F.serverTimestamp(), dataCadastro:F.serverTimestamp() });
  lote.set(F.doc(b,'restricoesAlimentares','novo'), registro('novo','Satc',{autorizou:false}));
  await assertFails(lote.commit());
  assert.equal((await F.getDoc(F.doc(b,'usuarios','novo'))).exists(), false);
});
test('aluno registra pedido LGPD próprio e a equipe da escola acompanha', async () => {
  const ref = F.doc(db('aluno'), 'solicitacoesPrivacidade', 'aluno');
  await assertSucceeds(F.setDoc(ref, pedidoPrivacidade('aluno', 'Satc', { mensagem: 'Quero excluir meus dados.' })));
  assert.equal((await assertSucceeds(F.getDoc(ref))).data().tipo, 'exclusao_dados');
  await assertSucceeds(F.getDocs(F.query(F.collection(db('admin'), 'solicitacoesPrivacidade'), F.where('escola', '==', 'Satc'))));
  await assertFails(F.getDoc(F.doc(db('admin-ags'), 'solicitacoesPrivacidade', 'aluno')));
  await assertFails(F.deleteDoc(F.doc(db('aluno'), 'solicitacoesPrivacidade', 'aluno')));
});
test('pedido LGPD rejeita identidade, status, escola e horários manipulados', async () => {
  for (const patch of [{ alunoId: 'outro' }, { alunoNome: 'Outro' }, { email: 'outro@exemplo.invalid' }, { escola: 'Outra' }, { tipo: 'acesso_dados' }, { status: 'concluido' }, { criadoEm: F.Timestamp.now() }, { atualizadoEm: F.Timestamp.now() }, { mensagem: 'x'.repeat(501) }]) {
    await assertFails(F.setDoc(F.doc(db('aluno'), 'solicitacoesPrivacidade', 'aluno'), pedidoPrivacidade('aluno', 'Satc', patch)));
  }
});
