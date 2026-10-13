const { test } = require('node:test');
const assert = require('node:assert/strict');
const { criarRuntime } = require('./runtime.cjs');
const R = criarRuntime().carregar('src/domain/restricoes.js');
const valido = (patch = {}) => ({ situacao: 'informadas', itens: ['intolerancia_lactose'], outra: '', declarante: 'responsavel', nomeResponsavel: 'Responsável Teste', autorizou: true, ...patch });

test('restrições são opcionais e ausência não é declarada como nenhuma', () => {
  assert.deepEqual(R.validarRestricoes(R.formularioRestricoes()), {});
  assert.equal(R.prepararRestricoes(undefined, 'u', 'Satc', 1), null);
});
test('declaração exige escolha específica de autorização e declarante', () => {
  for (const patch of [{ autorizou: false }, { declarante: '' }, { nomeResponsavel: 'A' }]) assert.ok(Object.keys(R.validarRestricoes(valido(patch))).length);
  assert.deepEqual(R.validarRestricoes(valido()), {});
  assert.deepEqual(R.validarRestricoes(valido({ declarante: 'titular_adulto', nomeResponsavel: '' })), {});
});
test('informação sem restrição requer lista vazia e autorização específica', () => {
  assert.deepEqual(R.validarRestricoes(valido({ situacao: 'nenhuma', itens: [] })), {});
  assert.ok(R.validarRestricoes(valido({ situacao: 'nenhuma' })).itens);
  assert.ok(R.validarRestricoes(valido({ itens: [] })).itens);
});
test('itens duplicados, desconhecidos e descrição inconsistente são rejeitados', () => {
  for (const patch of [{ itens: ['falso'] }, { itens: ['alergia_ovo', 'alergia_ovo'] }, { itens: ['outra'], outra: '' }, { outra: 'Detalhe inesperado' }, { itens: ['outra'], outra: 'x'.repeat(121) }]) assert.ok(Object.keys(R.validarRestricoes(valido(patch))).length);
  assert.deepEqual(R.validarRestricoes(valido({ itens: ['outra'], outra: 'Restrição específica' })), {});
});
test('payload ignora privilégios fornecidos e registra versão e horário', () => {
  const dados = R.prepararRestricoes(valido({ tipoConta: 'admin', alunoId: 'outro', escola: 'Outra' }), 'u', 'Satc', 123);
  assert.equal(dados.alunoId, 'u'); assert.equal(dados.escola, 'Satc'); assert.equal(dados.tipoConta, undefined);
  assert.equal(dados.atualizadoEm, 123); assert.equal(dados.versaoAviso, R.VERSAO_AVISO_RESTRICOES);
});
test('estatísticas contam cada aluno uma vez e preservam não informado', () => {
  const alunos = ['a', 'b', 'c'].map((uid) => ({ uid, tipoConta: 'aluno', escola: 'Satc', turnos: ['manha', 'tarde'] }));
  const dados = [R.prepararRestricoes(valido({ itens: ['intolerancia_lactose', 'alergia_leite'] }), 'a', 'Satc', 1), R.prepararRestricoes(valido({ situacao: 'nenhuma', itens: [] }), 'b', 'Satc', 1)];
  const resumo = R.estatisticasRestricoes([...alunos, alunos[0]], [...dados, { ...dados[0], alunoId: 'fora' }]);
  assert.equal(resumo.total, 3); assert.equal(resumo.comRestricoes, 1); assert.equal(resumo.semRestricoes, 1); assert.equal(resumo.naoInformado, 1);
  assert.equal(resumo.grupos.find((g) => g.id === 'intolerancia_lactose').quantidade, 1);
  assert.equal(resumo.grupos.find((g) => g.id === 'alergia_leite').quantidade, 1);
  assert.equal(resumo.impacto.porcoesAtencao, 1);
  assert.equal(resumo.impacto.semLeiteOuLactose, 1);
  assert.ok(Math.abs(resumo.impacto.percentualAtencao - (100 / 3)) < 0.001);
  assert.equal(R.estatisticasRestricoes(alunos, dados, 'noite').total, 0);
});
test('outra escola, autorização inválida ou ausência inconsistente não geram falsa segurança', () => {
  const alunos = ['a', 'b', 'c'].map((uid) => ({ uid, tipoConta: 'aluno', escola: 'Satc', turnos: ['manha'] }));
  const r = R.prepararRestricoes(valido(), 'a', 'Satc', 1);
  const resumo = R.estatisticasRestricoes(alunos, [{ ...r, escola: 'Outra' }, { ...r, alunoId: 'b', autorizou: 'true' }, { ...r, alunoId: 'c', situacao: 'nenhuma' }]);
  assert.equal(resumo.naoInformado, 3); assert.equal(resumo.informados, 0);
  assert.ok(R.estatisticasRestricoes([], []).grupos.every((g) => g.percentual === 0));
});
