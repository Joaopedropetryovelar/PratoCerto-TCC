import React from 'react';
import {Text,View} from 'react-native';
import {useColecao} from '../hooks/useDados';
import {Carregando,Falha,ui} from './Interface';
import ListaPaginada from './ListaPaginada';
import {nomeStatus} from '../domain/privacidade';
export default function HistoricoPrivacidade({uid}){
  const lista=useColecao(uid?`solicitacoesPrivacidade/${uid}/historico`:'historico',[],Boolean(uid));
  const itens=[...lista.dados].sort((a,b)=>b.revisao-a.revisao);
  return lista.carregando?<Carregando/>:lista.erro?<Falha mensagem={lista.erro} tentarNovamente={lista.tentarNovamente}/>:<View style={{gap:12}}><Text style={ui.secao}>Histórico de atendimento</Text>{!itens.length?<Text style={ui.pequeno}>Ainda não há movimentações registradas. Pedidos anteriores a esta versão terão histórico a partir do próximo atendimento.</Text>:<ListaPaginada prefixo="historico-privacidade" itens={itens} chave={uid} renderItem={e=><View key={e.id} style={ui.card}><Text style={ui.selo}>Pedido {e.ciclo} · {nomeStatus(e.status)}</Text><Text style={ui.pequeno}>{e.autorTipo==='admin'?'Equipe':'Aluno'} · {e.autorNome}{e.criadoEm?.seconds?` · ${new Date(e.criadoEm.seconds*1000).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}`:''}</Text>{e.mensagem?<Text style={ui.texto}>Mensagem: {e.mensagem}</Text>:null}{e.resposta?<Text style={ui.texto}>Resposta da equipe: {e.resposta}</Text>:null}</View>}/>}</View>;
}
