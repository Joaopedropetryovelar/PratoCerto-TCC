import test from 'node:test';
import assert from 'node:assert/strict';
import { lerPeso, lerQuantidade, validarProducao, resumirProducao, agruparPorDia, filtrarPeriodo, dataValida, periodoDias, formularioDoRegistro, compararPeriodos, gerarCsv, registroValido } from '../src/domain/producao.js';
const refeicao = { id: 'prato', data: '2026-10-11', turno: 'manha' };
const agora = new Date('2026-10-11T08:00:00-03:00');
const form = { preparadoKg: '10', sobraLimpaKg: '1', sobraDescartadaKg: '0,5', restosKg: '0,5', servidos: '30', observacao: '' };
const registro = { refeicaoId: 'prato', refeicaoNome: 'Arroz', data: '2026-10-11', turno: 'manha', preparadoG: 10000, sobraLimpaG: 1000, sobraDescartadaG: 500, restosG: 500, servidos: 30 };

test('01 — vírgula e ponto viram gramas inteiras sem erro de soma decimal', () => {
  assert.equal(lerPeso('0,1') + lerPeso('0.2'), 300);
  assert.equal(lerPeso('12,345'), 12345);
  assert.equal(lerPeso('0'), 0);
});
test('02 — entradas vazias, negativas, infinitas e ambíguas são rejeitadas', () => {
  ['', ' ', '-1', '1,000.00', '1e3', 'NaN', 'Infinity', '1.1234', null, '1000001'].forEach((x) => assert.equal(lerPeso(x), null, String(x)));
  ['', '-1', '1,2', '1.0', 'Infinity'].forEach((x) => assert.equal(lerQuantidade(x), null));
});
test('03 — não aceita produção zero ou sobras maiores que a produção', () => {
  assert.equal(validarProducao(form, refeicao, agora).valido, true);
  assert.ok(validarProducao({ ...form, preparadoKg: '0' }, refeicao, agora).erros.preparadoKg);
  assert.ok(validarProducao({ ...form, preparadoKg: '1' }, refeicao, agora).erros.pesos);
  assert.equal(validarProducao({ ...form, preparadoKg: '2' }, refeicao, agora).valido, true);
});
test('04 — data inexistente e refeição futura não geram resultado', () => {
  assert.equal(dataValida('2026-02-31'), false);
  assert.equal(dataValida('2024-02-29'), true);
  assert.equal(dataValida('2026-02-29'), false);
  assert.ok(validarProducao(form, { ...refeicao, data: '2026-10-12' }, agora).erros.refeicao);
});
test('05 — sobra limpa não é somada ao descarte', () => {
  const resumo = resumirProducao([registro]);
  assert.equal(resumo.descarteG, 1000);
  assert.equal(resumo.sobraLimpaG, 1000);
  assert.equal(resumo.percentualDescarte, 10);
});
test('06 — percentual agregado é ponderado pelo peso preparado', () => {
  const outro = { ...registro, preparadoG: 1000, sobraLimpaG: 0, sobraDescartadaG: 1000, restosG: 0 };
  assert.ok(Math.abs(resumirProducao([registro, outro]).percentualDescarte - 2000 / 11000 * 100) < 1e-9);
});
test('07 — ausência de dados e zero refeições não viram falso zero de indicadores', () => {
  assert.equal(resumirProducao([]).percentualDescarte, null);
  assert.equal(resumirProducao([{ ...registro, servidos: 0 }]).gramasPorRefeicao, null);
  assert.equal(resumirProducao([{ ...registro, sobraDescartadaG: 0, restosG: 0 }]).percentualDescarte, 0);
});
test('08 — filtros incluem os dois limites e isolam o turno', () => {
  const itens = [registro, { ...registro, turno: 'tarde' }, { ...registro, data: '2026-10-10' }];
  assert.equal(filtrarPeriodo(itens, '2026-10-11', '2026-10-11').length, 2);
  assert.equal(filtrarPeriodo(itens, '2026-10-10', '2026-10-11', 'manha').length, 2);
  assert.equal(agruparPorDia(itens).length, 2);
});
test('09 — gráfico e indicadores ignoram registros corrompidos explicitamente', () => {
  assert.equal(registroValido({ ...registro, preparadoG: -1 }), false);
  const resumo = resumirProducao([registro, { ...registro, restosG: 99999 }]);
  assert.equal(resumo.registros, 1);
  assert.equal(resumo.ignorados, 1);
});
test('10 — CSV protege fórmulas, aspas, delimitadores e quebras de linha', () => {
  const csv = gerarCsv([{ ...registro, refeicaoNome: '=1+1', observacao: 'Texto; "teste"\nLinha 2' }]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"\'=1+1"'));
  assert.ok(csv.includes('"Texto; ""teste""\nLinha 2"'));
  assert.equal(csv.split('\r\n').length, 2);
});
test('11 — edição conserva exatamente as gramas, inclusive com milhares', () => {
  const item = { ...registro, preparadoG: 1234567 };
  const formulario = formularioDoRegistro(item);
  assert.equal(formulario.preparadoKg, '1234,567');
  assert.equal(validarProducao(formulario, refeicao, agora).dados.preparadoG, item.preparadoG);
});
test('12 — comparação distingue pontos percentuais, variação relativa e base zero', () => {
  const anterior = { ...registro, sobraDescartadaG: 1000, restosG: 1000 };
  const comparacao = compararPeriodos([registro], [anterior]);
  assert.equal(comparacao.diferencaPontos, -10);
  assert.equal(comparacao.variacaoRelativa, -50);
  assert.equal(compararPeriodos([registro], []), null);
  assert.equal(compararPeriodos([registro], [{ ...registro, sobraDescartadaG: 0, restosG: 0 }]).variacaoRelativa, null);
});
test('13 — período de sete dias cruza corretamente mês e ano', () => {
  assert.deepEqual(periodoDias(7, new Date('2026-01-03T01:00:00-03:00')), { inicio: '2025-12-28', fim: '2026-01-03' });
});
