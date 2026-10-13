import test from 'node:test';
import assert from 'node:assert/strict';
import { dataLocal, diasDaSemana, erroConfirmacao, horarioValido, idAvaliacao } from '../src/domain/refeicoes.js';

const refeicao = { id: 'arroz', data: '2026-10-12', turno: 'manha', horarioLimite: '09:00', ativo: true };
test('confirmação fecha exatamente no prazo e considera a data da refeição', () => {
  assert.equal(erroConfirmacao(refeicao, 'manha', new Date('2026-10-12T08:59:59-03:00')), null);
  assert.match(erroConfirmacao(refeicao, 'manha', new Date('2026-10-12T09:00:00-03:00')), /terminou/);
  assert.match(erroConfirmacao(refeicao, 'manha', new Date('2026-10-13T08:00:00-03:00')), /terminou/);
  assert.equal(erroConfirmacao(refeicao, 'manha', new Date('2026-10-11T12:00:00')), null);
});
test('não confirma refeição removida, turno diferente ou prazo inválido', () => {
  const agora = new Date('2026-10-12T08:00:00-03:00');
  assert.match(erroConfirmacao({ ...refeicao, ativo: false }, 'manha', agora), /disponível/);
  assert.match(erroConfirmacao(refeicao, 'tarde', agora), /turno/);
  assert.match(erroConfirmacao({ ...refeicao, horarioLimite: '24:00' }, 'manha', agora), /corrigido/);
  assert.match(erroConfirmacao({ ...refeicao, data: '2026-02-31' }, 'manha', agora), /inválida/);
});
test('horários aceitam HH:MM e rejeitam entradas fora do padrão', () => {
  ['00:00', '09:00', '23:59'].forEach((valor) => assert.ok(horarioValido(valor)));
  ['9:00', '24:00', '13:60', '', null].forEach((valor) => assert.equal(horarioValido(valor), false));
});
test('avaliações de refeições diferentes não compartilham documento', () => {
  assert.notEqual(idAvaliacao('arroz', 'aluno1'), idAvaliacao('sopa', 'aluno1'));
  assert.equal(idAvaliacao('arroz', 'aluno1'), 'arroz_aluno1');
  assert.throws(() => idAvaliacao(null, 'aluno1'));
});
test('semana começa na segunda, inclusive quando a data inicial é domingo', () => {
  const dias = diasDaSemana(new Date('2026-10-11T12:00:00'));
  assert.equal(dias.length, 5);
  assert.equal(dias[0].id, '2026-10-05');
  const demo = diasDaSemana(new Date('2026-10-11T12:00:00'), true);
  assert.equal(demo[6].id, '2026-10-11');
  assert.equal(dataLocal(new Date('2026-10-11T00:30:00')), '2026-10-11');
});
