import { prepararRestricoes } from '../domain/restricoes';
import { auth, database, doc, getDoc, setDoc, escreverLote, updateDoc, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, deleteUser, serverTimestamp, sendEmailVerification, sendPasswordResetEmail, reload, getIdToken, reautenticar, verifyBeforeUpdateEmail, updatePassword } from './backend';
import { emailNormalizado, emailValido, erroSenha, validarCadastro, VERSAO_TERMOS } from '../domain/contas';
import { escolaValida } from '../domain/escolas';
import { entrarContaPronta, estaEmDemo } from './demo';
export async function entrarConta({ email, senha, escola, apenasAdmin = false }) {
  if (!emailValido(email) || !senha || !escolaValida(escola)) throw new Error('Confira o e-mail, a senha e a escola.');
  const pronta = await entrarContaPronta({ email, senha, escola, apenasAdmin });
  if (pronta) return pronta;
  const { user } = await signInWithEmailAndPassword(auth, emailNormalizado(email), senha);
  try {
    await reload(user);
    if (user.emailVerified) await getIdToken(user, true);
    const snap = await getDoc(doc(database, 'usuarios', user.uid));
    if (!snap.exists()) throw new Error('Sua conta ainda não possui um perfil. Procure a equipe para regularizar o cadastro.');
    const perfil = snap.data();
    if (perfil.escola !== escola) throw new Error('Esta conta não pertence à escola selecionada. Confira a escola e tente novamente.');
    if (!['aluno', 'admin'].includes(perfil.tipoConta) || (apenasAdmin && perfil.tipoConta !== 'admin')) throw new Error('Sua conta não tem permissão para esta área.');
    if (perfil.email !== user.email && user.emailVerified) await updateDoc(doc(database, 'usuarios', user.uid), { email: user.email });
    return { perfil, verificado: user.emailVerified === true };
  } catch (erro) { await signOut(auth); throw erro; }
}
export async function cadastrarAluno(dados) {
  const erros = validarCadastro(dados);
  if (Object.keys(erros).length) throw new Error(Object.values(erros)[0]);
  let usuario, perfilCriado = false;
  try {
    usuario = (await createUserWithEmailAndPassword(auth, emailNormalizado(dados.email), dados.senha)).user;
    await updateProfile(usuario, { displayName: dados.nome.trim() });
    const perfil = { uid: usuario.uid, nome: dados.nome.trim(), matricula: dados.matricula.trim(), turma: dados.turma.trim(), turnos: dados.turnos, turno: dados.turnos[0], escola: dados.escola, email: emailNormalizado(dados.email), tipoConta: 'aluno', aceitouTermos: true, versaoTermos: VERSAO_TERMOS, dataConsentimento: serverTimestamp(), dataCadastro: serverTimestamp() };
    const restricoes = prepararRestricoes(dados.restricoes, usuario.uid, dados.escola, serverTimestamp());
    if (restricoes) await escreverLote([{ ref: doc(database, 'usuarios', usuario.uid), dados: perfil }, { ref: doc(database, 'restricoesAlimentares', usuario.uid), dados: restricoes }]);
    else await setDoc(doc(database, 'usuarios', usuario.uid), perfil);
    perfilCriado = true;
  } catch (erro) {
    if (usuario && !perfilCriado) {
      try { await deleteUser(usuario); }
      catch { await signOut(auth); throw new Error('O cadastro ficou incompleto e não foi possível desfazer a conta. Procure a equipe antes de tentar novamente.'); }
    }
    throw erro;
  }
  try { await sendEmailVerification(usuario); return { emailEnviado: true }; }
  catch { return { emailEnviado: false }; }
}
export async function reenviarVerificacao() {
  const usuario = auth.currentUser;
  if (!usuario) throw new Error('Entre novamente.');
  await sendEmailVerification(usuario);
}
export async function verificarEmailConfirmado() {
  const usuario = auth.currentUser;
  if (!usuario) throw new Error('Entre novamente.');
  await reload(usuario);
  if (!usuario.emailVerified) throw new Error('O e-mail ainda não foi confirmado. Abra o link recebido e tente novamente.');
  await getIdToken(usuario, true);
  const snap = await getDoc(doc(database, 'usuarios', usuario.uid));
  if (!snap.exists() || !escolaValida(snap.data().escola) || !['aluno', 'admin'].includes(snap.data().tipoConta)) throw new Error('Seu perfil precisa ser conferido pela equipe.');
  return snap.data();
}
export async function recuperarSenha(email) {
  if (!emailValido(email)) throw new Error('Informe um e-mail válido.');
  try { await sendPasswordResetEmail(auth, emailNormalizado(email)); }
  catch (erro) { if (erro.code !== 'auth/user-not-found') throw erro; }
}
async function usuarioSeguro(senha) {
  if (estaEmDemo()) throw new Error('Alterações de conta real ficam disponíveis fora da demonstração.');
  const usuario = auth.currentUser;
  if (!usuario?.email || !senha) throw new Error('Informe sua senha atual.');
  await reautenticar(usuario, senha);
  if (auth.currentUser?.uid !== usuario.uid) throw new Error('Sua sessão mudou. Entre novamente.');
  return usuario;
}
export async function solicitarNovoEmail(email, senhaAtual) {
  const novo = emailNormalizado(email);
  if (!emailValido(novo)) throw new Error('Informe um e-mail válido.');
  const usuario = await usuarioSeguro(senhaAtual);
  if (novo === emailNormalizado(usuario.email)) throw new Error('Informe um e-mail diferente do atual.');
  await verifyBeforeUpdateEmail(usuario, novo);
}
export async function alterarSenha(senhaAtual, novaSenha) {
  const erro = erroSenha(novaSenha); if (erro) throw new Error(erro);
  if (senhaAtual === novaSenha) throw new Error('Escolha uma senha diferente da atual.');
  const usuario = await usuarioSeguro(senhaAtual);
  await updatePassword(usuario, novaSenha);
}
export async function alterarTurma(turma) {
  const texto = String(turma || '').trim();
  if (!texto || texto.length > 80) throw new Error('Informe uma turma de até 80 caracteres.');
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Entre novamente.');
  const perfil = await getDoc(doc(database, 'usuarios', uid));
  if (!perfil.exists() || perfil.data().tipoConta !== 'aluno') throw new Error('Perfil de aluno indisponível.');
  await updateDoc(doc(database, 'usuarios', uid), { turma: texto });
}
