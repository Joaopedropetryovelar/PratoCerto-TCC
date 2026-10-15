import React, { useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { Alert } from '../../components/Alerta';
import { Botao, Campo, Carregando, Falha, Filtros, Indicador, Pagina, ui } from '../../components/Interface';
import GraficoSerie from '../../components/GraficoSerie';
import Calendario from '../../components/Calendario';
import ListaPaginada from '../../components/ListaPaginada';
import CartaoRefeicao from '../../components/CartaoRefeicao';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { agoraAplicativo } from '../../services/relogio';
import { exportarProducao, exportarPdf } from '../../services/exportar';
import { agruparPorDia, dataValida, filtrarPeriodo, kg, periodoDias, registroValido, resumirProducao, TURNOS } from '../../domain/producao';

function DiaResultado({ dia, registros }) {
  const [aberto, setAberto] = useState(false);
  return <View style={ui.card}><Text style={ui.secao}>{dia.data.split('-').reverse().join('/')}</Text><Text style={ui.texto}>{dia.servidos} refeições servidas · {kg(dia.sobrasG, 2)} kg de sobra · {dia.registros} registros</Text>
    <Botao secundario onPress={() => setAberto(!aberto)}>{aberto ? 'Fechar detalhes do dia' : 'Ver detalhes do dia'}</Botao>
    {aberto ? registros.map(r => <CartaoRefeicao key={r.id} nome={r.refeicaoNome} style={{padding:16}}><Text style={ui.selo}>{TURNOS.find(t => t.id === r.turno)?.nome}</Text><Text style={ui.label}>{r.refeicaoNome}</Text><Text style={ui.texto}>{r.servidos} refeições servidas</Text>
      {r.schemaVersion === 2 ? <Text style={ui.texto}>Sobra: {kg(r.sobraTotalG)} kg · registro rápido</Text> : <><Text style={ui.texto}>Preparado: {kg(r.preparadoG)} kg · Sobra limpa: {kg(r.sobraLimpaG)} kg</Text><Text style={ui.texto}>Sobra descartada: {kg(r.sobraDescartadaG)} kg · Restos: {kg(r.restosG)} kg</Text></>}
      {r.observacao ? <Text style={ui.pequeno}>{r.observacao}</Text> : null}</CartaoRefeicao>) : null}
  </View>;
}
export default function TelaRelatorios() {
  const inicial = periodoDias(7, agoraAplicativo());
  const [periodo, setPeriodo] = useState(inicial), [inicio, setInicio] = useState(inicial.inicio), [fim, setFim] = useState(inicial.fim);
  const [turno, setTurno] = useState('todos'), [erroPeriodo, setErroPeriodo] = useState(null), [exportando, setExportando] = useState(null);
  const [editarPeriodo, setEditarPeriodo] = useState(false), [grafico, setGrafico] = useState('servidos'), [detalhes, setDetalhes] = useState(false), [busca, setBusca] = useState('');
  const bloqueioExportacao = useRef(false), perfil = usePerfil();
  const producao = useColecaoEscola('producao', perfil.perfil, [['data', '>=', periodo.inicio], ['data', '<=', periodo.fim]], perfil.perfil?.tipoConta === 'admin');
  const registros = filtrarPeriodo(producao.dados.filter(r => r.escola === perfil.perfil?.escola), periodo.inicio, periodo.fim, turno);
  const resumo = resumirProducao(registros);
  const validos = registros.filter(registroValido).sort((a,b) => b.data.localeCompare(a.data) || a.turno.localeCompare(b.turno));
  const normalizar = texto => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const encontrados = validos.filter(r => normalizar(`${r.refeicaoNome} ${r.observacao || ''}`).includes(normalizar(busca)));
  const dias = agruparPorDia(encontrados).reverse();
  function aplicar() {
    if (!dataValida(inicio) || !dataValida(fim) || inicio > fim || fim > periodoDias(1, agoraAplicativo()).fim) { setErroPeriodo('Escolha um período com início até o fim e sem datas futuras.'); return; }
    setErroPeriodo(null); setPeriodo({inicio,fim}); setEditarPeriodo(false);
  }
  async function exportar(formato = 'csv') {
    if (bloqueioExportacao.current || !validos.length || producao.erro || producao.carregando) return;
    bloqueioExportacao.current = true; setExportando(formato);
    try {
      if (formato === 'pdf') await exportarPdf(validos, { ...periodo, escola: perfil.perfil.escola, turno, demo: false });
      else await exportarProducao(validos, periodo.inicio, periodo.fim);
    } catch { Alert.alert('Falha na exportação', 'Não foi possível gerar ou compartilhar o relatório. Tente novamente.'); }
    finally { bloqueioExportacao.current = false; setExportando(null); }
  }
  return <Pagina titulo="Relatórios" subtitulo="Um resumo claro do que foi servido e do que sobrou.">
    <View style={ui.card}><Text style={ui.selo}>{perfil.perfil?.escola || 'Prato Certo'} · {periodo.inicio.split('-').reverse().join('/')} a {periodo.fim.split('-').reverse().join('/')}</Text>
      <Filtros label="Período" opcoes={[{id:7,nome:'Últimos 7 dias'},{id:30,nome:'Últimos 30 dias'}]} valor={null} onChange={dias => {const p=periodoDias(dias,agoraAplicativo());setInicio(p.inicio);setFim(p.fim);setPeriodo(p);setErroPeriodo(null);setEditarPeriodo(false);}} />
      <Botao secundario testID="alterar-periodo" onPress={() => setEditarPeriodo(!editarPeriodo)}>{editarPeriodo ? 'Fechar calendário' : 'Escolher outro período'}</Botao>
      {editarPeriodo ? <><Calendario label="Início do período" value={inicio} onChange={setInicio} max={fim} /><Calendario label="Fim do período" value={fim} onChange={setFim} min={inicio} max={periodoDias(1,agoraAplicativo()).fim} />{erroPeriodo ? <Text style={ui.erro} accessibilityRole="alert">{erroPeriodo}</Text> : null}<Botao secundario onPress={aplicar}>Aplicar período</Botao></> : null}
      <Filtros label="Turno" opcoes={TURNOS} valor={turno} onChange={setTurno} />
    </View>
    {perfil.carregando || producao.carregando ? <Carregando /> : perfil.erro || producao.erro ? <Falha tentarNovamente={() => { perfil.tentarNovamente(); producao.tentarNovamente(); }} /> : perfil.perfil?.tipoConta !== 'admin' ? <Falha mensagem="Esta área é exclusiva da equipe." tentarNovamente={perfil.tentarNovamente} /> : <>
      <View style={ui.linha}><Indicador label="Refeições servidas" valor={resumo.registros ? resumo.servidos : '—'} ajuda={`${resumo.registros} registros no período.`} /><Indicador label="Sobra de alimentos" valor={resumo.registros ? `${kg(resumo.sobrasG, 2)} kg` : '—'} ajuda="Alimento que ficou sem servir." /></View>
      <View style={ui.linha}><Indicador label="Descarte total" valor={resumo.medidos ? `${kg(resumo.descarteG, 2)} kg` : '—'} ajuda={`Medido em ${resumo.medidos} de ${resumo.registros} registros.`} /><Indicador label="Taxa de descarte" valor={resumo.percentualDescarte === null ? '—' : `${resumo.percentualDescarte.toFixed(1).replace('.', ',')}%`} ajuda="Calculada apenas nas pesagens detalhadas." /></View>
      {resumo.rapidos ? <Text style={ui.pequeno}>{resumo.rapidos} registros rápidos informam servidas e sobra. Descarte não medido fica sem valor, em vez de ser contado como zero.</Text> : null}
      {resumo.ignorados ? <View style={[ui.card, ui.aviso]}><Text style={ui.texto}>{resumo.ignorados} registro(s) inválido(s) foram excluídos dos indicadores e da exportação. Confira em Produção.</Text></View> : null}
      <Filtros label="Gráfico" opcoes={[{id:'servidos',nome:'Refeições servidas por dia'},{id:'sobrasG',nome:'Sobras por dia'},{id:'descarteG',nome:'Descarte por dia'}]} valor={grafico} onChange={setGrafico} />
      <GraficoSerie registros={grafico === 'descarteG' ? validos.filter(r => r.schemaVersion !== 2) : validos} campo={grafico} titulo={grafico === 'servidos' ? 'Refeições servidas por dia' : grafico === 'sobrasG' ? 'Sobras por dia' : 'Descarte por dia'} unidade={grafico === 'servidos' ? 'ref.' : 'kg'} />
      <View style={ui.card}><Text style={ui.secao}>Leve o relatório com você</Text><Text style={ui.texto}>O arquivo inclui todos os registros do período e turno selecionados, mesmo os que estão em outras páginas.</Text><Botao testID="exportar-pdf" onPress={() => exportar('pdf')} disabled={!validos.length || Boolean(exportando)} carregando={exportando === 'pdf'}>{Platform.OS === 'web' ? 'Baixar relatório PDF' : 'Compartilhar relatório PDF'}</Botao><Botao secundario testID="exportar" onPress={() => exportar('csv')} disabled={!validos.length || Boolean(exportando)} carregando={exportando === 'csv'}>{Platform.OS === 'web' ? 'Baixar dados CSV' : 'Compartilhar arquivo CSV'}</Botao></View>
      <View style={ui.card}><Text style={ui.secao}>Registros do período</Text><Text style={ui.texto}>{validos.length} registros · {agruparPorDia(validos).length} dias. Consulte cinco dias por página.</Text><Botao secundario testID="ver-registros" onPress={() => setDetalhes(!detalhes)}>{detalhes ? 'Fechar registros' : 'Consultar registros'}</Botao></View>
      {detalhes ? <><Campo label="Buscar nos registros" testID="buscar-registros" value={busca} onChangeText={setBusca} placeholder="Nome do prato ou observação" ajuda="A busca afeta esta lista; os indicadores e arquivos mantêm o período completo." />{!dias.length ? <View style={ui.card}><Text style={ui.secao}>Nenhum registro encontrado</Text><Text style={ui.texto}>Altere a busca ou selecione outro período.</Text></View> : <ListaPaginada prefixo="registros" itens={dias} chave={`${periodo.inicio}|${periodo.fim}|${turno}|${busca}`} tamanho={5} renderItem={dia => <DiaResultado key={dia.data} dia={dia} registros={encontrados.filter(r => r.data === dia.data)} />} />}</> : null}
      <Text style={ui.pequeno}>Sobra não significa descarte. A taxa de descarte usa sobra descartada e restos dos pratos em relação ao alimento preparado, somente em registros detalhados. Dias sem registro não entram como zero.</Text>
    </>}
  </Pagina>;
}
