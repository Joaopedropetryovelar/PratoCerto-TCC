import React from 'react';
import { useAgora } from '../hooks/useAgora';
import { dataDaEscola } from '../domain/refeicoes';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { agoraAplicativo, estaEmDemo, definirHorarioDemo } from '../services/demo';

export default function AvisoDemonstracao({ navigation }) {
  const agora = useAgora();
  if (!estaEmDemo()) return null;
  return (
    <SafeAreaView edges={['top']} style={styles.fundo}>
      <View style={styles.linha}>
        <Text style={styles.texto}>Dados fictícios · {dataDaEscola(agora).split('-').reverse().join('/')} · {agora.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}</Text>
        <TouchableOpacity accessibilityRole="button" style={styles.botao} onPress={() => definirHorarioDemo(agora.toLocaleTimeString('pt-BR', {timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'}) === '08:00' ? '21:00' : '08:00')}><Text style={styles.link}>Trocar horário</Text></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Inicial' }, { name: 'Demonstracao' }] })} style={styles.botao}>
          <Text style={styles.link}>Trocar perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  fundo: { backgroundColor: '#FFF1CF' },
  linha: { flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 6, flexWrap: 'wrap' },
  texto: { flexGrow: 1, flexBasis: 160, fontSize: 13, color: '#664B13', fontWeight: '600' },
  botao: { padding: 12, minHeight: 44, justifyContent: 'center' },
  link: { fontSize: 13, color: '#664B13', textDecorationLine: 'underline', fontWeight: '700' },
});
