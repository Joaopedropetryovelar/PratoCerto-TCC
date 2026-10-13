import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Botao, ui } from './Interface';
import { gradeMes, moverMes, parseData } from '../domain/calendario';
import { dataLocal } from '../domain/refeicoes';
export default function Calendario({ label = 'Data', value, onChange, min, max, somenteUteis = false, marcadas = [] }) {
  const [aberto, setAberto] = useState(false);
  const [mes, setMes] = useState(value || dataLocal());
  useEffect(() => { if (value) setMes(value); }, [value]);
  const titulo = parseData(mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return <View style={{ gap: 10 }}>
    <Text style={ui.label}>{label}</Text>
    <Botao secundario testID={`calendario-${label}`} onPress={() => setAberto(!aberto)}>{value?.split('-').reverse().join('/') || 'Selecionar data'} {aberto ? '▴' : '▾'}</Botao>
    {aberto ? <View style={[ui.card, { padding: 10 }]}>
      <View style={[ui.linha, { justifyContent: 'space-between', alignItems: 'center' }]}><Botao secundario testID="mes-anterior" onPress={() => setMes(moverMes(mes, -1))}>‹</Botao><Text style={[ui.label, { flex: 1, textAlign: 'center' }]}>{titulo}</Text><Botao secundario testID="mes-seguinte" onPress={() => setMes(moverMes(mes, 1))}>›</Botao></View>
      <View style={{ flexDirection: 'row' }}>{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((dia, i) => <Text key={i} style={[ui.pequeno, { width: `${100/7}%`, textAlign: 'center' }]}>{dia}</Text>)}</View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{gradeMes(mes).map((dia) => {
        const disabled = !dia.noMes || Boolean(min && dia.id < min) || Boolean(max && dia.id > max) || (somenteUteis && !dia.util);
        const escolhido = value === dia.id;
        return <TouchableOpacity key={dia.id} testID={`dia-${dia.id}`} accessibilityRole="button" accessibilityLabel={dia.id.split('-').reverse().join('/')} accessibilityState={{ disabled, selected: escolhido }} disabled={disabled} onPress={() => { onChange(dia.id); setAberto(false); }} style={{ width: `${100/7}%`, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: escolhido ? '#2F6B4F' : 'transparent', opacity: disabled ? 0.3 : 1 }}>
          <Text style={[ui.label, escolhido && { color: '#FFFFFF' }]}>{dia.numero}</Text>{marcadas.includes(dia.id) ? <Text style={{ color: escolhido ? '#FFFFFF' : '#2F6B4F', fontSize: 9 }}>●</Text> : null}
        </TouchableOpacity>;
      })}</View>
      <Text style={ui.pequeno}>Toque no dia para selecionar. Dias indisponíveis aparecem apagados.</Text>
    </View> : null}
  </View>;
}
