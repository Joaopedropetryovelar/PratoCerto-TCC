const path = require('node:path');
const { createRequire } = require('node:module');
const dasFuncoes = createRequire(path.resolve(__dirname, '../functions/package.json'));
const { initializeApp, deleteApp } = dasFuncoes('firebase-admin/app');
const { getAuth } = dasFuncoes('firebase-admin/auth');
const { getFirestore, FieldValue } = dasFuncoes('firebase-admin/firestore');

const ESCOLAS = ['Satc', 'Antônio Guglielmi Sobrinho'];

function obrigatorio(nome) {
  const valor = String(process.env[nome] || '').trim();
  if (!valor) throw new Error(`Defina ${nome} antes de criar a conta.`);
  return valor;
}

function validar() {
  const projeto = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  if (!projeto) throw new Error('Defina FIREBASE_PROJECT_ID com o ID do projeto Firebase correto.');
  const email = obrigatorio('ADMIN_TESTE_EMAIL').toLowerCase();
  const senha = obrigatorio('ADMIN_TESTE_SENHA');
  const nome = process.env.ADMIN_TESTE_NOME?.trim() || 'Equipe Prato Certo';
  const escola = process.env.ADMIN_TESTE_ESCOLA?.trim() || 'Satc';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('ADMIN_TESTE_EMAIL precisa ser um e-mail válido.');
  if (senha.length < 8) throw new Error('ADMIN_TESTE_SENHA precisa ter pelo menos 8 caracteres.');
  if (!ESCOLAS.includes(escola)) throw new Error(`ADMIN_TESTE_ESCOLA precisa ser uma destas: ${ESCOLAS.join(', ')}.`);
  return { projeto, email, senha, nome, escola };
}

async function buscarOuCriarUsuario(auth, dados) {
  try {
    const usuario = await auth.getUserByEmail(dados.email);
    await auth.updateUser(usuario.uid, { password: dados.senha, emailVerified: true, displayName: dados.nome, disabled: false });
    return { usuario: await auth.getUser(usuario.uid), criado: false };
  } catch (erro) {
    if (erro.code !== 'auth/user-not-found') throw erro;
    const usuario = await auth.createUser({ email: dados.email, password: dados.senha, emailVerified: true, displayName: dados.nome });
    return { usuario, criado: true };
  }
}

async function criarAdminReal() {
  const dados = validar();
  const app = initializeApp({ projectId: dados.projeto }, 'pratocerto-admin-real');
  try {
    const auth = getAuth(app), db = getFirestore(app);
    const { usuario, criado } = await buscarOuCriarUsuario(auth, dados);
    const ref = db.collection('usuarios').doc(usuario.uid);
    const atual = await ref.get();
    if (atual.exists && atual.data().tipoConta && atual.data().tipoConta !== 'admin' && process.env.ADMIN_TESTE_FORCAR !== '1') {
      throw new Error('Já existe um perfil não administrativo com este e-mail. Use outro e-mail ou ADMIN_TESTE_FORCAR=1 se tiver certeza.');
    }
    const perfil = {
      uid: usuario.uid,
      nome: dados.nome,
      email: dados.email,
      escola: dados.escola,
      tipoConta: 'admin',
      atualizadoEm: FieldValue.serverTimestamp(),
    };
    if (!atual.exists || !atual.data().criadoEm) perfil.criadoEm = FieldValue.serverTimestamp();
    await ref.set(perfil, { merge: true });
    console.log(`${criado ? 'Conta criada' : 'Conta atualizada'}: ${dados.email}`);
    console.log(`Escola: ${dados.escola}`);
    console.log('Perfil administrativo gravado em usuarios/' + usuario.uid);
  } finally {
    await deleteApp(app);
  }
}

criarAdminReal().catch((erro) => {
  console.error(erro.message);
  process.exitCode = 1;
});
