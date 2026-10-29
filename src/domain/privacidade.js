export const STATUS_PRIVACIDADE=[{id:'pendente',nome:'Pendente'},{id:'em_analise',nome:'Em análise'},{id:'concluida',nome:'Concluída'}];
export function nomeStatus(status){return STATUS_PRIVACIDADE.find(s=>s.id===status)?.nome||'Precisa de conferência';}
export function revisaoPedido(pedido){return Number.isInteger(pedido?.revisao)?pedido.revisao:1;}
export function cicloPedido(pedido){return Number.isInteger(pedido?.ciclo)?pedido.ciclo:1;}
export function podeAtender(pedido){return ['pendente','em_analise'].includes(pedido?.status);}
export function validarAtendimento(pedido,status,resposta){
  if(!podeAtender(pedido))return 'Este pedido já foi concluído. Recarregue a lista.';
  if(!['em_analise','concluida'].includes(status))return 'Escolha Em análise ou Concluída.';
  if(typeof resposta!=='string'||resposta.trim().length>1000)return 'Use uma resposta de até 1.000 caracteres.';
  if(status==='concluida'&&resposta.trim().length<3)return 'Registre uma resposta ao aluno antes de concluir.';
  return null;
}

export const TIPOS_PEDIDO = [{id:'acesso_dados',nome:'Acesso ou cópia dos dados'},{id:'correcao_dados',nome:'Correção dos dados'},{id:'exclusao_dados',nome:'Exclusão da conta e dos dados'},{id:'anonimizacao_dados',nome:'Remover identificação das respostas'}];