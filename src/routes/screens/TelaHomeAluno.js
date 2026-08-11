import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const semana = [
  {
    abrev: 'Seg',
    numero: '03',
    dataCompleta: 'Segunda-feira, 03 de agosto',
    refeicoes: [
      { icone: '🍚', tipo: 'Almoço', nome: 'Arroz, feijão e carne moída', status: 'ok' },
      { icone: '🍌', tipo: 'Lanche da tarde', nome: 'Banana e biscoito integral', status: 'ok' },
    ],
  },
  {
    abrev: 'Ter',
    numero: '04',
    dataCompleta: 'Terça-feira, 04 de agosto',
    refeicoes: [
      { icone: '🥗', tipo: 'Almoço', nome: 'Arroz, feijão, frango grelhado e salada', status: 'ok' },
      { icone: '🍎', tipo: 'Lanche da tarde', nome: 'Fruta da estação e suco natural', status: 'pendente' },
    ],
  },
  {
    abrev: 'Qua',
    numero: '05',
    dataCompleta: 'Quarta-feira, 05 de agosto',
    refeicoes: [
      { icone: '🥣', tipo: 'Almoço', nome: 'Sopa de legumes e pão integral', status: 'pendente' },
      { icone: '🍪', tipo: 'Lanche da tarde', nome: 'Biscoito de aveia e leite', status: 'pendente' },
    ],
  },
  {
    abrev: 'Qui',
    numero: '06',
    dataCompleta: 'Quinta-feira, 06 de agosto',
    refeicoes: [
      { icone: '🍝', tipo: 'Almoço', nome: 'Macarrão à bolonhesa e salada', status: 'pendente' },
      { icone: '🍊', tipo: 'Lanche da tarde', nome: 'Laranja e suco de uva', status: 'pendente' },
    ],
  },
  {
    abrev: 'Sex',
    numero: '07',
    dataCompleta: 'Sexta-feira, 07 de agosto',
    refeicoes: [
      { icone: '🍛', tipo: 'Almoço', nome: 'Arroz, feijão e omelete', status: 'pendente' },
      { icone: '🍇', tipo: 'Lanche da tarde', nome: 'Uva e bolo simples', status: 'pendente' },
    ],
  },
];

export default function TelaHomeAluno() {
  const [diaSelecionado, setDiaSelecionado] = useState(1); 
  const dia = semana[diaSelecionado];

  return (
    <SafeAreaView style={estilos.tela}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6FAF1" />

      <ScrollView
        style={estilos.conteudo}
        contentContainerStyle={estilos.conteudoInterno}
        showsVerticalScrollIndicator={false}
      >
        
        <View style={estilos.cabecalho}>
          <Text style={estilos.saudacao}>Bom dia, João 👋</Text>
          <Text style={estilos.titulo}>🌿 Cardápio da semana</Text>
        </View>

        <View style={estilos.linhaDias}>
          {semana.map((item, indice) => {
            const ativo = indice === diaSelecionado;
            return (
              <TouchableOpacity
                key={item.abrev}
                style={[estilos.dia, ativo && estilos.diaAtivo]}
                onPress={() => setDiaSelecionado(indice)}
              >
                <Text style={[estilos.diaAbrev, ativo && estilos.textoClaro]}>{item.abrev}</Text>
                <Text style={[estilos.diaNumero, ativo && estilos.textoClaro]}>{item.numero}</Text>
                <View style={[estilos.bolinha, ativo && estilos.bolinhaAtiva]} />
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={estilos.rotuloSecao}>{dia.dataCompleta}</Text>

        {dia.refeicoes.map((refeicao, indice) => (
          <View key={indice} style={estilos.cartaoRefeicao}>
            <View style={estilos.icone}>
              <Text style={estilos.icTexto}>{refeicao.icone}</Text>
            </View>

            <View style={estilos.info}>
              <Text style={estilos.tipo}>{refeicao.tipo}</Text>
              <Text style={estilos.nome}>{refeicao.nome}</Text>
            </View>

            <View style={[estilos.selo, refeicao.status === 'ok' ? estilos.seloOk : estilos.seloPendente]}>
              <Text style={refeicao.status === 'ok' ? estilos.seloTextoOk : estilos.seloTextoPendente}>
                {refeicao.status === 'ok' ? 'Confirmado' : 'Pendente'}
              </Text>
            </View>
          </View>
        ))}
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
  mangoSoft: '#FDECC9',
  laranjaTexto: '#9A6412',
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
  },
  seloOk: {
    backgroundColor: cores.card,
  },
  seloPendente: {
    backgroundColor: cores.mangoSoft,
  },
  seloTextoOk: {
    fontSize: 10,
    fontWeight: '700',
    color: cores.primary,
  },
  seloTextoPendente: {
    fontSize: 10,
    fontWeight: '700',
    color: cores.laranjaTexto,
  },
});