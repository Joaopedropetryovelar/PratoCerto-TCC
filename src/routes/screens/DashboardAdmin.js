import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Carregando, Falha, Filtros, Indicador, Pagina, ui } from '../../components/Interface';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { useAgora } from '../../hooks/useAgora';
import { dataDaEscola } from '../../domain/refeicoes';
import { kg, resumirProducao, TURNOS } from '../../domain/producao';
import { resumirAvaliacoes, resumirConfirmacoes } from '../../domain/planejamento';

export default function DashboardAdmin() {
  const hoje = dataDaEscola(useAgora()), perfil = usePerfil();
  const [turno, setTurno] = useState('todos');
  const filtros = [['data', '==', hoje]], habilitado = perfil.perfil?.tipoConta === 'admin';
  const pratos = useColecaoEscola('NomePratos', perfil.perfil, filtros, habilitado);
  const confirmacoes = useColecaoEscola('confirmacoes', perfil.perfil, filtros, habilitado);
  const avaliacoes = useColecaoEscola('feedbacks', perfil.perfil, filtros, habilitado);
  const producao = useColecaoEscola('producao', perfil.perfil, filtros, habilitado);
  const fontes = [perfil, pratos, confirmacoes, avaliacoes, producao];
  const noTurno = item => turno === 'todos' || item.turno === turno;
  const planejamento = resumirConfirmacoes(pratos.dados, confirmacoes.dados, turno);
  const resultado = resumirProducao(producao.dados.filter(noTurno));
  const satisfacao = resumirAvaliacoes(avaliacoes.dados.filter(noTurno));
  return <Pagina titulo="Visão geral" subtitulo={`${perfil.perfil?.escola || 'Sua escola'} · ${hoje.split('-').reverse().join('/')}`}>
    {fontes.some(f => f.carregando) ? <Carregando /> : fontes.some(f => f.erro) ? <Falha mensagem={fontes.find(f => f.erro)?.erro} tentarNovamente={() => fontes.forEach(f => f.tentarNovamente())} /> : <>
      <Filtros label="Turno" opcoes={TURNOS} valor={turno} onChange={setTurno} />
      <View style={ui.linha}>
        <Indicador label="Confirmadas" valor={planejamento.confirmados} />
        <Indicador label="Servidas" valor={resultado.registros ? resultado.servidos : '—'} />
        <Indicador label="Sobras" valor={resultado.registros ? `${kg(resultado.sobrasG)} kg` : '—'} />
        <Indicador label="Satisfação" valor={satisfacao.media === null ? '—' : `${satisfacao.media.toFixed(1).replace('.', ',')} / 5`} ajuda={`${satisfacao.notas} avaliações hoje.`} />
      </View>
      <View style={ui.card}>
        <Text style={ui.secao}>Refeições de hoje</Text>
        {!planejamento.pratos.length ? <Text style={ui.texto}>Nenhuma refeição publicada neste turno.</Text> : planejamento.pratos.map(prato => <View key={prato.id} style={{ gap: 5, paddingVertical: 8 }}>
          <Text style={ui.selo}>{TURNOS.find(t => t.id === prato.turno)?.nome}</Text>
          <Text style={ui.label}>{prato.nome}</Text>
          <Text style={ui.pequeno}>Confirmação até {prato.horarioLimite}</Text>
          <Text style={ui.pequeno}>{producao.dados.some(p => p.refeicaoId === prato.id) ? 'Produção registrada' : 'Produção ainda não registrada'}</Text>
        </View>)}
      </View>
      <Text style={ui.pequeno}>Abra o menu no canto superior para gerenciar cardápio, produção e os demais recursos.</Text>
    </>}
  </Pagina>;
}