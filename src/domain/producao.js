import { dataLocal, dataDaEscola, dataValida } from './refeicoes.js';

export const TURNOS = [{ id: 'todos', nome: 'Todos' }, { id: 'manha', nome: 'Manhã' }, { id: 'tarde', nome: 'Tarde' }, { id: 'noite', nome: 'Noite' }];
export const CAMPOS_PESO = ['preparadoKg', 'sobraLimpaKg', 'sobraDescartadaKg', 'restosKg'];

export { dataValida };

// Converte kg para gramas inteiras; não aceita campos vazios nem arredondamentos silenciosos.
export function lerPeso(valor) {
  const texto = String(valor ?? '').trim();
  if (!/^\d+(?:[,.]\d{1,3})?$/.test(texto)) return null;
  const [inteiro, decimal = ''] = texto.replace(',', '.').split('.');
  const gramas = Number(inteiro) * 1000 + Number(decimal.padEnd(3, '0'));
  return Number.isSafeInteger(gramas) && gramas <= 1000000000 ? gramas : null;
}
export function lerQuantidade(valor) {
  const texto = String(valor ?? '').trim();
  if (!/^\d+$/.test(texto)) return null;
  const numero = Number(texto);
  return Number.isSafeInteger(numero) && numero <= 1000000 ? numero : null;
}
export function validarProducao(formulario, refeicao, agora = new Date()) {
  const erros = {};
  if (!refeicao?.id || !dataValida(refeicao.data)) erros.refeicao = 'Escolha uma refeição com data válida.';
  else if (refeicao.data > dataDaEscola(agora)) erros.refeicao = 'Não é possível registrar o resultado de uma refeição futura.';
  if (formulario.modo === 'rapido') {
    const servidos = lerQuantidade(formulario.servidos), sobraTotalG = lerPeso(formulario.sobraTotalKg);
    if (servidos === null) erros.servidos = 'Informe um número inteiro de refeições servidas (0 ou mais).';
    if (sobraTotalG === null) erros.sobraTotalKg = 'Informe um peso em kg, com até 3 casas decimais. Use 0 quando não houver.';
    if (String(formulario.observacao || '').length > 500) erros.observacao = 'Use no máximo 500 caracteres.';
    return { erros, valido: Object.keys(erros).length === 0, dados: { sobraTotalG, servidos, observacao: String(formulario.observacao || '').trim() } };
  }
  const pesos = {};
  CAMPOS_PESO.forEach((campo) => {
    pesos[campo] = lerPeso(formulario[campo]);
    if (pesos[campo] === null) erros[campo] = 'Informe um peso em kg, com até 3 casas decimais. Use 0 quando não houver.';
  });
  if (pesos.preparadoKg === 0) erros.preparadoKg = 'A quantidade preparada deve ser maior que zero.';
  const servidos = lerQuantidade(formulario.servidos);
  if (servidos === null) erros.servidos = 'Informe um número inteiro de refeições servidas (0 ou mais).';
  if (CAMPOS_PESO.every((campo) => pesos[campo] !== null) && pesos.sobraLimpaKg + pesos.sobraDescartadaKg + pesos.restosKg > pesos.preparadoKg) {
    erros.pesos = 'A soma das sobras e restos não pode superar a quantidade preparada.';
  }
  if (String(formulario.observacao || '').length > 500) erros.observacao = 'Use no máximo 500 caracteres.';
  return { erros, valido: Object.keys(erros).length === 0, dados: {
    preparadoG: pesos.preparadoKg, sobraLimpaG: pesos.sobraLimpaKg, sobraDescartadaG: pesos.sobraDescartadaKg,
    restosG: pesos.restosKg, servidos, observacao: String(formulario.observacao || '').trim(),
  } };
}
export function registroValido(item) {
  if (!item || !dataValida(item.data) || !item.refeicaoId || !['manha', 'tarde', 'noite'].includes(item.turno)) return false;
  if (item.schemaVersion === 2) return Number.isSafeInteger(item.sobraTotalG) && item.sobraTotalG >= 0 && item.sobraTotalG <= 1000000000 && Number.isSafeInteger(item.servidos) && item.servidos >= 0 && item.servidos <= 1000000;
  if (item.schemaVersion !== undefined && item.schemaVersion !== 1) return false;
  const campos = ['preparadoG', 'sobraLimpaG', 'sobraDescartadaG', 'restosG', 'servidos'];
  if (!campos.every((campo) => Number.isSafeInteger(item[campo]) && item[campo] >= 0)) return false;
  return item.preparadoG > 0 && item.preparadoG <= 1000000000 && item.servidos <= 1000000 && item.sobraLimpaG + item.sobraDescartadaG + item.restosG <= item.preparadoG;
}
export function resumirProducao(registros) {
  const validos = registros.filter(registroValido);
  const detalhados = validos.filter(item => item.schemaVersion !== 2);
  const preparadoG = detalhados.reduce((soma, item) => soma + item.preparadoG, 0);
  const descarteG = detalhados.reduce((soma, item) => soma + item.sobraDescartadaG + item.restosG, 0);
  const sobraLimpaG = detalhados.reduce((soma, item) => soma + item.sobraLimpaG, 0);
  const sobrasG = validos.reduce((soma, item) => soma + (item.schemaVersion === 2 ? item.sobraTotalG : item.sobraLimpaG + item.sobraDescartadaG), 0);
  const servidosMedidos = detalhados.reduce((soma, item) => soma + item.servidos, 0);
  const servidos = validos.reduce((soma, item) => soma + item.servidos, 0);
  return { registros: validos.length, ignorados: registros.length - validos.length, medidos: detalhados.length, rapidos: validos.length - detalhados.length, sobrasG, preparadoG, descarteG, sobraLimpaG, servidos,
    percentualDescarte: preparadoG > 0 ? descarteG / preparadoG * 100 : null,
    gramasPorRefeicao: servidosMedidos > 0 ? descarteG / servidosMedidos : null };
}
export function filtrarPeriodo(registros, inicio, fim, turno = 'todos') {
  return registros.filter((item) => item.data >= inicio && item.data <= fim && (turno === 'todos' || item.turno === turno));
}
export function agruparPorDia(registros) {
  const dias = [...new Set(registros.filter(registroValido).map((item) => item.data))].sort();
  return dias.map((data) => ({ data, ...resumirProducao(registros.filter((item) => item.data === data)) }));
}
export function periodoDias(quantidade, agora = new Date()) {
  const inicio = new Date(`${dataDaEscola(agora)}T12:00:00`);
  inicio.setHours(12, 0, 0, 0);
  inicio.setDate(inicio.getDate() - quantidade + 1);
  return { inicio: dataLocal(inicio), fim: dataDaEscola(agora) };
}
export function kg(gramas, casas = 3) { return (gramas / 1000).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }); }
export function formularioDoRegistro(registro) {
  if (!registro) return { modo: 'rapido', sobraTotalKg: '', preparadoKg: '', sobraLimpaKg: '', sobraDescartadaKg: '', restosKg: '', servidos: '', observacao: '' };
  const textoPeso = (valor) => Number.isSafeInteger(valor) && valor >= 0 ? kg(valor).replace(/\./g, '') : '';
  return { modo: registro.schemaVersion === 2 ? 'rapido' : 'detalhado', sobraTotalKg: textoPeso(registro.sobraTotalG), preparadoKg: textoPeso(registro.preparadoG), sobraLimpaKg: textoPeso(registro.sobraLimpaG),
    sobraDescartadaKg: textoPeso(registro.sobraDescartadaG), restosKg: textoPeso(registro.restosG),
    servidos: Number.isSafeInteger(registro.servidos) ? String(registro.servidos) : '', observacao: registro.observacao || '' };
}
export function compararPeriodos(atual, anterior) {
  const a = resumirProducao(atual), b = resumirProducao(anterior);
  if (a.percentualDescarte === null || b.percentualDescarte === null) return null;
  return { diferencaPontos: a.percentualDescarte - b.percentualDescarte,
    variacaoRelativa: b.percentualDescarte > 0 ? (a.percentualDescarte - b.percentualDescarte) / b.percentualDescarte * 100 : null };
}
function celula(valor) {
  let texto = String(valor ?? '');
  if (typeof valor === 'string' && /^[\s]*[=+@\-]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replace(/"/g, '""')}"`;
}
export function gerarCsv(registros) {
  const cabecalho = ['Data', 'Turno', 'Escola', 'Origem', 'Refeição', 'Preparado (kg)', 'Sobra limpa (kg)', 'Sobra descartada (kg)', 'Restos dos pratos (kg)', 'Descarte total (kg)', 'Descarte (%)', 'Refeições servidas', 'Observação', 'Sobra de alimentos (kg)', 'Tipo de registro'];
  const linhas = registros.filter(registroValido).sort((a, b) => a.data.localeCompare(b.data) || a.turno.localeCompare(b.turno)).map((item) => {
    const descarte = item.sobraDescartadaG + item.restosG;
    if (item.schemaVersion === 2) return [item.data, item.turno, item.escola || '', item.exemplo ? 'Demonstração' : 'Registrado pela equipe', item.refeicaoNome, '', '', '', '', '', '', item.servidos, item.observacao, (item.sobraTotalG / 1000).toFixed(3).replace('.', ','), 'Rápido'];
    return [item.data, item.turno, item.escola || '', item.exemplo === true ? 'Demonstração' : item.exemplo === false ? 'Registrado pela equipe' : 'Origem não informada', item.refeicaoNome, ...['preparadoG', 'sobraLimpaG', 'sobraDescartadaG', 'restosG'].map((campo) => (item[campo] / 1000).toFixed(3).replace('.', ',')),
      (descarte / 1000).toFixed(3).replace('.', ','), (descarte / item.preparadoG * 100).toFixed(2).replace('.', ','), item.servidos, item.observacao, ((item.sobraLimpaG + item.sobraDescartadaG) / 1000).toFixed(3).replace('.', ','), 'Detalhado'];
  });
  return '\uFEFF' + [cabecalho, ...linhas].map((linha) => linha.map(celula).join(';')).join('\r\n');
}
