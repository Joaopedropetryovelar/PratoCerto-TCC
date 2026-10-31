import { auth, database, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from './backend';
import { prepararRestricoes } from '../domain/restricoes';
async function alunoAtual() {
  const identificadorUsuario = auth.currentUser?.uid;
  if (!identificadorUsuario) throw new Error('Entre novamente para alterar estas informações.');
  const perfil = await getDoc(doc(database, 'usuarios', identificadorUsuario));
  if (!perfil.exists() || perfil.data().tipoConta !== 'aluno')
    throw new Error('Estas informações pertencem ao perfil de aluno.');
  return {
    uid: identificadorUsuario,
    perfil: perfil.data(),
  };
}
export async function salvarRestricoes(formulario) {
  const { uid: identificadorUsuario, perfil } = await alunoAtual();
  const dados = prepararRestricoes(
    formulario,
    identificadorUsuario,
    perfil.escola,
    serverTimestamp(),
  );
  if (!dados) throw new Error('Use Retirar informações para remover uma declaração já salva.');
  await setDoc(doc(database, 'restricoesAlimentares', identificadorUsuario), dados);
}
export async function retirarRestricoes() {
  const identificadorUsuario = auth.currentUser?.uid;
  if (!identificadorUsuario) throw new Error('Entre novamente para retirar estas informações.');
  await deleteDoc(doc(database, 'restricoesAlimentares', identificadorUsuario));
}
