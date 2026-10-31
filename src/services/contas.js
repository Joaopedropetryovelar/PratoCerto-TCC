import { vincularMatricula } from './matriculas';
import { conferirTurma } from './turmas';
import { prepararRestricoes } from '../domain/restricoes';
import {
  auth,
  database,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  escreverLote,
  updateDoc,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  deleteUser,
  serverTimestamp,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  getIdToken,
  reautenticar,
  verifyBeforeUpdateEmail,
  updatePassword,
} from './backend';
import {
  emailNormalizado,
  emailValido,
  erroSenha,
  validarCadastro,
  VERSAO_TERMOS,
} from '../domain/contas';
import { escolaValida } from '../domain/escolas';
export async function entrarConta({ email, senha, escola, apenasAdmin = false }) {
  if (!emailValido(email) || !senha || !escolaValida(escola))
    throw new Error('Confira o e-mail, a senha e a escola.');
  const { user } = await signInWithEmailAndPassword(auth, emailNormalizado(email), senha);
  try {
    await reload(user);
    if (user.emailVerified) await getIdToken(user, true);
    const documentoConsultado = await getDoc(doc(database, 'usuarios', user.uid));
    if (!documentoConsultado.exists())
      throw new Error(
        'Sua conta ainda não possui um perfil. Procure a equipe para regularizar o cadastro.',
      );
    const perfil = documentoConsultado.data();
    if (perfil.acessoAtivo === false) throw new Error('Seu acesso foi desativado pela direção.');
    if (perfil.escola !== escola)
      throw new Error(
        'Esta conta não pertence à escola selecionada. Confira a escola e tente novamente.',
      );
    if (
      !['aluno', 'admin'].includes(perfil.tipoConta) ||
      (apenasAdmin && perfil.tipoConta !== 'admin')
    )
      throw new Error('Sua conta não tem permissão para esta área.');
    if (perfil.email !== user.email && user.emailVerified)
      await updateDoc(doc(database, 'usuarios', user.uid), {
        email: user.email,
      });
    return {
      perfil,
      verificado: user.emailVerified === true,
    };
  } catch (erro) {
    await signOut(auth);
    throw erro;
  }
}
export async function cadastrarAluno(dados) {
  const erros = validarCadastro(dados);
  if (Object.keys(erros).length) throw new Error(Object.values(erros)[0]);
  const selecionada = await conferirTurma(dados.escola, dados.turmaId);
  let usuario,
    perfilCriado = false;
  try {
    try {
      usuario = (
        await createUserWithEmailAndPassword(auth, emailNormalizado(dados.email), dados.senha)
      ).user;
      await updateProfile(usuario, {
        displayName: dados.nome.trim(),
      });
      const perfil = {
        uid: usuario.uid,
        nome: dados.nome.trim(),
        matricula: dados.matricula.trim(),
        ...selecionada,
        turnos: dados.turnos,
        turno: dados.turnos[0],
        escola: dados.escola,
        email: emailNormalizado(dados.email),
        tipoConta: 'aluno',
        aceitouTermos: true,
        cientePrivacidade: true,
        versaoTermos: VERSAO_TERMOS,
        dataConsentimento: serverTimestamp(),
        dataCadastro: serverTimestamp(),
      };
      const restricoes = prepararRestricoes(
        dados.restricoes,
        usuario.uid,
        dados.escola,
        serverTimestamp(),
      );
      await vincularMatricula(perfil, restricoes);
      perfilCriado = true;
    } catch (erro) {
      if (usuario && !perfilCriado) {
        let salvo;
        try {
          salvo = await getDocFromServer(doc(database, 'usuarios', usuario.uid));
        } catch {
          throw new Error(
            'Não foi possível confirmar se o cadastro foi concluído. Sua conta foi preservada. Confira a conexão e procure a equipe antes de criar outra conta.',
          );
        }
        if (salvo.exists()) {
          const perfil = salvo.data();
          if (
            perfil.uid !== usuario.uid ||
            perfil.escola !== dados.escola ||
            perfil.matricula !== String(dados.matricula).trim() ||
            perfil.email !== emailNormalizado(dados.email)
          )
            throw new Error(
              'Sua conta precisa ser conferida pela equipe. Nenhum cadastro existente foi removido.',
            );
          perfilCriado = true;
        } else {
          try {
            await deleteUser(usuario);
          } catch {
            await signOut(auth);
            throw new Error(
              'O cadastro ficou incompleto e não foi possível desfazer a conta. Procure a equipe antes de tentar novamente.',
            );
          }
        }
      }
      if (!perfilCriado) throw erro;
    }
    try {
      await sendEmailVerification(usuario);
      return {
        emailEnviado: true,
      };
    } catch {
      return {
        emailEnviado: false,
      };
    }
  } finally {
    // Criar uma conta no Firebase também abre uma sessão; o aluno fará login depois.
    if (usuario && auth.currentUser?.uid === usuario.uid) await signOut(auth);
  }
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
  if (!usuario.emailVerified)
    throw new Error('O e-mail ainda não foi confirmado. Abra o link recebido e tente novamente.');
  await getIdToken(usuario, true);
  const documentoConsultado = await getDoc(doc(database, 'usuarios', usuario.uid));
  if (
    !documentoConsultado.exists() ||
    !escolaValida(documentoConsultado.data().escola) ||
    !['aluno', 'admin'].includes(documentoConsultado.data().tipoConta)
  )
    throw new Error('Seu perfil precisa ser conferido pela equipe.');
  return documentoConsultado.data();
}
export async function recuperarSenha(email) {
  if (!emailValido(email)) throw new Error('Informe um e-mail válido.');
  try {
    await sendPasswordResetEmail(auth, emailNormalizado(email));
  } catch (erro) {
    if (erro.code !== 'auth/user-not-found') throw erro;
  }
}
async function usuarioSeguro(senha) {
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
  if (novo === emailNormalizado(usuario.email))
    throw new Error('Informe um e-mail diferente do atual.');
  await verifyBeforeUpdateEmail(usuario, novo);
}
export async function alterarSenha(senhaAtual, novaSenha) {
  const erro = erroSenha(novaSenha);
  if (erro) throw new Error(erro);
  if (senhaAtual === novaSenha) throw new Error('Escolha uma senha diferente da atual.');
  const usuario = await usuarioSeguro(senhaAtual);
  await updatePassword(usuario, novaSenha);
}
export async function alterarTurma(turmaId) {
  const identificadorUsuario = auth.currentUser?.uid;
  if (!identificadorUsuario) throw new Error('Entre novamente.');
  const perfil = await getDoc(doc(database, 'usuarios', identificadorUsuario));
  if (!perfil.exists() || perfil.data().tipoConta !== 'aluno')
    throw new Error('Perfil de aluno indisponível.');
  const selecionada = await conferirTurma(perfil.data().escola, turmaId);
  await updateDoc(doc(database, 'usuarios', identificadorUsuario), selecionada);
}
export async function alterarTurnos(turnos) {
  if (
    !Array.isArray(turnos) ||
    !turnos.length ||
    turnos.length > 3 ||
    new Set(turnos).size !== turnos.length ||
    turnos.some((turno) => !['manha', 'tarde', 'noite'].includes(turno))
  )
    throw new Error('Escolha de um a três turnos válidos.');
  const identificadorUsuario = auth.currentUser?.uid;
  if (!identificadorUsuario) throw new Error('Entre novamente.');
  await updateDoc(doc(database, 'usuarios', identificadorUsuario), {
    turnos,
    turno: turnos[0],
  });
}
export async function alterarDadosEscolares(turmaId, turnos) {
  if (
    !Array.isArray(turnos) ||
    !turnos.length ||
    turnos.length > 3 ||
    new Set(turnos).size !== turnos.length ||
    turnos.some((turno) => !['manha', 'tarde', 'noite'].includes(turno))
  )
    throw new Error('Escolha de um a três turnos válidos.');
  const identificadorUsuario = auth.currentUser?.uid;
  if (!identificadorUsuario) throw new Error('Entre novamente.');
  const documentoConsultado = await getDoc(doc(database, 'usuarios', identificadorUsuario));
  if (!documentoConsultado.exists() || documentoConsultado.data().tipoConta !== 'aluno')
    throw new Error('Perfil de aluno indisponível.');
  const turma = await conferirTurma(documentoConsultado.data().escola, turmaId);
  await updateDoc(doc(database, 'usuarios', identificadorUsuario), {
    ...turma,
    turnos,
    turno: turnos[0],
  });
}
