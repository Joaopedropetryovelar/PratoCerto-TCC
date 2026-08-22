import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TelaDeFeedbackAdmin({ navigation: navegacao }) {
  function abrirTela(nomeDaTela) {
    if (navegacao) {
      navegacao.navigate(nomeDaTela);
    }
  }

  return (
    <SafeAreaView style={estilos.tela}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6FAF1" />

      <ScrollView
        style={estilos.rolagem}
        contentContainerStyle={estilos.conteudoRolagem}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.cabecalho}>
          <View style={estilos.seloAdmin}>
            <Text style={estilos.textoSeloAdmin}>🛡️ ADMINISTRADOR</Text>
          </View>
          <Text style={estilos.subtituloCabecalho}>Terça-feira, 04/08 · Almoço</Text>
          <Text style={estilos.titulo}>Feedback dos alunos</Text>
        </View>

        <View style={estilos.linhaEstatisticas}>
          <View style={estilos.cartaoEstatistica}>
            <Text style={estilos.valorEstatistica}>4.2</Text>
            <Text style={estilos.rotuloEstatistica}>NOTA{`\n`}MÉDIA</Text>
          </View>

          <View style={estilos.cartaoEstatistica}>
            <Text style={estilos.valorEstatistica}>186</Text>
            <Text style={estilos.rotuloEstatistica}>RESPOSTAS{`\n`}HOJE</Text>
          </View>

          <View style={estilos.cartaoEstatistica}>
            <Text style={estilos.valorAlerta}>-18%</Text>
            <Text style={estilos.rotuloEstatistica}>DESPERDÍCIO{`\n`}NA SEMANA</Text>
          </View>
        </View>

        <View style={estilos.cartaoAvaliacao}>
          <View style={estilos.cabecalhoAvaliacao}>
            <Text style={estilos.notaMedia}>
              4.2<Text style={estilos.notaMaxima}>/5</Text>
            </Text>
            <Text style={estilos.tituloAvaliacao}>COMO FOI O ALMOÇO DE HOJE</Text>
          </View>

          <View style={estilos.linhaBarra}>
            <Text style={estilos.emojiAvaliacao}>😍</Text>
            <View style={estilos.trilhoBarra}>
              <View style={estilos.barraExcelente} />
            </View>
            <Text style={estilos.porcentagem}>38%</Text>
          </View>

          <View style={estilos.linhaBarra}>
            <Text style={estilos.emojiAvaliacao}>🙂</Text>
            <View style={estilos.trilhoBarra}>
              <View style={estilos.barraBoa} />
            </View>
            <Text style={estilos.porcentagem}>44%</Text>
          </View>

          <View style={estilos.linhaBarra}>
            <Text style={estilos.emojiAvaliacao}>😐</Text>
            <View style={estilos.trilhoBarra}>
              <View style={estilos.barraRegular} />
            </View>
            <Text style={estilos.porcentagem}>12%</Text>
          </View>

          <View style={estilos.ultimaLinhaBarra}>
            <Text style={estilos.emojiAvaliacao}>🙁</Text>
            <View style={estilos.trilhoBarra}>
              <View style={estilos.barraRuim} />
            </View>
            <Text style={estilos.porcentagem}>6%</Text>
          </View>
        </View>

        <Text style={estilos.tituloSecao}>COMENTÁRIOS RECENTES</Text>

        <View style={estilos.cartaoComentario}>
          <View style={estilos.cabecalhoComentario}>
            <Text style={estilos.nomeAluno}>
              Sofia L. <Text style={estilos.turmaAluno}>· 7º B</Text>
            </Text>
            <Text style={estilos.emojiComentario}>🙂</Text>
          </View>
          <Text style={estilos.textoComentario}>
            Tava bem gostoso hoje, só achei que faltou um pouco de tempero no
            frango.
          </Text>
          <View style={estilos.linhaEtiquetas}>
            <View style={estilos.etiqueta}>
              <Text style={estilos.textoEtiqueta}>Tinha bastante comida</Text>
            </View>
            <View style={estilos.etiqueta}>
              <Text style={estilos.textoEtiqueta}>Pouco tempero</Text>
            </View>
          </View>
        </View>

        <View style={estilos.cartaoComentario}>
          <View style={estilos.cabecalhoComentario}>
            <Text style={estilos.nomeAluno}>
              Enzo M. <Text style={estilos.turmaAluno}>· 6º A</Text>
            </Text>
            <Text style={estilos.emojiComentario}>😍</Text>
          </View>
          <Text style={estilos.textoComentario}>
            Amei o frango grelhado, pode repetir esse prato semana que vem!
          </Text>
          <View style={estilos.linhaEtiquetas}>
            <View style={estilos.etiqueta}>
              <Text style={estilos.textoEtiqueta}>Repetir esse prato</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: '#F6FAF1',
  },
  rolagem: {
    flex: 1,
  },
  conteudoRolagem: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  cabecalho: {
    marginBottom: 18,
  },
  seloAdmin: {
    alignSelf: 'flex-start',
    backgroundColor: '#204A37',
    borderRadius: 100,
    paddingHorizontal: 11,
    paddingVertical: 6,
    marginBottom: 9,
  },
  textoSeloAdmin: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  subtituloCabecalho: {
    color: '#5B6B5C',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  titulo: {
    color: '#204A37',
    fontSize: 25,
    fontWeight: '800',
  },
  linhaEstatisticas: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  cartaoEstatistica: {
    flex: 1,
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE8D2',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  valorEstatistica: {
    color: '#2F6B4F',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 3,
  },
  valorAlerta: {
    color: '#E85D4C',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 3,
  },
  rotuloEstatistica: {
    color: '#5B6B5C',
    fontSize: 8,
    fontWeight: '800',
    lineHeight: 11,
    textAlign: 'center',
  },
  cartaoAvaliacao: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE8D2',
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 15,
    marginBottom: 18,
  },
  cabecalhoAvaliacao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  notaMedia: {
    color: '#204A37',
    fontSize: 32,
    fontWeight: '900',
  },
  notaMaxima: {
    color: '#5B6B5C',
    fontSize: 13,
    fontWeight: '600',
  },
  tituloAvaliacao: {
    flex: 1,
    color: '#5B6B5C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    lineHeight: 14,
  },
  linhaBarra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 9,
  },
  ultimaLinhaBarra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  emojiAvaliacao: {
    width: 22,
    fontSize: 17,
  },
  trilhoBarra: {
    flex: 1,
    height: 8,
    overflow: 'hidden',
    backgroundColor: '#DCE8D2',
    borderRadius: 100,
  },
  barraExcelente: {
    width: '38%',
    height: '100%',
    backgroundColor: '#2F6B4F',
    borderRadius: 100,
  },
  barraBoa: {
    width: '44%',
    height: '100%',
    backgroundColor: '#F2A93B',
    borderRadius: 100,
  },
  barraRegular: {
    width: '12%',
    height: '100%',
    backgroundColor: '#C9B98A',
    borderRadius: 100,
  },
  barraRuim: {
    width: '6%',
    height: '100%',
    backgroundColor: '#E85D4C',
    borderRadius: 100,
  },
  porcentagem: {
    width: 34,
    color: '#5B6B5C',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
  },
  tituloSecao: {
    color: '#5B6B5C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  cartaoComentario: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE8D2',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 13,
    marginBottom: 10,
  },
  cabecalhoComentario: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nomeAluno: {
    color: '#1E2B21',
    fontSize: 13,
    fontWeight: '800',
  },
  turmaAluno: {
    color: '#5B6B5C',
    fontSize: 11,
    fontWeight: '600',
  },
  emojiComentario: {
    fontSize: 18,
  },
  textoComentario: {
    color: '#5B6B5C',
    fontSize: 12,
    lineHeight: 18,
  },
  linhaEtiquetas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 9,
  },
  etiqueta: {
    backgroundColor: '#EFF6E7',
    borderRadius: 100,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  textoEtiqueta: {
    color: '#2F6B4F',
    fontSize: 9,
    fontWeight: '800',
  }
});
