import React from 'react';
import { Text, View } from 'react-native';
import { Botao, Carregando, Falha, Pagina, ui } from '../../components/Interface';
import ListaPaginada from '../../components/ListaPaginada';
import RefeicaoDiaAluno from '../../components/RefeicaoDiaAluno';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { useAgora } from '../../hooks/useAgora';
import { auth } from '../../services/backend';
import { dataDaEscola } from '../../domain/refeicoes';
import { moverDia } from '../../domain/calendario';
import { podeConsumir, TURNOS_ALUNO } from '../../domain/escolas';

export default function TelaMinhasRefeicoes({ navigation }) {
  const perfil = usePerfil(), agora = useAgora(), hoje = dataDaEscola(agora);
  const refeicoes = useColecaoEscola('NomePratos', perfil.perfil, [['data', '==', hoje]]);
  // Nunca consulta respostas de outros alunos. Janela de 31 dias permite o fallback por dia.
  const respostas = useColecaoEscola('confirmacoes', perfil.perfil, [['alunoId', '==', auth.currentUser?.uid || ''], ['data', '>=', moverDia(hoje, -30)], ['data', '<=', hoje]], Boolean(auth.currentUser?.uid));
  const deHoje = refeicoes.dados.filter(r => r.ativo !== false && podeConsumir(r, perfil.perfil)).sort((a, b) => (a.horarioFim || '').localeCompare(b.horarioFim || ''));
  const historico = respostas.dados.filter(r => r.data < hoje).sort((a, b) => b.data.localeCompare(a.data) || a.id.localeCompare(b.id));
  return <Pagina titulo="Minhas refeições" subtitulo="Confirme sua participação e consulte suas respostas recentes.">
    {perfil.carregando ? <Carregando /> : perfil.erro ? <Falha mensagem={perfil.erro} tentarNovamente={perfil.tentarNovamente} /> : <>
      <Text style={ui.secao}>Hoje</Text>
      {refeicoes.carregando ? <Carregando /> : refeicoes.erro ? <Falha mensagem={refeicoes.erro} tentarNovamente={refeicoes.tentarNovamente} /> : deHoje.length ? deHoje.map(r => <RefeicaoDiaAluno key={r.id} refeicao={r} perfil={perfil.perfil} agora={agora} navigation={navigation} />) : <View style={ui.card}><Text style={ui.texto}>Nenhuma refeição publicada para seus turnos hoje.</Text><Botao secundario onPress={() => navigation.navigate('Cardapio')}>Ver cardápio</Botao></View>}
      <Text style={ui.secao}>Histórico dos últimos 30 dias</Text>
      {respostas.carregando ? <Carregando /> : respostas.erro ? <Falha mensagem={respostas.erro} tentarNovamente={respostas.tentarNovamente} /> : historico.length ? <ListaPaginada itens={historico} chave={hoje} prefixo="historico-refeicoes" renderItem={r => <View key={r.id} style={ui.card}><Text style={ui.selo}>{r.data.split('-').reverse().join('/')} · {TURNOS_ALUNO.find(t => t.id === r.turno)?.nome || r.turno}</Text><Text style={ui.secao}>{r.refeicaoNome || 'Refeição'}</Text><Text style={ui.texto}>{r.vaiConsumir ? 'Você confirmou que iria comer' : 'Você informou que não iria comer'}</Text></View>} /> : <Text style={ui.texto}>Suas respostas dos dias anteriores aparecerão aqui.</Text>}
    </>}
  </Pagina>;
}