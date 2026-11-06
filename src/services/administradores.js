import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  auth, database, doc, collection, query, where, limit, novoId,
  getDocFromServer, getDocsFromServer, executarTransacao, serverTimestamp,
  reload, getIdToken, abrirCadastroAdministrador, projetoFirebase,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser,
} from './backend';
import { emailNormalizado, emailValido, erroSenha } from '../domain/contas';
import { escolaValida, escolasCadastroAdmin } from '../domain/escolas';

let cadastrando = false;

function falha(codigo, mensagem) {
  const erro = new Error(mensagem);
  erro.code = codigo;
  return erro;
}

function mesmaSessao(uid) {
  if (auth.currentUser?.uid !== uid)
    throw falha('admin/sessao-alterada', 'Sua sessão mudou. Entre novamente antes de cadastrar.');
}

function mesmoCadastro(perfil, esperado) {
  return ['uid', 'email', 'escola', 'tipoConta', 'criadoPorUid', 'acessoAtivo'].every(
    (campo) => perfil[campo] === esperado[campo],
  );
}

function resposta(perfil, jaExistia) {
  return {
    uid: perfil.uid,
    nome: perfil.nome,
    email: perfil.email,
    escola: perfil.escola,
    jaExistia,
  };
}

async function limparPendente(chave) {
  // Uma falha de limpeza local não desfaz um cadastro confirmado no servidor.
  try { await AsyncStorage.removeItem(chave); } catch {}
}

function cadastroPendente() {
  return falha(
    'admin/confirmacao-pendente',
    'Não foi possível confirmar o cadastro. Confira a conexão e tente novamente neste aparelho, com o mesmo e-mail e a mesma senha inicial. A conta foi preservada.',
  );
}

export async function cadastrarAdministrador(dados) {
  if (cadastrando)
    throw falha('admin/em-andamento', 'Aguarde o cadastro atual terminar.');
  const nome = String(dados?.nome || '').trim();
  const email = emailNormalizado(dados?.email);
  if (nome.length < 3 || nome.length > 100 || !emailValido(email))
    throw falha('admin/dados-invalidos', 'Confira o nome completo e o e-mail.');

  cadastrando = true;
  let acesso, novoUsuario, criadoAgora = false, gravacaoIniciada = false;
  let chave, perfilNovo;
  try {
    const usuario = auth.currentUser;
    if (!usuario) throw falha('admin/nao-autorizado', 'Entre com uma conta ativa da direção.');
    await reload(usuario);
    await getIdToken(usuario, true);
    mesmaSessao(usuario.uid);
    const documento = await getDocFromServer(doc(database, 'usuarios', usuario.uid));
    const diretor = documento.exists() ? documento.data() : null;
    if (
      !usuario.emailVerified || !diretor || diretor.tipoConta !== 'admin' ||
      !escolaValida(diretor.escola) ||
      (diretor.acessoAtivo !== undefined && diretor.acessoAtivo !== true)
    )
      throw falha('admin/nao-autorizado', 'Somente um administrador ativo e com e-mail confirmado pode cadastrar outros administradores.');

    const escola = dados.escola === undefined ? diretor.escola : dados.escola;
    if (!escolaValida(escola))
      throw falha('admin/escola-invalida', 'Selecione uma escola válida para o novo administrador.');
    if (!escolasCadastroAdmin(diretor).includes(escola))
      throw falha('admin/escola-nao-autorizada', 'Sua conta pode cadastrar administradores somente na própria escola.');

    chave = `pratocerto:cadastro-admin:${JSON.stringify([projetoFirebase(), usuario.uid, email])}`;
    const filtros = [where('escola', '==', escola), where('email', '==', email)];
    if (escola !== diretor.escola) filtros.push(where('tipoConta', '==', 'admin'));
    const existentes = await getDocsFromServer(query(
      collection(database, 'usuarios'), ...filtros, limit(2),
    ));
    mesmaSessao(usuario.uid);
    if (existentes.docs.length) {
      const pessoa = existentes.docs[0];
      const perfil = pessoa.data();
      if (
        existentes.docs.length !== 1 || perfil.tipoConta !== 'admin' ||
        (perfil.acessoAtivo !== undefined && perfil.acessoAtivo !== true)
      )
        throw falha('admin/email-cadastrado', 'Este e-mail já possui uma conta ou um acesso desativado. Nenhuma permissão foi alterada.');
      await limparPendente(chave);
      return resposta({ ...perfil, uid: pessoa.id, nome: perfil.nome || nome }, true);
    }

    const senha = dados?.senhaTemporaria || '';
    const problemaSenha = erroSenha(senha);
    if (problemaSenha)
      throw falha('admin/senha-inicial', `Para criar uma conta nova, informe uma senha inicial. ${problemaSenha}`);

    // As regras antigas impedem esta leitura. Verificamos antes de criar a conta Auth.
    try {
      await getDocFromServer(doc(database, 'usuarios', novoId('usuarios')));
    } catch (erro) {
      if (erro.code === 'permission-denied')
        throw falha('admin/regras-desatualizadas', 'Publique as regras do cadastro gratuito no Firestore antes de adicionar o administrador.');
      throw erro;
    }

    let pendente = null;
    const salvo = await AsyncStorage.getItem(chave);
    try { pendente = salvo ? JSON.parse(salvo) : null; } catch {}
    mesmaSessao(usuario.uid);
    acesso = await abrirCadastroAdministrador();
    try {
      novoUsuario = (await createUserWithEmailAndPassword(acesso.auth, email, senha)).user;
      criadoAgora = true;
    } catch (erro) {
      if (erro.code !== 'auth/email-already-in-use') throw erro;
      if (
        !pendente || pendente.email !== email || pendente.escola !== escola ||
        pendente.criadoPorUid !== usuario.uid || typeof pendente.uid !== 'string'
      )
        throw falha('admin/email-cadastrado', 'Este e-mail já possui uma conta. Use outro e-mail; alunos e contas de outra escola não são convertidos em administradores.');
      try {
        novoUsuario = (await signInWithEmailAndPassword(acesso.auth, email, senha)).user;
      } catch (erroAcesso) {
        if (['auth/invalid-credential', 'auth/wrong-password'].includes(erroAcesso.code))
          throw falha('admin/senha-inicial', 'Para retomar o cadastro incompleto, use a mesma senha inicial da tentativa anterior.');
        throw erroAcesso;
      }
      if (novoUsuario.uid !== pendente.uid)
        throw falha('admin/cadastro-divergente', 'Este acesso precisa ser conferido pela equipe. Nenhum perfil foi alterado.');
    }

    perfilNovo = {
      uid: novoUsuario.uid, nome, email, escola,
      tipoConta: 'admin', acessoAtivo: true, criadoPorUid: usuario.uid,
      dataCadastro: serverTimestamp(),
    };
    // Apenas identificadores de recuperação são guardados. A senha não é salva.
    await AsyncStorage.setItem(chave, JSON.stringify({
      uid: perfilNovo.uid, email, escola, criadoPorUid: usuario.uid,
    }));
    mesmaSessao(usuario.uid);
    gravacaoIniciada = true;
    const perfilSalvo = await executarTransacao(async (transacao) => {
      const referencia = doc(database, 'usuarios', novoUsuario.uid);
      const atual = await transacao.get(referencia);
      if (atual.exists()) {
        if (!mesmoCadastro(atual.data(), perfilNovo))
          throw falha('admin/cadastro-divergente', 'Já existe um perfil para esta conta. Nenhuma permissão foi alterada.');
        return atual.data();
      }
      transacao.set(referencia, perfilNovo);
      return perfilNovo;
    });
    await limparPendente(chave);
    return resposta(perfilSalvo, false);
  } catch (erro) {
    if (novoUsuario && (perfilNovo || criadoAgora)) {
      if (gravacaoIniciada) {
        let confirmado;
        try {
          confirmado = await getDocFromServer(doc(database, 'usuarios', novoUsuario.uid));
        } catch {
          // Nunca apagar Auth quando a gravação pode ter sido concluída.
          throw cadastroPendente();
        }
        if (confirmado.exists()) {
          if (mesmoCadastro(confirmado.data(), perfilNovo)) {
            await limparPendente(chave);
            return resposta(confirmado.data(), false);
          }
          throw falha('admin/cadastro-divergente', 'O perfil precisa ser conferido pela equipe. A conta foi preservada.');
        }
      }
      if (criadoAgora) {
        try { await deleteUser(novoUsuario); } catch { throw cadastroPendente(); }
        await limparPendente(chave);
      }
    }
    if (erro.code === 'permission-denied')
      throw falha('admin/regras-desatualizadas', 'Confira se sua conta continua ativa e se as regras do cadastro gratuito foram publicadas no Firestore.');
    throw erro;
  } finally {
    try { if (acesso) await acesso.encerrar(); } catch {}
    cadastrando = false;
  }
}
