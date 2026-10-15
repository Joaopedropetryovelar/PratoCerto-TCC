import { auth, database, doc, getDoc, setDoc, executarTransacao, serverTimestamp } from './backend';
import { chaveEscola } from '../domain/escolas';
export function idTurma(escola, nome) {
  return `${chaveEscola(escola)}_${encodeURIComponent(nome.trim().toLocaleLowerCase('pt-BR')).replace(/%/g, '_')}`;
}
export async function conferirTurma(escola, turmaId) {
  if (typeof turmaId !== 'string' || !turmaId || turmaId.includes('/') || turmaId.length > 500) throw new Error('Selecione uma turma da lista da escola.');
  const snap = await getDoc(doc(database, 'turmas', turmaId));
  if (!snap.exists() || snap.data().escola !== escola || snap.data().ativa !== true) throw new Error('Esta turma não está disponível. Selecione outra turma da lista.');
  return { turma: snap.data().nome, turmaId: snap.id || turmaId };
}
export async function salvarTurma(nome) {
  const texto = String(nome || '').trim();
  if (!texto || texto.length > 80) throw new Error('Informe um nome de turma de até 80 caracteres.');
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Entre novamente.');
  const snap = await getDoc(doc(database, 'usuarios', uid));
  if (!snap.exists() || snap.data().tipoConta !== 'admin') throw new Error('Somente a equipe pode organizar as turmas.');
  const escola = snap.data().escola;
  const ref = doc(database, 'turmas', idTurma(escola, texto));
  return executarTransacao(async (tx) => {
    const atual = await tx.get(ref);
    if (atual.exists() && atual.data().escola !== escola) throw new Error('Esta turma pertence a outra escola.');
    const dados = { escola, nome: atual.exists() ? atual.data().nome : texto, ativa: true, atualizadoPorUid: uid, atualizadoEm: serverTimestamp(), criadoEm: atual.exists() ? atual.data().criadoEm : serverTimestamp() };
    tx.set(ref, dados); return { ...dados, id: ref.id };
  });
}
export async function desativarTurma(id) {
  const uid = auth.currentUser?.uid;
  if (!uid || typeof id !== 'string' || id.includes('/')) throw new Error('Confira a turma e entre novamente.');
  const perfil = await getDoc(doc(database, 'usuarios', uid));
  if (!perfil.exists() || perfil.data().tipoConta !== 'admin') throw new Error('Somente a equipe pode organizar as turmas.');
  const ref = doc(database, 'turmas', id);
  return executarTransacao(async (tx) => {
    const atual = await tx.get(ref);
    if (!atual.exists() || atual.data().escola !== perfil.data().escola) throw new Error('Turma indisponível nesta escola.');
    tx.set(ref, { ...atual.data(), ativa: false, atualizadoPorUid: uid, atualizadoEm: serverTimestamp() });
  });
}
