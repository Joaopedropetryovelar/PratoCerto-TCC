import React from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icone from './Icone';

export const ContextoAviso = React.createContext(false);
export const ContextoCabecalho = React.createContext(false);
export const cores = { verde: '#23624B', escuro: '#173F32', fundo: '#F5F6F2', texto: '#516159', linha: '#DDE5DF', branco: '#FFFFFF', laranja: '#975B13', vermelho: '#A63737' };
const fonte = Platform.OS === 'web' ? 'Arial, sans-serif' : Platform.OS === 'android' ? 'sans-serif' : 'System';
export const ui = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 28, paddingBottom: 40, gap: 24, maxWidth: 1120, width: '100%', alignSelf: 'center' },
  cabecalho: { gap: 8, paddingVertical: 6 }, titulo: { fontFamily: fonte, fontSize: 34, lineHeight: 42, fontWeight: '800', color: cores.escuro }, subtitulo: { fontFamily: fonte, color: cores.texto, fontSize: 16, lineHeight: 24 },
  card: { backgroundColor: cores.branco, borderWidth: 1, borderColor: cores.linha, borderRadius: 22, padding: 22, gap: 14 },
  secao: { fontFamily: fonte, color: cores.escuro, fontSize: 21, lineHeight: 28, fontWeight: '700' }, texto: { fontFamily: fonte, color: cores.texto, fontSize: 16, lineHeight: 24 },
  linha: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' }, indicador: { flexGrow: 1, flexBasis: 210, minWidth: 140, gap: 10, borderTopWidth: 4, borderTopColor: cores.verde }, numero: { fontFamily: fonte, fontSize: 38, lineHeight: 46, fontWeight: '800', color: cores.escuro },
  rotulo: { fontFamily: fonte, color: cores.texto, fontSize: 15, lineHeight: 21, fontWeight: '600' }, botao: { minHeight: 52, justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 14, backgroundColor: cores.verde },
  secundario: { backgroundColor: '#EAF0EA' }, botaoTexto: { fontFamily: fonte, color: cores.branco, fontWeight: '700', fontSize: 16 }, secundarioTexto: { color: cores.verde },
  desativado: { opacity: 0.45 }, filtros: { flexDirection: 'row', gap: 8 }, filtro: { minHeight: 44, paddingHorizontal: 15, justifyContent: 'center', borderRadius: 24, borderWidth: 1, borderColor: cores.linha, backgroundColor: cores.branco },
  filtroAtivo: { backgroundColor: cores.verde, borderColor: cores.verde }, filtroTexto: { fontFamily: fonte, fontWeight: '600', color: cores.texto, fontSize: 15 },
  campo: { gap: 7 }, label: { fontFamily: fonte, fontSize: 16, color: cores.escuro, fontWeight: '700' }, input: { fontFamily: fonte, borderWidth: 1, borderColor: '#B5CBBB', borderRadius: 14, padding: 14, minHeight: 52, fontSize: 16, color: cores.escuro, backgroundColor: cores.branco },
  erro: { fontFamily: fonte, color: cores.vermelho, fontSize: 13, lineHeight: 19 }, aviso: { backgroundColor: '#FFF3DB', borderColor: '#ECDDAD' },
  pequeno: { fontFamily: fonte, fontSize: 14, color: cores.texto, lineHeight: 21 }, selo: { fontFamily: fonte, color: cores.verde, fontWeight: '700', fontSize: 15, lineHeight: 22 }, separador: { height: 1, backgroundColor: cores.linha },
});
export function Pagina({ titulo, subtitulo, children, estreita = false }) {
  const comAviso = React.useContext(ContextoAviso);
  const comCabecalho = React.useContext(ContextoCabecalho);
  const { width } = useWindowDimensions();
  return <SafeAreaView style={ui.pagina} edges={comAviso || comCabecalho ? ['left', 'right'] : ['top', 'left', 'right']}>
    <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={[ui.conteudo, estreita && { maxWidth: 600 }, width < 600 && { padding: 16, paddingBottom: 28, gap: 18 }]}>
      <View style={ui.cabecalho}><Text accessibilityRole="header" style={[ui.titulo, width < 600 && { fontSize: 28, lineHeight: 36 }]}>{titulo}</Text>{subtitulo ? <Text style={ui.subtitulo}>{subtitulo}</Text> : null}</View>
      {children}
    </ScrollView>
  </SafeAreaView>;
}
export function Botao({ children, onPress, disabled = false, carregando = false, secundario = false, selecionado = false, testID }) {
  return <TouchableOpacity testID={testID} accessibilityRole="button" accessibilityState={{ selected: selecionado, disabled: disabled || carregando }} disabled={disabled || carregando} onPress={onPress} style={[ui.botao, secundario && ui.secundario, selecionado && { borderWidth: 2, borderColor: cores.escuro }, (disabled || carregando) && ui.desativado]}>
    {carregando ? <ActivityIndicator color={secundario ? cores.verde : cores.branco} /> : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>{selecionado ? <Icone nome="confirmar" tamanho={22} cor={secundario ? cores.verde : cores.branco} /> : null}<Text style={[ui.botaoTexto, secundario && ui.secundarioTexto, { flexShrink: 1, textAlign: 'center' }]}>{children}</Text></View>}
  </TouchableOpacity>;
}
export function Campo({ label, ajuda, erro, ...props }) {
  return <View style={ui.campo}><Text style={ui.label}>{label}</Text>{ajuda ? <Text style={ui.pequeno}>{ajuda}</Text> : null}
    <TextInput accessibilityLabel={label} placeholderTextColor="#758477" style={[ui.input, props.multiline && { minHeight: 90, textAlignVertical: 'top' }, erro && { borderColor: cores.vermelho }]} {...props} />
    {erro ? <Text accessibilityRole="alert" style={ui.erro}>{erro}</Text> : null}
  </View>;
}
export function Filtros({ opcoes, valor, onChange, label, vertical = false }) {
  const escolhas = opcoes.map((opcao) => <TouchableOpacity key={opcao.id} accessibilityRole="button" accessibilityLabel={opcao.nome} accessibilityState={{ selected: opcao.id === valor, disabled: Boolean(opcao.disabled) }} disabled={opcao.disabled} onPress={() => onChange(opcao.id)} style={[ui.filtro, vertical && { paddingVertical: 12 }, opcao.disabled && ui.desativado, opcao.id === valor && ui.filtroAtivo]}><Text style={[ui.filtroTexto, opcao.id === valor && { color: cores.branco }]}>{opcao.nome}</Text></TouchableOpacity>);
  return <View style={{ gap: 8 }}>{label ? <Text style={ui.rotulo}>{label}</Text> : null}{vertical ? <View style={{ gap: 8 }}>{escolhas}</View> : opcoes.length <= 4 ? <View style={[ui.filtros, { flexWrap: 'wrap' }]}>{escolhas}</View> : <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={ui.filtros}>{escolhas}</ScrollView>}</View>;
}
export function Indicador({ label, valor, ajuda }) {
  const { width } = useWindowDimensions();
  return <View style={[ui.card, ui.indicador, width < 600 && { flexBasis: '42%', padding: 16 }]}><Text style={ui.rotulo}>{label}</Text><Text style={[ui.numero, width < 600 && { fontSize: 30, lineHeight: 38 }]}>{valor}</Text>{ajuda ? <Text style={ui.pequeno}>{ajuda}</Text> : null}</View>;
}
export function Carregando() { return <View style={ui.card}><ActivityIndicator color={cores.verde} /><Text style={ui.texto}>Carregando dados…</Text></View>; }
export function Falha({ tentarNovamente, mensagem = 'Não conseguimos carregar os dados. Confira sua conexão ou o acesso à conta e tente novamente.' }) {
  return <View style={ui.card}><Text style={ui.secao}>Dados indisponíveis</Text><Text accessibilityRole="alert" style={ui.texto}>{mensagem}</Text><Botao onPress={tentarNovamente}>Tentar novamente</Botao></View>;
}