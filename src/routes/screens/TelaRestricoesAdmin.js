import React,{useState} from 'react';
import {Text,View} from 'react-native';
import {Botao,Carregando,Falha,Filtros,Indicador,Pagina,ui} from '../../components/Interface';
import Calendario from '../../components/Calendario';
import {useColecaoEscola,usePerfil} from '../../hooks/useDados';
import {useAgora} from '../../hooks/useAgora';
import {dataDaEscola} from '../../domain/refeicoes';
import {TURNOS_ALUNO} from '../../domain/escolas';
import {estatisticasRestricoes,planejarRestricoesDaRefeicao} from '../../domain/restricoes';
export default function TelaRestricoesAdmin({navigation,route}){
  const agora=useAgora();
  const perfil=usePerfil(),[escopo,setEscopo]=useState('refeicao'),[turno,setTurno]=useState(route?.params?.turno||'manha'),[data,setData]=useState(route?.params?.data||dataDaEscola(agora)),[refeicaoId,setRefeicaoId]=useState(route?.params?.refeicaoId||'');
  const habilitado=perfil.perfil?.tipoConta==='admin';
  const alunos=useColecaoEscola('usuarios',perfil.perfil,[['tipoConta','==','aluno']],habilitado),restricoes=useColecaoEscola('restricoesAlimentares',perfil.perfil,[],habilitado);
  const pratos=useColecaoEscola('NomePratos',perfil.perfil,[['data','==',data]],habilitado&&escopo==='refeicao'),confirmacoes=useColecaoEscola('confirmacoes',perfil.perfil,[['data','==',data]],habilitado&&escopo==='refeicao');
  const fontes=[perfil,alunos,restricoes,...(escopo==='refeicao'?[pratos,confirmacoes]:[])];
  const refeicoes=pratos.dados.filter(r=>r.turno===turno).sort((a,b)=>Number(b.ativo!==false)-Number(a.ativo!==false)||a.id.localeCompare(b.id));
  const refeicao=refeicoes.find(r=>r.id===refeicaoId)||refeicoes[0]||null;
  const resumo=escopo==='refeicao'?planejarRestricoesDaRefeicao(refeicao,alunos.dados,restricoes.dados,confirmacoes.dados):estatisticasRestricoes(alunos.dados,restricoes.dados,turno);
  function mudarEscopo(v){setEscopo(v);if(v==='refeicao'&&turno==='todos')setTurno('manha');}
  return <Pagina titulo="Restrições alimentares" subtitulo={`${perfil.perfil?.escola||'Sua escola'} · Consulte os cadastros ou planeje uma refeição.`}>
    <Filtros label="Visão" opcoes={[{id:'refeicao',nome:'Por refeição'},{id:'cadastro',nome:'Cadastros da escola'}]} valor={escopo} onChange={mudarEscopo}/>
    {escopo==='refeicao'?<Calendario label="Dia da refeição" value={data} onChange={v=>{setData(v);setRefeicaoId('');}}/>:null}
    <Filtros label={escopo==='refeicao'?'Turno da refeição':'Turno dos alunos'} opcoes={escopo==='refeicao'?TURNOS_ALUNO:[{id:'todos',nome:'Todos'},...TURNOS_ALUNO]} valor={turno} onChange={v=>{setTurno(v);setRefeicaoId('');}}/>
    {fontes.some(f=>f.carregando)?<Carregando/>:fontes.some(f=>f.erro)?<Falha mensagem={fontes.find(f=>f.erro)?.erro} tentarNovamente={()=>fontes.forEach(f=>f.tentarNovamente())}/>:!habilitado?<Text style={ui.erro}>Esta área é exclusiva da equipe autorizada.</Text>:escopo==='refeicao'&&!refeicao?<View style={ui.card}><Text style={ui.secao}>Nenhuma refeição nesta seleção</Text><Text style={ui.texto}>Selecione outra data ou turno. Os totais de cadastro continuam disponíveis na outra visão.</Text></View>:<>
      {escopo==='refeicao'?<View style={ui.card}><Text testID="refeicao-planejada" style={ui.secao}>{refeicao.nome}</Text><Text style={ui.pequeno}>{data.split('-').reverse().join('/')} · {TURNOS_ALUNO.find(t=>t.id===turno)?.nome}{refeicao.ativo===false?' · Arquivada':''}</Text>{refeicoes.length>1?<Filtros label="Refeição" opcoes={refeicoes.map(r=>({id:r.id,nome:`${r.nome}${r.ativo===false?' (arquivada)':''}`}))} valor={refeicao.id} onChange={setRefeicaoId}/>:null}<Text style={ui.texto}>Os indicadores consideram somente os alunos com resposta Vou comer nesta refeição.</Text></View>:<View style={[ui.card,ui.aviso]}><Text style={ui.texto}>Esta visão considera os alunos cadastrados no turno selecionado. Ela não representa o número de refeições confirmadas.</Text></View>}
      <View style={ui.linha}><Indicador label={escopo==='refeicao'?'Confirmaram a refeição':'Alunos cadastrados'} valor={resumo.total}/><Indicador label="Com restrições declaradas" valor={resumo.comRestricoes}/></View>
      <View style={ui.linha}><Indicador label="Sem restrições declaradas" valor={resumo.semRestricoes}/><Indicador label="Ainda não informaram" valor={resumo.naoInformado} ajuda="Ausência de informação não significa ausência de restrição."/></View>
      <View style={ui.card}><Text style={ui.secao}>{escopo==='refeicao'?'Declarações entre os confirmados':'Declarações dos cadastros'}</Text><Text style={ui.texto}>{resumo.comRestricoes} de {resumo.total} {escopo==='refeicao'?'alunos que confirmaram esta refeição':'alunos cadastrados nesta seleção'} declararam restrições alimentares.</Text><View style={ui.linha}><Indicador label="Leite ou lactose" valor={resumo.impacto.semLeiteOuLactose}/><Indicador label="Glúten ou trigo" valor={resumo.impacto.semGlutenOuTrigo}/><Indicador label="Alergias declaradas" valor={resumo.impacto.alergiasDeclaradas} ajuda="Alunos com uma ou mais alergias informadas, sem classificação de gravidade."/></View><Text style={ui.pequeno}>As declarações precisam ser conferidas pela escola junto com os ingredientes e o preparo. Um aluno pode aparecer em mais de um grupo.</Text>{resumo.semCadastro?<Text style={ui.erro}>{resumo.semCadastro} confirmação(ões) não têm cadastro válido nesta seleção e foram contadas como situação não informada. Confira os vínculos.</Text>:null}</View>
      <View style={ui.card}><Text style={ui.secao}>Quantidade por restrição</Text>{resumo.total?resumo.grupos.map(g=><View key={g.id} testID={`estatistica-${g.id}`} style={{gap:6}}><View style={[ui.linha,{justifyContent:'space-between'}]}><Text style={[ui.texto,{flex:1}]}>{g.nome}</Text><Text style={ui.label}>{g.quantidade} · {g.percentual.toFixed(1).replace('.',',')}%</Text></View><View style={{height:10,borderRadius:5,backgroundColor:'#EAF0EA',overflow:'hidden'}}><View style={{height:10,backgroundColor:'#427B61',width:`${g.percentual}%`}}/></View></View>):<Text style={ui.texto}>{escopo==='refeicao'?'Ninguém confirmou esta refeição ainda.':'Nenhum aluno cadastrado nesta seleção.'}</Text>}</View>
      <Text style={ui.pequeno}>Os indicadores usam as declarações atualmente disponíveis. Esta tela mostra totais, sem nomes ou comentários de saúde dos alunos.</Text>
    </>}<Botao secundario onPress={()=>navigation.goBack()}>Voltar ao painel</Botao>
  </Pagina>;
}
