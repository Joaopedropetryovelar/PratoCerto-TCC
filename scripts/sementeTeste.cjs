const path = require('node:path');
const { createRequire } = require('node:module');
const dasFuncoes = createRequire(path.resolve(__dirname, '../functions/package.json'));
const { criarRuntime } = require('../tests/runtime.cjs');
async function prepararContasTeste() {
  if (
    !/^(127\.0\.0\.1|localhost):9099$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST || '') ||
    !/^(127\.0\.0\.1|localhost):8080$/.test(process.env.FIRESTORE_EMULATOR_HOST || '')
  )
    throw new Error('A preparação de exemplos só pode usar os emuladores locais.');
  const { initializeApp, deleteApp } = dasFuncoes('firebase-admin/app');
  const { getAuth } = dasFuncoes('firebase-admin/auth');
  const { getFirestore, Timestamp } = dasFuncoes('firebase-admin/firestore');
  const aplicativoFirebase = initializeApp(
    {
      projectId: 'demo-pratocerto',
    },
    'semente-pratocerto',
  );
  try {
    const dados = criarRuntime().carregar('tests/fixtures/demo.js').gerarExemplos();
    const auth = getAuth(aplicativoFirebase),
      bancoDados = getFirestore(aplicativoFirebase);
    for (const perfil of Object.values(dados.usuarios)) {
      const principal = perfil.uid === 'demo-admin';
      const email = principal
        ? 'equipe.teste@exemplo.invalid'
        : perfil.uid === 'demo-aluno-multi'
          ? 'aluno.teste@exemplo.invalid'
          : perfil.email;
      perfil.email = email;
      const password = perfil.tipoConta === 'admin' ? 'EquipeTeste123!' : 'AlunoTeste123!';
      try {
        await auth.createUser({
          uid: perfil.uid,
          email,
          password,
          emailVerified: true,
          displayName: perfil.nome,
        });
      } catch (erroCapturado) {
        if (
          erroCapturado.code !== 'auth/uid-already-exists' &&
          erroCapturado.code !== 'auth/email-already-exists'
        )
          throw erroCapturado;
        await auth.updateUser(perfil.uid, {
          email,
          password,
          emailVerified: true,
        });
      }
    }
    dados.matriculasAutorizadas = {};
    for (const perfilUsuario of Object.values(dados.usuarios)) {
      if (perfilUsuario.tipoConta !== 'aluno') continue;
      dados.matriculasAutorizadas[
        `${perfilUsuario.escola === 'Satc' ? 'satc' : 'ags'}_${perfilUsuario.matricula}`
      ] = {
        escola: perfilUsuario.escola,
        matricula: perfilUsuario.matricula,
        email: '',
        ativa: true,
        alunoId: perfilUsuario.uid,
        vinculadoEm: Timestamp.now(),
        revisao: 1,
        criadoEm: Timestamp.now(),
        atualizadoEm: Timestamp.now(),
        atualizadoPorUid: 'semente_local',
      };
    }
    function converter(valor) {
      if (!valor || typeof valor !== 'object') return valor;
      if (
        Object.keys(valor).length === 2 &&
        Number.isInteger(valor.seconds) &&
        Number.isInteger(valor.nanoseconds)
      )
        return new Timestamp(valor.seconds, valor.nanoseconds);
      if (Array.isArray(valor)) return valor.map(converter);
      return Object.fromEntries(
        Object.entries(valor).map(([chaveCampo, valorDaLista]) => [
          chaveCampo,
          converter(valorDaLista),
        ]),
      );
    }
    let lote = bancoDados.batch(),
      quantidade = 0;
    for (const [colecao, documentos] of Object.entries(dados))
      for (const [identificador, valor] of Object.entries(documentos)) {
        lote.set(bancoDados.collection(colecao).doc(identificador), converter(valor));
        quantidade += 1;
        if (quantidade === 400) {
          await lote.commit();
          lote = bancoDados.batch();
          quantidade = 0;
        }
      }
    if (quantidade) await lote.commit();
    return {
      equipe: {
        email: 'equipe.teste@exemplo.invalid',
        senha: 'EquipeTeste123!',
      },
      aluno: {
        email: 'aluno.teste@exemplo.invalid',
        senha: 'AlunoTeste123!',
      },
    };
  } finally {
    await deleteApp(aplicativoFirebase);
  }
}
module.exports = {
  prepararContasTeste,
};
