import React, { useEffect, useState } from 'react';

import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  collection,
  onSnapshot,
} from 'firebase/firestore';

import { database } from '../../../FireBaseConfig';

function formatarDataBanco(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

function gerarDiasDaSemanaAtual() {
  const hoje = new Date();
  const diaDaSemana = hoje.getDay();

  const diferencaParaSegunda =
    diaDaSemana === 0 ? -6 : 1 - diaDaSemana;

  const segunda = new Date(hoje);

  segunda.setHours(12, 0, 0, 0);
  segunda.setDate(hoje.getDate() + diferencaParaSegunda);

  const nomesDosDias = [
    'Seg',
    'Ter',
    'Qua',
    'Qui',
    'Sex',
  ];

  const diasDaSemana = [];

  for (let i = 0; i < 5; i++) {
    const data = new Date(segunda);

    data.setDate(segunda.getDate() + i);

    diasDaSemana.push({
      id: formatarDataBanco(data),
      nome: nomesDosDias[i],
      numero: String(data.getDate()).padStart(2, '0'),
      data,
    });
  }

  return diasDaSemana;
}

function formatarTituloDoDia(data) {
  if (!data) {
    return '';
  }

  const nomesDosDias = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];

  const nomesDosMeses = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ];

  const nomeDia = nomesDosDias[data.getDay()];
  const numeroDia = String(data.getDate()).padStart(2, '0');
  const nomeMes = nomesDosMeses[data.getMonth()];

  return `${nomeDia}, ${numeroDia} de ${nomeMes}`;
}

function pegarDiaInicial(dias) {
  const hoje = formatarDataBanco(new Date());

  const diaAtual = dias.find(
    (dia) => dia.id === hoje
  );

  if (diaAtual) {
    return diaAtual.id;
  }

  return dias[0].id;
}

export default function TelaHomeAluno() {
  const dias = gerarDiasDaSemanaAtual();

  const [diaEscolhido, setDiaEscolhido] = useState(
    () => pegarDiaInicial(dias)
  );

  const [refeicoesPorDia, setRefeicoesPorDia] = useState({});

  useEffect(() => {
    const pararDeEscutar = onSnapshot(
      collection(database, 'NomePratos'),

      (snapshot) => {
        const refeicoesDoBanco = {};

        dias.forEach((dia) => {
          refeicoesDoBanco[dia.id] = [];
        });

        snapshot.forEach((documento) => {
          const dados = documento.data();

          const dataDaRefeicao = dados.data;

          if (refeicoesDoBanco[dataDaRefeicao]) {
            refeicoesDoBanco[dataDaRefeicao].push({
              id: documento.id,
              nome: dados.nome,
              tipo: dados.tipo || 'Almoço',
              icone: dados.icone || '🍽️',
              descricao: dados.descricao || '',
              horarioLimite: dados.horarioLimite || '09:00',
              horarioFim: dados.horarioFim || '12:30',
              ativo: dados.ativo !== false,
            });
          }
        });

        setRefeicoesPorDia(refeicoesDoBanco);
      },

      (erro) => {
        console.log('Erro ao buscar refeições:', erro);
      }
    );

    return () => {
      pararDeEscutar();
    };
  }, []);

  const listaDoDia =
    refeicoesPorDia[diaEscolhido] || [];

  const diaSelecionado = dias.find(
    (dia) => dia.id === diaEscolhido
  );

  return (
    <SafeAreaView style={estilos.tela}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F6FAF1"
      />

      <ScrollView
        style={estilos.conteudo}
        contentContainerStyle={estilos.conteudoInterno}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.cabecalho}>
          <Text style={estilos.saudacao}>
            Bom dia, Lucas 👋
          </Text>

          <Text style={estilos.titulo}>
            🌿 Cardápio da semana
          </Text>
        </View>

        <View style={estilos.linhaDias}>
          {dias.map((item) => {
            const ativo =
              item.id === diaEscolhido;

            const temRefeicao =
              (refeicoesPorDia[item.id] || []).length > 0;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  estilos.dia,
                  ativo && estilos.diaAtivo,
                ]}
                onPress={() =>
                  setDiaEscolhido(item.id)
                }
              >
                <Text
                  style={[
                    estilos.diaAbrev,
                    ativo && estilos.textoClaro,
                  ]}
                >
                  {item.nome}
                </Text>

                <Text
                  style={[
                    estilos.diaNumero,
                    ativo && estilos.textoClaro,
                  ]}
                >
                  {item.numero}
                </Text>

                {temRefeicao && (
                  <View
                    style={[
                      estilos.bolinha,
                      ativo && estilos.bolinhaAtiva,
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={estilos.rotuloSecao}>
          {formatarTituloDoDia(
            diaSelecionado?.data
          )}
        </Text>

        {listaDoDia.length === 0 ? (
          <Text style={estilos.textoVazio}>
            Nenhuma refeição cadastrada para este dia.
          </Text>
        ) : (
          listaDoDia.map((refeicao) => (
            <View
              key={refeicao.id}
              style={estilos.cartaoRefeicao}
            >
              <View style={estilos.icone}>
                <Text style={estilos.icTexto}>
                  {refeicao.icone}
                </Text>
              </View>

              <View style={estilos.info}>
                <Text style={estilos.tipo}>
                  {refeicao.tipo}
                </Text>

                <Text style={estilos.nome}>
                  {refeicao.nome}
                </Text>
              </View>

              <View style={estilos.selo}>
                <Text style={estilos.seloTexto}>
                  Disponível
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const cores = {
  bg: '#F6FAF1',
  ink: '#1E2B21',
  inkSoft: '#5B6B5C',
  primary: '#2F6B4F',
  primaryDark: '#204A37',
  card: '#EFF6E7',
  mango: '#F2A93B',
  line: '#DCE8D2',
  white: '#FFFFFF',
};

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.bg,
  },

  conteudo: {
    flex: 1,
  },

  conteudoInterno: {
    paddingHorizontal: 20,
    paddingTop: 9,
    paddingBottom: 20,
  },

  cabecalho: {
    marginBottom: 24,
  },

  saudacao: {
    fontSize: 12,
    fontWeight: '600',
    color: cores.inkSoft,
  },

  titulo: {
    fontWeight: '800',
    fontSize: 23,
    color: cores.primaryDark,
    marginTop: 7,
  },

  linhaDias: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },

  dia: {
    flex: 1,
    backgroundColor: cores.white,
    borderWidth: 1.5,
    borderColor: cores.line,
    borderRadius: 16,
    paddingVertical: 9,
    alignItems: 'center',
  },

  diaAtivo: {
    backgroundColor: cores.primary,
    borderColor: cores.primary,
  },

  diaAbrev: {
    fontSize: 10,
    fontWeight: '700',
    color: cores.inkSoft,
    textTransform: 'uppercase',
  },

  diaNumero: {
    fontWeight: '700',
    fontSize: 16,
    color: cores.ink,
    marginTop: 2,
  },

  textoClaro: {
    color: cores.white,
  },

  bolinha: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: cores.mango,
    marginTop: 4,
  },

  bolinhaAtiva: {
    backgroundColor: cores.white,
  },

  rotuloSecao: {
    fontSize: 11,
    fontWeight: '700',
    color: cores.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  textoVazio: {
    fontSize: 13,
    color: cores.inkSoft,
    marginBottom: 15,
  },

  cartaoRefeicao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: cores.white,
    borderWidth: 1.5,
    borderColor: cores.line,
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
  },

  icone: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: cores.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  icTexto: {
    fontSize: 22,
  },

  info: {
    flex: 1,
  },

  tipo: {
    fontSize: 10,
    fontWeight: '700',
    color: cores.primary,
    textTransform: 'uppercase',
  },

  nome: {
    fontWeight: '700',
    fontSize: 14.5,
    color: cores.ink,
    marginTop: 2,
    lineHeight: 19,
  },

  selo: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: cores.card,
  },

  seloTexto: {
    fontSize: 10,
    fontWeight: '700',
    color: cores.primary,
  },
});