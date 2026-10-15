import { auth, database, doc, getDoc, executarTransacao, serverTimestamp, timestampData, novoId } from './backend';
import { chaveEscola } from '../domain/escolas';
import { dataValida, horarioValido, dataDaEscola, instanteEscola } from '../domain/refeicoes';
import { limiteAvaliacao } from '../domain/calendario';
import { agoraAplicativo } from './relogio';
const turnos = ['manha', 'tarde', 'noite'];
async function equipe() {
  const usuario = auth.currentUser; if (!usuario) throw new Error('Entre novamente.');
  const perfil = await getDoc(doc(database, 'usuarios', usuario.uid));
  if (!perfil.exists() || perfil.data().tipoConta !== 'admin') throw new Error('Esta ação é exclusiva da equipe.');
  chaveEscola(perfil.data().escola);
  return { ...perfil.data(), uid: usuario.uid };
}
export function chavePrato(escola, nome) { return `${chaveEscola(escola)}_${encodeURIComponent(nome.trim().toLocaleLowerCase('pt-BR')).replace(/%/g, '_')}`; }
export async function salvarPrato({ nome, descricao = '', id, revisaoEsperada = 0 }) {
  const perfil = await equipe();
  if (typeof nome !== 'string' || nome.trim().length < 3 || nome.trim().length > 100 || typeof descricao !== 'string' || descricao.length > 300) throw new Error('Use um nome de 3 a 100 caracteres e descrição de até 300.');
  if (!Number.isSafeInteger(revisaoEsperada) || revisaoEsperada < 0 || (!id && revisaoEsperada !== 0)) throw new Error('Revisão do catálogo inválida.');
  const referencia = doc(database, 'pratos', id || chavePrato(perfil.escola, nome));
  return executarTransacao(async (tx) => {
    const atual = await tx.get(referencia);
    if (id && !atual.exists()) throw new Error('O prato foi removido. Recarregue.');
    if (atual.exists() && (atual.data().escola !== perfil.escola || atual.data().revisao !== revisaoEsperada)) throw new Error('Este prato já existe ou foi atualizado. Escolha-o no catálogo ou recarregue.');
    const dados = { nome: nome.trim(), descricao: descricao.trim(), escola: perfil.escola, revisao: revisaoEsperada + 1, atualizadoPorUid: perfil.uid, atualizadoEm: serverTimestamp(), criadoEm: atual.exists() ? atual.data().criadoEm : serverTimestamp() };
    tx.set(referencia, dados); return { ...dados, id: referencia.id };
  });
}
export async function salvarRefeicao({ data, turno, pratoId, horarioLimite, horarioFim, id, revisaoEsperada = 0 }) {
  const perfil = await equipe();
  if (!dataValida(data) || data < dataDaEscola(agoraAplicativo()) || [0,6].includes(new Date(`${data}T12:00:00`).getDay()) || !turnos.includes(turno)) throw new Error('Escolha um dia útil atual ou futuro e um turno válido.');
  if (!horarioValido(horarioLimite) || !horarioValido(horarioFim) || horarioLimite >= horarioFim) throw new Error('Use horários HH:MM; a confirmação deve terminar antes do fim da refeição.');
  if (!pratoId || !Number.isSafeInteger(revisaoEsperada) || revisaoEsperada < 0 || (!id && revisaoEsperada !== 0)) throw new Error('Confira o prato e a revisão da refeição.');
  const slot = `${chaveEscola(perfil.escola)}_${data}_${turno}`;
  const agendaRef = doc(database, 'agenda', slot);
  const pratoRef = doc(database, 'pratos', pratoId);
  const refeicaoRef = doc(database, 'NomePratos', id || novoId('NomePratos'));
  return executarTransacao(async (tx) => {
    const [agenda, prato, existente] = await Promise.all([tx.get(agendaRef), tx.get(pratoRef), tx.get(refeicaoRef)]);
    if (id && !existente.exists()) throw new Error('A refeição foi removida. Recarregue.');
    if (!prato.exists() || prato.data().escola !== perfil.escola) throw new Error('Escolha um prato do catálogo da sua escola.');
    if (agenda.exists() && agenda.data().ativo === true && agenda.data().refeicaoId !== refeicaoRef.id) throw new Error('Já existe uma refeição ativa neste dia e turno. Edite ou arquive a existente.');
    if (existente.exists() && (existente.data().escola !== perfil.escola || existente.data().revisao !== revisaoEsperada || existente.data().data !== data || existente.data().turno !== turno || existente.data().ativo === false)) throw new Error('A refeição mudou. Recarregue o cardápio antes de editar.');
    if (existente.exists() && agoraAplicativo() >= instanteEscola(existente.data().data, existente.data().horarioLimite)) throw new Error('A edição encerrou com o prazo de confirmação desta refeição.');
    const item = { data, turno, pratoId, nome: prato.data().nome, descricao: prato.data().descricao || '', escola: perfil.escola, tipo: `Refeição da ${turno === 'manha' ? 'manhã' : turno}`, horarioLimite, horarioFim, ativo: true, slotId: slot, revisao: revisaoEsperada + 1, criadoEm: existente.exists() ? existente.data().criadoEm : serverTimestamp(), atualizadoEm: serverTimestamp(), atualizadoPorUid: perfil.uid };
    item.limiteConfirmacao = timestampData(instanteEscola(data, horarioLimite));
    item.inicioAvaliacao = timestampData(instanteEscola(data, horarioFim));
    item.limiteAvaliacao = timestampData(limiteAvaliacao(item));
    tx.set(refeicaoRef, item);
    tx.set(agendaRef, { escola: perfil.escola, data, turno, refeicaoId: refeicaoRef.id, ativo: true });
    return { ...item, id: refeicaoRef.id };
  });
}
export async function arquivarRefeicao(refeicao) {
  const perfil = await equipe();
  const ref = doc(database, 'NomePratos', refeicao.id);
  return executarTransacao(async (tx) => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists() || snapshot.data().escola !== perfil.escola || snapshot.data().revisao !== refeicao.revisao) throw new Error('A refeição mudou. Recarregue antes de arquivar.');
    const dados = snapshot.data();
    if (dados.ativo === false) throw new Error('Esta refeição já foi arquivada.');
    const agendaRef = doc(database, 'agenda', dados.slotId);
    const agenda = await tx.get(agendaRef);
    tx.set(ref, { ...dados, ativo: false, revisao: dados.revisao + 1, atualizadoEm: serverTimestamp(), atualizadoPorUid: perfil.uid });
    if (agenda.exists() && agenda.data().refeicaoId === ref.id) tx.set(agendaRef, { ...agenda.data(), ativo: false });
  });
}
