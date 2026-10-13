import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ui } from './Interface';
import { agruparPorDia } from '../domain/producao';
export default function GraficoSerie({ registros, campo, titulo, unidade }) {
  const todos=agruparPorDia(registros),dias=todos.slice(-31);const valores=dias.map(d=>campo==='servidos'?d.servidos:d[campo]/1000);const maior=Math.max(1,...valores);
  return <View style={ui.card}><Text style={ui.secao}>{titulo}</Text><Text style={ui.pequeno}>{todos.length>31?'Últimos 31 dias com registros neste período.':'Dias com registros neste período.'} Dias sem registro não entram como zero.</Text>
    {!dias.length?<Text style={ui.texto}>Sem dados para o gráfico.</Text>:<ScrollView horizontal showsHorizontalScrollIndicator><View style={{flexDirection:'row',gap:12,alignItems:'flex-end',paddingTop:10}}>{dias.map((dia,i)=><View key={dia.data} accessible accessibilityLabel={`${dia.data.split('-').reverse().join('/')}: ${valores[i]} ${unidade}`} style={{width:82,alignItems:'center',gap:10}}><Text style={ui.label}>{campo==='servidos'?valores[i]:valores[i].toFixed(2).replace('.',',')} {unidade}</Text><View style={{height:150,width:38,justifyContent:'flex-end',backgroundColor:'#EDF4ED',borderRadius:8}}><View testID={`barra-${campo}-${dia.data}`} style={{height:Math.max(0,valores[i]/maior*150),width:38,borderRadius:8,backgroundColor:campo==='servidos'?'#23624B':'#A5773D'}}/></View><Text style={ui.pequeno}>{dia.data.slice(8)}/{dia.data.slice(5,7)}</Text></View>)}</View></ScrollView>}
  </View>;
}
