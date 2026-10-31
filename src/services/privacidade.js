import { auth, database, doc, getDoc, serverTimestamp, executarTransacao } from './backend';
import { revisaoPedido, cicloPedido, podeAtender, validarAtendimento } from '../domain/privacidade';
export const TIPO_SOLICITACAO_EXCLUSAO = 'exclusao_dados';
export const STATUS_SOLICITACAO_PENDENTE = 'pendente';
export const VERSAO_POLITICA_PRIVACIDADE = '2026-10-13';
async function contexto(tipo) {
  const identificadorUsuario = auth.currentUser?.uid;
  if (!identificadorUsuario || !auth.currentUser.emailVerified)
    throw new Error('Entre novamente com o e-mail confirmado.');
  const documentoConsultado = await getDoc(doc(database, 'usuarios', identificadorUsuario));
  if (!documentoConsultado.exists() || documentoConsultado.data().tipoConta !== tipo)
    throw new Error(
      tipo === 'admin'
        ? 'Somente a equipe pode atender pedidos.'
        : 'A solicitação fica disponível no perfil do aluno.',
    );
  return {
    ...documentoConsultado.data(),
    uid: identificadorUsuario,
  };
}
function escreverPedido(transacao, referenciaDocumento, dados, autor) {
  const evento = {
    revisao: dados.revisao,
    ciclo: dados.ciclo,
    status: dados.status,
    mensagem: dados.mensagem,
    resposta: dados.resposta,
    pedidoEm: dados.criadoEm,
    autorUid: autor.uid,
    autorNome: autor.nome,
    autorTipo: autor.tipoConta,
    criadoEm: serverTimestamp(),
  };
  transacao.set(referenciaDocumento, dados);
  transacao.set(
    doc(
      database,
      `solicitacoesPrivacidade/${referenciaDocumento.id}/historico`,
      String(dados.revisao),
    ),
    evento,
  );
}
export async function solicitarExclusaoDados(mensagem = '', tipo = 'exclusao_dados') {
  if (!['exclusao_dados', 'acesso_dados', 'correcao_dados', 'anonimizacao_dados'].includes(tipo))
    throw new Error('Escolha um tipo de pedido válido.');
  if (typeof mensagem !== 'string' || mensagem.trim().length > 500)
    throw new Error('Use uma mensagem de até 500 caracteres.');
  const perfil = await contexto('aluno'),
    referenciaDocumento = doc(database, 'solicitacoesPrivacidade', perfil.uid);
  return executarTransacao(async (transacao) => {
    const documentoConsultado = await transacao.get(referenciaDocumento),
      anterior = documentoConsultado.exists() ? documentoConsultado.data() : null;
    if (anterior && podeAtender(anterior))
      throw new Error('Você já possui um pedido em andamento. Acompanhe a resposta no seu perfil.');
    if (
      anterior &&
      (anterior.alunoId !== perfil.uid ||
        anterior.escola !== perfil.escola ||
        anterior.status !== 'concluida')
    )
      throw new Error('Seu pedido anterior precisa ser conferido pela equipe.');
    const dados = {
      alunoId: perfil.uid,
      alunoNome: perfil.nome,
      email: auth.currentUser.email,
      escola: perfil.escola,
      matricula: perfil.matricula,
      turma: perfil.turma,
      tipo,
      status: 'pendente',
      mensagem: mensagem.trim(),
      versaoPolitica: VERSAO_POLITICA_PRIVACIDADE,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
      revisao: anterior ? revisaoPedido(anterior) + 1 : 1,
      ciclo: anterior ? cicloPedido(anterior) + 1 : 1,
      resposta: '',
      atendidoPorUid: '',
      atendidoPorNome: '',
      atendidoEm: null,
    };
    escreverPedido(transacao, referenciaDocumento, dados, perfil);
    return dados;
  });
}
export async function atenderSolicitacao(
  identificadorUsuario,
  { status, resposta = '', revisaoEsperada },
) {
  if (
    typeof identificadorUsuario !== 'string' ||
    !identificadorUsuario ||
    identificadorUsuario.includes('/')
  )
    throw new Error('Pedido inválido.');
  const perfil = await contexto('admin'),
    referenciaDocumento = doc(database, 'solicitacoesPrivacidade', identificadorUsuario);
  return executarTransacao(async (transacao) => {
    const documentoConsultado = await transacao.get(referenciaDocumento);
    if (!documentoConsultado.exists() || documentoConsultado.data().escola !== perfil.escola)
      throw new Error('Pedido indisponível nesta escola.');
    const atual = documentoConsultado.data();
    if (revisaoPedido(atual) !== revisaoEsperada)
      throw new Error('Outra pessoa atualizou este pedido. Recarregue antes de salvar.');
    const erro = validarAtendimento(atual, status, resposta);
    if (erro) throw new Error(erro);
    const dados = {
      ...atual,
      status,
      resposta: resposta.trim(),
      revisao: revisaoPedido(atual) + 1,
      ciclo: cicloPedido(atual),
      atendidoPorUid: perfil.uid,
      atendidoPorNome: perfil.nome,
      atendidoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    };
    escreverPedido(transacao, referenciaDocumento, dados, perfil);
    return dados;
  });
}
