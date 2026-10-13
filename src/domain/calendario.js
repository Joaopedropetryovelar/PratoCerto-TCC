import { dataLocal, dataDaEscola, instanteEscola, dataValida, diasDaSemana, horarioValido } from './refeicoes.js';
export function parseData(valor) { return dataValida(valor) ? new Date(`${valor}T12:00:00`) : null; }
export function moverDia(valor, quantidade) { const data = parseData(valor); if (!data) throw new Error('Data inválida.'); data.setDate(data.getDate() + quantidade); return dataLocal(data); }
export function proximoDiaUtil(valor) { let dia = moverDia(valor, 1); while ([0, 6].includes(parseData(dia).getDay())) dia = moverDia(dia, 1); return dia; }
export function semanaVisivel(agora = new Date(), refeicoes = []) {
  let base = parseData(dataDaEscola(agora));
  const sexta = diasDaSemana(base)[4].id;
  const deSexta = refeicoes.filter((r) => r.data === sexta && r.ativo !== false);
  const fimSexta = deSexta.reduce((maior, r) => horarioValido(r.horarioFim) && r.horarioFim > maior ? r.horarioFim : maior, deSexta.length ? '00:00' : '18:00');
  if ([0, 6].includes(base.getDay()) || (base.getDay() === 5 && agora >= instanteEscola(sexta, fimSexta))) {
    base = parseData(proximoDiaUtil(dataLocal(base)));
  }
  return diasDaSemana(base);
}
export function limiteAvaliacao(refeicao) {
  if (!dataValida(refeicao?.data) || !horarioValido(refeicao?.horarioFim)) return null;
  return new Date(instanteEscola(proximoDiaUtil(refeicao.data), '23:59').getTime() + 59999);
}
export function erroAvaliacao(refeicao, agora = new Date()) {
  const limite = limiteAvaliacao(refeicao);
  if (!limite || !refeicao?.id || refeicao.ativo === false) return 'Esta refeição não está disponível para avaliar.';
  let inicio;
  try { inicio = instanteEscola(refeicao.data, refeicao.horarioFim); }
  catch { return 'O horário desta refeição precisa ser corrigido pela equipe.'; }
  if (agora < inicio) return `Avaliação disponível após o término da refeição, às ${refeicao.horarioFim}.`;
  if (agora > limite) return 'O prazo de avaliação terminou. Seu histórico está preservado.';
  return null;
}
export function gradeMes(valor) {
  const data = parseData(valor); if (!data) throw new Error('Data inválida.');
  const primeiro = new Date(data.getFullYear(), data.getMonth(), 1, 12);
  const inicio = new Date(primeiro); inicio.setDate(1 - (primeiro.getDay() + 6) % 7);
  return Array.from({ length: 42 }, (_, indice) => { const dia = new Date(inicio); dia.setDate(inicio.getDate() + indice); return { id: dataLocal(dia), numero: dia.getDate(), noMes: dia.getMonth() === data.getMonth(), util: ![0, 6].includes(dia.getDay()) }; });
}
export function moverMes(valor, quantidade) { const data = parseData(valor); if (!data) throw new Error('Data inválida.'); return dataLocal(new Date(data.getFullYear(), data.getMonth() + quantidade, 1, 12)); }
