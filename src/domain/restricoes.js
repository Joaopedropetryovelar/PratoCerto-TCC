import { turnosDoPerfil } from './escolas.js';

export const VERSAO_AVISO_RESTRICOES = '2026-10-13-restricoes-1';
export const OPCOES_RESTRICOES = [
  { id: 'intolerancia_lactose', nome: 'Intolerância à lactose' },
  { id: 'alergia_leite', nome: 'Alergia ao leite' },
  { id: 'alergia_ovo', nome: 'Alergia ao ovo' },
  { id: 'alergia_amendoim', nome: 'Alergia ao amendoim' },
  { id: 'alergia_castanhas', nome: 'Alergia a castanhas ou nozes' },
  { id: 'alergia_soja', nome: 'Alergia à soja' },
  { id: 'alergia_trigo', nome: 'Alergia ao trigo' },
  { id: 'alergia_peixe', nome: 'Alergia a peixe' },
  { id: 'alergia_frutos_mar', nome: 'Alergia a frutos do mar' },
  { id: 'restricao_gluten', nome: 'Restrição ao glúten' },
  { id: 'outra', nome: 'Outra restrição alimentar' },
];
export function formularioRestricoes(registro) {
  return {
    situacao: registro?.situacao || 'nao_informado',
    itens: Array.isArray(registro?.itens) ? [...registro.itens] : [],
    outra: registro?.outra || '',
    declarante: registro?.declarante || '',
    nomeResponsavel: registro?.nomeResponsavel || '',
    autorizou: false,
  };
}
export function validarRestricoes(formulario = formularioRestricoes()) {
  const erros = {};
  if (!['nao_informado', 'nenhuma', 'informadas'].includes(formulario.situacao)) erros.situacao = 'Escolha como deseja informar as restrições.';
  if (formulario.situacao === 'nao_informado') return erros;
  const itens = formulario.itens;
  const ids = new Set(OPCOES_RESTRICOES.map((item) => item.id));
  if (!Array.isArray(itens) || itens.some((id) => !ids.has(id)) || new Set(itens).size !== itens.length || itens.length > ids.size) erros.itens = 'Confira as restrições selecionadas.';
  else if (formulario.situacao === 'informadas' && !itens.length) erros.itens = 'Selecione pelo menos uma restrição.';
  else if (formulario.situacao === 'nenhuma' && itens.length) erros.itens = 'Remova as restrições ou escolha Tenho restrições.';
  const outra = String(formulario.outra || '').trim();
  if (Array.isArray(itens) && itens.includes('outra') ? outra.length < 3 || outra.length > 120 : outra.length > 0) erros.outra = 'Descreva somente a outra restrição, de 3 a 120 caracteres.';
  if (!['titular_adulto', 'responsavel'].includes(formulario.declarante)) erros.declarante = 'Informe quem está preenchendo estes dados.';
  const responsavel = String(formulario.nomeResponsavel || '').trim();
  if (formulario.declarante === 'responsavel' ? responsavel.length < 3 || responsavel.length > 100 : responsavel.length > 0) erros.nomeResponsavel = 'Informe o nome do responsável, de 3 a 100 caracteres.';
  if (formulario.autorizou !== true) erros.autorizacao = 'Autorize especificamente o uso destas informações ou escolha Informar depois.';
  return erros;
}
export function prepararRestricoes(formulario = formularioRestricoes(), uid, escola, horario) {
  const erros = validarRestricoes(formulario);
  if (Object.keys(erros).length) throw new Error(Object.values(erros)[0]);
  if (formulario.situacao === 'nao_informado') return null;
  return {
    alunoId: uid, escola, situacao: formulario.situacao, itens: [...formulario.itens],
    outra: String(formulario.outra || '').trim(), declarante: formulario.declarante,
    nomeResponsavel: String(formulario.nomeResponsavel || '').trim(),
    autorizou: true, versaoAviso: VERSAO_AVISO_RESTRICOES, atualizadoEm: horario,
  };
}
export function resumoRestricoes(registro) {
  if (!registro) return 'Ainda não informado';
  if (registro.situacao === 'nenhuma') return 'Sem restrições alimentares declaradas';
  if (registro.situacao !== 'informadas' || !Array.isArray(registro.itens)) return 'Informação precisa ser conferida';
  return registro.itens.map((id) => OPCOES_RESTRICOES.find((item) => item.id === id)?.nome || 'Informação não reconhecida').join(', ');
}
export function estatisticasRestricoes(alunos, registros, turno = 'todos') {
  const elegiveis = new Map(alunos.filter((aluno) => aluno.tipoConta === 'aluno' && (turno === 'todos' || turnosDoPerfil(aluno).includes(turno))).map((aluno) => [aluno.uid || aluno.id, aluno]));
  const porAluno = new Map(registros.map((item) => [item.alunoId, item]));
  const frequencias = new Map(OPCOES_RESTRICOES.map((item) => [item.id, 0]));
  const impacto = { porcoesAtencao: 0, semLeiteOuLactose: 0, semGlutenOuTrigo: 0, alergiasCriticas: 0, outrasRestricoes: 0 };
  let comRestricoes = 0, semRestricoes = 0, naoInformado = 0;
  for (const [uid, aluno] of elegiveis) {
    const r = porAluno.get(uid);
    const reconhecidas = r?.situacao === 'informadas' && Array.isArray(r.itens) && r.itens.length > 0 && r.itens.every((id) => frequencias.has(id));
    const nenhumaValida = r?.situacao === 'nenhuma' && Array.isArray(r.itens) && r.itens.length === 0;
    if (!r || r.escola !== aluno.escola || r.autorizou !== true || r.versaoAviso !== VERSAO_AVISO_RESTRICOES || (!reconhecidas && !nenhumaValida)) { naoInformado += 1; continue; }
    if (r.situacao === 'nenhuma') { semRestricoes += 1; continue; }
    comRestricoes += 1;
    impacto.porcoesAtencao += 1;
    const itens = new Set(r.itens);
    if (['intolerancia_lactose', 'alergia_leite'].some((id) => itens.has(id))) impacto.semLeiteOuLactose += 1;
    if (['restricao_gluten', 'alergia_trigo'].some((id) => itens.has(id))) impacto.semGlutenOuTrigo += 1;
    if (['alergia_ovo', 'alergia_amendoim', 'alergia_castanhas', 'alergia_soja', 'alergia_peixe', 'alergia_frutos_mar'].some((id) => itens.has(id))) impacto.alergiasCriticas += 1;
    if (itens.has('outra')) impacto.outrasRestricoes += 1;
    itens.forEach((id) => frequencias.set(id, frequencias.get(id) + 1));
  }
  const total = elegiveis.size;
  impacto.percentualAtencao = total ? impacto.porcoesAtencao / total * 100 : 0;
  return { total, comRestricoes, semRestricoes, naoInformado, informados: comRestricoes + semRestricoes,
    impacto,
    grupos: OPCOES_RESTRICOES.map((item) => ({ ...item, quantidade: frequencias.get(item.id), percentual: total ? frequencias.get(item.id) / total * 100 : 0 })) };
}
