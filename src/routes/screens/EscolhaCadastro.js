import React from "react";

import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function EscolhaCadastro({
  navigation,
}) {
  function cadastrarAluno() {
    navigation.navigate(
      "Consentimento",
      {
        screen: "Cadastro",
      }
    );
  }

  function cadastrarAdministrador() {
    navigation.navigate(
      "VerificarAdmin"
    );
  }

  return (
    <SafeAreaView style={styles.tela}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F6FAF1"
      />

      <View style={styles.conteudo}>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() =>
            navigation.goBack()
          }
        >
          <Text style={styles.setaVoltar}>
            ←
          </Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>
          Criar conta
        </Text>

        <Text style={styles.subtitulo}>
          Escolha qual tipo de conta deseja cadastrar.
        </Text>

        <TouchableOpacity
          style={styles.card}
          onPress={cadastrarAluno}
        >
          <View style={styles.iconeArea}>
            <Text style={styles.icone}>
              🎓
            </Text>
          </View>

          <View style={styles.info}>
            <Text style={styles.cardTitulo}>
              Aluno
            </Text>

            <Text style={styles.cardTexto}>
              Crie uma conta para visualizar o cardápio,
              confirmar refeições e enviar feedbacks.
            </Text>
          </View>

          <Text style={styles.seta}>
            ›
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={cadastrarAdministrador}
        >
          <View style={styles.iconeArea}>
            <Text style={styles.icone}>
              🛡️
            </Text>
          </View>

          <View style={styles.info}>
            <Text style={styles.cardTitulo}>
              Administrador
            </Text>

            <Text style={styles.cardTexto}>
              Um administrador existente deverá
              autorizar a criação da nova conta.
            </Text>
          </View>

          <Text style={styles.seta}>
            ›
          </Text>
        </TouchableOpacity>

        <View style={styles.aviso}>
          <Text style={styles.avisoTitulo}>
            Cadastro protegido
          </Text>

          <Text style={styles.avisoTexto}>
            Um usuário não pode simplesmente escolher
            ser administrador. Outro administrador
            precisa autorizar.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: "#F6FAF1",
  },

  conteudo: {
    flex: 1,
    padding: 24,
  },

  botaoVoltar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE8D2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },

  setaVoltar: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2F6B4F",
  },

  titulo: {
    fontSize: 30,
    fontWeight: "900",
    color: "#1E2B21",
  },

  subtitulo: {
    fontSize: 14,
    color: "#667368",
    marginTop: 7,
    marginBottom: 28,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#DCE8D2",
  },

  iconeArea: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#E8F3E4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  icone: {
    fontSize: 25,
  },

  info: {
    flex: 1,
  },

  cardTitulo: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1E2B21",
  },

  cardTexto: {
    fontSize: 12,
    color: "#667368",
    lineHeight: 18,
    marginTop: 4,
  },

  seta: {
    fontSize: 28,
    color: "#2F6B4F",
    marginLeft: 10,
  },

  aviso: {
    backgroundColor: "#E8F3E4",
    borderRadius: 18,
    padding: 16,
    marginTop: 10,
  },

  avisoTitulo: {
    color: "#2F6B4F",
    fontSize: 13,
    fontWeight: "800",
  },

  avisoTexto: {
    color: "#667368",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
});