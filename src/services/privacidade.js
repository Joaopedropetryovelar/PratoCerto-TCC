import { auth, database, doc, getDoc, serverTimestamp, executarTransacao } from './backend';
import { revisaoPedido,cicloPedido,podeAtender,validarAtendimento } from '../domain/privacidade';
export const TIPO_SOLICITACAO_EXCLUSAO='exclusao_dados';
export const STATUS_SOLICITACAO_PENDENTE='pendente';
export const VERSAO_POLITICA_PRIVACIDADE='2026-10-13';
async function contexto(tipo){
  const uid=auth.currentUser?.uid;
  if(!uid||!auth.currentUser.emailVerified)throw new Error('Entre novamente com o e-mail confirmado.');
  const snap=await getDoc(doc(database,'usuarios',uid));
  if(!snap.exists()||snap.data().tipoConta!==tipo)throw new Error(tipo==='admin'?'Somente a equipe pode atender pedidos.':'A solicitação fica disponível no perfil do aluno.');
  return {...snap.data(),uid};
}
function escreverPedido(tx,ref,dados,autor){
  const evento={revisao:dados.revisao,ciclo:dados.ciclo,status:dados.status,mensagem:dados.mensagem,resposta:dados.resposta,pedidoEm:dados.criadoEm,autorUid:autor.uid,autorNome:autor.nome,autorTipo:autor.tipoConta,criadoEm:serverTimestamp()};
  tx.set(ref,dados);tx.set(doc(database,`solicitacoesPrivacidade/${ref.id}/historico`,String(dados.revisao)),evento);
}
export async function solicitarExclusaoDados(mensagem='',tipo='exclusao_dados'){
  if(!['exclusao_dados','acesso_dados','correcao_dados','anonimizacao_dados'].includes(tipo))throw new Error('Escolha um tipo de pedido válido.');
  if(typeof mensagem!=='string'||mensagem.trim().length>500)throw new Error('Use uma mensagem de até 500 caracteres.');
  const perfil=await contexto('aluno'),ref=doc(database,'solicitacoesPrivacidade',perfil.uid);
  return executarTransacao(async tx=>{
    const snap=await tx.get(ref),anterior=snap.exists()?snap.data():null;
    if(anterior&&podeAtender(anterior))throw new Error('Você já possui um pedido em andamento. Acompanhe a resposta no seu perfil.');
    if(anterior&&(anterior.alunoId!==perfil.uid||anterior.escola!==perfil.escola||anterior.status!=='concluida'))throw new Error('Seu pedido anterior precisa ser conferido pela equipe.');
    const dados={alunoId:perfil.uid,alunoNome:perfil.nome,email:auth.currentUser.email,escola:perfil.escola,matricula:perfil.matricula,turma:perfil.turma,tipo,status:'pendente',mensagem:mensagem.trim(),versaoPolitica:VERSAO_POLITICA_PRIVACIDADE,criadoEm:serverTimestamp(),atualizadoEm:serverTimestamp(),revisao:anterior?revisaoPedido(anterior)+1:1,ciclo:anterior?cicloPedido(anterior)+1:1,resposta:'',atendidoPorUid:'',atendidoPorNome:'',atendidoEm:null};
    escreverPedido(tx,ref,dados,perfil);return dados;
  });
}
export async function atenderSolicitacao(uid,{status,resposta='',revisaoEsperada}){
  if(typeof uid!=='string'||!uid||uid.includes('/'))throw new Error('Pedido inválido.');
  const perfil=await contexto('admin'),ref=doc(database,'solicitacoesPrivacidade',uid);
  return executarTransacao(async tx=>{
    const snap=await tx.get(ref);
    if(!snap.exists()||snap.data().escola!==perfil.escola)throw new Error('Pedido indisponível nesta escola.');
    const atual=snap.data();
    if(revisaoPedido(atual)!==revisaoEsperada)throw new Error('Outra pessoa atualizou este pedido. Recarregue antes de salvar.');
    const erro=validarAtendimento(atual,status,resposta);if(erro)throw new Error(erro);
    const dados={...atual,status,resposta:resposta.trim(),revisao:revisaoPedido(atual)+1,ciclo:cicloPedido(atual),atendidoPorUid:perfil.uid,atendidoPorNome:perfil.nome,atendidoEm:serverTimestamp(),atualizadoEm:serverTimestamp()};
    escreverPedido(tx,ref,dados,perfil);return dados;
  });
}