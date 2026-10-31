import {
  dataLocal,
  dataDaEscola,
  instanteEscola,
  dataValida,
  diasDaSemana,
  horarioValido,
} from './refeicoes.js';
export function parseData(valor) {
  return dataValida(valor) ? new Date(`${valor}T12:00:00`) : null;
}
export function moverDia(valor, quantidade) {
  const data = parseData(valor);
  if (!data) throw new Error('Data inválida.');
  data.setDate(data.getDate() + quantidade);
  return dataLocal(data);
}
export function proximoDiaUtil(valor) {
  let dia = moverDia(valor, 1);
  while ([0, 6].includes(parseData(dia).getDay())) dia = moverDia(dia, 1);
  return dia;
}
export function semanaVisivel(agora = new Date(), refeicoes = []) {
  let base = parseData(dataDaEscola(agora));
  const sexta = diasDaSemana(base)[4].id;
  const deSexta = refeicoes.filter(
    (refeicao) => refeicao.data === sexta && refeicao.ativo !== false,
  );
  const fimSexta = deSexta.reduce(
    (maior, refeicao) =>
      horarioValido(refeicao.horarioFim) && refeicao.horarioFim > maior
        ? refeicao.horarioFim
        : maior,
    deSexta.length ? '00:00' : '18:00',
  );
  if (
    [0, 6].includes(base.getDay()) ||
    (base.getDay() === 5 && agora >= instanteEscola(sexta, fimSexta))
  ) {
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
  if (!limite || !refeicao?.id || refeicao.ativo === false)
    return 'Esta refeição não está disponível para avaliar.';
  let inicio;
  try {
    inicio = instanteEscola(refeicao.data, refeicao.horarioFim);
  } catch {
    return 'O horário desta refeição precisa ser corrigido pela equipe.';
  }
  if (agora < inicio)
    return `Avaliação disponível após o término da refeição, às ${refeicao.horarioFim}.`;
  if (agora > limite) return 'O prazo de avaliação terminou. Seu histórico está preservado.';
  return null;
}
// Datas do calendário são dias civis. UTC evita deslocamento de coluna por fuso/DST.
function dataCivilUTC(data) {
  return `${String(data.getUTCFullYear()).padStart(4, '0')}-${String(data.getUTCMonth() + 1).padStart(2, '0')}-${String(data.getUTCDate()).padStart(2, '0')}`;
}
export function formatarDataCalendario(valor) {
  if (!dataValida(valor)) return 'Selecionar data';
  return valor.split('-').reverse().join('/');
}
export function tituloMesCalendario(valor) {
  if (!dataValida(valor)) throw new Error('Data inválida.');
  const meses = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ];
  const [ano, mes] = valor.split('-').map(Number);
  return `${meses[mes - 1]} de ${ano}`;
}
export function gradeMes(valor) {
  if (!dataValida(valor)) throw new Error('Data inválida.');
  const [ano, mes] = valor.split('-').map(Number);
  const primeiro = new Date(Date.UTC(ano, mes - 1, 1, 12));
  const deslocamento = (primeiro.getUTCDay() + 6) % 7;
  return Array.from(
    {
      length: 42,
    },
    (_, indice) => {
      const dia = new Date(Date.UTC(ano, mes - 1, 1 - deslocamento + indice, 12));
      return {
        id: dataCivilUTC(dia),
        numero: dia.getUTCDate(),
        noMes: dia.getUTCMonth() === mes - 1,
        util: ![0, 6].includes(dia.getUTCDay()),
      };
    },
  );
}
export function moverMes(valor, quantidade) {
  if (!dataValida(valor) || !Number.isInteger(quantidade)) throw new Error('Data inválida.');
  const [ano, mes] = valor.split('-').map(Number);
  return dataCivilUTC(new Date(Date.UTC(ano, mes - 1 + quantidade, 1, 12)));
}
