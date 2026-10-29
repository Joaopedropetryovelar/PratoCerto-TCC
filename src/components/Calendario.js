import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Botao, ui } from './Interface';
import { formatarDataCalendario, gradeMes, moverMes, tituloMesCalendario } from '../domain/calendario';
import { dataDaEscola, dataValida } from '../domain/refeicoes';

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export default function Calendario({ label = 'Data', value, onChange, min, max, somenteUteis = false, marcadas = [] }) {
  const hoje = dataDaEscola();
  const [aberto, setAberto] = useState(false), [mes, setMes] = useState(dataValida(value) ? value : hoje);
  useEffect(() => { if (dataValida(value)) setMes(value); }, [value]);
  const grade = gradeMes(mes), anterior = moverMes(mes, -1), seguinte = moverMes(mes, 1);
  const podeVoltar = !dataValida(min) || anterior.slice(0, 7) >= min.slice(0, 7);
  const podeAvancar = !dataValida(max) || seguinte.slice(0, 7) <= max.slice(0, 7);
  return <View style={{ gap: 10 }}>
    <Text style={ui.label}>{label}</Text>
    <Botao secundario testID={`calendario-${label}`} onPress={() => setAberto(!aberto)}>{formatarDataCalendario(value)} {aberto ? '▴' : '▾'}</Botao>
    {aberto ? <View style={[ui.card, { padding: 10, gap: 8 }]}>
      <View style={[ui.linha, { alignItems: 'center', flexWrap: 'nowrap' }]}>
        <Botao secundario testID="mes-anterior" disabled={!podeVoltar} onPress={() => setMes(anterior)}>‹</Botao>
        <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[ui.label, { flex: 1, textAlign: 'center' }]}>{tituloMesCalendario(mes)}</Text>
        <Botao secundario testID="mes-seguinte" disabled={!podeAvancar} onPress={() => setMes(seguinte)}>›</Botao>
      </View>
      <View style={{ flexDirection: 'row' }}>{DIAS.map(dia => <Text key={dia} style={[ui.pequeno, { flex: 1, textAlign: 'center', fontSize: 12 }]}>{dia}</Text>)}</View>
      {Array.from({ length: 6 }, (_, semana) => <View key={semana} testID={`semana-calendario-${semana}`} style={{ flexDirection: 'row' }}>
        {grade.slice(semana * 7, semana * 7 + 7).map(dia => {
          const disabled = !dia.noMes || Boolean(min && dia.id < min) || Boolean(max && dia.id > max) || (somenteUteis && !dia.util);
          const escolhido = value === dia.id;
          return <TouchableOpacity key={dia.id} testID={`dia-${dia.id}`} accessibilityRole="button" accessibilityLabel={formatarDataCalendario(dia.id)} accessibilityState={{ disabled, selected: escolhido }} disabled={disabled} onPress={() => { onChange(dia.id); setAberto(false); }} style={{ flex: 1, minWidth: 0, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: escolhido ? '#23624B' : 'transparent', opacity: disabled ? 0.3 : 1 }}>
            <Text style={[ui.label, escolhido && { color: '#FFFFFF' }]}>{dia.numero}</Text>{marcadas.includes(dia.id) ? <Text style={{ color: escolhido ? '#FFFFFF' : '#23624B', fontSize: 9 }}>●</Text> : null}
          </TouchableOpacity>;
        })}
      </View>)}
      <Text style={ui.pequeno}>Toque no dia desejado. Datas indisponíveis aparecem apagadas.</Text>
    </View> : null}
  </View>;
}