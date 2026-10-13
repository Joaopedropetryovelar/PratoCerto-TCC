import { auth, database, doc, getDoc, serverTimestamp, setDoc } from './backend';

export const TIPO_SOLICITACAO_EXCLUSAO = 'exclusao_dados';
export const STATUS_SOLICITACAO_PENDENTE = 'pendente';
export const VERSAO_POLITICA_PRIVACIDADE = '2026-10-13';

export async function solicitarExclusaoDados(mensagem = '') {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Entre novamente para solicitar a exclusão dos dados.');

  const perfilRef = doc(database, 'usuarios', uid);
  const perfilSnap = await getDoc(perfilRef);
  if (!perfilSnap.exists() || perfilSnap.data().tipoConta !== 'aluno') {
    throw new Error('A solicitação de exclusão fica disponível no perfil do aluno.');
  }

  const perfil = perfilSnap.data();
  const solicitacaoRef = doc(database, 'solicitacoesPrivacidade', uid);
  const atual = await getDoc(solicitacaoRef);
  const agora = serverTimestamp();

  await setDoc(solicitacaoRef, {
    alunoId: uid,
    alunoNome: perfil.nome,
    email: auth.currentUser?.email || perfil.email,
    escola: perfil.escola,
    matricula: perfil.matricula,
    turma: perfil.turma,
    tipo: TIPO_SOLICITACAO_EXCLUSAO,
    status: STATUS_SOLICITACAO_PENDENTE,
    mensagem: String(mensagem || '').trim().slice(0, 500),
    versaoPolitica: VERSAO_POLITICA_PRIVACIDADE,
    criadoEm: atual.exists() ? atual.data().criadoEm : agora,
    atualizadoEm: agora,
  });
}
