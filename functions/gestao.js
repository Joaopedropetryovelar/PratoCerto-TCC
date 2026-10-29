const { randomBytes } = require('node:crypto');
const ESCOLAS = ['Satc', 'Antônio Guglielmi Sobrinho'];
class FalhaGestao extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
function exigir(condicao, mensagem, code = 'permission-denied') {
  if (!condicao) throw new FalhaGestao(code, mensagem);
}
function criarGestao({ db, auth, FieldValue, Timestamp }) {
  async function perfilAtual(actor, tipo) {
    exigir(actor?.uid && actor.token?.email_verified === true, 'Entre novamente com o e-mail confirmado.');
    const snap = await db.collection('usuarios').doc(actor.uid).get();
    exigir(snap.exists && ESCOLAS.includes(snap.data().escola) && snap.data().acessoAtivo !== false && (!tipo || snap.data().tipoConta === tipo), 'Sua conta não tem acesso a esta operação.');
    return { ...snap.data(), uid: actor.uid };
  }
  async function alterarAcesso(actor, dados) {
    const perfil = await perfilAtual(actor, 'admin');
    exigir(typeof dados?.uid === 'string' && !dados.uid.includes('/') && typeof dados.ativo === 'boolean', 'Confira a conta selecionada.', 'invalid-argument');
    exigir(dados.uid !== actor.uid, 'Você não pode desativar a própria conta.');
    const ref = db.collection('usuarios').doc(dados.uid);
    await db.runTransaction(async tx => {
      const [alvo, autor] = await Promise.all([tx.get(ref), tx.get(db.collection('usuarios').doc(actor.uid))]);
      exigir(autor.exists && autor.data().tipoConta === 'admin' && autor.data().acessoAtivo !== false && autor.data().escola === perfil.escola, 'Sua autorização mudou. Entre novamente.');
      exigir(alvo.exists && alvo.data().tipoConta === 'admin' && alvo.data().escola === perfil.escola, 'Conta indisponível nesta escola.');
      tx.update(ref, { acessoAtivo: dados.ativo, acessoAlteradoEm: FieldValue.serverTimestamp(), acessoAlteradoPorUid: actor.uid });
    });
    await auth.updateUser(dados.uid, { disabled: !dados.ativo });
    if (!dados.ativo) await auth.revokeRefreshTokens(dados.uid);
    return { ativo: dados.ativo };
  }
  async function obterMeusDados(actor) {
    const perfil = await perfilAtual(actor, 'aluno');
    const declaracao = await db.collection('restricoesAlimentares').doc(actor.uid).get();
    const respostas = {};
    // Exportação limitada por página; nunca devolve documentos de outro titular/escola.
    for (const nome of ['confirmacoes', 'feedbacks']) {
      respostas[nome] = [];
      let ultimo = null;
      while (true) {
        let q = db.collection(nome).where('alunoId', '==', actor.uid).orderBy('__name__').limit(200);
        if (ultimo) q = q.startAfter(ultimo);
        const pagina = await q.get();
        respostas[nome].push(...pagina.docs.filter(d => d.data().escola === perfil.escola).map(d => ({ ...d.data(), id: d.id })));
        if (pagina.size < 200) break;
        ultimo = pagina.docs.at(-1);
        exigir(respostas[nome].length <= 10000, 'Solicite uma cópia histórica à direção.', 'resource-exhausted');
      }
    }
    return { perfil, restricoes: declaracao.exists ? declaracao.data() : null, ...respostas };
  }
  async function executarExclusao(actor, dados) {
    const diretor = await perfilAtual(actor, 'admin');
    const uid = dados?.uid;
    exigir(typeof uid === 'string' && uid && !uid.includes('/') && uid !== actor.uid && Number.isInteger(dados.revisaoEsperada), 'Confira o pedido.', 'invalid-argument');
    const pedidoRef = db.collection('solicitacoesPrivacidade').doc(uid);
    const usuarioRef = db.collection('usuarios').doc(uid);
    const token = randomBytes(16).toString('hex');
    const base = await db.runTransaction(async tx => {
      const [pedidoSnap, usuarioSnap, autorSnap] = await Promise.all([tx.get(pedidoRef), tx.get(usuarioRef), tx.get(db.collection('usuarios').doc(actor.uid))]);
      exigir(autorSnap.exists && autorSnap.data().tipoConta === 'admin' && autorSnap.data().escola === diretor.escola && autorSnap.data().acessoAtivo !== false, 'Sua autorização mudou.');
      exigir(pedidoSnap.exists && pedidoSnap.data().escola === diretor.escola && pedidoSnap.data().alunoId === uid, 'Pedido indisponível nesta escola.');
      const pedido = pedidoSnap.data();
      if (pedido.status === 'concluida' && pedido.providenciaExecutadaEm) return null;
      exigir(['exclusao_dados','anonimizacao_dados'].includes(pedido.tipo) && ['pendente', 'em_analise'].includes(pedido.status), 'Esta ação exige um pedido de exclusão aberto.', 'failed-precondition');
      exigir(pedido.revisao === dados.revisaoEsperada, 'O pedido foi atualizado. Recarregue.', 'failed-precondition');
      exigir(!pedido.executandoExclusao || Date.now() - (pedido.execucaoIniciadaEm?.toMillis() || 0) > 180000, 'Uma exclusão já está em andamento. Aguarde antes de tentar novamente.', 'failed-precondition');
      exigir(!usuarioSnap.exists || (usuarioSnap.data().tipoConta === 'aluno' && usuarioSnap.data().escola === diretor.escola), 'O perfil precisa de conferência.');
      const matricula = usuarioSnap.data()?.matricula || pedido.matricula;
      tx.update(pedidoRef, { executandoExclusao: true, tokenExecucao: token, execucaoIniciadaEm: Timestamp.now(), idAnonimo: pedido.idAnonimo || token, matricula });
      if (usuarioSnap.exists) tx.update(usuarioRef, { acessoAtivo: false });
      return { ...pedido, matricula, idAnonimo: pedido.idAnonimo || token };
    });
    if (!base) return { concluida: true };
    // A conta fica bloqueada durante a limpeza. Uma falha pode ser retomada pelo mesmo pedido.
    try { if (base.tipo === 'exclusao_dados') await auth.updateUser(uid, { disabled: true }); await auth.revokeRefreshTokens(uid); }
    catch (erro) { if (erro.code !== 'auth/user-not-found') throw erro; }
    for (const nome of ['confirmacoes', 'feedbacks']) {
      while (true) {
        const quantidade = await db.runTransaction(async lote => {
        const pedidoAtual = await lote.get(pedidoRef);
        exigir(pedidoAtual.data()?.tokenExecucao === token, 'Outra execução assumiu este pedido.', 'aborted');
        const pagina = await lote.get(db.collection(nome).where('alunoId', '==', uid).limit(100));
        for (const doc of pagina.docs) {
          exigir(doc.data().escola === diretor.escola, 'Há registros inconsistentes; a conta continua bloqueada para conferência.', 'failed-precondition');
          // Conserva somente números operacionais e categorias; remove texto livre e identificadores.
          const original = doc.data(), agregado = {};
          for (const campo of ['escola','data','turno','refeicaoId','refeicaoNome','tipoRefeicao','vaiConsumir','resposta','nota','emoji','emojiValor','etiquetas','dataResposta','criadoEm']) {
            if (original[campo] !== undefined) agregado[campo] = original[campo];
          }
          agregado.alunoId = `registro_${base.idAnonimo}`; agregado.alunoNome = ''; agregado.turma = '';
          if (nome === 'feedbacks') agregado.comentario = '';
          lote.set(db.collection(nome).doc(), agregado);
          lote.delete(doc.ref);
        }
        return pagina.size;
        });
        if (quantidade === 0) break;
      }
    }
    if (base.tipo === 'anonimizacao_dados') {
      await db.runTransaction(async tx => {
        const atual = await tx.get(pedidoRef);
        exigir(atual.data()?.tokenExecucao === token, 'Outra execução assumiu o pedido.', 'aborted');
        tx.update(usuarioRef, { acessoAtivo: true });
        const limpo = { ...base, status: 'concluida', mensagem: '', resposta: 'Os identificadores e comentários das respostas anteriores foram removidos. Sua conta e sua declaração alimentar foram preservadas.', revisao: base.revisao + 1, atualizadoEm: FieldValue.serverTimestamp(), atendidoEm: FieldValue.serverTimestamp(), atendidoPorUid: actor.uid, atendidoPorNome: diretor.nome, providenciaExecutadaEm: FieldValue.serverTimestamp() };
        for (const campo of ['idAnonimo','tokenExecucao','executandoExclusao','execucaoIniciadaEm']) delete limpo[campo];
        tx.set(pedidoRef, limpo);
      });
      return { concluida: true, contaPreservada: true };
    }
    await db.collection('restricoesAlimentares').doc(uid).delete();
    const historico = await pedidoRef.collection('historico').get();
    // Cada histórico pode conter cópias da mensagem original. Também precisa ser eliminado.
    for (let i = 0; i < historico.size; i += 400) {
      const lote = db.batch(); historico.docs.slice(i, i + 400).forEach(d => lote.delete(d.ref)); await lote.commit();
    }
    try { await auth.deleteUser(uid); } catch (erro) { if (erro.code !== 'auth/user-not-found') throw erro; }
    await db.runTransaction(async tx => {
      const atual = await tx.get(pedidoRef);
      exigir(atual.data()?.tokenExecucao === token, 'Outra execução assumiu este pedido. Recarregue.', 'aborted');
      const chave = `${diretor.escola === 'Satc' ? 'satc' : 'ags'}_${base.matricula}`;
      const matriculaRef = db.collection('matriculasAutorizadas').doc(chave);
      const matricula = await tx.get(matriculaRef);
      if (matricula.exists && matricula.data().alunoId === uid) tx.delete(matriculaRef);
      tx.delete(usuarioRef);
      // Comprovante mínimo para prestação de contas, sem nome, matrícula, e-mail ou mensagem.
      tx.set(pedidoRef, { escola: diretor.escola, alunoId: uid, alunoNome: 'Conta excluída', matricula: '', turma: '', email: '', tipo: 'exclusao_dados', status: 'concluida', mensagem: '', resposta: 'Conta e declaração alimentar excluídas. Identificadores e textos livres das respostas foram removidos; totais operacionais foram preservados.', revisao: base.revisao + 1, ciclo: base.ciclo, versaoPolitica: base.versaoPolitica, criadoEm: base.criadoEm, atualizadoEm: FieldValue.serverTimestamp(), atendidoEm: FieldValue.serverTimestamp(), atendidoPorUid: actor.uid, atendidoPorNome: diretor.nome, providenciaExecutadaEm: FieldValue.serverTimestamp() });
    });
    return { concluida: true };
  }
  return { alterarAcesso, obterMeusDados, executarExclusao };
}
module.exports = { criarGestao, FalhaGestao };