import {
  auth,
  database,
  doc,
  getDoc,
  executarTransacao,
  serverTimestamp,
  timestampData,
  novoId,
} from './backend';
import { chaveEscola } from '../domain/escolas';
import { dataValida, horarioValido, dataDaEscola, instanteEscola } from '../domain/refeicoes';
import { limiteAvaliacao } from '../domain/calendario';
import { agoraAplicativo } from './relogio';
const turnos = ['manha', 'tarde', 'noite'];
function registrarRevisao(transacao, referenciaDocumento, dados, identificadorUsuario) {
  const { escola, revisao, nome, descricao, horarioLimite, horarioFim, ativo } = dados;
  transacao.set(doc(database, `NomePratos/${referenciaDocumento.id}/historico`, String(revisao)), {
    escola,
    revisao,
    nome,
    descricao,
    horarioLimite,
    horarioFim,
    ativo,
    autorUid: identificadorUsuario,
    criadoEm: serverTimestamp(),
  });
}
async function equipe() {
  const usuario = auth.currentUser;
  if (!usuario) throw new Error('Entre novamente.');
  const perfil = await getDoc(doc(database, 'usuarios', usuario.uid));
  if (!perfil.exists() || perfil.data().tipoConta !== 'admin')
    throw new Error('Esta ação é exclusiva da equipe.');
  chaveEscola(perfil.data().escola);
  return {
    ...perfil.data(),
    uid: usuario.uid,
  };
}
function validarPrato({ nome, descricao = '', id: identificador, revisaoEsperada = 0 }) {
  if (
    typeof nome !== 'string' ||
    nome.trim().length < 3 ||
    nome.trim().length > 100 ||
    typeof descricao !== 'string' ||
    descricao.length > 300
  )
    throw new Error('Use um nome de 3 a 100 caracteres e descrição de até 300.');
  if (
    !Number.isSafeInteger(revisaoEsperada) ||
    revisaoEsperada < 0 ||
    (!identificador && revisaoEsperada !== 0)
  )
    throw new Error('Revisão do catálogo inválida.');
}
function dadosPrato(prato, perfil, anterior) {
  return {
    nome: prato.nome.trim(),
    descricao: (prato.descricao || '').trim(),
    escola: perfil.escola,
    revisao: (prato.revisaoEsperada || 0) + 1,
    atualizadoPorUid: perfil.uid,
    atualizadoEm: serverTimestamp(),
    criadoEm: anterior?.criadoEm || serverTimestamp(),
  };
}
export function chavePrato(escola, nome) {
  return `${chaveEscola(escola)}_${encodeURIComponent(nome.trim().toLocaleLowerCase('pt-BR')).replace(/%/g, '_')}`;
}
export async function salvarPrato(prato) {
  const perfil = await equipe();
  validarPrato(prato);
  const { nome, id: identificador, revisaoEsperada = 0 } = prato;
  const referencia = doc(database, 'pratos', identificador || chavePrato(perfil.escola, nome));
  return executarTransacao(async (transacao) => {
    const atual = await transacao.get(referencia);
    if (identificador && !atual.exists()) throw new Error('O prato foi removido. Recarregue.');
    if (
      atual.exists() &&
      (atual.data().escola !== perfil.escola || atual.data().revisao !== revisaoEsperada)
    )
      throw new Error(
        'Este prato já existe ou foi atualizado. Escolha-o no catálogo ou recarregue.',
      );
    const dados = dadosPrato(prato, perfil, atual.exists() ? atual.data() : null);
    transacao.set(referencia, dados);
    return {
      ...dados,
      id: referencia.id,
    };
  });
}

// "prato" permite digitar ou editar o alimento junto com a publicação.
// Catálogo, refeição e agenda são gravados na mesma transação.
export async function salvarRefeicao({
  data,
  turno,
  pratoId,
  prato,
  horarioLimite,
  horarioFim,
  id: identificador,
  revisaoEsperada = 0,
}) {
  const perfil = await equipe();
  if (
    !dataValida(data) ||
    data < dataDaEscola(agoraAplicativo()) ||
    [0, 6].includes(new Date(`${data}T12:00:00`).getDay()) ||
    !turnos.includes(turno)
  )
    throw new Error('Escolha um dia útil atual ou futuro e um turno válido.');
  if (!horarioValido(horarioLimite) || !horarioValido(horarioFim) || horarioLimite >= horarioFim)
    throw new Error('Use horários HH:MM; a confirmação deve terminar antes do fim da refeição.');
  if (
    (!pratoId && !prato) ||
    (pratoId && prato) ||
    !Number.isSafeInteger(revisaoEsperada) ||
    revisaoEsperada < 0 ||
    (!identificador && revisaoEsperada !== 0)
  )
    throw new Error('Confira o prato e a revisão da refeição.');
  if (prato) validarPrato(prato);
  const slot = `${chaveEscola(perfil.escola)}_${data}_${turno}`;
  const agendaRef = doc(database, 'agenda', slot);
  const pratoRef = doc(
    database,
    'pratos',
    pratoId || prato.id || chavePrato(perfil.escola, prato.nome),
  );
  const refeicaoRef = doc(database, 'NomePratos', identificador || novoId('NomePratos'));
  return executarTransacao(async (transacao) => {
    const [agenda, catalogo, existente] = await Promise.all([
      transacao.get(agendaRef),
      transacao.get(pratoRef),
      transacao.get(refeicaoRef),
    ]);
    if (identificador && !existente.exists())
      throw new Error('A refeição foi removida. Recarregue.');
    if (catalogo.exists() && catalogo.data().escola !== perfil.escola)
      throw new Error('Escolha um prato do catálogo da sua escola.');
    if (!prato && !catalogo.exists())
      throw new Error('O prato foi removido do catálogo. Recarregue.');
    if (prato?.id && !catalogo.exists()) throw new Error('O prato foi removido. Recarregue.');
    if (prato && catalogo.exists() && catalogo.data().revisao !== (prato.revisaoEsperada || 0))
      throw new Error('O catálogo foi atualizado. Confira o prato e tente novamente.');
    if (
      agenda.exists() &&
      agenda.data().ativo === true &&
      agenda.data().refeicaoId !== refeicaoRef.id
    )
      throw new Error(
        'Já existe uma refeição ativa neste dia e turno. Edite ou exclua a existente.',
      );
    if (
      existente.exists() &&
      (existente.data().escola !== perfil.escola ||
        existente.data().revisao !== revisaoEsperada ||
        existente.data().data !== data ||
        existente.data().turno !== turno ||
        existente.data().ativo === false)
    )
      throw new Error('A refeição mudou. Recarregue o cardápio antes de editar.');
    const alimento = prato
      ? dadosPrato(prato, perfil, catalogo.exists() ? catalogo.data() : null)
      : catalogo.data();
    const item = {
      data,
      turno,
      pratoId: pratoRef.id,
      nome: alimento.nome,
      descricao: alimento.descricao || '',
      escola: perfil.escola,
      tipo: `Refeição da ${turno === 'manha' ? 'manhã' : turno}`,
      horarioLimite,
      horarioFim,
      ativo: true,
      slotId: slot,
      revisao: revisaoEsperada + 1,
      criadoEm: existente.exists()
        ? existente.data().criadoEm || serverTimestamp()
        : serverTimestamp(),
      atualizadoEm: serverTimestamp(),
      atualizadoPorUid: perfil.uid,
    };
    item.limiteConfirmacao = timestampData(instanteEscola(data, horarioLimite));
    item.inicioAvaliacao = timestampData(instanteEscola(data, horarioFim));
    item.limiteAvaliacao = timestampData(limiteAvaliacao(item));
    if (
      prato &&
      (!catalogo.exists() ||
        catalogo.data().nome !== alimento.nome ||
        (catalogo.data().descricao || '') !== alimento.descricao)
    )
      transacao.set(pratoRef, alimento);
    transacao.set(refeicaoRef, item);
    registrarRevisao(transacao, refeicaoRef, item, perfil.uid);
    transacao.set(agendaRef, {
      escola: perfil.escola,
      data,
      turno,
      refeicaoId: refeicaoRef.id,
      ativo: true,
    });
    return {
      ...item,
      id: refeicaoRef.id,
    };
  });
}

// Exclusão lógica: remove da oferta, libera o turno e conserva os registros vinculados.
export async function excluirRefeicao(refeicao) {
  const perfil = await equipe();
  const referenciaDocumento = doc(database, 'NomePratos', refeicao.id);
  return executarTransacao(async (transacao) => {
    const snapshot = await transacao.get(referenciaDocumento);
    if (
      !snapshot.exists() ||
      snapshot.data().escola !== perfil.escola ||
      snapshot.data().revisao !== refeicao.revisao
    )
      throw new Error('A refeição mudou. Recarregue antes de excluir.');
    const dados = snapshot.data();
    if (dados.ativo === false) throw new Error('Esta refeição já foi excluída do cardápio.');
    const agendaRef = doc(database, 'agenda', dados.slotId);
    const agenda = await transacao.get(agendaRef);
    const arquivada = {
      ...dados,
      ativo: false,
      revisao: dados.revisao + 1,
      atualizadoEm: serverTimestamp(),
      atualizadoPorUid: perfil.uid,
    };
    transacao.set(referenciaDocumento, arquivada);
    registrarRevisao(transacao, referenciaDocumento, arquivada, perfil.uid);
    if (agenda.exists() && agenda.data().refeicaoId === referenciaDocumento.id)
      transacao.set(agendaRef, {
        ...agenda.data(),
        ativo: false,
      });
  });
}
// Compatibilidade com chamadas anteriores do aplicativo.
export const arquivarRefeicao = excluirRefeicao;
