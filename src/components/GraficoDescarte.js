import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { agruparPorDia, kg } from '../domain/producao';
import { cores, ui } from './Interface';
export default function GraficoDescarte({ registros }) {
  const dias = agruparPorDia(registros).slice(-7);
  const maximo = Math.max(1, ...dias.map((dia) => dia.descarteG));
  return (
    <View style={ui.card}>
      <Text style={ui.secao}>Descarte por dia</Text>
      <Text style={ui.pequeno}>
        Até os últimos 7 dias com pesagens no período selecionado. Dias sem registro não são
        tratados como zero.
      </Text>
      {!dias.length ? (
        <Text style={ui.texto}>Registre a produção para acompanhar o descarte.</Text>
      ) : (
        <View style={estilosLocais.linha}>
          {dias.map((dia) => (
            <View
              key={dia.data}
              style={estilosLocais.grupo}
              accessibilityLabel={`${dia.data}: ${kg(dia.descarteG)} kg descartados`}
            >
              <Text style={[ui.pequeno, estilosLocais.texto]}>{kg(dia.descarteG, 2)}</Text>
              <View style={estilosLocais.barraGrafico}>
                <View
                  style={criarEstiloBarraGrafico((90 * dia.descarteG) / maximo, cores.laranja)}
                />
              </View>
              <Text style={[ui.pequeno, estilosLocais.texto2]}>
                {dia.data.slice(8)}/{dia.data.slice(5, 7)}
              </Text>
            </View>
          ))}
        </View>
      )}
      <Text style={ui.pequeno}>Pesos em kg · sobra descartada + restos dos pratos</Text>
    </View>
  );
}
const estilosLocais = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  grupo: {
    flex: 1,
    gap: 6,
    alignItems: 'center',
  },
  texto: {
    fontSize: 10,
  },
  barraGrafico: {
    height: 90,
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: '#F3F7F1',
    borderRadius: 6,
  },
  texto2: {
    fontSize: 10,
  },
});
function criarEstiloBarraGrafico(altura, corFundo) {
  return {
    height: altura,
    backgroundColor: corFundo,
    borderRadius: 6,
    width: '100%',
  };
}
