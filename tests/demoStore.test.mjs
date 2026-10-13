import test from 'node:test';
import assert from 'node:assert/strict';
import { criarDemoStore } from '../src/services/demoStore.js';

const gerar = () => ({ usuarios: { aluno: { nome: 'Exemplo' } }, NomePratos: {}, confirmacoes: {}, feedbacks: {} });
function memoria() {
  let texto = null;
  return { getItem: async () => texto, setItem: async (_, valor) => { texto = valor; } };
}
const documento = (colecao, id) => ({ tipo: 'doc', colecao, id });
const pausa = () => new Promise((resolve) => setImmediate(resolve));

test('dados persistem ao recriar o serviço e ficam separados por refeição/aluno', async () => {
  const armazenamento = memoria();
  const store = criarDemoStore(armazenamento, gerar);
  const ref = documento('confirmacoes', 'prato_aluno');
  await store.escrever(ref, { vaiConsumir: true });
  await store.escrever(ref, { vaiConsumir: false }, true);
  const outro = criarDemoStore(armazenamento, gerar);
  assert.equal((await outro.ler(ref)).data().vaiConsumir, false);
  assert.equal((await outro.ler({ tipo: 'collection', colecao: 'confirmacoes' })).size, 1);
});
test('gravações simultâneas preservam os dois registros', async () => {
  const store = criarDemoStore(memoria(), gerar);
  await Promise.all([store.escrever(documento('feedbacks', 'a'), { nota: 5 }), store.escrever(documento('feedbacks', 'b'), { nota: 4 })]);
  assert.equal((await store.ler({ tipo: 'collection', colecao: 'feedbacks' })).size, 2);
});
test('uma falha de persistência não confirma a alteração e não interrompe as próximas', async () => {
  const armazenamento = memoria();
  const salvar = armazenamento.setItem;
  let falhar = true;
  armazenamento.setItem = async (...args) => { if (falhar) throw new Error('disco indisponível'); return salvar(...args); };
  const store = criarDemoStore(armazenamento, gerar);
  const ref = documento('feedbacks', 'a');
  await assert.rejects(store.escrever(ref, { nota: 5 }), /disco/);
  assert.equal((await store.ler(ref)).exists(), false);
  falhar = false;
  await store.escrever(ref, { nota: 4 });
  assert.equal((await store.ler(ref)).data().nota, 4);
});
test('ouvintes atualizam aluno/equipe e param ao desmontar', async () => {
  const store = criarDemoStore(memoria(), gerar);
  let chamadas = 0;
  const ref = documento('confirmacoes', 'prato_aluno');
  const cancelar = store.escutar(ref, () => { chamadas += 1; });
  await pausa();
  assert.equal(chamadas, 1);
  await store.escrever(ref, { vaiConsumir: true });
  assert.equal(chamadas, 2);
  cancelar();
  await store.escrever(ref, { vaiConsumir: false });
  assert.equal(chamadas, 2);
});
test('consulta de mês/turno e limite correspondem aos filtros das telas', async () => {
  const store = criarDemoStore(memoria(), gerar);
  await store.escrever(documento('feedbacks', 'a'), { data: '2026-10-11', turno: 'manha' });
  await store.escrever(documento('feedbacks', 'b'), { data: '2026-11-11', turno: 'manha' });
  const consulta = { tipo: 'collection', colecao: 'feedbacks', filtros: [{ campo: 'data', operador: '>=', valor: '2026-10-01' }, { campo: 'data', operador: '<=', valor: '2026-10-31' }] };
  assert.equal((await store.ler(consulta)).size, 1);
  assert.equal((await store.ler({ ...consulta, filtros: [{ tipo: 'limit', valor: 1 }] })).size, 1);
});
test('arquivar uma refeição preserva confirmações anteriores', async () => {
  const store = criarDemoStore(memoria(), gerar);
  const ref = documento('NomePratos', 'prato');
  await store.escrever(ref, { nome: 'Arroz', ativo: true });
  await store.escrever(documento('confirmacoes', 'prato_aluno'), { refeicaoId: 'prato' });
  await store.escrever(ref, { ativo: false }, true, true);
  assert.equal((await store.ler(ref)).data().nome, 'Arroz');
  assert.equal((await store.ler(documento('confirmacoes', 'prato_aluno'))).exists(), true);
});
test('restaurar exemplos substitui só o conteúdo da demonstração', async () => {
  const store = criarDemoStore(memoria(), gerar);
  await store.escrever(documento('feedbacks', 'a'), { nota: 5 });
  await store.restaurar();
  assert.equal((await store.ler(documento('feedbacks', 'a'))).exists(), false);
  assert.equal((await store.ler(documento('usuarios', 'aluno'))).exists(), true);
});
