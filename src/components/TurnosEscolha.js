import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { TURNOS_ALUNO } from '../domain/escolas';
import { ui } from './Interface';
export default function TurnosEscolha({ value, onChange, disabled }) {
  return <View style={{ gap: 8 }}><Text style={ui.label}>Turnos em que você estuda</Text><Text style={ui.pequeno}>Pode selecionar mais de um, por exemplo manhã e tarde.</Text><View style={ui.linha}>{TURNOS_ALUNO.map((turno) => <TouchableOpacity key={turno.id} testID={`turno-${turno.id}`} accessibilityRole="checkbox" accessibilityLabel={turno.nome} accessibilityState={{ checked: value.includes(turno.id) }} disabled={disabled} onPress={() => onChange(value.includes(turno.id) ? value.filter((id) => id !== turno.id) : [...value, turno.id])} style={[ui.filtro, value.includes(turno.id) && ui.filtroAtivo]}><Text style={[ui.filtroTexto, value.includes(turno.id) && { color: '#FFF' }]}>{value.includes(turno.id) ? '✓ ' : ''}{turno.nome}</Text></TouchableOpacity>)}</View></View>;
}
