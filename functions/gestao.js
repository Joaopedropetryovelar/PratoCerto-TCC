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
  async function executarExclusao(administradorAutenticado, dados) {
    const perfilAdministrador = await perfilAtual(administradorAutenticado, 'admin');
    const identificadorAluno = dados?.uid;
    exigir(
      typeof identificadorAluno === 'string' &&
        identificadorAluno &&
        !identificadorAluno.includes('/') &&
        identificadorAluno !== administradorAutenticado.uid &&
        Number.isInteger(dados.revisaoEsperada),
      'Confira o pedido.',
      'invalid-argument',
    );
    const referenciaPedido = bancoDados
      .collection('solicitacoesPrivacidade')
      .doc(identificadorAluno);
    const referenciaAluno = bancoDados.collection('usuarios').doc(identificadorAluno);
    const tokenExecucao = randomBytes(16).toString('hex');
    const dadosPedido = await bancoDados.runTransaction(async (transacao) => {
      const [documentoPedido, documentoAluno, documentoAdministrador] = await Promise.all([
        transacao.get(referenciaPedido),
        transacao.get(referenciaAluno),
        transacao.get(bancoDados.collection('usuarios').doc(administradorAutenticado.uid)),
      ]);
      exigir(
        documentoAdministrador.exists &&
          documentoAdministrador.data().tipoConta === 'admin' &&
          documentoAdministrador.data().escola === perfilAdministrador.escola &&
          documentoAdministrador.data().acessoAtivo !== false,
        'Sua autorização mudou.',
      );
      exigir(
        documentoPedido.exists &&
          documentoPedido.data().escola === perfilAdministrador.escola &&
          documentoPedido.data().alunoId === identificadorAluno,
        'Pedido indisponível nesta escola.',
      );
      const dadosSalvos = documentoPedido.data();
      const pedido = {
        ...dadosSalvos,
        revisao: Number.isInteger(dadosSalvos.revisao) ? dadosSalvos.revisao : 1,
        ciclo: Number.isInteger(dadosSalvos.ciclo) ? dadosSalvos.ciclo : 1,
        versaoPolitica: dadosSalvos.versaoPolitica || '2026-10-13',
        criadoEm: dadosSalvos.criadoEm || Timestamp.now(),
      };
      exigir(
        ['exclusao_dados', 'anonimizacao_dados'].includes(pedido.tipo),
        'Esta ação exige um pedido de exclusão ou de retirada de identificação.',
        'failed-precondition',
      );
      if (pedido.status === 'concluida' && pedido.providenciaExecutadaEm) return null;
      exigir(
        ['pendente', 'em_analise', 'concluida'].includes(pedido.status),
        'O status deste pedido precisa ser conferido pela equipe.',
        'failed-precondition',
      );
      exigir(
        pedido.revisao === dados.revisaoEsperada,
        'O pedido foi atualizado. Recarregue.',
        'failed-precondition',
      );
      exigir(
        !pedido.executandoExclusao ||
          Date.now() - (pedido.execucaoIniciadaEm?.toMillis?.() || 0) > 180000,
        'Uma exclusão já está em andamento. Aguarde antes de tentar novamente.',
        'failed-precondition',
      );
      exigir(
        !documentoAluno.exists ||
          (documentoAluno.data().tipoConta === 'aluno' &&
            documentoAluno.data().escola === perfilAdministrador.escola),
        'O perfil precisa de conferência.',
      );
      exigir(
        pedido.tipo !== 'anonimizacao_dados' || documentoAluno.exists,
        'A conta do aluno não foi encontrada para preservar seu acesso.',
        'failed-precondition',
      );
      const matricula = documentoAluno.data()?.matricula || pedido.matricula;
      const acessoAlunoAnterior =
        typeof pedido.acessoAlunoAnterior === 'boolean'
          ? pedido.acessoAlunoAnterior
          : documentoAluno.data()?.acessoAtivo !== false;
      transacao.update(referenciaPedido, {
        status: 'em_analise',
        executandoExclusao: true,
        tokenExecucao: tokenExecucao,
        execucaoIniciadaEm: Timestamp.now(),
        idAnonimo: pedido.idAnonimo || tokenExecucao,
        matricula: matricula || '',
        acessoAlunoAnterior,
      });
      if (documentoAluno.exists)
        transacao.update(referenciaAluno, {
          acessoAtivo: false,
        });
      return {
        ...pedido,
        matricula: matricula || '',
        acessoAlunoAnterior,
        idAnonimo: pedido.idAnonimo || tokenExecucao,
      };
    });
    if (!dadosPedido)
      return {
        concluida: true,
      };
    try {
      // A conta fica bloqueada durante a limpeza. Uma falha pode ser retomada pelo mesmo pedido.
      try {
        if (dadosPedido.tipo === 'exclusao_dados') {
          await auth.updateUser(identificadorAluno, {
            disabled: true,
          });
          await auth.revokeRefreshTokens(identificadorAluno);
        }
      } catch (erro) {
        if (erro.code !== 'auth/user-not-found') throw erro;
      }
      for (const nome of ['confirmacoes', 'feedbacks']) {
        while (true) {
          const quantidade = await bancoDados.runTransaction(async (transacao) => {
            const pedidoAtual = await transacao.get(referenciaPedido);
            exigir(
              pedidoAtual.data()?.tokenExecucao === tokenExecucao,
              'Outra execução assumiu este pedido.',
              'aborted',
            );
            const pagina = await transacao.get(
              bancoDados.collection(nome).where('alunoId', '==', identificadorAluno).limit(100),
            );
            for (const documento of pagina.docs) {
              exigir(
                documento.data().escola === perfilAdministrador.escola,
                'Há registros inconsistentes; a conta continua bloqueada para conferência.',
                'failed-precondition',
              );
              // Conserva somente números operacionais e categorias; remove texto livre e identificadores.
              const respostaOriginal = documento.data(),
                respostaSemIdentificacao = {};
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
                if (respostaOriginal[campo] !== undefined)
                  respostaSemIdentificacao[campo] = respostaOriginal[campo];
              }
              respostaSemIdentificacao.alunoId = `registro_${dadosPedido.idAnonimo}`;
              respostaSemIdentificacao.alunoNome = '';
              respostaSemIdentificacao.turma = '';
              if (nome === 'feedbacks') respostaSemIdentificacao.comentario = '';
              transacao.set(bancoDados.collection(nome).doc(), respostaSemIdentificacao);
              transacao.delete(documento.ref);
            }
            if (pagina.size)
              transacao.update(referenciaPedido, { execucaoIniciadaEm: Timestamp.now() });
            return pagina.size;
          });
          if (quantidade === 0) break;
        }
      }
      if (dadosPedido.tipo === 'anonimizacao_dados') {
        await bancoDados.runTransaction(async (transacao) => {
          const documentoAtual = await transacao.get(referenciaPedido);
          exigir(
            documentoAtual.data()?.tokenExecucao === tokenExecucao,
            'Outra execução assumiu o pedido.',
            'aborted',
          );
          transacao.update(referenciaAluno, {
            acessoAtivo: dadosPedido.acessoAlunoAnterior,
          });
          const pedidoConcluido = {
            ...dadosPedido,
            status: 'concluida',
            mensagem: '',
            resposta:
              'Os identificadores e comentários das respostas anteriores foram removidos. Sua conta e sua declaração alimentar foram preservadas.',
            revisao: dadosPedido.revisao + 1,
            atualizadoEm: FieldValue.serverTimestamp(),
            atendidoEm: FieldValue.serverTimestamp(),
            atendidoPorUid: administradorAutenticado.uid,
            atendidoPorNome: perfilAdministrador.nome || 'Equipe',
            providenciaExecutadaEm: FieldValue.serverTimestamp(),
          };
          for (const campo of [
            'idAnonimo',
            'tokenExecucao',
            'executandoExclusao',
            'execucaoIniciadaEm',
            'acessoAlunoAnterior',
          ])
            delete pedidoConcluido[campo];
          transacao.set(referenciaPedido, pedidoConcluido);
          transacao.set(
            referenciaPedido.collection('historico').doc(String(pedidoConcluido.revisao)),
            {
              revisao: pedidoConcluido.revisao,
              ciclo: pedidoConcluido.ciclo,
              status: pedidoConcluido.status,
              mensagem: pedidoConcluido.mensagem,
              resposta: pedidoConcluido.resposta,
              pedidoEm: pedidoConcluido.criadoEm,
              autorUid: administradorAutenticado.uid,
              autorNome: perfilAdministrador.nome || 'Equipe',
              autorTipo: 'admin',
              criadoEm: FieldValue.serverTimestamp(),
            },
          );
        });
        return {
          concluida: true,
          contaPreservada: true,
        };
      }
      const referenciaRestricoes = bancoDados
        .collection('restricoesAlimentares')
        .doc(identificadorAluno);
      await bancoDados.runTransaction(async (transacao) => {
        const pedidoAtual = await transacao.get(referenciaPedido);
        exigir(
          pedidoAtual.data()?.tokenExecucao === tokenExecucao,
          'Outra execução assumiu o pedido.',
          'aborted',
        );
        transacao.delete(referenciaRestricoes);
      });
      // A matrícula e cada versão do histórico também podem conter dados pessoais.
      const consultasParaExcluir = [
        bancoDados.collection('matriculasAutorizadas').where('alunoId', '==', identificadorAluno),
        referenciaPedido.collection('historico'),
      ];
      for (const consulta of consultasParaExcluir) {
        while (true) {
          const quantidade = await bancoDados.runTransaction(async (transacao) => {
            const pedidoAtual = await transacao.get(referenciaPedido);
            exigir(
              pedidoAtual.data()?.tokenExecucao === tokenExecucao,
              'Outra execução assumiu o pedido.',
              'aborted',
            );
            const pagina = await transacao.get(consulta.limit(100));
            for (const documento of pagina.docs) {
              if (documento.ref.parent.id === 'matriculasAutorizadas')
                exigir(
                  documento.data().escola === perfilAdministrador.escola,
                  'Há uma matrícula de outra escola vinculada a esta conta. Procure a equipe.',
                  'failed-precondition',
                );
              transacao.delete(documento.ref);
            }
            if (pagina.size)
              transacao.update(referenciaPedido, { execucaoIniciadaEm: Timestamp.now() });
            return pagina.size;
          });
          if (quantidade === 0) break;
        }
      }
      try {
        await auth.deleteUser(identificadorAluno);
      } catch (erro) {
        if (erro.code !== 'auth/user-not-found') throw erro;
      }
      await bancoDados.runTransaction(async (transacao) => {
        const documentoAtual = await transacao.get(referenciaPedido);
        exigir(
          documentoAtual.data()?.tokenExecucao === tokenExecucao,
          'Outra execução assumiu este pedido. Recarregue.',
          'aborted',
        );
        const chave = `${perfilAdministrador.escola === 'Satc' ? 'satc' : 'ags'}_${dadosPedido.matricula}`;
        const matriculaRef = bancoDados.collection('matriculasAutorizadas').doc(chave);
        const matricula = await transacao.get(matriculaRef);
        if (matricula.exists && matricula.data().alunoId === identificadorAluno)
          transacao.delete(matriculaRef);
        transacao.delete(referenciaAluno);
        // Comprovante mínimo para prestação de contas, sem nome, matrícula, e-mail ou mensagem.
        transacao.set(referenciaPedido, {
          escola: perfilAdministrador.escola,
          alunoId: identificadorAluno,
          alunoNome: 'Conta excluída',
          matricula: '',
          turma: '',
          email: '',
          tipo: 'exclusao_dados',
          status: 'concluida',
          mensagem: '',
          resposta:
            'Conta e declaração alimentar excluídas. Identificadores e textos livres das respostas foram removidos; totais operacionais foram preservados.',
          revisao: dadosPedido.revisao + 1,
          ciclo: dadosPedido.ciclo,
          versaoPolitica: dadosPedido.versaoPolitica,
          criadoEm: dadosPedido.criadoEm,
          atualizadoEm: FieldValue.serverTimestamp(),
          atendidoEm: FieldValue.serverTimestamp(),
          atendidoPorUid: administradorAutenticado.uid,
          atendidoPorNome: perfilAdministrador.nome || 'Equipe',
          providenciaExecutadaEm: FieldValue.serverTimestamp(),
        });
      });
      return {
        concluida: true,
      };
    } catch (erro) {
    
      try {
        await bancoDados.runTransaction(async (transacao) => {
          const pedidoAtual = await transacao.get(referenciaPedido);
          if (pedidoAtual.data()?.tokenExecucao === tokenExecucao)
            transacao.update(referenciaPedido, { executandoExclusao: false });
        });
      } catch {

      }
      throw erro;
    }
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
