import Icone from '../../components/Icone';
import CartaoRefeicao from '../../components/CartaoRefeicao';
import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Alert } from '../../components/Alerta';
import { Botao, Filtros, Carregando, Falha, Pagina, ui } from '../../components/Interface';
import { useDocumento } from '../../hooks/useDados';
import { useRefeicaoAluno } from '../../hooks/useRefeicaoAluno';
import { auth } from '../../services/backend';
import { useAgora } from '../../hooks/useAgora';
import { salvarConfirmacao } from '../../services/aluno';
import { turnosDoPerfil, podeConsumir } from '../../domain/escolas';
import { erroAvaliacao } from '../../domain/calendario';
import { erroConfirmacao, idAvaliacao } from '../../domain/refeicoes';

export default function TelaDeConfirmacao({ navigation, route }) {
  const agora = useAgora();
  const [escolhida, setEscolhida] = useState(null);
  useEffect(() => setEscolhida(null), [route?.params?.refeicao?.id]);
  const contexto = useRefeicaoAluno(escolhida || route?.params?.refeicao?.id);
  useEffect(() => { if (!escolhida && !route?.params?.refeicao?.id && !contexto.carregando && contexto.refeicao) setEscolhida(contexto.refeicao.id); }, [escolhida, route?.params?.refeicao?.id, contexto.carregando, contexto.refeicao?.id]);
  const { refeicao, perfil } = contexto;
  const uid = auth.currentUser?.uid;
  const resposta = useDocumento('confirmacoes', refeicao?.id && uid ? idAvaliacao(refeicao.id, uid) : null);
  const [salvando, setSalvando] = useState(false);
  const bloqueio = useRef(false);
  const impedimento = refeicao ? erroConfirmacao(refeicao, turnosDoPerfil(perfil), agora) : null;
  async function salvar(vaiConsumir) {
    if (bloqueio.current || !refeicao) return;
    bloqueio.current = true; setSalvando(true);
    try {
      await salvarConfirmacao(refeicao.id, vaiConsumir);
      Alert.alert('Resposta registrada', vaiConsumir ? 'Sua refeição foi confirmada.' : 'Você informou que não vai consumir esta refeição.');
    } catch (erro) { Alert.alert('Não foi possível confirmar', erro.message); }
    finally { bloqueio.current = false; setSalvando(false); }
  }
  return <Pagina titulo="Confirmar refeição" subtitulo="Ajude a cozinha a preparar a quantidade necessária.">
    {contexto.carregando || resposta.carregando ? <Carregando /> : contexto.erro || resposta.erro ? <Falha mensagem={contexto.erro || resposta.erro} tentarNovamente={() => { contexto.tentarNovamente(); resposta.tentarNovamente(); }} /> : !refeicao || refeicao.ativo === false || !podeConsumir(refeicao, perfil) ? <View style={ui.card}><Text style={ui.secao}>Nenhuma refeição disponível</Text><Text style={ui.texto}>Abra uma refeição no cardápio ou aguarde a publicação da equipe.</Text><Botao secundario onPress={() => navigation.navigate('HomeAluno', {screen:'Cardapio'})}>Ver cardápio</Botao></View> : <>
      <Filtros label="Refeição" opcoes={contexto.refeicoes.map(r => ({id:r.id,nome:`${r.data.split('-').reverse().join('/')} · ${r.turno}`}))} valor={refeicao.id} onChange={setEscolhida} />
      <CartaoRefeicao nome={refeicao.nome}><Text style={ui.selo}>{refeicao.data?.split('-').reverse().join('/')} · {refeicao.tipo || 'Refeição'}</Text><Text style={ui.secao}>{refeicao.nome}</Text>{refeicao.descricao ? <Text style={ui.texto}>{refeicao.descricao}</Text> : null}<Text style={ui.texto}>Você vai consumir esta refeição?</Text></CartaoRefeicao>
      <View style={[ui.card, impedimento && ui.aviso]}><Text style={ui.texto}>{impedimento || `Responda até ${refeicao.horarioLimite}. Você pode alterar a resposta até esse prazo.`}</Text></View>
      {typeof resposta.dados?.vaiConsumir === 'boolean' ? <View testID="resposta-salva" accessibilityLiveRegion="polite" style={[ui.card, { backgroundColor: resposta.dados.vaiConsumir ? '#E8F3EC' : '#EFF1F5', borderColor: '#86AB97' }]}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><Icone nome="confirmar" tamanho={26}/><Text style={[ui.secao,{flex:1}]}>{resposta.dados.vaiConsumir ? 'Refeição confirmada' : 'Você não vai consumir'}</Text></View><Text style={ui.texto}>Sua escolha está salva para esta refeição.</Text></View> : null}
      <Botao testID="confirmar-sim" selecionado={resposta.dados?.vaiConsumir === true} onPress={() => salvar(true)} disabled={Boolean(impedimento) || salvando}>{resposta.dados?.vaiConsumir === true ? 'Vou comer · selecionado' : 'Vou comer'}</Botao>
      <Botao testID="confirmar-nao" selecionado={resposta.dados?.vaiConsumir === false} secundario onPress={() => salvar(false)} disabled={Boolean(impedimento) || salvando}>{resposta.dados?.vaiConsumir === false ? 'Não vou comer · selecionado' : 'Não vou comer'}</Botao>
      {salvando ? <Carregando /> : null}
      {!erroAvaliacao(refeicao, agora) ? <Botao secundario onPress={() => navigation.navigate('HomeAluno', {screen:'Feedback',params:{refeicao}})}>Avaliar esta refeição</Botao> : <Text style={ui.pequeno}>{erroAvaliacao(refeicao, agora)}</Text>}
    </>}
    <Botao secundario onPress={() => navigation.goBack()}>Voltar ao cardápio</Botao>
  </Pagina>;
}