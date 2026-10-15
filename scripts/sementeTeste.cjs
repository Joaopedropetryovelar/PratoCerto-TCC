const path = require('node:path');
const { createRequire } = require('node:module');
const dasFuncoes = createRequire(path.resolve(__dirname, '../functions/package.json'));
const { criarRuntime } = require('../tests/runtime.cjs');

async function prepararContasTeste() {
  if (!/^(127\.0\.0\.1|localhost):9099$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST || '') || !/^(127\.0\.0\.1|localhost):8080$/.test(process.env.FIRESTORE_EMULATOR_HOST || '')) throw new Error('A preparação de exemplos só pode usar os emuladores locais.');
  const { initializeApp, deleteApp } = dasFuncoes('firebase-admin/app');
  const { getAuth } = dasFuncoes('firebase-admin/auth');
  const { getFirestore, Timestamp } = dasFuncoes('firebase-admin/firestore');
  const app = initializeApp({ projectId: 'demo-pratocerto' }, 'semente-pratocerto');
  try {
    const dados = criarRuntime().carregar('tests/fixtures/demo.js').gerarExemplos();
    const auth = getAuth(app), db = getFirestore(app);
    for (const perfil of Object.values(dados.usuarios)) {
      const principal = perfil.uid === 'demo-admin';
      const email = principal ? 'equipe.teste@exemplo.invalid' : perfil.uid === 'demo-aluno-multi' ? 'aluno.teste@exemplo.invalid' : perfil.email;
      perfil.email = email;
      const password = perfil.tipoConta === 'admin' ? 'EquipeTeste123!' : 'AlunoTeste123!';
      try { await auth.createUser({ uid: perfil.uid, email, password, emailVerified: true, displayName: perfil.nome }); }
      catch (e) { if (e.code !== 'auth/uid-already-exists' && e.code !== 'auth/email-already-exists') throw e; await auth.updateUser(perfil.uid, { email, password, emailVerified: true }); }
    }
    dados.matriculasAutorizadas={};for(const p of Object.values(dados.usuarios)){if(p.tipoConta!=='aluno')continue;dados.matriculasAutorizadas[`${p.escola==='Satc'?'satc':'ags'}_${p.matricula}`]={escola:p.escola,matricula:p.matricula,email:'',ativa:true,alunoId:p.uid,vinculadoEm:Timestamp.now(),revisao:1,criadoEm:Timestamp.now(),atualizadoEm:Timestamp.now(),atualizadoPorUid:'semente_local'};}
    function converter(valor) {
      if (!valor || typeof valor !== 'object') return valor;
      if (Object.keys(valor).length === 2 && Number.isInteger(valor.seconds) && Number.isInteger(valor.nanoseconds)) return new Timestamp(valor.seconds, valor.nanoseconds);
      if (Array.isArray(valor)) return valor.map(converter);
      return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, converter(v)]));
    }
    let lote = db.batch(), quantidade = 0;
    for (const [colecao, documentos] of Object.entries(dados)) for (const [id, valor] of Object.entries(documentos)) {
      lote.set(db.collection(colecao).doc(id), converter(valor)); quantidade += 1;
      if (quantidade === 400) { await lote.commit(); lote = db.batch(); quantidade = 0; }
    }
    if (quantidade) await lote.commit();
    return { equipe: { email: 'equipe.teste@exemplo.invalid', senha: 'EquipeTeste123!' }, aluno: { email: 'aluno.teste@exemplo.invalid', senha: 'AlunoTeste123!' } };
  } finally { await deleteApp(app); }
}
module.exports = { prepararContasTeste };
