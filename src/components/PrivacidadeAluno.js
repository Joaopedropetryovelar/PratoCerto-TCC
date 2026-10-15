import React,{useRef,useState} from 'react';
import {Text,View} from 'react-native';
import {auth} from '../services/backend';
import {useDocumento} from '../hooks/useDados';
import {solicitarExclusaoDados} from '../services/privacidade';
import {nomeStatus,podeAtender,cicloPedido} from '../domain/privacidade';
import {mensagemAuth} from '../domain/contas';
import {Botao,Campo,Carregando,Falha,ui} from './Interface';
import {Alert} from './Alerta';
import HistoricoPrivacidade from './HistoricoPrivacidade';
export default function PrivacidadeAluno(){
  const uid=auth.currentUser?.uid,pedido=useDocumento('solicitacoesPrivacidade',uid);
  const [formulario,setFormulario]=useState(false),[mensagem,setMensagem]=useState(''),[historico,setHistorico]=useState(false),[erro,setErro]=useState(null),[ocupado,setOcupado]=useState(false);const trava=useRef(false);
  async function enviar(){if(trava.current)return;trava.current=true;setOcupado(true);setErro(null);try{await solicitarExclusaoDados(mensagem);setMensagem('');setFormulario(false);Alert.alert('Pedido registrado','Você pode acompanhar o status e a resposta da equipe nesta área.');}catch(e){setErro(mensagemAuth(e));}finally{trava.current=false;setOcupado(false);}}
  return <View style={ui.card}><Text style={ui.secao}>Pedidos sobre seus dados</Text><Text style={ui.texto}>Registre um pedido de revisão ou exclusão e acompanhe o atendimento da sua escola.</Text>
    {pedido.carregando?<Carregando/>:pedido.erro?<Falha mensagem={pedido.erro} tentarNovamente={pedido.tentarNovamente}/>:<>
      {pedido.dados?<View style={{gap:10}}><Text testID="status-pedido-privacidade" style={ui.selo}>Pedido {cicloPedido(pedido.dados)} · {nomeStatus(pedido.dados.status)}</Text>{pedido.dados.mensagem?<Text style={ui.texto}>Sua mensagem: {pedido.dados.mensagem}</Text>:null}{pedido.dados.resposta?<Text style={ui.texto}>Resposta da equipe: {pedido.dados.resposta}</Text>:<Text style={ui.pequeno}>Aguardando resposta da equipe.</Text>}<Botao testID="ver-historico-privacidade" secundario onPress={()=>setHistorico(!historico)}>{historico?'Fechar histórico':'Ver histórico'}</Botao>{historico?<HistoricoPrivacidade uid={uid}/>:null}</View>:null}
      {!podeAtender(pedido.dados)?formulario?<><Campo label="Mensagem opcional" testID="mensagem-privacidade" value={mensagem} onChangeText={setMensagem} maxLength={500} multiline editable={!ocupado}/><Text style={ui.pequeno}>A conclusão registra o atendimento da escola. A equipe deve informar o que foi feito e quais registros precisam ser mantidos.</Text><Botao testID="registrar-solicitacao-lgpd" carregando={ocupado} onPress={enviar}>Registrar solicitação</Botao><Botao secundario disabled={ocupado} onPress={()=>setFormulario(false)}>Cancelar</Botao></>:<Botao testID="solicitar-exclusao-dados" secundario onPress={()=>{setFormulario(true);setErro(null);}}>{pedido.dados?'Abrir novo pedido':'Pedir revisão ou exclusão de dados'}</Botao>:<Text style={ui.pequeno}>Já há um pedido em andamento. Acompanhe as atualizações aqui.</Text>}
    </>}{erro?<Text style={ui.erro} accessibilityRole="alert">{erro}</Text>:null}
  </View>;
}
