const { test } = require('node:test');
const assert = require('node:assert/strict');
const { criarRuntime } = require('./runtime.cjs');
function ambiente() {
  const chamadas = [], renovacoes = [];
  const firestore = {
    collection: (_, nome) => ({ nome }), where: (campo, op, valor) => ({ campo, op, valor }), query: (ref, ...filtros) => ({ ...ref, filtros }),
    onSnapshot: (ref, sucesso, erro) => { const c = { ref, sucesso, erro, cancelado: false }; chamadas.push(c); return () => { c.cancelado = true; }; },
  };
  const auth = { currentUser: { uid: 'u', emailVerified: true } };
  const rt = criarRuntime({ firestore, firebaseAuth: { getIdToken: async (...args) => { renovacoes.push(args); return 'token'; } }, configuracao: { auth, database: {} } });
  return { servico: rt.carregar('src/services/consultas.js'), chamadas, renovacoes, rt };
}
const filtros = [['escola', '==', 'Satc'], ['alunoId', '==', 'u'], ['data', '>=', '2026-10-12'], ['data', '<=', '2026-10-14']];
const snapshot = (id) => ({ docs: id ? [{ id, data: () => ({ escola: 'Satc', data: '2026-10-12' }) }] : [] });
test('índice ausente usa dias específicos preservando escola e aluno, sem resultado parcial', () => {
  const a = ambiente(), resultados = [], erros = [];
  const parar = a.servico.escutarConsulta('feedbacks', filtros, (v) => resultados.push(v), (e) => erros.push(e));
  a.chamadas[0].erro({ code: 'failed-precondition', message: 'The query requires an index.' });
  assert.equal(a.chamadas[0].cancelado, true); assert.equal(a.chamadas.length, 4);
  for (const c of a.chamadas.slice(1)) {
    assert.ok(c.ref.filtros.every((f) => f.op === '=='));
    assert.ok(c.ref.filtros.some((f) => f.campo === 'escola' && f.valor === 'Satc'));
    assert.ok(c.ref.filtros.some((f) => f.campo === 'alunoId' && f.valor === 'u'));
  }
  a.chamadas[1].sucesso(snapshot('r1')); a.chamadas[2].sucesso(snapshot(null)); assert.equal(resultados.length, 0);
  a.chamadas[3].sucesso(snapshot('r3')); assert.deepEqual(resultados[0].map((v) => v.id), ['r1', 'r3']);
  parar(); assert.ok(a.chamadas.every((c) => c.cancelado));
  a.chamadas[1].sucesso(snapshot('atrasado')); assert.equal(resultados.length, 1); assert.equal(erros.length, 0);
});
test('período acima de 31 dias não é truncado silenciosamente', () => {
  const a = ambiente(), erros = [];
  const longos = [...filtros.slice(0, 2), ['data', '>=', '2026-01-01'], ['data', '<=', '2026-02-01']];
  assert.equal(a.servico.consultasPorDia(longos), null);
  const parar = a.servico.escutarConsulta('feedbacks', longos, () => assert.fail(), (e) => erros.push(e));
  a.chamadas[0].erro({ code: 'failed-precondition', message: 'index required' });
  assert.equal(a.chamadas.length, 1); assert.equal(erros.length, 1); parar();
});
test('token verificado é renovado uma única vez e permissões continuam sendo exigidas', async () => {
  const a = ambiente(), erros = [];
  const parar = a.servico.escutarConsulta('NomePratos', filtros, () => {}, (e) => erros.push(e));
  a.chamadas[0].erro({ code: 'permission-denied' });
  await new Promise((r) => setImmediate(r));
  assert.equal(a.renovacoes.length, 1); assert.equal(a.renovacoes[0][1], true); assert.equal(a.chamadas.length, 2);
  a.chamadas[1].erro({ code: 'permission-denied' });
  assert.equal(erros.length, 1); assert.equal(a.chamadas.length, 2); parar();
});
test('consulta cancelada durante renovação não reinicia nem publica dados', async () => {
  const a = ambiente(), erros = [];
  const parar = a.servico.escutarConsulta('NomePratos', filtros, () => assert.fail(), (e) => erros.push(e));
  a.chamadas[0].erro({ code: 'permission-denied' }); parar(); await new Promise((r) => setImmediate(r));
  assert.equal(a.chamadas.length, 1); assert.equal(erros.length, 0);
});
test('mensagens distinguem permissão, índice e conexão sem expor conteúdo pessoal', () => {
  const { mensagemDados } = ambiente().rt.carregar('src/domain/errosDados.js');
  assert.match(mensagemDados({ code: 'permission-denied' }), /permissões/);
  assert.match(mensagemDados({ code: 'failed-precondition' }), /índices/);
  assert.match(mensagemDados({ code: 'unavailable' }), /conexão/);
  assert.doesNotMatch(mensagemDados(new Error('informação privada de teste')), /privada/);
});
