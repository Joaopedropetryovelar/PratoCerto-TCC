export function dataDaEscola(data = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(data);
}
export function instanteEscola(data, hora) {
  if (!dataValida(data) || !horarioValido(hora))
    throw new Error('Data ou horário da escola inválido.');
  const [ano, mes, dia] = data.split('-').map(Number),
    [horas, minutos] = hora.split(':').map(Number);
  const alvo = Date.UTC(ano, mes - 1, dia, horas, minutos);
  const formatador = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  let valor = alvo + 3 * 3600000;
  for (let indice = 0; indice < 3; indice += 1) {
    const partes = Object.fromEntries(
      formatador
        .formatToParts(new Date(valor))
        .filter((parteData) => parteData.type !== 'literal')
        .map((parteData) => [parteData.type, Number(parteData.value)]),
    );
    const exibido = Date.UTC(
      partes.year,
      partes.month - 1,
      partes.day,
      partes.hour,
      partes.minute,
      partes.second,
    );
    if (exibido === alvo) return new Date(valor);
    valor += alvo - exibido;
  }
  throw new Error('Este horário não existe no fuso da escola. Escolha outro horário.');
}
export function dataLocal(data = new Date()) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}
export function diasDaSemana(hoje = new Date(), incluirFimDeSemana = false) {
  const segunda = new Date(hoje);
  segunda.setHours(12, 0, 0, 0);
  segunda.setDate(hoje.getDate() + (hoje.getDay() === 0 ? -6 : 1 - hoje.getDay()));
  const nomes = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  return nomes.slice(0, incluirFimDeSemana ? 7 : 5).map((nome, indice) => {
    const data = new Date(segunda);
    data.setDate(segunda.getDate() + indice);
    return {
      id: dataLocal(data),
      nome,
      numero: String(data.getDate()).padStart(2, '0'),
      data,
    };
  });
}
export function horarioValido(horario) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(horario || '');
}
export function erroConfirmacao(refeicao, turno, agora = new Date()) {
  if (!refeicao?.id || refeicao.ativo === false) return 'Esta refeição não está disponível.';
  if (!(Array.isArray(turno) ? turno : [turno]).includes(refeicao.turno))
    return 'Você só pode confirmar refeições do seu turno.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(refeicao.data || '') || !horarioValido(refeicao.horarioLimite)) {
    return 'O prazo desta refeição precisa ser corrigido pela equipe.';
  }
  if (!dataValida(refeicao.data)) return 'A data desta refeição é inválida.';
  let limite;
  try {
    limite = instanteEscola(refeicao.data, refeicao.horarioLimite);
  } catch {
    return 'O horário desta refeição precisa ser corrigido pela equipe.';
  }
  if (!Number.isFinite(limite.getTime()) || dataDaEscola(limite) !== refeicao.data)
    return 'A data desta refeição é inválida.';
  if (agora >= limite)
    return `O prazo de confirmação terminou em ${refeicao.data.split('-').reverse().join('/')} às ${refeicao.horarioLimite}.`;
  return null;
}
export function idAvaliacao(refeicaoId, alunoId) {
  if (!refeicaoId || !alunoId) throw new Error('Refeição e aluno são obrigatórios.');
  return `${refeicaoId}_${alunoId}`;
}
export function dataValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor || '')) return false;
  const data = new Date(`${valor}T12:00:00`);
  return Number.isFinite(data.getTime()) && dataLocal(data) === valor;
}
