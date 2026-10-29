import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Botao, Campo, Carregando, Falha, Filtros, Indicador, Pagina, ui } from '../../components/Interface';
import Calendario from '../../components/Calendario';
import ListaPaginada from '../../components/ListaPaginada';
import CartaoRefeicao from '../../components/CartaoRefeicao';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { useAgora } from '../../hooks/useAgora';
import { formatarDataCalendario } from '../../domain/calendario';
import { dataValida } from '../../domain/refeicoes';
import { dataDaEscola } from '../../domain/refeicoes';
import { TURNOS } from '../../domain/producao';
import { resumirAvaliacoes } from '../../domain/planejamento';
export default function TelaDeFeedbackAdmin() {
  const hoje = dataDaEscola(useAgora());
  const [dataEscolhida, setData] = useState(null), [turno, setTurno] = useState('todos');
  const data = dataValida(dataEscolhida) && dataEscolhida <= hoje ? dataEscolhida : hoje;
  const [busca, setBusca] = useState(''), [nota, setNota] = useState('todos'), [tipo, setTipo] = useState('todos');
  const perfil = usePerfil();
  const feedbacks = useColecaoEscola('feedbacks', perfil.perfil, [['data', '==', data]], perfil.perfil?.tipoConta === 'admin');
  const resumo = resumirAvaliacoes(feedbacks.dados.filter(f => turno === 'todos' || f.turno === turno));
  const normalizar = texto => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filtrados = resumo.lista.filter(f => (nota === 'todos' || f.nota === nota)
    && (tipo === 'todos' || Boolean(f.comentario?.trim()))
    && normalizar([f.refeicaoNome, f.comentario, ...(Array.isArray(f.etiquetas) ? f.etiquetas : [])].join(' ')).includes(normalizar(busca)))
    .sort((a, b) => (b.dataResposta?.seconds || 0) - (a.dataResposta?.seconds || 0) || String(a.alunoNome || '').localeCompare(String(b.alunoNome || '')));
  return <Pagina titulo="Avaliações dos alunos" subtitulo={`${perfil.perfil?.escola || 'Prato Certo'} · Ouça os alunos sem perder o que importa.`}>
    <View style={ui.card}><Calendario label="Dia da refeição" value={data} onChange={setData} max={hoje} /><Botao secundario disabled={data === hoje} onPress={() => setData(null)}>Voltar para hoje</Botao><Text style={ui.pequeno}>Avaliações das refeições de {formatarDataCalendario(data)}. A data corresponde ao dia em que a refeição foi servida.</Text><Filtros label="Turno" opcoes={TURNOS} valor={turno} onChange={setTurno} /></View>
    {perfil.carregando || feedbacks.carregando ? <Carregando /> : perfil.erro || feedbacks.erro ? <Falha tentarNovamente={() => { perfil.tentarNovamente(); feedbacks.tentarNovamente(); }} /> : perfil.perfil?.tipoConta !== 'admin' ? <Falha mensagem="Esta área é exclusiva da equipe." tentarNovamente={perfil.tentarNovamente} /> : <>
      <View style={ui.linha}><Indicador label="Avaliações recebidas" valor={resumo.lista.length} ajuda="No dia e turno selecionados." /><Indicador label="Nota média" valor={resumo.media === null ? '—' : `${resumo.media.toFixed(1).replace('.', ',')} / 5`} ajuda="Todas as notas desta seleção." /></View>
      <View style={ui.card}><Text style={ui.secao}>Explore as respostas</Text><Campo label="Buscar avaliação" testID="buscar-avaliacao" value={busca} onChangeText={setBusca} placeholder="Prato ou comentário" />
        <Filtros label="Nota" opcoes={[{ id: 'todos', nome: 'Todas' }, ...[5,4,3,2,1].map(id => ({ id, nome: `${id} / 5` }))]} valor={nota} onChange={setNota} />
        <Filtros label="Conteúdo" opcoes={[{id:'todos',nome:'Todas as respostas'},{id:'comentarios',nome:'Com comentário'}]} valor={tipo} onChange={setTipo} />
      </View>
      <Text style={ui.secao}>Respostas · {filtrados.length}</Text>
      {!filtrados.length ? <View style={ui.card}><Text style={ui.secao}>Nenhuma avaliação nesta seleção</Text><Text style={ui.texto}>Altere os filtros ou escolha outro dia.</Text></View> : <ListaPaginada prefixo="avaliacoes" itens={filtrados} tamanho={6} chave={`${data}|${turno}|${nota}|${tipo}|${busca}`} renderItem={f => <CartaoRefeicao key={f.id || `${f.refeicaoId}_${f.alunoId}`} nome={f.refeicaoNome}>
        <View style={[ui.linha, {justifyContent:'space-between',alignItems:'center'}]}><Text style={ui.selo}>{TURNOS.find(t => t.id === f.turno)?.nome}</Text><Text style={ui.secao}>{Number.isFinite(f.nota) ? `${f.nota} / 5` : 'Sem nota'}</Text></View>
        <Text style={ui.label}>{f.refeicaoNome || 'Refeição'}</Text>{f.comentario ? <Text style={ui.texto}>{f.comentario}</Text> : <Text style={ui.pequeno}>Sem comentário escrito.</Text>}
        {Array.isArray(f.etiquetas) && f.etiquetas.length ? <Text style={ui.pequeno}>{f.etiquetas.join(' · ')}</Text> : null}
      </CartaoRefeicao>} />}
    </>}
  </Pagina>;
}