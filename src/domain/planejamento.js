export function resumirConfirmacoes(refeicoes, confirmacoes, turno = 'todos') {
  const pratos = refeicoes.filter((item) => item.ativo !== false && (turno === 'todos' || item.turno === turno));
  const ids = new Set(pratos.map((item) => item.id));
  const porAluno = new Map();
  confirmacoes.forEach((item) => {
    if (!ids.has(item.refeicaoId) || !item.alunoId || typeof item.vaiConsumir !== 'boolean') return;
    const chave = `${item.refeicaoId}|${item.alunoId}`;
    const anterior = porAluno.get(chave);
    const tempo = item.dataResposta?.seconds || 0;
    if (!anterior || tempo >= (anterior.dataResposta?.seconds || 0)) porAluno.set(chave, item);
  });
  const respostas = [...porAluno.values()];
  const confirmados = respostas.filter((item) => item.vaiConsumir).length;
  return { confirmados, recusados: respostas.length - confirmados, total: respostas.length,
    taxaConfirmacao: respostas.length ? confirmados / respostas.length * 100 : null, respostas, pratos };
}
export function resumirAvaliacoes(feedbacks) {
  const porAluno = new Map();
  feedbacks.forEach((item) => {
    if (!item.alunoId || !item.refeicaoId) return;
    const chave = `${item.refeicaoId}|${item.alunoId}`;
    const anterior = porAluno.get(chave);
    if (!anterior || (item.dataResposta?.seconds || 0) >= (anterior.dataResposta?.seconds || 0)) porAluno.set(chave, item);
  });
  const lista = [...porAluno.values()];
  const notas = lista.filter((item) => Number.isFinite(item.nota) && item.nota >= 1 && item.nota <= 5);
  return { lista, notas: notas.length, media: notas.length ? notas.reduce((soma, item) => soma + item.nota, 0) / notas.length : null };
}
