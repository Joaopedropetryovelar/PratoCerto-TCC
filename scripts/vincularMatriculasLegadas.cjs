const escolas = {
  Satc: 'satc',
  'Antônio Guglielmi Sobrinho': 'ags',
};
function planejarVinculos(perfis, autorizacoes = {}) {
  const grupos = new Map(),
    pendencias = [],
    plano = [];
  for (const perfilUsuario of perfis) {
    if (perfilUsuario.tipoConta !== 'aluno') continue;
    if (
      !escolas[perfilUsuario.escola] ||
      perfilUsuario.uid !== perfilUsuario.id ||
      typeof perfilUsuario.matricula !== 'string' ||
      !/^\d{5}$/.test(perfilUsuario.matricula) ||
      typeof perfilUsuario.email !== 'string' ||
      perfilUsuario.email !== perfilUsuario.email.trim().toLowerCase() ||
      !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(perfilUsuario.email)
    ) {
      pendencias.push({
        id: perfilUsuario.id,
        motivo: 'Perfil exige revisão de escola, uid, matrícula ou e-mail.',
      });
      continue;
    }
    const chave = `${escolas[perfilUsuario.escola]}_${perfilUsuario.matricula}`;
    const lista = grupos.get(chave) || [];
    lista.push(perfilUsuario);
    grupos.set(chave, lista);
  }
  for (const [chave, lista] of grupos) {
    if (lista.length !== 1) {
      pendencias.push({
        chave,
        motivo: 'Matrícula duplicada na escola.',
        ids: lista.map((perfilUsuario) => perfilUsuario.id),
      });
      continue;
    }
    const perfilAluno = lista[0],
      atual = autorizacoes[chave];
    if (
      atual?.alunoId === perfilAluno.id &&
      atual.escola === perfilAluno.escola &&
      atual.matricula === perfilAluno.matricula
    )
      continue;
    if (
      atual &&
      (atual.alunoId ||
        atual.escola !== perfilAluno.escola ||
        atual.matricula !== perfilAluno.matricula ||
        (atual.email && atual.email !== perfilAluno.email))
    ) {
      pendencias.push({
        chave,
        motivo: 'Autorização existente diverge do perfil.',
      });
      continue;
    }
    plano.push({
      chave,
      uid: perfilAluno.id,
      escola: perfilAluno.escola,
      matricula: perfilAluno.matricula,
      email: perfilAluno.email,
    });
  }
  return {
    plano,
    pendencias,
  };
}
async function executar() {
  const argumentos = process.argv.slice(2),
    indice = argumentos.indexOf('--project'),
    projectId = argumentos[indice + 1];
  if (indice < 0 || !projectId || projectId.startsWith('--'))
    throw Error('Uso: node scripts/vincularMatriculasLegadas.cjs --project ID [--aplicar]');
  const { createRequire } = require('node:module'),
    path = require('node:path'),
    dasFuncoes = createRequire(path.resolve(__dirname, '../functions/package.json'));
  const { initializeApp, applicationDefault, deleteApp } = dasFuncoes('firebase-admin/app'),
    { getFirestore, FieldValue } = dasFuncoes('firebase-admin/firestore');
  const aplicativoFirebase = initializeApp({
    credential: applicationDefault(),
    projectId,
  });
  try {
    const bancoDados = getFirestore(aplicativoFirebase),
      [usuarios, registros] = await Promise.all([
        bancoDados.collection('usuarios').get(),
        bancoDados.collection('matriculasAutorizadas').get(),
      ]);
    const { plano, pendencias } = planejarVinculos(
      usuarios.docs.map((documento) => ({
        ...documento.data(),
        id: documento.id,
      })),
      Object.fromEntries(registros.docs.map((documento) => [documento.id, documento.data()])),
    );
    console.log(
      JSON.stringify(
        {
          projectId,
          vinculosPrevistos: plano.length,
          pendencias,
          modo: argumentos.includes('--aplicar') ? 'aplicar' : 'somente conferência',
        },
        null,
        2,
      ),
    );
    if (pendencias.length) {
      process.exitCode = 1;
      console.log('Nenhum vínculo foi aplicado. Revise as pendências antes de executar novamente.');
      return;
    }
    if (!argumentos.includes('--aplicar')) {
      console.log(
        'Nenhum documento alterado. Revise os perfis e faça backup antes de usar --aplicar.',
      );
      return;
    }
    let aplicados = 0;
    try {
      for (const item of plano) {
        const referenciaDocumento = bancoDados.collection('matriculasAutorizadas').doc(item.chave),
          perfilRef = bancoDados.collection('usuarios').doc(item.uid);
        await bancoDados.runTransaction(async (transacao) => {
          const [documento, documentoAtual] = await Promise.all([
              transacao.get(perfilRef),
              transacao.get(referenciaDocumento),
            ]),
            dados = documento.data();
          if (
            !documento.exists ||
            dados.uid !== item.uid ||
            dados.tipoConta !== 'aluno' ||
            dados.escola !== item.escola ||
            dados.matricula !== item.matricula ||
            dados.email !== item.email
          )
            throw Error('Um perfil mudou durante a execução. Execute novamente a conferência.');
          if (documentoAtual.exists) {
            const matriculaAutorizada = documentoAtual.data();
            if (
              matriculaAutorizada.alunoId === item.uid &&
              matriculaAutorizada.escola === item.escola &&
              matriculaAutorizada.matricula === item.matricula
            )
              return;
            if (
              matriculaAutorizada.alunoId ||
              matriculaAutorizada.escola !== item.escola ||
              matriculaAutorizada.matricula !== item.matricula ||
              (matriculaAutorizada.email && matriculaAutorizada.email !== item.email)
            )
              throw Error('Uma autorização mudou durante a execução.');
          }
          transacao.set(referenciaDocumento, {
            escola: item.escola,
            matricula: item.matricula,
            email: '',
            ativa: true,
            alunoId: item.uid,
            vinculadoEm: FieldValue.serverTimestamp(),
            revisao: documentoAtual.exists ? documentoAtual.data().revisao + 1 : 1,
            criadoEm: documentoAtual.exists
              ? documentoAtual.data().criadoEm
              : FieldValue.serverTimestamp(),
            atualizadoEm: FieldValue.serverTimestamp(),
            atualizadoPorUid: 'migracao_responsavel_firebase',
          });
        });
        aplicados += 1;
      }
      console.log(
        `${aplicados} vínculo(s) conferido(s). Perfis, contas, respostas e dados alimentares foram preservados.`,
      );
    } catch (erroCapturado) {
      console.error(
        `${aplicados} vínculo(s) já conferido(s) foram preservados. A execução pode ser repetida após corrigir o problema.`,
      );
      throw erroCapturado;
    }
  } finally {
    await deleteApp(aplicativoFirebase);
  }
}
if (require.main === module)
  executar().catch((erroCapturado) => {
    console.error(erroCapturado.message);
    process.exitCode = 1;
  });
module.exports = {
  planejarVinculos,
};
