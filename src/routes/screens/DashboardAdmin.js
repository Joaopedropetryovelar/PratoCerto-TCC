import CartaoRefeicao from '../../components/CartaoRefeicao';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Alert } from '../../components/Alerta';
import { auth, signOut } from '../../services/backend';
import { Botao, Carregando, Falha, Filtros, Indicador, Pagina, ui } from '../../components/Interface';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { useAgora } from '../../hooks/useAgora';
import { dataDaEscola } from '../../domain/refeicoes';
import { resumirProducao, TURNOS } from '../../domain/producao';
import { resumirAvaliacoes, resumirConfirmacoes } from '../../domain/planejamento';
export default function DashboardAdmin({ navigation }) {
  const hoje=dataDaEscola(useAgora());const [turno,setTurno]=useState('todos');const perfil=usePerfil();const filtros=[['data','==',hoje]];const habilitado=perfil.perfil?.tipoConta==='admin';
  const pratos=useColecaoEscola('NomePratos',perfil.perfil,filtros,habilitado),confirmacoes=useColecaoEscola('confirmacoes',perfil.perfil,filtros,habilitado),avaliacoes=useColecaoEscola('feedbacks',perfil.perfil,filtros,habilitado),producao=useColecaoEscola('producao',perfil.perfil,filtros,habilitado),solicitacoes=useColecaoEscola('solicitacoesPrivacidade',perfil.perfil,[],habilitado);
  const fontes=[perfil,pratos,confirmacoes,avaliacoes,producao,solicitacoes];const planejamento=resumirConfirmacoes(pratos.dados,confirmacoes.dados,turno);const feedback=resumirAvaliacoes(avaliacoes.dados.filter(r=>turno==='todos'||r.turno===turno));const resultado=resumirProducao(producao.dados.filter(r=>turno==='todos'||r.turno===turno));const comentarios=feedback.lista.filter(r=>r.comentario?.trim()).sort((a,b)=>(b.dataResposta?.seconds||0)-(a.dataResposta?.seconds||0)).slice(0,4);const pendentes=solicitacoes.dados.filter(s=>s.status==='pendente');
  return <Pagina titulo="Painel da equipe" subtitulo={`${perfil.perfil?.escola||'Prato Certo'} · ${hoje.split('-').reverse().join('/')}`}>
    {fontes.some(f=>f.carregando)?<Carregando/>:fontes.some(f=>f.erro)?<Falha mensagem={fontes.find(f=>f.erro)?.erro} tentarNovamente={()=>fontes.forEach(f=>f.tentarNovamente())}/>:!habilitado?<Falha mensagem="Esta área é exclusiva da equipe." tentarNovamente={perfil.tentarNovamente}/>:<>
      <Filtros label="Turno" opcoes={TURNOS} valor={turno} onChange={setTurno}/>
      <View style={ui.linha}><Indicador label="Refeições confirmadas" valor={planejamento.confirmados} ajuda="Intenção informada pelos alunos."/><Indicador label="Refeições servidas" valor={resultado.registros?resultado.servidos:'—'} ajuda={resultado.registros?'Quantidade registrada pela equipe.':'Aguardando registro da equipe.'}/></View>
      <View style={ui.linha}><Indicador label="Não vão consumir" valor={planejamento.recusados}/><Indicador label="Satisfação de hoje" valor={feedback.media===null?'—':`${feedback.media.toFixed(1).replace('.',',')} / 5`} ajuda={`${feedback.notas} avaliações válidas.`}/></View>
      <View style={ui.card}><Text style={ui.secao}>Cardápio ativo de hoje</Text>{planejamento.pratos.length?planejamento.pratos.map(prato=><CartaoRefeicao key={prato.id} nome={prato.nome} style={{ padding: 16 }}><Text style={ui.selo}>{TURNOS.find(t=>t.id===prato.turno)?.nome}</Text><Text style={ui.label}>{prato.nome}</Text><Text style={ui.pequeno}>Confirmar até {prato.horarioLimite}</Text></CartaoRefeicao>):<Text style={ui.texto}>Nenhuma refeição publicada nesta seleção.</Text>}<Botao secundario onPress={()=>navigation.navigate('CardapioAdmin')}>Organizar cardápio</Botao></View>
      <View style={ui.card}><Text style={ui.secao}>Comentários de hoje</Text>{comentarios.length?comentarios.map(item=><View key={item.id} style={{gap:4}}><Text style={ui.selo}>{TURNOS.find(t=>t.id===item.turno)?.nome}</Text><Text style={ui.texto}>{item.comentario}</Text><Text style={ui.pequeno}>{item.refeicaoNome} · {item.alunoNome}</Text></View>):<Text style={ui.texto}>Nenhum comentário recebido nesta seleção.</Text>}<Botao secundario onPress={()=>navigation.navigate('FeedbackAdmin')}>Ver avaliações</Botao></View>
      <View style={ui.card}><Text style={ui.secao}>Pedidos de privacidade</Text><Text style={ui.texto}>{pendentes.length ? `${pendentes.length} pedido(s) pendente(s) sobre dados pessoais.` : 'Nenhuma solicitação pendente nesta escola.'}</Text>{pendentes.slice(0,3).map(item=><View key={item.id} style={{gap:4}}><Text style={ui.label}>{item.alunoNome}</Text><Text style={ui.pequeno}>Matrícula {item.matricula} · {item.tipo === 'exclusao_dados' ? 'revisão ou exclusão de dados' : item.tipo}</Text>{item.mensagem ? <Text style={ui.texto}>{item.mensagem}</Text> : null}</View>)}<Text style={ui.pequeno}>Atenda esses pedidos pelo processo definido pela instituição, verificando o que pode ser excluído, anonimizado ou precisa ser conservado.</Text></View>
      <Botao testID="abrir-restricoes-admin" secundario onPress={()=>navigation.getParent()?.navigate('RestricoesAdmin')}>Ver restrições alimentares</Botao>
      <Botao secundario onPress={()=>navigation.navigate('Relatorios')}>Abrir relatórios</Botao><Botao secundario onPress={()=>navigation.getParent()?.navigate('CadastroAdmin')}>Autorizar novo administrador</Botao>
      <Botao secundario onPress={()=>Alert.alert('Sair da conta?','Você voltará à tela inicial.',[{text:'Cancelar',style:'cancel'},{text:'Sair',onPress:async()=>{try{await signOut(auth);(navigation.getParent()||navigation).reset({index:0,routes:[{name:'Inicial'}]});}catch{Alert.alert('Não foi possível sair','Tente novamente.');}}}])}>Sair da conta</Botao>
    </>}
  </Pagina>;
}
