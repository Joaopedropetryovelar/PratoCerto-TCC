import { auth, database, doc, getDoc, serverTimestamp, setDoc } from './backend';
import { agoraAplicativo } from './demo';
import { podeConsumir, turnosDoPerfil } from '../domain/escolas';
import { erroAvaliacao, limiteAvaliacao } from '../domain/calendario';
import { dataLocal, dataValida, erroConfirmacao, idAvaliacao } from '../domain/refeicoes';

async function contexto(refeicaoId) {
  const usuario = auth.currentUser;
  if (!usuario) throw new Error('Entre novamente para enviar sua resposta.');
  const perfilSnapshot = await getDoc(doc(database, 'usuarios', usuario.uid));
  if (!perfilSnapshot.exists()) throw new Error('Seu perfil não foi encontrado.');
  const perfil = perfilSnapshot.data();
  if (perfil.tipoConta !== 'aluno') throw new Error('Esta ação é exclusiva dos alunos.');
  const prato = await getDoc(doc(database, 'NomePratos', refeicaoId));
  if (!prato.exists() || prato.data().ativo === false) throw new Error('Esta refeição não está disponível.');
  const refeicao = { ...prato.data(), id: prato.id };
  if (!podeConsumir(refeicao, perfil)) throw new Error('Escolha uma refeição da sua escola e de um dos seus turnos.');
  return { usuario, perfil, refeicao };
}
export async function salvarConfirmacao(refeicaoId, vaiConsumir) {
  if (typeof vaiConsumir !== 'boolean') throw new Error('Escolha se vai consumir a refeição.');
  const { usuario, perfil, refeicao } = await contexto(refeicaoId);
  const erro = erroConfirmacao(refeicao, turnosDoPerfil(perfil), agoraAplicativo());
  if (erro) throw new Error(erro);
  await setDoc(doc(database, 'confirmacoes', idAvaliacao(refeicao.id, usuario.uid)), {
    alunoId: usuario.uid, alunoNome: perfil.nome || usuario.displayName || 'Aluno', turma: perfil.turma || '', turno: refeicao.turno, escola: perfil.escola || '',
    refeicaoId: refeicao.id, refeicaoNome: refeicao.nome || 'Refeição', tipoRefeicao: refeicao.tipo || 'Refeição', data: refeicao.data,
    vaiConsumir, resposta: vaiConsumir ? 'confirmado' : 'recusado', dataResposta: serverTimestamp(),
  }, { merge: true });
}
export const OPCOES_NOTA = [
  { valor: 'amei', emoji: '😍', rotulo: 'Amei', nota: 5 }, { valor: 'gostei', emoji: '🙂', rotulo: 'Gostei', nota: 4 },
  { valor: 'ok', emoji: '😐', rotulo: 'Ok', nota: 3 }, { valor: 'nao_gostei', emoji: '🙁', rotulo: 'Não gostei', nota: 2 },
  { valor: 'ruim', emoji: '😞', rotulo: 'Ruim', nota: 1 },
];
export const ETIQUETAS = ['Tinha bastante comida', 'Pouco tempero', 'Repetir esse prato', 'Estava frio'];
export async function salvarAvaliacao(refeicaoId, { emojiValor, comentario = '', etiquetas = [] }) {
  const opcao = OPCOES_NOTA.find((item) => item.valor === emojiValor);
  if (!opcao || String(comentario).length > 240 || !Array.isArray(etiquetas) || etiquetas.some((item) => !ETIQUETAS.includes(item))) throw new Error('Confira a nota, o comentário e as etiquetas.');
  const { usuario, perfil, refeicao } = await contexto(refeicaoId);
  const erroPrazo = erroAvaliacao(refeicao, agoraAplicativo());
  if (erroPrazo) throw new Error(erroPrazo);
  const novoId = idAvaliacao(refeicao.id, usuario.uid);
  const novo = await getDoc(doc(database, 'feedbacks', novoId));
  const antigoId = `${refeicao.data}_${usuario.uid}`;
  const antigo = novo.exists() ? null : await getDoc(doc(database, 'feedbacks', antigoId));
  const antigoValido = antigo?.exists() && antigo.data().refeicaoId === refeicao.id && antigo.data().alunoId === usuario.uid;
  const id = novo.exists() ? novoId : antigoValido ? antigoId : novoId;
  const anterior = novo.exists() ? novo.data() : antigoValido ? antigo.data() : null;
  await setDoc(doc(database, 'feedbacks', id), {
    alunoId: usuario.uid, alunoNome: perfil.nome || usuario.displayName || 'Aluno', turma: perfil.turma || '', turno: refeicao.turno, escola: perfil.escola || '',
    refeicaoId: refeicao.id, refeicaoNome: refeicao.nome || 'Refeição', data: refeicao.data,
    nota: opcao.nota, emoji: opcao.emoji, emojiValor: opcao.valor, comentario: String(comentario).trim(), etiquetas: [...new Set(etiquetas)],
    dataResposta: serverTimestamp(), criadoEm: anterior?.criadoEm || serverTimestamp(),
  }, { merge: true });
}
