import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { ui } from './Interface';
import { agruparPorDia } from '../domain/producao';
export default function GraficoSerie({ registros, campo, titulo, unidade }) {
  const todos = agruparPorDia(registros),
    dias = todos.slice(-31);
  const valores = dias.map((registroProducao) =>
    campo === 'servidos' ? registroProducao.servidos : registroProducao[campo] / 1000,
  );
  const maior = Math.max(1, ...valores);
  return (
    <View style={ui.card}>
      <Text style={ui.secao}>{titulo}</Text>
      <Text style={ui.pequeno}>
        {todos.length > 31
          ? 'Últimos 31 dias com registros neste período.'
          : 'Dias com registros neste período.'}{' '}
        Dias sem registro não entram como zero.
      </Text>
      {!dias.length ? (
        <Text style={ui.texto}>Sem dados para o gráfico.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={estilosLocais.linha}>
            {dias.map((dia, indice) => (
              <View
                key={dia.data}
                accessible
                accessibilityLabel={`${dia.data.split('-').reverse().join('/')}: ${valores[indice]} ${unidade}`}
                style={estilosLocais.grupo}
              >
                <Text style={ui.label}>
                  {campo === 'servidos'
                    ? valores[indice]
                    : valores[indice].toFixed(2).replace('.', ',')}{' '}
                  {unidade}
                </Text>
                <View style={estilosLocais.barraGrafico}>
                  <View
                    testID={`barra-${campo}-${dia.data}`}
                    style={criarEstiloBarraGrafico(
                      Math.max(0, (valores[indice] / maior) * 150),
                      campo === 'servidos' ? '#23624B' : '#A5773D',
                    )}
                  />
                </View>
                <Text style={ui.pequeno}>
                  {dia.data.slice(8)}/{dia.data.slice(5, 7)}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
const estilosLocais = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
    paddingTop: 10,
  },
  grupo: {
    width: 82,
    alignItems: 'center',
    gap: 10,
  },
  barraGrafico: {
    height: 150,
    width: 38,
    justifyContent: 'flex-end',
    backgroundColor: '#EDF4ED',
    borderRadius: 8,
  },
});
function criarEstiloBarraGrafico(altura, corFundo) {
  return {
    height: altura,
    width: 38,
    borderRadius: 8,
    backgroundColor: corFundo,
  };
}
