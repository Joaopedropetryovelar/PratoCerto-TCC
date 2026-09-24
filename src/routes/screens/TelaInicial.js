import React from "react";

import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function TelaInicial({ navigation }) {
  function abrirLogin() {
    navigation.navigate("Login");
  }

  function abrirCadastro() {
    navigation.navigate("Consentimento", {
      screen: "Cadastro",
    });
  }

  function abrirTermos() {
    navigation.navigate("Consentimento", {
      screen: "TermosUso",
    });
  }

  function abrirPolitica() {
    navigation.navigate("Consentimento", {
      screen: "PoliticaPrivacidade",
    });
  }

  return (
    <SafeAreaView style={styles.tela}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F7FAF2"
      />

      <View style={styles.conteudo}>
        <View style={styles.areaPrincipal}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🍽️</Text>
          </View>

          <Text style={styles.titulo}>Prato Certo</Text>

          <Text style={styles.descricao}>
            Sistema de controle da alimentação escolar que reduz o desperdício de
            alimentos: os alunos confirmam as refeições com antecedência, a escola
            planeja a produção diária com mais precisão e melhora o cardápio a
            partir das avaliações recebidas.
          </Text>

          <View style={styles.indicadores}>
            <View style={[styles.indicador, styles.indicadorAtivo]} />
            <View style={styles.indicador} />
            <View style={styles.indicador} />
          </View>

          <TouchableOpacity
            style={styles.botaoEntrar}
            activeOpacity={0.85}
            onPress={abrirLogin}
          >
            <Text style={styles.textoBotaoEntrar}>Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoCriarConta}
            activeOpacity={0.85}
            onPress={abrirCadastro}
          >
            <Text style={styles.textoBotaoCriarConta}>Criar conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: "#F7FAF2",
  },

  conteudo: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 24,
    justifyContent: "space-between",
  },

  areaPrincipal: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
  },

  logoContainer: {
    width: 82,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  logoEmoji: {
    fontSize: 62,
  },

  titulo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1F543D",
    marginBottom: 20,
  },

  descricao: {
    width: "100%",
    maxWidth: 340,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 22,
    color: "#68736A",
    marginBottom: 24,
  },

  botaoEntrar: {
    width: "100%",
    maxWidth: 360,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#347A59",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  textoBotaoEntrar: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  botaoCriarConta: {
    width: "100%",
    maxWidth: 360,
    height: 64,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#347A59",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  textoBotaoCriarConta: {
    color: "#347A59",
    fontSize: 17,
    fontWeight: "800",
  }
});
