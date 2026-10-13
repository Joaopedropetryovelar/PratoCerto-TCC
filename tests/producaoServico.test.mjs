import test from 'node:test';
import assert from 'node:assert/strict';
import { criarAmbiente } from './ambienteDemo.mjs';
import { dataLocal } from '../src/domain/refeicoes.js';
const formulario = { preparadoKg: '10', sobraLimpaKg: '1', sobraDescartadaKg: '0,5', restosKg: '0,5', servidos: '30', observacao: 'Teste' };
async function equipe() {
  const ambiente = await criarAmbiente();
  await ambiente.demo.entrarDemonstracao('admin');
  ambiente.demo.definirHorarioDemo('21:00');
  ambiente.refeicaoId = `demo-${'2026-10-12'}-manha`;
  return ambiente;
}
const referencia = (b, id) => b.doc(b.database, 'producao', id);

test('01 — equipe registra resultado na mesma refeição, com dados e autor corretos', async () => {
  const { producao, backend, refeicaoId } = await equipe();
  const registro = await producao.salvarProducao({ refeicaoId, formulario });
  assert.equal(registro.preparadoG, 10000);
  assert.equal(registro.criadoPorUid, 'demo-admin');
  assert.equal(registro.revisao, 1);
  assert.equal((await backend.getDoc(referencia(backend, refeicaoId))).data().servidos, 30);
});
test('02 — aluno não consegue gravar produção', async () => {
  const { producao, demo, refeicaoId } = await equipe();
  await demo.entrarDemonstracao('aluno');
  await assert.rejects(producao.salvarProducao({ refeicaoId, formulario }), /Somente a equipe/);
});
test('03 — sessão encerrada não pode gravar', async () => {
  const { producao, demo, refeicaoId } = await equipe();
  demo.sairDemonstracao();
  await assert.rejects(producao.salvarProducao({ refeicaoId, formulario }), /Entre novamente/);
});
test('04 — validação rejeita dados inválidos antes de persistir', async () => {
  const { producao, backend, refeicaoId } = await equipe();
  await assert.rejects(producao.salvarProducao({ refeicaoId, formulario: { ...formulario, restosKg: '999' } }), /soma/);
  assert.equal((await backend.getDoc(referencia(backend, refeicaoId))).exists(), false);
});
test('05 — duas gravações concorrentes não se sobrescrevem silenciosamente', async () => {
  const { producao, refeicaoId } = await equipe();
  const resultados = await Promise.allSettled([producao.salvarProducao({ refeicaoId, formulario }), producao.salvarProducao({ refeicaoId, formulario })]);
  assert.equal(resultados.filter((item) => item.status === 'fulfilled').length, 1);
  assert.match(resultados.find((item) => item.status === 'rejected').reason.message, /atualizado/);
});
test('06 — edição atualiza revisão sem criar um segundo registro', async () => {
  const { producao, backend, refeicaoId } = await equipe();
  const inicial = await producao.salvarProducao({ refeicaoId, formulario });
  const editado = await producao.salvarProducao({ refeicaoId, formulario: { ...formulario, servidos: '31' }, revisaoEsperada: 1 });
  assert.equal(editado.revisao, 2);
  assert.deepEqual(editado.criadoEm, inicial.criadoEm);
  assert.equal(editado.servidos, 31);
  const itens = await backend.getDocs(backend.collection(backend.database, 'producao'));
  assert.equal(itens.docs.filter((item) => item.id === refeicaoId).length, 1);
});
test('07 — gravação de revisão antiga falha e conserva a edição atual', async () => {
  const { producao, backend, refeicaoId } = await equipe();
  await producao.salvarProducao({ refeicaoId, formulario });
  await assert.rejects(producao.salvarProducao({ refeicaoId, formulario: { ...formulario, servidos: '200' } }), /atualizado/);
  assert.equal((await backend.getDoc(referencia(backend, refeicaoId))).data().servidos, 30);
});
test('08 — refeição removida não recebe resultado novo e mantém histórico editável', async () => {
  const { producao, backend, refeicaoId } = await equipe();
  const prato = backend.doc(backend.database, 'NomePratos', refeicaoId);
  await backend.updateDoc(prato, { ativo: false });
  await assert.rejects(producao.salvarProducao({ refeicaoId, formulario }), /removida/);
  await backend.updateDoc(prato, { ativo: true });
  await producao.salvarProducao({ refeicaoId, formulario });
  await backend.updateDoc(prato, { ativo: false });
  assert.equal((await producao.salvarProducao({ refeicaoId, formulario, revisaoEsperada: 1 })).revisao, 2);
});
test('09 — escola diferente e refeição futura são rejeitadas', async () => {
  const { producao, backend, refeicaoId } = await equipe();
  const prato = backend.doc(backend.database, 'NomePratos', refeicaoId);
  await backend.updateDoc(prato, { escola: 'Outra escola' });
  await assert.rejects(producao.salvarProducao({ refeicaoId, formulario }), /outra escola/);
  const amanha = new Date('2026-10-12T12:00:00'); amanha.setDate(amanha.getDate() + 1);
  await backend.updateDoc(prato, { escola: 'Satc', data: dataLocal(amanha) });
  await assert.rejects(producao.salvarProducao({ refeicaoId, formulario }), /futura/);
});
test('10 — produção notifica assinantes e não chama o SDK real na demonstração', async () => {
  const { producao, backend, sdk, refeicaoId } = await equipe();
  let quantidade = 0;
  const parar = backend.onSnapshot(referencia(backend, refeicaoId), () => { quantidade += 1; });
  await new Promise((resolve) => setImmediate(resolve));
  await producao.salvarProducao({ refeicaoId, formulario });
  assert.equal(quantidade, 2);
  parar();
  assert.deepEqual(sdk.chamadas, []);
});
