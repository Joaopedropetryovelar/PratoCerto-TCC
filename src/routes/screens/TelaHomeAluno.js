import React, { useState } from 'react';
import { Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import Icone from '../../components/Icone';
import PratoIlustrado from '../../components/PratoIlustrado';
import { Botao, Carregando, Falha, ui } from '../../components/Interface';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { useAgora } from '../../hooks/useAgora';
import { dataDaEscola, horarioValido, instanteEscola } from '../../domain/refeicoes';
import { moverDia } from '../../domain/calendario';
import { podeConsumir, turnosDoPerfil, TURNOS_ALUNO } from '../../domain/escolas';

export function proximaRefeicao(refeicoes, perfil, agora) {
  const hoje = dataDaEscola(agora);
  return refeicoes.filter(r => {
    if (r.ativo === false || !podeConsumir(r, perfil) || r.data < hoje || !horarioValido(r.horarioFim)) return false;
    try { return instanteEscola(r.data, r.horarioFim) > agora; } catch { return false; }
  }).sort((a, b) => a.data.localeCompare(b.data) || a.horarioFim.localeCompare(b.horarioFim) || a.id.localeCompare(b.id))[0] || null;
}

export default function TelaHomeAluno({ navigation }) {
  const focada = useIsFocused();
  const perfil = usePerfil(), agora = useAgora(), hoje = dataDaEscola(agora);
  const { width, fontScale = 1 } = useWindowDimensions();
  const lista = useColecaoEscola('NomePratos', perfil.perfil, [['data', '>=', hoje], ['data', '<=', moverDia(hoje, 14)]]);
  const [painel, setPainel] = useState(null);
  const dados = perfil.perfil;
  const proxima = proximaRefeicao(lista.dados, dados, agora);
  const carregando = perfil.carregando || lista.carregando;
  const erro = perfil.erro || lista.erro;
  const turnos = turnosDoPerfil(dados).map(t => TURNOS_ALUNO.find(item => item.id === t)?.nome).join(' e ');
  const compacta = width < 360 || fontScale > 1.2;
  const dataProxima = proxima?.data === hoje ? 'Hoje' : proxima?.data?.split('-').reverse().join('/');
  const servicos = [
    { id: 'cardapio', icone: 'calendario', nome: 'Cardápio', abrir: () => navigation.navigate('Cardapio') },
    { id: 'refeicoes', icone: 'cardapio', nome: 'Minhas refeições', abrir: () => navigation.navigate('MinhasRefeicoes') },
    { id: 'matricula', icone: 'matriculas', nome: 'Matrícula', abrir: () => setPainel('matricula') },
    { id: 'feedback', icone: 'feedback', nome: 'Feedback', abrir: () => navigation.navigate('Feedback') },
  ];
  return <View style={s.pagina}>
    {focada ? <StatusBar barStyle="light-content" /> : null}
    <ScrollView contentContainerStyle={s.rolagem} keyboardShouldPersistTaps="handled">
      <SafeAreaView edges={['top', 'left', 'right']} style={s.cabecalho}>
        <View style={s.limite}>
          <View style={s.linha}>
            <View style={s.marca}><Icone nome="folha" cor="#FFFFFF" tamanho={32} /><Text style={s.nomeApp}>PratoCerto</Text></View>
            <TouchableOpacity testID="avisos-aluno" accessibilityRole="button" accessibilityLabel="Ver avisos do dia" style={s.botaoIcone} onPress={() => setPainel('avisos')}><Icone nome="sino" cor="#FFFFFF" /></TouchableOpacity>
          </View>
          <View style={[s.linha, { marginTop: 14 }]}>
            <View style={{ flex: 1, gap: 5 }}><Text accessibilityRole="header" style={s.saudacao}>Olá, {dados?.nome?.trim().split(/\s+/)[0] || 'aluno'}!</Text><Text style={s.boasVindas}>Que bom te ver por aqui!</Text></View>
            <TouchableOpacity testID="perfil-inicio" accessibilityRole="button" accessibilityLabel="Abrir meu perfil" style={s.avatar} onPress={() => navigation.navigate('PerfilAluno')}><Icone nome="perfil" cor="#FFFFFF" tamanho={27} /></TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
      <View style={s.conteudo}>
        <TouchableOpacity testID="banner-cardapio" accessibilityRole="button" accessibilityLabel="Conferir o cardápio" onPress={() => navigation.navigate('Cardapio')} activeOpacity={0.85} style={s.banner}>
          <View style={s.textoBanner}><Text style={[s.tituloBanner, compacta && { fontSize: 20, lineHeight: 26 }]}>Alimentação de qualidade para o seu dia!</Text><View style={s.chamada}><Text style={s.chamadaTexto}>Confira o cardápio</Text><Icone nome="seta" tamanho={19} cor="#FFFFFF" /></View></View>
          <View style={s.prato}><PratoIlustrado tamanho={compacta ? 126 : 158} /></View>
        </TouchableOpacity>
        <Text accessibilityRole="header" style={s.secao}>Seu dia</Text>
        {carregando ? <Carregando /> : erro ? <Falha mensagem={erro} tentarNovamente={() => { perfil.tentarNovamente(); lista.tentarNovamente(); }} /> : proxima ? <TouchableOpacity testID="proxima-refeicao" accessibilityRole="button" accessibilityLabel={`Ver próxima refeição: ${proxima.nome}, ${dataProxima}`} style={s.resumo} onPress={() => navigation.navigate('Confirmacao', { refeicao: { id: proxima.id } })}>
          <View style={s.fundoIcone}><Icone nome="calendario" tamanho={29} /></View>
          <View style={s.detalhes}><Text style={s.legenda}>Próxima refeição · {dataProxima}</Text><Text style={s.refeicao}>{proxima.tipo || 'Refeição'} · {TURNOS_ALUNO.find(t => t.id === proxima.turno)?.nome}</Text><Text style={s.auxiliar}>{proxima.nome}</Text><Text style={s.auxiliar}>Confirmar até {proxima.horarioLimite} · Término {proxima.horarioFim}</Text></View>
          <Icone nome="seta" tamanho={19} />
        </TouchableOpacity> : <View testID="sem-proxima-refeicao" style={s.resumo}><View style={s.fundoIcone}><Icone nome="calendario" tamanho={29} /></View><View style={s.detalhes}><Text style={s.refeicao}>Nenhuma próxima refeição</Text><Text style={s.auxiliar}>O cardápio dos seus turnos aparecerá quando a escola publicar.</Text></View></View>}
        <Text accessibilityRole="header" style={s.secao}>Serviços rápidos</Text>
        <View style={s.servicos}>{servicos.map(item => <TouchableOpacity key={item.id} testID={`servico-${item.id}`} accessibilityRole="button" accessibilityLabel={item.nome} style={[s.servico, compacta && s.servicoCompacto]} onPress={item.abrir}>
          <View style={s.fundoServico}><Icone nome={item.icone} tamanho={26} /></View><Text style={s.nomeServico}>{item.nome}</Text>
        </TouchableOpacity>)}</View>
      </View>
    </ScrollView>
    <Modal visible={Boolean(painel)} transparent animationType="fade" onRequestClose={() => setPainel(null)}>
      <View style={s.sombra}><SafeAreaView style={s.modalSeguro}><ScrollView contentContainerStyle={s.modal}>
        <Text accessibilityRole="header" style={ui.secao}>{painel === 'matricula' ? 'Minha matrícula' : 'Avisos do dia'}</Text>
        {painel === 'matricula' ? <><Text style={ui.texto}>Matrícula: {dados?.matricula || 'Não informada'}</Text><Text style={ui.texto}>Escola: {dados?.escola || 'Não informada'}</Text><Text style={ui.texto}>Turma: {dados?.turma || 'Não informada'}</Text><Text style={ui.texto}>Turnos: {turnos || 'Não informados'}</Text><Botao secundario onPress={() => { setPainel(null); navigation.navigate('PerfilAluno'); }}>Ver opções do perfil</Botao></> : carregando ? <Text style={ui.texto}>Carregando o cardápio…</Text> : erro ? <Text style={ui.erro}>Não foi possível consultar os avisos. Feche esta janela e tente carregar os dados novamente.</Text> : <><Text style={ui.texto}>{proxima ? `${proxima.nome}: confirmação até ${proxima.horarioLimite} em ${dataProxima}.` : 'Ainda não há uma próxima refeição publicada para seus turnos.'}</Text><Text style={ui.pequeno}>As avaliações ficam disponíveis após o término de cada refeição.</Text><Botao secundario onPress={() => { setPainel(null); navigation.navigate('Cardapio'); }}>Consultar cardápio</Botao></>}
        <Botao testID="fechar-painel-aluno" onPress={() => setPainel(null)}>Fechar</Botao>
      </ScrollView></SafeAreaView></View>
    </Modal>
  </View>;
}

const s = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: '#F6F9F7' }, rolagem: { paddingBottom: 24 },
  cabecalho: { backgroundColor: '#075E43', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingHorizontal: 20, paddingBottom: 24 },
  limite: { width: '100%', maxWidth: 560, alignSelf: 'center' }, linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 9 }, nomeApp: { fontSize: 23, fontWeight: '800', color: '#FFFFFF' },
  botaoIcone: { minWidth: 48, minHeight: 48, justifyContent: 'center', alignItems: 'center' }, saudacao: { color: '#FFFFFF', fontSize: 22, lineHeight: 29, fontWeight: '700' },
  boasVindas: { color: '#DAEDE4', fontSize: 15, lineHeight: 22 }, avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#7CA995', justifyContent: 'center', alignItems: 'center' },
  conteudo: { width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  banner: { backgroundColor: '#116C4E', borderRadius: 20, padding: 19, minHeight: 168, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  textoBanner: { flex: 1, zIndex: 1, gap: 18 }, tituloBanner: { color: '#FFFFFF', fontSize: 23, fontWeight: '800', lineHeight: 29 },
  chamada: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }, chamadaTexto: { color: '#F0F8F2', fontSize: 13, lineHeight: 20 }, prato: { marginRight: -34, marginLeft: 6 },
  secao: { fontSize: 18, lineHeight: 25, color: '#174C3C', fontWeight: '800', marginTop: 3 },
  resumo: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#EAF0EC', elevation: 2 },
  fundoIcone: { width: 48, height: 54, borderRadius: 15, backgroundColor: '#EFF8F2', alignItems: 'center', justifyContent: 'center' }, detalhes: { flex: 1, gap: 5 },
  legenda: { color: '#617F73', fontSize: 12, lineHeight: 17 }, refeicao: { color: '#174C3C', fontWeight: '700', fontSize: 16, lineHeight: 22 }, auxiliar: { color: '#5E756A', fontSize: 13, lineHeight: 19 },
  servicos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, servico: { flexGrow: 1, flexBasis: 0, minWidth: 64, backgroundColor: '#FFFFFF', borderRadius: 17, paddingHorizontal: 5, paddingVertical: 14, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#EDF2EE', elevation: 1 },
  servicoCompacto: { flexBasis: '43%' }, fundoServico: { width: 44, height: 40, backgroundColor: '#F1F8F3', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, nomeServico: { color: '#245B47', fontSize: 12, fontWeight: '600', lineHeight: 17, textAlign: 'center' },
  sombra: { flex: 1, backgroundColor: 'rgba(0,25,15,0.5)', justifyContent: 'center', padding: 22 }, modalSeguro: { maxHeight: '90%', borderRadius: 22, backgroundColor: '#FFFFFF', width: '100%', maxWidth: 480, alignSelf: 'center' }, modal: { padding: 22, gap: 18 },
});