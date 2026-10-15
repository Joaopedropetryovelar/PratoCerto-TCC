import React, { useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Botao, Campo, Carregando, Falha, Filtros, Pagina, ui } from '../../components/Interface';
import Calendario from '../../components/Calendario';
import ListaPaginada from '../../components/ListaPaginada';
import CartaoRefeicao from '../../components/CartaoRefeicao';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { useAgora } from '../../hooks/useAgora';
import { TURNOS_ALUNO } from '../../domain/escolas';
import { dataDaEscola, dataValida, horarioValido, instanteEscola } from '../../domain/refeicoes';
import { moverDia, parseData, proximoDiaUtil } from '../../domain/calendario';
import { salvarPrato, salvarRefeicao } from '../../services/cardapio';
const horarios = { manha: ['09:00', '12:30'], tarde: ['14:00', '16:00'], noite: ['18:00', '20:00'] };
export default function TelaRefeicaoDiaAdmin({ navigation }) {
  const agora = useAgora(), hoje = dataDaEscola(agora), perfil = usePerfil();
  const [data, setData] = useState([0, 6].includes(parseData(hoje).getDay()) ? proximoDiaUtil(hoje) : hoje);
  const [turno, setTurno] = useState('manha'), [modo, setModo] = useState('novo');
  const [nome, setNome] = useState(''), [descricao, setDescricao] = useState(''), [pratoId, setPratoId] = useState(''), [busca, setBusca] = useState('');
  const [limite, setLimite] = useState(horarios.manha[0]), [fim, setFim] = useState(horarios.manha[1]);
  const [erro, setErro] = useState(null), [ocupado, setOcupado] = useState(false), [publicada, setPublicada] = useState(null);
  const trava = useRef(false), habilitado = perfil.perfil?.tipoConta === 'admin';
  const catalogo = useColecaoEscola('pratos', perfil.perfil, [], habilitado);
  const cardapio = useColecaoEscola('NomePratos', perfil.perfil, [['data', '==', data]], habilitado);
  const existentes = cardapio.dados.filter(r => r.ativo !== false && r.turno === turno);
  const pratos = catalogo.dados.filter(p => p.nome.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))).sort((a, b) => a.nome.localeCompare(b.nome));
  const fontes = [perfil, catalogo, cardapio];
  function mudarTurno(v) { if (ocupado) return; setTurno(v); setLimite(horarios[v][0]); setFim(horarios[v][1]); setErro(null); setPublicada(null); }
  async function publicar() {
    if (trava.current) return;
    trava.current = true; setOcupado(true); setErro(null);
    try {
      if (!dataValida(data) || data < hoje || [0, 6].includes(parseData(data).getDay())) throw new Error('Escolha um dia útil atual ou futuro.');
      if (!horarioValido(limite) || !horarioValido(fim) || limite >= fim) throw new Error('Confira os horários: a confirmação deve terminar antes do fim da refeição.');
      if (existentes.length) throw new Error('Já existe uma refeição neste dia e turno. Abra Gerenciar cardápio para editá-la.');
      let escolhido = pratoId;
      if (modo === 'novo' && !escolhido) {
        const repetido = catalogo.dados.find(p => p.nome.trim().toLocaleLowerCase('pt-BR') === nome.trim().toLocaleLowerCase('pt-BR'));
        if (repetido) {
          if ((repetido.descricao || '').trim() !== descricao.trim()) throw new Error('Este nome já está no catálogo com outra descrição. Escolha Usar catálogo para reutilizá-lo ou informe outro nome.');
          escolhido = repetido.id;
        } else { escolhido = (await salvarPrato({ nome, descricao })).id; }
        setPratoId(escolhido);
      }
      if (!escolhido) throw new Error('Escolha um prato do catálogo.');
      const refeicao = await salvarRefeicao({ data, turno, pratoId: escolhido, horarioLimite: limite, horarioFim: fim });
      setPublicada(refeicao);
    } catch (e) { setErro(e.message || 'Não foi possível publicar. Tente novamente.'); }
    finally { trava.current = false; setOcupado(false); }
  }
  const prazoPassou = dataValida(data) && horarioValido(limite) && agora >= instanteEscola(data, limite);
  return <Pagina titulo="Cadastrar refeição do dia" subtitulo={`${perfil.perfil?.escola || 'Sua escola'} · Publique o alimento que aparecerá para os alunos.`}>
    {fontes.some(f => f.carregando) ? <Carregando /> : fontes.some(f => f.erro) ? <Falha mensagem={fontes.find(f => f.erro)?.erro} tentarNovamente={() => fontes.forEach(f => f.tentarNovamente())} /> : !habilitado ? <Falha mensagem="Esta área é exclusiva da equipe." tentarNovamente={perfil.tentarNovamente} /> : <>
      {publicada ? <View testID="refeicao-publicada" style={[ui.card, { backgroundColor: '#EDF5EE' }]}><Text style={ui.secao}>Refeição publicada</Text><Text style={ui.texto}>{publicada.nome} · {publicada.data.split('-').reverse().join('/')} · {TURNOS_ALUNO.find(t => t.id === publicada.turno)?.nome}. Os alunos desses turnos podem consultar a refeição na escola correspondente.</Text></View> : null}
      <Calendario label="Data da refeição" value={data} onChange={v => { if (!ocupado) { setData(v); setPublicada(null); setErro(null); } }} min={hoje} max={moverDia(hoje, 365)} somenteUteis />
      <Filtros label="Turno da refeição" opcoes={TURNOS_ALUNO.map(t => ({ ...t, disabled: ocupado }))} valor={turno} onChange={mudarTurno} />
      {existentes.length ? <View style={ui.card}><Text style={ui.secao}>Refeição já cadastrada nesta seleção</Text>{existentes.map(r => <CartaoRefeicao key={r.id} nome={r.nome}><Text style={ui.label}>{r.nome}</Text><Text style={ui.texto}>{r.descricao}</Text><Text style={ui.pequeno}>Confirmação até {r.horarioLimite}</Text></CartaoRefeicao>)}<Text style={ui.texto}>Para alterar ou arquivar essa refeição, abra Gerenciar cardápio.</Text></View> : <>
        <Filtros label="Alimento ou refeição" valor={modo} onChange={v => { if (!ocupado) { setModo(v); setPratoId(''); setErro(null); } }} opcoes={[{ id: 'novo', nome: 'Digitar refeição', disabled: ocupado }, { id: 'catalogo', nome: 'Usar catálogo', disabled: ocupado }]} />
        {modo === 'novo' ? <View style={ui.card}><Campo label="Alimento ou refeição do dia" testID="alimento-dia" value={nome} onChangeText={v => { setNome(v); setPratoId(''); }} maxLength={100} editable={!ocupado} placeholder="Arroz, feijão, frango e salada" ajuda="Descreva a refeição completa ou o alimento servido." /><Campo label="Descrição (opcional)" testID="descricao-dia" value={descricao} onChangeText={v => { setDescricao(v); setPratoId(''); }} maxLength={300} editable={!ocupado} multiline placeholder="Informações sobre o que será servido" /><Text style={ui.pequeno}>O prato também ficará no catálogo para ser reutilizado em outros dias.</Text></View> : <View style={ui.card}><Campo label="Buscar no catálogo" value={busca} onChangeText={setBusca} editable={!ocupado} /><ListaPaginada prefixo="catalogo-dia" itens={pratos} chave={busca} tamanho={5} renderItem={p => <TouchableOpacity key={p.id} testID={`selecionar-prato-dia-${p.id}`} accessibilityRole="radio" accessibilityState={{ selected: pratoId === p.id }} disabled={ocupado} onPress={() => setPratoId(p.id)} style={[ui.card, pratoId === p.id && { borderColor: '#2F6B4F' }]}><Text style={ui.label}>{pratoId === p.id ? '✓ ' : ''}{p.nome}</Text><Text style={ui.pequeno}>{p.descricao}</Text></TouchableOpacity>} /></View>}
        <View style={ui.card}><Campo label="Confirmar presença até" testID="limite-dia" value={limite} onChangeText={setLimite} maxLength={5} placeholder="HH:MM" editable={!ocupado} /><Campo label="Término da refeição" testID="fim-dia" value={fim} onChangeText={setFim} maxLength={5} placeholder="HH:MM" editable={!ocupado} /><Text style={ui.pequeno}>Horários de Brasília. A avaliação fica disponível depois do término.</Text>{prazoPassou ? <Text style={ui.erro}>O prazo informado já passou. Ajuste-o se os alunos ainda devem confirmar; com esse horário a refeição aparecerá com a confirmação encerrada.</Text> : null}</View>
        {erro ? <Text accessibilityRole="alert" style={ui.erro}>{erro}</Text> : null}
        <Botao testID="publicar-refeicao-dia" carregando={ocupado} onPress={publicar}>Publicar refeição para os alunos</Botao>
      </>}
      <Botao secundario disabled={ocupado} onPress={() => navigation.navigate('HomeAdmin', { screen: 'CardapioAdmin' })}>Gerenciar cardápio</Botao>
    </>}
    <Botao secundario disabled={ocupado} onPress={() => navigation.goBack()}>Voltar</Botao>
  </Pagina>;
}
