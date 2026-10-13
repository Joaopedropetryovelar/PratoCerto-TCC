export const ESCOLAS = ['Satc', 'Antônio Guglielmi Sobrinho'];
export const TURNOS_ALUNO = [{ id: 'manha', nome: 'Manhã' }, { id: 'tarde', nome: 'Tarde' }, { id: 'noite', nome: 'Noite' }];
export const TURMAS = ['6º Ano', '7º Ano', '8º Ano', '9º Ano', '1º Ano do Ensino Médio', '2º Ano do Ensino Médio', '3º Ano do Ensino Médio'];
export function escolaValida(escola) { return ESCOLAS.includes(escola); }
export function chaveEscola(escola) {
  if (!escolaValida(escola)) throw new Error('Selecione uma escola válida.');
  return escola === ESCOLAS[0] ? 'satc' : 'ags';
}
export function turnosDoPerfil(perfil) {
  const fonte = Array.isArray(perfil?.turnos) ? perfil.turnos : [perfil?.turno];
  return TURNOS_ALUNO.map((t) => t.id).filter((t) => fonte.includes(t));
}
export function pertenceEscola(item, perfil) { return escolaValida(perfil?.escola) && item?.escola === perfil.escola; }
export function podeConsumir(refeicao, perfil) { return pertenceEscola(refeicao, perfil) && turnosDoPerfil(perfil).includes(refeicao?.turno); }
