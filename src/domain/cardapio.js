import { TURNOS_ALUNO } from './escolas';
import { dataDaEscola, dataValida } from './refeicoes';

export const HORARIOS_TURNO = {
  manha: ['09:00', '12:30'],
  tarde: ['14:00', '16:00'],
  noite: ['18:00', '20:00'],
};

export function organizarRefeicoesPorTurno(refeicoes, data) {
  return TURNOS_ALUNO.map(turno => ({
    ...turno,
    refeicoes: refeicoes.filter(item => item.ativo !== false && item.data === data && item.turno === turno.id),
  }));
}

export function podeEditarRefeicao(refeicao, agora) {
  return Boolean(refeicao && refeicao.ativo !== false && dataValida(refeicao.data) && refeicao.data >= dataDaEscola(agora));
}
