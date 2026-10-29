import { Alert } from '../../components/Alerta';
import React, { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Botao, Campo, Carregando, Filtros, Pagina, ui } from '../../components/Interface';
import AvisoCardapio from '../../components/AvisoCardapio';
import Calendario from '../../components/Calendario';
import ListaPaginada from '../../components/ListaPaginada';
import CartaoRefeicao from '../../components/CartaoRefeicao';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { useAgora } from '../../hooks/useAgora';
import { TURNOS_ALUNO } from '../../domain/escolas';
import { HORARIOS_TURNO, podeEditarRefeicao } from '../../domain/cardapio';
import { dataDaEscola, dataValida, horarioValido, instanteEscola } from '../../domain/refeicoes';
import { moverDia, parseData, proximoDiaUtil } from '../../domain/calendario';
import { salvarRefeicao } from '../../services/cardapio';

export default function TelaRefeicaoDiaAdmin({ navigation, route }) {
  const agora = useAgora(), hoje = dataDaEscola(agora), perfil = usePerfil();
  const dataPadrao = [0, 6].includes(parseData(hoje).getDay()) ? proximoDiaUtil(hoje) : hoje;
  const idEdicao = route?.params?.refeicaoId || null;
  const dataInicial = dataValida(route?.params?.data) ? route.params.data : dataPadrao;
  const turnoInicial = HORARIOS_TURNO[route?.params?.turno] ? route.params.turno : 'manha';
  const [data, setData] = useState(dataInicial), [turno, setTurno] = useState(turnoInicial);
  const [modo, setModo] = useState('novo'), [edicao, setEdicao] = useState(null);
  const [nome, setNome] = useState(''), [descricao, setDescricao] = useState(''), [pratoId, setPratoId] = useState(''), [busca, setBusca] = useState('');
  const [limite, setLimite] = useState(HORARIOS_TURNO[turnoInicial][0]), [fim, setFim] = useState(HORARIOS_TURNO[turnoInicial][1]);
  const [erro, setErro] = useState(null), [ocupado, setOcupado] = useState(false), [publicada, setPublicada] = useState(null);
  const trava = useRef(false), habilitado = perfil.perfil?.tipoConta === 'admin';
  const catalogo = useColecaoEscola('pratos', perfil.perfil, [], habilitado);
  const cardapio = useColecaoEscola('NomePratos', perfil.perfil, [['data', '==', data]], habilitado);
  const existentes = cardapio.dados.filter(r => r.data === data && r.ativo !== false && r.turno === turno);
  const selecionada = cardapio.dados.find(r => r.data === data && r.id === idEdicao && r.ativo !== false);
  const pratos = catalogo.dados.filter(p => String(p.nome || '').toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))).sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'));
  const fontes = [perfil, catalogo, cardapio];

  // A mesma rota atende novos cadastros e a edição aberta a partir de um turno.
  useEffect(() => {
    setData(dataInicial); setTurno(turnoInicial); setEdicao(null); setPublicada(null);
    setNome(''); setDescricao(''); setPratoId(''); setBusca(''); setModo('novo'); setErro(null);
    setLimite(HORARIOS_TURNO[turnoInicial][0]); setFim(HORARIOS_TURNO[turnoInicial][1]);
  }, [idEdicao, dataInicial, turnoInicial]);
  useEffect(() => {
    if (!idEdicao || edicao?.id === idEdicao || !selecionada) return;
    // Mantém a revisão carregada ao abrir a edição para detectar alterações concorrentes.
    setEdicao(selecionada); setNome(selecionada.nome || ''); setDescricao(selecionada.descricao || '');
    setPratoId(selecionada.pratoId || ''); setLimite(selecionada.horarioLimite); setFim(selecionada.horarioFim);
  }, [idEdicao, selecionada, edicao]);

  function verCardapio() {
    navigation.navigate('CardapioAdmin', { data, atualizadoEm: Date.now() });
  }
  function mudarTurno(v) {
    if (trava.current || idEdicao) return;
    setTurno(v); setLimite(HORARIOS_TURNO[v][0]); setFim(HORARIOS_TURNO[v][1]); setErro(null);
  }
  function confirmarPublicacao() {
    if (edicao && (limite !== edicao.horarioLimite || fim !== edicao.horarioFim)) {
      Alert.alert('Alterar horários da refeição?', `Confirmação: ${edicao.horarioLimite} → ${limite}. Término: ${edicao.horarioFim} → ${fim}. As respostas existentes serão mantidas. Um prazo futuro reabre as confirmações; alterar o término também muda o período de avaliação.`, [
        { text: 'Cancelar', style: 'cancel' }, { text: 'Salvar horários', onPress: publicar },
      ]);
    } else publicar();
  }
  async function publicar() {
    if (trava.current) return;
    trava.current = true; setOcupado(true); setErro(null);
    try {
      if (!dataValida(data) || data < hoje || [0, 6].includes(parseData(data).getDay())) throw new Error('Escolha um dia útil atual ou futuro.');
      if (!horarioValido(limite) || !horarioValido(fim) || limite >= fim) throw new Error('Confira os horários: a confirmação deve terminar antes do fim da refeição.');
      if (!idEdicao && existentes.length) throw new Error('Já existe uma refeição neste dia e turno. Edite ou exclua a refeição existente pelo cardápio.');
      if (idEdicao && !edicao) throw new Error('Recarregue a refeição antes de editar.');
      let alimento;
      if (modo === 'catalogo') {
        if (!pratoId) throw new Error('Escolha um prato do catálogo.');
        alimento = { pratoId };
      } else {
        const repetido = catalogo.dados.find(p => String(p.nome || '').trim().toLocaleLowerCase('pt-BR') === nome.trim().toLocaleLowerCase('pt-BR'));
        alimento = { prato: { nome, descricao, id: repetido?.id, revisaoEsperada: repetido?.revisao || 0 } };
      }
      const refeicao = await salvarRefeicao({ data, turno, ...alimento, horarioLimite: limite, horarioFim: fim, id: edicao?.id, revisaoEsperada: edicao?.revisao || 0 });
      setPublicada(refeicao);
    } catch (e) { setErro(e.message || 'Não foi possível salvar a refeição. Tente novamente.'); }
    finally { trava.current = false; setOcupado(false); }
  }

  const prazoPassou = dataValida(data) && horarioValido(limite) && agora >= instanteEscola(data, limite);
  const edicaoBloqueada = Boolean(idEdicao && edicao && !podeEditarRefeicao(edicao, agora));
  return <Pagina titulo={idEdicao ? 'Editar refeição do dia' : 'Cadastrar refeição do dia'} subtitulo={`${perfil.perfil?.escola || 'Sua escola'} · ${idEdicao ? 'Atualize o alimento, a descrição e os horários.' : 'Publique o alimento que aparecerá para os alunos do turno escolhido.'}`}>
    {fontes.some(f => f.carregando) ? <Carregando /> : fontes.some(f => f.erro) ? <AvisoCardapio mensagem={fontes.find(f => f.erro)?.erro} tentarNovamente={() => fontes.forEach(f => f.tentarNovamente())} /> : !habilitado ? <Text style={ui.erro}>Esta área é exclusiva da equipe.</Text> : publicada ? <View testID="refeicao-publicada" style={[ui.card, { backgroundColor: '#EDF5EE' }]}>
      <Text style={ui.secao}>{idEdicao ? 'Refeição atualizada' : 'Refeição publicada'}</Text>
      <Text style={ui.texto}>{publicada.nome} · {publicada.data.split('-').reverse().join('/')} · {TURNOS_ALUNO.find(t => t.id === publicada.turno)?.nome}</Text>
      <Botao testID="ver-cardapio-salvo" onPress={verCardapio}>Ver cardápio por turno</Botao>
    </View> : <>
      {idEdicao ? <View style={ui.card}><Text style={ui.selo}>{data.split('-').reverse().join('/')} · {TURNOS_ALUNO.find(t => t.id === turno)?.nome}</Text><Text style={ui.pequeno}>As alterações atualizam esta refeição. Outros cardápios já publicados conservam seus dados.</Text></View> : <>
        <Calendario label="Data da refeição" value={data} onChange={v => { if (!trava.current) { setData(v); setErro(null); } }} min={hoje} max={moverDia(hoje, 365)} somenteUteis />
        <Filtros label="Turno da refeição" opcoes={TURNOS_ALUNO.map(t => ({ ...t, disabled: ocupado }))} valor={turno} onChange={mudarTurno} />
      </>}
      {idEdicao && (!selecionada || !edicao) ? <View style={ui.card}><Text style={ui.texto}>Esta refeição não está mais disponível para edição. Volte ao cardápio e confira a lista atualizada.</Text></View> : !idEdicao && existentes.length ? <View style={ui.card}>
        <Text style={ui.secao}>Refeição já cadastrada neste turno</Text>
        {existentes.map(r => <CartaoRefeicao key={r.id} nome={r.nome}>
          <Text style={ui.label}>{r.nome}</Text>{r.descricao ? <Text style={ui.texto}>{r.descricao}</Text> : null}
          <Botao testID={`editar-existente-${r.id}`} secundario disabled={ocupado || !podeEditarRefeicao(r, agora)} onPress={() => navigation.navigate('RefeicaoDiaAdmin', { data: r.data, turno: r.turno, refeicaoId: r.id })}>Editar esta refeição</Botao>
        </CartaoRefeicao>)}
        <Text style={ui.pequeno}>Abra o cardápio para excluir a refeição ou escolha outro dia ou turno para cadastrar.</Text>
      </View> : <>
        {edicaoBloqueada ? <Text style={ui.erro}>Somente refeições de hoje ou de datas futuras podem ser editadas.</Text> : null}
        <Filtros label="Alimento ou refeição" valor={modo} onChange={v => { if (!trava.current) { setModo(v); setPratoId(''); setErro(null); } }} opcoes={[{ id: 'novo', nome: 'Digitar refeição', disabled: ocupado || edicaoBloqueada }, { id: 'catalogo', nome: 'Usar catálogo', disabled: ocupado || edicaoBloqueada }]} />
        {modo === 'novo' ? <View style={ui.card}>
          <Campo label="Alimento ou refeição do dia" testID="alimento-dia" value={nome} onChangeText={setNome} maxLength={100} editable={!ocupado && !edicaoBloqueada} placeholder="Arroz, feijão, frango e salada" ajuda="Descreva a refeição completa ou o alimento servido." />
          <Campo label="Descrição (opcional)" testID="descricao-dia" value={descricao} onChangeText={setDescricao} maxLength={300} editable={!ocupado && !edicaoBloqueada} multiline placeholder="Informações sobre o que será servido" />
          <Text style={ui.pequeno}>O alimento também será salvo no catálogo para reutilizar em outros dias.</Text>
        </View> : <View style={ui.card}>
          <Campo label="Buscar no catálogo" value={busca} onChangeText={setBusca} editable={!ocupado && !edicaoBloqueada} />
          <ListaPaginada prefixo="catalogo-dia" itens={pratos} chave={busca} tamanho={5} renderItem={p => <TouchableOpacity key={p.id} testID={`selecionar-prato-dia-${p.id}`} accessibilityRole="radio" accessibilityState={{ selected: pratoId === p.id }} disabled={ocupado || edicaoBloqueada} onPress={() => setPratoId(p.id)} style={[ui.card, pratoId === p.id && { borderColor: '#2F6B4F' }]}>
            <Text style={ui.label}>{pratoId === p.id ? '✓ ' : ''}{p.nome}</Text>{p.descricao ? <Text style={ui.pequeno}>{p.descricao}</Text> : null}
          </TouchableOpacity>} />
          {!pratos.length ? <Text style={ui.texto}>Nenhum alimento encontrado. Use Digitar refeição para cadastrar.</Text> : null}
        </View>}
        <View style={ui.card}>
          <Campo label="Confirmar presença até" testID="limite-dia" value={limite} onChangeText={setLimite} maxLength={5} placeholder="HH:MM" editable={!ocupado && !edicaoBloqueada} />
          <Campo label="Término da refeição" testID="fim-dia" value={fim} onChangeText={setFim} maxLength={5} placeholder="HH:MM" editable={!ocupado && !edicaoBloqueada} />
          <Text style={ui.pequeno}>Horários de Brasília. A avaliação fica disponível depois do término.</Text>
          {prazoPassou && !edicaoBloqueada ? <Text style={ui.erro}>O prazo informado já passou. Ajuste-o se os alunos ainda devem confirmar; com esse horário a confirmação ficará encerrada.</Text> : null}
        </View>
        {erro ? <Text accessibilityRole="alert" style={ui.erro}>{erro}</Text> : null}
        <Botao testID="publicar-refeicao-dia" carregando={ocupado} disabled={edicaoBloqueada} onPress={confirmarPublicacao}>{idEdicao ? 'Salvar alterações da refeição' : 'Publicar refeição para os alunos'}</Botao>
      </>}
      <Botao secundario disabled={ocupado} onPress={verCardapio}>Ver cardápio por turno</Botao>
    </>}
    <Botao secundario disabled={ocupado} onPress={() => navigation.goBack()}>Voltar</Botao>
  </Pagina>;
}