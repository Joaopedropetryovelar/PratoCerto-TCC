import ListaPaginada from '../../components/ListaPaginada';
import CartaoRefeicao from '../../components/CartaoRefeicao';
import React, { useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Alert } from '../../components/Alerta';
import { Botao, Campo, Carregando, Falha, Filtros, Pagina, ui } from '../../components/Interface';
import Calendario from '../../components/Calendario';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { useAgora } from '../../hooks/useAgora';
import { dataDaEscola } from '../../domain/refeicoes';
import { moverDia, parseData, proximoDiaUtil } from '../../domain/calendario';
import { TURNOS_ALUNO } from '../../domain/escolas';
import { salvarPrato, salvarRefeicao, arquivarRefeicao } from '../../services/cardapio';
export default function AdminCardapio() {
  const hoje=dataDaEscola(useAgora());const [data,setData]=useState([0,6].includes(parseData(hoje).getDay())?proximoDiaUtil(hoje):hoje);const [turno,setTurno]=useState('manha');const [editor,setEditor]=useState(null);
  const [pratoId,setPratoId]=useState('');const [busca,setBusca]=useState('');const [novo,setNovo]=useState(false);const [nome,setNome]=useState('');const [descricao,setDescricao]=useState('');const [limite,setLimite]=useState('09:00');const [fim,setFim]=useState('12:30');const [erro,setErro]=useState(null);const [ocupado,setOcupado]=useState(false);const bloqueio=useRef(false);
  const perfil=usePerfil();const pratos=useColecaoEscola('pratos',perfil.perfil,[],perfil.perfil?.tipoConta==='admin');const cardapio=useColecaoEscola('NomePratos',perfil.perfil,[['data','>=',hoje],['data','<=',moverDia(hoje,365)]],perfil.perfil?.tipoConta==='admin');
  const lista=cardapio.dados.filter(r=>r.ativo!==false&&r.data===data&&r.turno===turno);const catalogo=pratos.dados.filter(p=>p.nome.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))).sort((a,b)=>a.nome.localeCompare(b.nome));
  function abrir(refeicao){setEditor(refeicao||{nova:true});setPratoId(refeicao?.pratoId||'');setLimite(refeicao?.horarioLimite||{manha:'09:00',tarde:'14:00',noite:'18:00'}[turno]);setFim(refeicao?.horarioFim||{manha:'12:30',tarde:'16:00',noite:'20:00'}[turno]);setErro(null);setNovo(false);setBusca('');setNome('');setDescricao('');}
  async function executar(fn){if(bloqueio.current)return;bloqueio.current=true;setOcupado(true);setErro(null);try{await fn();}catch(e){setErro(e.message||'Não foi possível salvar.');}finally{bloqueio.current=false;setOcupado(false);}}
  async function salvarCatalogo(){const prato=await salvarPrato({nome,descricao});setPratoId(prato.id);setNovo(false);setNome('');setDescricao('');}
  async function salvar(){if(!pratoId)throw new Error('Selecione um prato do catálogo.');await salvarRefeicao({data,turno,pratoId,horarioLimite:limite,horarioFim:fim,id:editor?.id,revisaoEsperada:editor?.revisao||0});setEditor(null);Alert.alert('Cardápio salvo','A refeição está disponível para os alunos desta escola.');}
  const fontes=[perfil,pratos,cardapio];
  return <Pagina titulo="Organizar cardápio" subtitulo={`${perfil.perfil?.escola||'Prato Certo'} · Selecione um dia e reutilize os pratos da escola.`}>
    {fontes.some(f=>f.carregando)?<Carregando/>:fontes.some(f=>f.erro)?<Falha tentarNovamente={()=>fontes.forEach(f=>f.tentarNovamente())}/>:perfil.perfil?.tipoConta!=='admin'?<Falha mensagem="Esta área é exclusiva da equipe." tentarNovamente={perfil.tentarNovamente}/>:editor?<>
      <View style={ui.card}><Text style={ui.selo}>{data.split('-').reverse().join('/')} · {TURNOS_ALUNO.find(t=>t.id===turno)?.nome}</Text><Text style={ui.secao}>{editor.nova?'Adicionar refeição':'Editar refeição'}</Text><Text style={ui.pequeno}>Alterar o catálogo não muda cardápios já salvos. Cada refeição conserva o nome e a descrição publicados.</Text></View>
      <View style={ui.card}><Text style={ui.secao}>Catálogo da escola</Text><Campo label="Buscar prato" value={busca} onChangeText={setBusca} editable={!ocupado}/>
        <ListaPaginada itens={catalogo} chave={busca} prefixo="catalogo" tamanho={5} renderItem={prato=><TouchableOpacity key={prato.id} testID={`prato-${prato.id}`} accessibilityRole="radio" accessibilityState={{selected:pratoId===prato.id}} disabled={ocupado} onPress={()=>setPratoId(prato.id)} style={[ui.card,pratoId===prato.id&&{borderColor:'#2F6B4F',backgroundColor:'#EDF5EE'}]}><Text style={ui.label}>{pratoId===prato.id?'✓ ':''}{prato.nome}</Text>{prato.descricao?<Text style={ui.pequeno}>{prato.descricao}</Text>:null}</TouchableOpacity>} />
        {!catalogo.length?<Text style={ui.texto}>Nenhum prato encontrado. Cadastre um novo abaixo.</Text>:null}
        <Botao secundario disabled={ocupado} onPress={()=>setNovo(!novo)}>{novo?'Fechar novo prato':'Cadastrar novo prato'}</Botao>
        {novo?<><Campo label="Nome do novo prato" testID="novo-prato" value={nome} onChangeText={setNome} maxLength={100} editable={!ocupado}/><Campo label="Descrição do prato (opcional)" value={descricao} onChangeText={setDescricao} maxLength={300} multiline editable={!ocupado}/><Botao testID="salvar-prato" carregando={ocupado} onPress={()=>executar(salvarCatalogo)}>Salvar no catálogo e selecionar</Botao></>:null}
      </View>
      <View style={ui.card}><Campo label="Confirmação até" value={limite} onChangeText={setLimite} maxLength={5} placeholder="HH:MM" editable={!ocupado}/><Campo label="Fim da refeição" value={fim} onChangeText={setFim} maxLength={5} placeholder="HH:MM" editable={!ocupado}/><Text style={ui.pequeno}>Horários de Brasília. A avaliação abre no fim da refeição e fecha ao final do próximo dia útil.</Text></View>
      {erro?<Text accessibilityRole="alert" style={ui.erro}>{erro}</Text>:null}<Botao testID="salvar-refeicao" carregando={ocupado} onPress={()=>executar(salvar)}>Salvar refeição</Botao><Botao secundario disabled={ocupado} onPress={()=>Alert.alert('Sair da edição?','Os dados ainda não salvos serão perdidos.',[{text:'Continuar',style:'cancel'},{text:'Sair',onPress:()=>setEditor(null)}])}>Voltar à lista</Botao>
    </>:<>
      <Calendario label="Dia do cardápio" value={data} onChange={setData} min={hoje} max={moverDia(hoje,365)} somenteUteis marcadas={cardapio.dados.filter(r=>r.ativo!==false).map(r=>r.data)}/><Filtros label="Turno" opcoes={TURNOS_ALUNO} valor={turno} onChange={setTurno}/>
      {lista.length?lista.map(refeicao=><CartaoRefeicao key={refeicao.id} nome={refeicao.nome}><Text style={ui.secao}>{refeicao.nome}</Text><Text style={ui.texto}>{refeicao.descricao}</Text><Text style={ui.pequeno}>Confirmar até {refeicao.horarioLimite} · Término {refeicao.horarioFim}</Text><Botao secundario onPress={()=>abrir(refeicao)}>Editar refeição</Botao><Botao secundario disabled={ocupado} onPress={()=>Alert.alert('Arquivar refeição?','Ela sairá do cardápio. Confirmações, avaliações e pesagens ficarão preservadas.',[{text:'Cancelar',style:'cancel'},{text:'Arquivar',onPress:()=>executar(()=>arquivarRefeicao(refeicao))}])}>Arquivar refeição</Botao></CartaoRefeicao>):<View style={ui.card}><Text style={ui.secao}>Dia ainda sem refeição neste turno</Text><Text style={ui.texto}>Escolha um prato do catálogo para montar o cardápio.</Text><Botao testID="adicionar-refeicao" onPress={()=>abrir(null)}>Adicionar refeição</Botao></View>}
      {erro?<Text style={ui.erro} accessibilityRole="alert">{erro}</Text>:null}<Text style={ui.pequeno}>Datas passadas saem desta lista de planejamento. O histórico continua salvo para avaliações, produção e relatórios.</Text>
    </>}
  </Pagina>;
}
