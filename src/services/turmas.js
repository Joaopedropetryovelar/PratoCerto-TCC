import { auth, database, doc, getDoc, setDoc, executarTransacao, serverTimestamp } from './backend';
import { chaveEscola } from '../domain/escolas';
export function idTurma(escola, nome) {
  return `${chaveEscola(escola)}_${encodeURIComponent(nome.trim().toLocaleLowerCase('pt-BR')).replace(/%/g, '_')}`;
}
export async function conferirTurma(escola, turmaId) {
  if (typeof turmaId !== 'string' || !turmaId || turmaId.includes('/') || turmaId.length > 500)
    throw new Error('Selecione uma turma da lista da escola.');
  const documentoConsultado = await getDoc(doc(database, 'turmas', turmaId));
  if (
    !documentoConsultado.exists() ||
    documentoConsultado.data().escola !== escola ||
    documentoConsultado.data().ativa !== true
  )
    throw new Error('Esta turma não está disponível. Selecione outra turma da lista.');
  return {
    turma: documentoConsultado.data().nome,
    turmaId: documentoConsultado.id || turmaId,
  };
}
export async function salvarTurma(nome) {
  const texto = String(nome || '').trim();
  if (!texto || texto.length > 80)
    throw new Error('Informe um nome de turma de até 80 caracteres.');
  const identificadorUsuario = auth.currentUser?.uid;
  if (!identificadorUsuario) throw new Error('Entre novamente.');
  const documentoConsultado = await getDoc(doc(database, 'usuarios', identificadorUsuario));
  if (!documentoConsultado.exists() || documentoConsultado.data().tipoConta !== 'admin')
    throw new Error('Somente a equipe pode organizar as turmas.');
  const escola = documentoConsultado.data().escola;
  const referenciaDocumento = doc(database, 'turmas', idTurma(escola, texto));
  return executarTransacao(async (transacao) => {
    const atual = await transacao.get(referenciaDocumento);
    if (atual.exists() && atual.data().escola !== escola)
      throw new Error('Esta turma pertence a outra escola.');
    const dados = {
      escola,
      nome: atual.exists() ? atual.data().nome : texto,
      ativa: true,
      atualizadoPorUid: identificadorUsuario,
      atualizadoEm: serverTimestamp(),
      criadoEm: atual.exists() ? atual.data().criadoEm : serverTimestamp(),
    };
    transacao.set(referenciaDocumento, dados);
    return {
      ...dados,
      id: referenciaDocumento.id,
    };
  });
}
export async function desativarTurma(identificadorTurma) {
  const identificadorUsuario = auth.currentUser?.uid;
  if (
    !identificadorUsuario ||
    typeof identificadorTurma !== 'string' ||
    identificadorTurma.includes('/')
  )
    throw new Error('Confira a turma e entre novamente.');
  const perfil = await getDoc(doc(database, 'usuarios', identificadorUsuario));
  if (!perfil.exists() || perfil.data().tipoConta !== 'admin')
    throw new Error('Somente a equipe pode organizar as turmas.');
  const referenciaDocumento = doc(database, 'turmas', identificadorTurma);
  return executarTransacao(async (transacao) => {
    const atual = await transacao.get(referenciaDocumento);
    if (!atual.exists() || atual.data().escola !== perfil.data().escola)
      throw new Error('Turma indisponível nesta escola.');
    transacao.set(referenciaDocumento, {
      ...atual.data(),
      ativa: false,
      atualizadoPorUid: identificadorUsuario,
      atualizadoEm: serverTimestamp(),
    });
  });
}
