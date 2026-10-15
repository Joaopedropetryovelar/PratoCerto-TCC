import React, { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Botao, Carregando, Falha, ui } from './Interface';
import { useColecao } from '../hooks/useDados';
export default function ListaTurmas({ escola, valor, onChange, disabled = false, erro }) {
  const [aberta, setAberta] = useState(false);
  const lista = useColecao('turmas', [['escola', '==', escola || ''], ['ativa', '==', true]], Boolean(escola));
  const opcoes = [...lista.dados].sort((a,b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));
  const selecionada = opcoes.find(t => t.id === valor);
  return <View style={ui.campo}><Text style={ui.label}>Turma</Text>
    <TouchableOpacity testID="selecionar-turma" accessibilityRole="button" accessibilityLabel={selecionada ? `Turma: ${selecionada.nome}` : 'Selecionar turma'} accessibilityState={{ expanded: aberta, disabled: disabled || !escola }} disabled={disabled || !escola || lista.carregando || Boolean(lista.erro)} onPress={() => setAberta(true)} style={[ui.input, (disabled || !escola) && ui.desativado]}><Text style={ui.texto}>{selecionada?.nome || 'Selecionar turma'}</Text></TouchableOpacity>
    {!escola ? <Text style={ui.pequeno}>Escolha a escola para consultar as turmas.</Text> : lista.carregando ? <Carregando /> : lista.erro ? <Falha mensagem={lista.erro} tentarNovamente={lista.tentarNovamente} /> : !opcoes.length ? <Text style={ui.pequeno}>A escola ainda não disponibilizou turmas. Solicite o cadastro à equipe.</Text> : null}
    {erro ? <Text style={ui.erro} accessibilityRole="alert">{erro}</Text> : null}
    <Modal visible={aberta && !disabled} transparent animationType="fade" onRequestClose={() => setAberta(false)}>
      <View style={{ flex:1, backgroundColor:'#0007', justifyContent:'center', padding:20 }}><View style={[ui.card,{maxHeight:'80%',width:'100%',maxWidth:520,alignSelf:'center'}]}><Text style={ui.secao}>Selecione sua turma</Text><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:8}}>{opcoes.map(t => <Botao key={t.id} testID={`turma-${t.id}`} secundario selecionado={t.id===valor} onPress={() => { onChange(t); setAberta(false); }}>{t.nome}</Botao>)}</ScrollView><Botao secundario onPress={() => setAberta(false)}>Fechar</Botao></View></View>
    </Modal>
  </View>;
}
