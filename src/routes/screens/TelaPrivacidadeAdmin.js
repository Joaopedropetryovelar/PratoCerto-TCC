import React,{useRef,useState} from 'react';
import {Text,View} from 'react-native';
import {Botao,Campo,Carregando,Falha,Filtros,Pagina,ui} from '../../components/Interface';
import ListaPaginada from '../../components/ListaPaginada';
import HistoricoPrivacidade from '../../components/HistoricoPrivacidade';
import {useColecaoEscola,usePerfil} from '../../hooks/useDados';
import {atenderSolicitacao} from '../../services/privacidade';
import {nomeStatus,STATUS_PRIVACIDADE,podeAtender,revisaoPedido,cicloPedido} from '../../domain/privacidade';
import {mensagemAuth} from '../../domain/contas';
import {Alert} from '../../components/Alerta';
function Atendimento({pedido,ocupado,onSalvar}){
  const [status,setStatus]=useState(pedido.status==='pendente'?'em_analise':pedido.status),[resposta,setResposta]=useState(pedido.resposta||''),[base,setBase]=useState(revisaoPedido(pedido));
  const desatualizado=base!==revisaoPedido(pedido);
  return <View style={{gap:14}}>{desatualizado?<View style={[ui.card,ui.aviso]}><Text style={ui.texto}>Este pedido foi atualizado durante a edição. Seu texto foi preservado; confira a atualização antes de salvar.</Text><Botao testID="recarregar-atendimento" secundario onPress={()=>{setBase(revisaoPedido(pedido));setStatus(pedido.status==='pendente'?'em_analise':pedido.status);setResposta(pedido.resposta||'');}}>Carregar atualização</Botao></View>:null}<Filtros label="Novo status" opcoes={STATUS_PRIVACIDADE.filter(s=>s.id!=='pendente').map(s=>({...s,disabled:ocupado||desatualizado}))} valor={status} onChange={setStatus}/><Campo label="Resposta ao aluno" testID="resposta-privacidade" value={resposta} onChangeText={setResposta} multiline maxLength={1000} editable={!ocupado&&!desatualizado} ajuda="Esta resposta ficará visível ao aluno. Explique as providências tomadas; concluir não executa exclusão automática."/><Botao testID="salvar-atendimento" disabled={desatualizado} carregando={ocupado} onPress={()=>onSalvar({status,resposta,revisaoEsperada:base})}>Salvar atendimento</Botao></View>;
}
export default function TelaPrivacidadeAdmin({navigation}){
  const perfil=usePerfil(),habilitado=perfil.perfil?.tipoConta==='admin',lista=useColecaoEscola('solicitacoesPrivacidade',perfil.perfil,[],habilitado);
  const [filtro,setFiltro]=useState('todos'),[busca,setBusca]=useState(''),[selecionado,setSelecionado]=useState(null),[historico,setHistorico]=useState(false),[erro,setErro]=useState(null),[ocupado,setOcupado]=useState(false);const trava=useRef(false);
  const normalizar=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const itens=lista.dados.filter(r=>(filtro==='todos'||r.status===filtro)&&normalizar(`${r.alunoNome} ${r.matricula} ${r.email}`).includes(normalizar(busca))).sort((a,b)=>(b.criadoEm?.seconds||0)-(a.criadoEm?.seconds||0)||a.id.localeCompare(b.id));
  const pedido=lista.dados.find(r=>r.id===selecionado);
  async function salvar(dados){if(trava.current)return;trava.current=true;setOcupado(true);setErro(null);try{await atenderSolicitacao(pedido.id,dados);setSelecionado(null);setHistorico(false);Alert.alert('Atendimento registrado','O status e a resposta já podem ser acompanhados pelo aluno.');}catch(e){setErro(mensagemAuth(e));}finally{trava.current=false;setOcupado(false);}}
  return <Pagina titulo="Pedidos de privacidade" subtitulo={`${perfil.perfil?.escola||'Sua escola'} · Consulte os pedidos e registre o atendimento.`}>
    {perfil.carregando||lista.carregando?<Carregando/>:perfil.erro||lista.erro?<Falha mensagem={perfil.erro||lista.erro} tentarNovamente={()=>{perfil.tentarNovamente();lista.tentarNovamente();}}/>:!habilitado?<Text style={ui.erro}>Esta área é exclusiva da equipe.</Text>:pedido?<>
      <View style={ui.card}><Text style={ui.secao}>{pedido.alunoNome}</Text><Text style={ui.texto}>Matrícula {pedido.matricula} · {pedido.turma}</Text><Text style={ui.texto}>{pedido.email}</Text><Text style={ui.selo}>Pedido {cicloPedido(pedido)} · {nomeStatus(pedido.status)}</Text><Text style={ui.texto}>{pedido.mensagem||'O aluno não acrescentou uma mensagem.'}</Text>{pedido.resposta?<Text style={ui.texto}>Resposta registrada: {pedido.resposta}</Text>:null}{podeAtender(pedido)?<Atendimento key={pedido.id} pedido={pedido} ocupado={ocupado} onSalvar={salvar}/>:<Text style={ui.pequeno}>Atendimento concluído. O histórico está preservado.</Text>}</View>
      {erro?<Text style={ui.erro} accessibilityRole="alert">{erro}</Text>:null}<Botao secundario onPress={()=>setHistorico(!historico)}>{historico?'Fechar histórico':'Ver histórico completo'}</Botao>{historico?<HistoricoPrivacidade uid={pedido.id}/>:null}<Botao secundario disabled={ocupado} onPress={()=>{setSelecionado(null);setErro(null);setHistorico(false);}}>Voltar aos pedidos</Botao>
    </>:<><Campo label="Buscar aluno, matrícula ou e-mail" value={busca} onChangeText={setBusca}/><Filtros label="Status" valor={filtro} onChange={setFiltro} opcoes={[{id:'todos',nome:'Todos'},...STATUS_PRIVACIDADE]}/><Text style={ui.pequeno}>{lista.dados.length} aluno(s) com pedidos registrados. Abra um pedido para consultar os ciclos anteriores no histórico.</Text><ListaPaginada prefixo="pedidos-privacidade" itens={itens} tamanho={8} chave={`${filtro}|${busca}`} renderItem={r=><View key={r.id} style={ui.card}><Text style={ui.secao}>{r.alunoNome}</Text><Text style={ui.texto}>Matrícula {r.matricula} · {r.turma}</Text><Text style={ui.selo}>{nomeStatus(r.status)}</Text><Botao testID={`abrir-pedido-${r.id}`} secundario onPress={()=>{setSelecionado(r.id);setErro(null);setHistorico(false);}}>Consultar e atender</Botao></View>}/></>}
    <Botao secundario disabled={ocupado} onPress={()=>navigation.goBack()}>Voltar ao painel</Botao>
  </Pagina>;
}
