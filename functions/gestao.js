const { randomBytes } = require('node:crypto');
const ESCOLAS = ['Satc', 'Antônio Guglielmi Sobrinho'];
class FalhaGestao extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
function exigir(condicao, mensagem, code = 'permission-denied') {
  if (!condicao) throw new FalhaGestao(code, mensagem);
}
function criarGestao({ db: bancoDados, auth, FieldValue, Timestamp }) {
  async function perfilAtual(actor, tipo) {
    exigir(
      actor?.uid && actor.token?.email_verified === true,
      'Entre novamente com o e-mail confirmado.',
    );
    const documentoConsultado = await bancoDados.collection('usuarios').doc(actor.uid).get();
    exigir(
      documentoConsultado.exists &&
        ESCOLAS.includes(documentoConsultado.data().escola) &&
        documentoConsultado.data().acessoAtivo !== false &&
        (!tipo || documentoConsultado.data().tipoConta === tipo),
      'Sua conta não tem acesso a esta operação.',
    );
    return {
      ...documentoConsultado.data(),
      uid: actor.uid,
    };
  }
  async function alterarAcesso(actor, dados) {
    const perfil = await perfilAtual(actor, 'admin');
    exigir(
      typeof dados?.uid === 'string' &&
        !dados.uid.includes('/') &&
        typeof dados.ativo === 'boolean',
      'Confira a conta selecionada.',
      'invalid-argument',
    );
    exigir(dados.uid !== actor.uid, 'Você não pode desativar a própria conta.');
    const referenciaDocumento = bancoDados.collection('usuarios').doc(dados.uid);
    await bancoDados.runTransaction(async (transacao) => {
      const [alvo, autor] = await Promise.all([
        transacao.get(referenciaDocumento),
        transacao.get(bancoDados.collection('usuarios').doc(actor.uid)),
      ]);
      exigir(
        autor.exists &&
          autor.data().tipoConta === 'admin' &&
          autor.data().acessoAtivo !== false &&
          autor.data().escola === perfil.escola,
        'Sua autorização mudou. Entre novamente.',
      );
      exigir(
        alvo.exists && alvo.data().tipoConta === 'admin' && alvo.data().escola === perfil.escola,
        'Conta indisponível nesta escola.',
      );
      transacao.update(referenciaDocumento, {
        acessoAtivo: dados.ativo,
        acessoAlteradoEm: FieldValue.serverTimestamp(),
        acessoAlteradoPorUid: actor.uid,
      });
    });
    await auth.updateUser(dados.uid, {
      disabled: !dados.ativo,
    });
    if (!dados.ativo) await auth.revokeRefreshTokens(dados.uid);
    return {
      ativo: dados.ativo,
    };
  }
  async function obterMeusDados(actor) {
    const perfil = await perfilAtual(actor, 'aluno');
    const declaracao = await bancoDados.collection('restricoesAlimentares').doc(actor.uid).get();
    const respostas = {};
    // Exportação limitada por página; nunca devolve documentos de outro titular/escola.
    for (const nome of ['confirmacoes', 'feedbacks']) {
      respostas[nome] = [];
      let ultimo = null;
      while (true) {
        let consulta = bancoDados
          .collection(nome)
          .where('alunoId', '==', actor.uid)
          .orderBy('__name__')
          .limit(200);
        if (ultimo) consulta = consulta.startAfter(ultimo);
        const pagina = await consulta.get();
        respostas[nome].push(
          ...pagina.docs
            .filter((documento) => documento.data().escola === perfil.escola)
            .map((documento) => ({
              ...documento.data(),
              id: documento.id,
            })),
        );
        if (pagina.size < 200) break;
        ultimo = pagina.docs.at(-1);
        exigir(
          respostas[nome].length <= 10000,
          'Solicite uma cópia histórica à direção.',
          'resource-exhausted',
        );
      }
    }
    return {
      perfil,
      restricoes: declaracao.exists ? declaracao.data() : null,
      ...respostas,
    };
  }
  async function executarExclusao(actor, dados) {
    const diretor = await perfilAtual(actor, 'admin');
    const identificadorUsuario = dados?.uid;
    exigir(
      typeof identificadorUsuario === 'string' &&
        identificadorUsuario &&
        !identificadorUsuario.includes('/') &&
        identificadorUsuario !== actor.uid &&
        Number.isInteger(dados.revisaoEsperada),
      'Confira o pedido.',
      'invalid-argument',
    );
    const pedidoRef = bancoDados.collection('solicitacoesPrivacidade').doc(identificadorUsuario);
    const usuarioRef = bancoDados.collection('usuarios').doc(identificadorUsuario);
    const token = randomBytes(16).toString('hex');
    const base = await bancoDados.runTransaction(async (transacao) => {
      const [pedidoSnap, usuarioSnap, autorSnap] = await Promise.all([
        transacao.get(pedidoRef),
        transacao.get(usuarioRef),
        transacao.get(bancoDados.collection('usuarios').doc(actor.uid)),
      ]);
      exigir(
        autorSnap.exists &&
          autorSnap.data().tipoConta === 'admin' &&
          autorSnap.data().escola === diretor.escola &&
          autorSnap.data().acessoAtivo !== false,
        'Sua autorização mudou.',
      );
      exigir(
        pedidoSnap.exists &&
          pedidoSnap.data().escola === diretor.escola &&
          pedidoSnap.data().alunoId === identificadorUsuario,
        'Pedido indisponível nesta escola.',
      );
      const pedido = pedidoSnap.data();
      if (pedido.status === 'concluida' && pedido.providenciaExecutadaEm) return null;
      exigir(
        ['exclusao_dados', 'anonimizacao_dados'].includes(pedido.tipo) &&
          ['pendente', 'em_analise'].includes(pedido.status),
        'Esta ação exige um pedido de exclusão aberto.',
        'failed-precondition',
      );
      exigir(
        pedido.revisao === dados.revisaoEsperada,
        'O pedido foi atualizado. Recarregue.',
        'failed-precondition',
      );
      exigir(
        !pedido.executandoExclusao ||
          Date.now() - (pedido.execucaoIniciadaEm?.toMillis() || 0) > 180000,
        'Uma exclusão já está em andamento. Aguarde antes de tentar novamente.',
        'failed-precondition',
      );
      exigir(
        !usuarioSnap.exists ||
          (usuarioSnap.data().tipoConta === 'aluno' &&
            usuarioSnap.data().escola === diretor.escola),
        'O perfil precisa de conferência.',
      );
      const matricula = usuarioSnap.data()?.matricula || pedido.matricula;
      transacao.update(pedidoRef, {
        executandoExclusao: true,
        tokenExecucao: token,
        execucaoIniciadaEm: Timestamp.now(),
        idAnonimo: pedido.idAnonimo || token,
        matricula,
      });
      if (usuarioSnap.exists)
        transacao.update(usuarioRef, {
          acessoAtivo: false,
        });
      return {
        ...pedido,
        matricula,
        idAnonimo: pedido.idAnonimo || token,
      };
    });
    if (!base)
      return {
        concluida: true,
      };
    // A conta fica bloqueada durante a limpeza. Uma falha pode ser retomada pelo mesmo pedido.
    try {
      if (base.tipo === 'exclusao_dados')
        await auth.updateUser(identificadorUsuario, {
          disabled: true,
        });
      await auth.revokeRefreshTokens(identificadorUsuario);
    } catch (erro) {
      if (erro.code !== 'auth/user-not-found') throw erro;
    }
    for (const nome of ['confirmacoes', 'feedbacks']) {
      while (true) {
        const quantidade = await bancoDados.runTransaction(async (lote) => {
          const pedidoAtual = await lote.get(pedidoRef);
          exigir(
            pedidoAtual.data()?.tokenExecucao === token,
            'Outra execução assumiu este pedido.',
            'aborted',
          );
          const pagina = await lote.get(
            bancoDados.collection(nome).where('alunoId', '==', identificadorUsuario).limit(100),
          );
          for (const documento of pagina.docs) {
            exigir(
              documento.data().escola === diretor.escola,
              'Há registros inconsistentes; a conta continua bloqueada para conferência.',
              'failed-precondition',
            );
            // Conserva somente números operacionais e categorias; remove texto livre e identificadores.
            const original = documento.data(),
              agregado = {};
            for (const campo of [
              'escola',
              'data',
              'turno',
              'refeicaoId',
              'refeicaoNome',
              'tipoRefeicao',
              'vaiConsumir',
              'resposta',
              'nota',
              'emoji',
              'emojiValor',
              'etiquetas',
              'dataResposta',
              'criadoEm',
            ]) {
              if (original[campo] !== undefined) agregado[campo] = original[campo];
            }
            agregado.alunoId = `registro_${base.idAnonimo}`;
            agregado.alunoNome = '';
            agregado.turma = '';
            if (nome === 'feedbacks') agregado.comentario = '';
            lote.set(bancoDados.collection(nome).doc(), agregado);
            lote.delete(documento.ref);
          }
          return pagina.size;
        });
        if (quantidade === 0) break;
      }
    }
    if (base.tipo === 'anonimizacao_dados') {
      await bancoDados.runTransaction(async (transacao) => {
        const atual = await transacao.get(pedidoRef);
        exigir(
          atual.data()?.tokenExecucao === token,
          'Outra execução assumiu o pedido.',
          'aborted',
        );
        transacao.update(usuarioRef, {
          acessoAtivo: true,
        });
        const limpo = {
          ...base,
          status: 'concluida',
          mensagem: '',
          resposta:
            'Os identificadores e comentários das respostas anteriores foram removidos. Sua conta e sua declaração alimentar foram preservadas.',
          revisao: base.revisao + 1,
          atualizadoEm: FieldValue.serverTimestamp(),
          atendidoEm: FieldValue.serverTimestamp(),
          atendidoPorUid: actor.uid,
          atendidoPorNome: diretor.nome,
          providenciaExecutadaEm: FieldValue.serverTimestamp(),
        };
        for (const campo of [
          'idAnonimo',
          'tokenExecucao',
          'executandoExclusao',
          'execucaoIniciadaEm',
        ])
          delete limpo[campo];
        transacao.set(pedidoRef, limpo);
      });
      return {
        concluida: true,
        contaPreservada: true,
      };
    }
    await bancoDados.collection('restricoesAlimentares').doc(identificadorUsuario).delete();
    const historico = await pedidoRef.collection('historico').get();
    // Cada histórico pode conter cópias da mensagem original. Também precisa ser eliminado.
    for (let indice = 0; indice < historico.size; indice += 400) {
      const lote = bancoDados.batch();
      historico.docs
        .slice(indice, indice + 400)
        .forEach((documentoResposta) => lote.delete(documentoResposta.ref));
      await lote.commit();
    }
    try {
      await auth.deleteUser(identificadorUsuario);
    } catch (erro) {
      if (erro.code !== 'auth/user-not-found') throw erro;
    }
    await bancoDados.runTransaction(async (transacao) => {
      const atual = await transacao.get(pedidoRef);
      exigir(
        atual.data()?.tokenExecucao === token,
        'Outra execução assumiu este pedido. Recarregue.',
        'aborted',
      );
      const chave = `${diretor.escola === 'Satc' ? 'satc' : 'ags'}_${base.matricula}`;
      const matriculaRef = bancoDados.collection('matriculasAutorizadas').doc(chave);
      const matricula = await transacao.get(matriculaRef);
      if (matricula.exists && matricula.data().alunoId === identificadorUsuario)
        transacao.delete(matriculaRef);
      transacao.delete(usuarioRef);
      // Comprovante mínimo para prestação de contas, sem nome, matrícula, e-mail ou mensagem.
      transacao.set(pedidoRef, {
        escola: diretor.escola,
        alunoId: identificadorUsuario,
        alunoNome: 'Conta excluída',
        matricula: '',
        turma: '',
        email: '',
        tipo: 'exclusao_dados',
        status: 'concluida',
        mensagem: '',
        resposta:
          'Conta e declaração alimentar excluídas. Identificadores e textos livres das respostas foram removidos; totais operacionais foram preservados.',
        revisao: base.revisao + 1,
        ciclo: base.ciclo,
        versaoPolitica: base.versaoPolitica,
        criadoEm: base.criadoEm,
        atualizadoEm: FieldValue.serverTimestamp(),
        atendidoEm: FieldValue.serverTimestamp(),
        atendidoPorUid: actor.uid,
        atendidoPorNome: diretor.nome,
        providenciaExecutadaEm: FieldValue.serverTimestamp(),
      });
    });
    return {
      concluida: true,
    };
  }
  return {
    alterarAcesso,
    obterMeusDados,
    executarExclusao,
  };
}
module.exports = {
  criarGestao,
  FalhaGestao,
};
