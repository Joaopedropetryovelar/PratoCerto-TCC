const ESCOLAS = ['Satc', 'Antônio Guglielmi Sobrinho'];

class FalhaMatricula extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function exigir(condicao, mensagem, codigo = 'failed-precondition') {
  if (!condicao) throw new FalhaMatricula(codigo, mensagem);
}

async function editarMatricula({ actor, dados, db: bancoDados, FieldValue }) {
  exigir(
    actor?.uid && actor.token?.email_verified === true,
    'Entre novamente com uma conta da direção e confirme seu e-mail.',
    'permission-denied',
  );
  const matriculaAtual = String(dados?.matriculaAtual || '').trim();
  const novaMatricula = String(dados?.novaMatricula || '').trim();
  const revisaoEsperada = dados?.revisaoEsperada;
  const emailInformado = dados?.email;
  exigir(
    /^[0-9]{5}$/.test(matriculaAtual) && /^[0-9]{5}$/.test(novaMatricula),
    'Informe uma matrícula com exatamente cinco números.',
    'invalid-argument',
  );
  exigir(
    Number.isSafeInteger(revisaoEsperada) && revisaoEsperada >= 0,
    'Recarregue a lista de matrículas antes de editar.',
    'invalid-argument',
  );
  exigir(
    emailInformado === undefined || typeof emailInformado === 'string',
    'Confira o e-mail vinculado.',
    'invalid-argument',
  );
  const emailNormalizado = emailInformado?.trim().toLowerCase();
  exigir(
    !emailNormalizado ||
      (emailNormalizado.length <= 254 &&
        /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(emailNormalizado)),
    'Informe um e-mail válido ou deixe o vínculo vazio.',
    'invalid-argument',
  );

  return bancoDados.runTransaction(async (transacao) => {
    const autor = await transacao.get(bancoDados.collection('usuarios').doc(actor.uid));
    const perfilAutor = autor.data();
    exigir(
      autor.exists &&
        perfilAutor.tipoConta === 'admin' &&
        perfilAutor.acessoAtivo !== false &&
        ESCOLAS.includes(perfilAutor.escola),
      'Somente a direção pode corrigir matrículas da própria escola.',
      'permission-denied',
    );
    const escola = perfilAutor.escola;
    const prefixoEscola = escola === 'Satc' ? 'satc' : 'ags';
    const referenciaAtual = bancoDados
      .collection('matriculasAutorizadas')
      .doc(`${prefixoEscola}_${matriculaAtual}`);
    const mudouNumero = novaMatricula !== matriculaAtual;
    const referenciaDestino = mudouNumero
      ? bancoDados.collection('matriculasAutorizadas').doc(`${prefixoEscola}_${novaMatricula}`)
      : referenciaAtual;
    const consultaAlunos = (matricula) =>
      bancoDados
        .collection('usuarios')
        .where('escola', '==', escola)
        .where('matricula', '==', matricula)
        .limit(2);
    const [autorizacaoAtual, autorizacaoDestino, cadastrosAtuais, cadastrosDestino] =
      await Promise.all([
        transacao.get(referenciaAtual),
        mudouNumero ? transacao.get(referenciaDestino) : Promise.resolve(null),
        transacao.get(consultaAlunos(matriculaAtual)),
        mudouNumero ? transacao.get(consultaAlunos(novaMatricula)) : Promise.resolve(null),
      ]);
    exigir(autorizacaoAtual.exists, 'A autorização foi removida. Recarregue a lista.');
    const anterior = autorizacaoAtual.data();
    exigir(
      anterior.escola === escola && anterior.matricula === matriculaAtual,
      'Esta matrícula não pertence à sua escola.',
      'permission-denied',
    );
    exigir(
      (anterior.revisao || 0) === revisaoEsperada,
      'A matrícula foi atualizada por outra pessoa. Recarregue a lista.',
    );
    exigir(
      !autorizacaoDestino?.exists && !cadastrosDestino?.size,
      'A nova matrícula já está autorizada ou vinculada a outra conta.',
      'already-exists',
    );
    exigir(
      cadastrosAtuais.size <= 1,
      'Há cadastros duplicados para a matrícula atual. A equipe precisa conferir os vínculos.',
    );

    const cadastroAtual = cadastrosAtuais.docs[0];
    const alunoId = anterior.alunoId || cadastroAtual?.id || '';
    const aluno = alunoId
      ? await transacao.get(bancoDados.collection('usuarios').doc(alunoId))
      : null;
    if (alunoId) {
      exigir(
        aluno.exists &&
          aluno.data().tipoConta === 'aluno' &&
          aluno.data().escola === escola &&
          aluno.data().matricula === matriculaAtual &&
          (!cadastroAtual || cadastroAtual.id === alunoId),
        'O cadastro do aluno mudou. Recarregue a lista antes de editar.',
      );
      exigir(
        emailNormalizado === undefined || emailNormalizado === (anterior.email || ''),
        'O e-mail da conta vinculada deve ser alterado pelo próprio titular.',
        'invalid-argument',
      );
    }

    const horarioAtualizacao = FieldValue.serverTimestamp();
    const autorizacaoCorrigida = {
      escola,
      matricula: novaMatricula,
      email: alunoId ? anterior.email || '' : (emailNormalizado ?? anterior.email ?? ''),
      ativa: alunoId ? anterior.ativa !== false : true,
      alunoId,
      vinculadoEm: alunoId ? anterior.vinculadoEm || horarioAtualizacao : null,
      revisao: mudouNumero ? 1 : revisaoEsperada + 1,
      criadoEm: mudouNumero ? horarioAtualizacao : anterior.criadoEm || horarioAtualizacao,
      atualizadoEm: horarioAtualizacao,
      atualizadoPorUid: actor.uid,
    };
    // O número muda junto com a autorização; a conta mantém o mesmo UID e histórico.
    transacao.set(referenciaDestino, autorizacaoCorrigida);
    if (alunoId && mudouNumero)
      transacao.update(bancoDados.collection('usuarios').doc(alunoId), {
        matricula: novaMatricula,
      });
    if (mudouNumero) transacao.delete(referenciaAtual);
    return { matriculaAnterior: matriculaAtual, matricula: novaMatricula, alunoId };
  });
}

module.exports = { editarMatricula, FalhaMatricula };
