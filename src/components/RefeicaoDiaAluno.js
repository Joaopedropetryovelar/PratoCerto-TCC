import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import CartaoRefeicao from './CartaoRefeicao';
import { Botao, Carregando, Falha, ui } from './Interface';
import { useDocumento } from '../hooks/useDados';
import { auth } from '../services/backend';
import { salvarConfirmacao } from '../services/aluno';
import { erroConfirmacao, idAvaliacao } from '../domain/refeicoes';
import { erroAvaliacao } from '../domain/calendario';
import { turnosDoPerfil, TURNOS_ALUNO } from '../domain/escolas';
export default function RefeicaoDiaAluno({ refeicao, perfil, agora, navigation }) {
  const uid = auth.currentUser?.uid;
  const resposta = useDocumento('confirmacoes', uid ? idAvaliacao(refeicao.id, uid) : null);
  const [salvando, setSalvando] = useState(false), [erro, setErro] = useState(null);
  const trava = useRef(false);
  const impedimento = erroConfirmacao(refeicao, turnosDoPerfil(perfil), agora);
  async function responder(vaiConsumir) {
    if (trava.current || impedimento || resposta.carregando || resposta.erro) return;
    trava.current = true; setSalvando(true); setErro(null);
    try { await salvarConfirmacao(refeicao.id, vaiConsumir); }
    catch (e) { setErro(e.message || 'Não foi possível salvar sua resposta. Tente novamente.'); }
    finally { trava.current = false; setSalvando(false); }
  }
  return <CartaoRefeicao nome={refeicao.nome}>
    <Text style={ui.selo}>{TURNOS_ALUNO.find(t => t.id === refeicao.turno)?.nome} · Hoje, {refeicao.data.split('-').reverse().join('/')}</Text>
    <Text style={ui.secao}>{refeicao.nome}</Text>
    {refeicao.descricao ? <Text style={ui.texto}>{refeicao.descricao}</Text> : null}
    <Text style={ui.pequeno}>Confirmação até {refeicao.horarioLimite} · Término {refeicao.horarioFim}</Text>
    {resposta.carregando ? <Carregando /> : resposta.erro ? <Falha mensagem={resposta.erro} tentarNovamente={resposta.tentarNovamente} /> : <>
      {salvando ? <Text style={ui.texto} accessibilityLiveRegion="polite">Salvando sua resposta…</Text> : typeof resposta.dados?.vaiConsumir === 'boolean' ? <View testID={`resposta-hoje-${refeicao.id}`} style={[ui.card, { backgroundColor: '#EDF5EE' }]}><Text style={ui.label} accessibilityLiveRegion="polite">{resposta.dados.vaiConsumir ? 'Presença na refeição confirmada' : 'Você informou que não vai comer'}</Text><Text style={ui.pequeno}>Sua resposta está salva.</Text></View> : <Text style={ui.texto}>Você vai participar desta refeição?</Text>}
      {impedimento ? <Text style={ui.pequeno}>{impedimento}</Text> : <Text style={ui.pequeno}>Você pode alterar sua resposta até o horário limite.</Text>}
      <View style={ui.linha}>
        <Botao testID={`confirmar-${refeicao.id}`} selecionado={!salvando && resposta.dados?.vaiConsumir === true} disabled={Boolean(impedimento) || salvando} onPress={() => responder(true)}>Vou comer</Botao>
        <Botao testID={`recusar-${refeicao.id}`} secundario selecionado={!salvando && resposta.dados?.vaiConsumir === false} disabled={Boolean(impedimento) || salvando} onPress={() => responder(false)}>Não vou comer</Botao>
      </View>
      {erro ? <Text style={ui.erro} accessibilityRole="alert">{erro}</Text> : null}
    </>}
    {!erroAvaliacao(refeicao, agora) ? <Botao secundario onPress={() => navigation.navigate('Feedback', { refeicao })}>Avaliar esta refeição</Botao> : null}
  </CartaoRefeicao>;
}
