import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Botao, ui } from './Interface';
import {
  formatarDataCalendario,
  gradeMes,
  moverMes,
  tituloMesCalendario,
} from '../domain/calendario';
import { dataDaEscola, dataValida } from '../domain/refeicoes';
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export default function Calendario({
  label = 'Data',
  value,
  onChange,
  min,
  max,
  somenteUteis = false,
  marcadas = [],
}) {
  const hoje = dataDaEscola();
  const [aberto, setAberto] = useState(false),
    [mes, setMes] = useState(dataValida(value) ? value : hoje);
  useEffect(() => {
    if (dataValida(value)) setMes(value);
  }, [value]);
  const grade = gradeMes(mes),
    anterior = moverMes(mes, -1),
    seguinte = moverMes(mes, 1);
  const podeVoltar = !dataValida(min) || anterior.slice(0, 7) >= min.slice(0, 7);
  const podeAvancar = !dataValida(max) || seguinte.slice(0, 7) <= max.slice(0, 7);
  return (
    <View style={estilosLocais.grupo}>
      <Text style={ui.label}>{label}</Text>
      <Botao secundario testID={`calendario-${label}`} onPress={() => setAberto(!aberto)}>
        {formatarDataCalendario(value)} {aberto ? '▴' : '▾'}
      </Botao>
      {aberto ? (
        <View style={[ui.card, estilosLocais.espacamento]}>
          <View style={[ui.linha, estilosLocais.quebraLinha]}>
            <Botao
              secundario
              testID="mes-anterior"
              disabled={!podeVoltar}
              onPress={() => setMes(anterior)}
            >
              ‹
            </Botao>
            <Text
              accessibilityRole="header"
              accessibilityLiveRegion="polite"
              style={[ui.label, estilosLocais.alinhamentoTexto]}
            >
              {tituloMesCalendario(mes)}
            </Text>
            <Botao
              secundario
              testID="mes-seguinte"
              disabled={!podeAvancar}
              onPress={() => setMes(seguinte)}
            >
              ›
            </Botao>
          </View>
          <View style={estilosLocais.linha}>
            {DIAS.map((dia) => (
              <Text key={dia} style={[ui.pequeno, estilosLocais.texto]}>
                {dia}
              </Text>
            ))}
          </View>
          {Array.from(
            {
              length: 6,
            },
            (_, semana) => (
              <View
                key={semana}
                testID={`semana-calendario-${semana}`}
                style={estilosLocais.linha2}
              >
                {grade.slice(semana * 7, semana * 7 + 7).map((dia) => {
                  const disabled =
                    !dia.noMes ||
                    Boolean(min && dia.id < min) ||
                    Boolean(max && dia.id > max) ||
                    (somenteUteis && !dia.util);
                  const escolhido = value === dia.id;
                  return (
                    <TouchableOpacity
                      key={dia.id}
                      testID={`dia-${dia.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={formatarDataCalendario(dia.id)}
                      accessibilityState={{
                        disabled,
                        selected: escolhido,
                      }}
                      disabled={disabled}
                      onPress={() => {
                        onChange(dia.id);
                        setAberto(false);
                      }}
                      style={criarEstiloCartao(
                        escolhido ? '#23624B' : 'transparent',
                        disabled ? 0.3 : 1,
                      )}
                    >
                      <Text style={[ui.label, escolhido && estilosLocais.texto2]}>
                        {dia.numero}
                      </Text>
                      {marcadas.includes(dia.id) ? (
                        <Text style={criarEstiloTexto(escolhido ? '#FFFFFF' : '#23624B')}>●</Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ),
          )}
          <Text style={ui.pequeno}>
            Toque no dia desejado. Datas indisponíveis aparecem apagadas.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
const estilosLocais = StyleSheet.create({
  grupo: {
    gap: 10,
  },
  espacamento: {
    padding: 10,
    gap: 8,
  },
  quebraLinha: {
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  alinhamentoTexto: {
    flex: 1,
    textAlign: 'center',
  },
  linha: {
    flexDirection: 'row',
  },
  texto: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
  },
  linha2: {
    flexDirection: 'row',
  },
  texto2: {
    color: '#FFFFFF',
  },
});
function criarEstiloCartao(corFundo, opacidade) {
  return {
    flex: 1,
    minWidth: 0,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: corFundo,
    opacity: opacidade,
  };
}
function criarEstiloTexto(corTexto) {
  return {
    color: corTexto,
    fontSize: 9,
  };
}
