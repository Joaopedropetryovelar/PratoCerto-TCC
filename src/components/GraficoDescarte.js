import React from 'react';
import { Text, View } from 'react-native';
import { agruparPorDia, kg } from '../domain/producao';
import { cores, ui } from './Interface';

export default function GraficoDescarte({ registros }) {
  const dias = agruparPorDia(registros).slice(-7);
  const maximo = Math.max(1, ...dias.map((dia) => dia.descarteG));
  return <View style={ui.card}><Text style={ui.secao}>Descarte por dia</Text><Text style={ui.pequeno}>Até os últimos 7 dias com pesagens no período selecionado. Dias sem registro não são tratados como zero.</Text>
    {!dias.length ? <Text style={ui.texto}>Registre a produção para acompanhar o descarte.</Text> : <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
      {dias.map((dia) => <View key={dia.data} style={{ flex: 1, gap: 6, alignItems: 'center' }} accessibilityLabel={`${dia.data}: ${kg(dia.descarteG)} kg descartados`}>
        <Text style={[ui.pequeno, { fontSize: 10 }]}>{kg(dia.descarteG, 2)}</Text>
        <View style={{ height: 90, width: '100%', justifyContent: 'flex-end', backgroundColor: '#F3F7F1', borderRadius: 6 }}>
          <View style={{ height: 90 * dia.descarteG / maximo, backgroundColor: cores.laranja, borderRadius: 6, width: '100%' }} />
        </View><Text style={[ui.pequeno, { fontSize: 10 }]}>{dia.data.slice(8)}/{dia.data.slice(5, 7)}</Text>
      </View>)}
    </View>}
    <Text style={ui.pequeno}>Pesos em kg · sobra descartada + restos dos pratos</Text>
  </View>;
}
