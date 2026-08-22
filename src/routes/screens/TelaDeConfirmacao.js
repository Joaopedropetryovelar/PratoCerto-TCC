import React, { useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

export default function TelaDeConfirmacao({ navigation, route }) {
  const params = route.params || {};

  const refeicao = {
    id: String(params.id ?? "1"),

    tipo: String(params.tipo ?? "Almoço"),

    nome: String(
      params.nome ?? "Arroz, feijão e frango grelhado"
    ),

    descricao: String(
      params.descricao ??
        "Acompanha salada verde e suco de laranja natural"
    ),

    data: String(params.data ?? "20/08/2026"),

    horarioLimite: String(
      params.horarioLimite ?? "09:00"
    ),

    horarioFim: String(
      params.horarioFim ?? "12:30"
    ),

    icone: String(params.icone ?? "🍛"),
  };

  const [resposta, setResposta] = useState(null);

  function confirmarConsumo() {
    setResposta("sim");

    const dados = {
      refeicaoId: refeicao.id,
      vaiConsumir: true,
    };

    console.log("CONFIRMAÇÃO:", dados);

    Alert.alert(
      "Presença confirmada! ✅",
      "Você informou que vai consumir esta refeição."
    );

    /*
      FUTURAMENTE FIREBASE:

      await addDoc(collection(db, "Consumos"), {
        alunoId: alunoId,
        refeicaoId: refeicao.id,
        vaiConsumir: true,
        dataResposta: new Date()
      });
    */
  }

  function recusarConsumo() {
    setResposta("nao");

    const dados = {
      refeicaoId: refeicao.id,
      vaiConsumir: false,
    };

    console.log("CONFIRMAÇÃO:", dados);

    Alert.alert(
      "Resposta registrada",
      "Você informou que não vai consumir esta refeição."
    );

    /*
      FUTURAMENTE FIREBASE:

      await addDoc(collection(db, "Consumos"), {
        alunoId: alunoId,
        refeicaoId: refeicao.id,
        vaiConsumir: false,
        dataResposta: new Date()
      });
    */
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* VOLTAR */}

        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.textoVoltar}>←</Text>
        </TouchableOpacity>

        {/* CABEÇALHO */}

        <View style={styles.header}>
          <Text style={styles.data}>
            Quinta-feira, {refeicao.data}
          </Text>

          <Text style={styles.titulo}>
            {refeicao.tipo} de hoje
          </Text>
        </View>

        {/* CARD DO PRATO */}

        <View style={styles.cardPrato}>
          <View style={styles.circuloExterno}>
            <View style={styles.circuloInterno}>
              <Text style={styles.iconePrato}>
                {refeicao.icone}
              </Text>
            </View>
          </View>

          <Text style={styles.nomePrato}>
            {refeicao.nome}
          </Text>

          <Text style={styles.descricao}>
            {refeicao.descricao}
          </Text>
        </View>

        {/* PRAZO */}

        <View style={styles.prazoBox}>
          <Text style={styles.prazoIcone}>⏰</Text>

          <Text style={styles.prazoTexto}>
            Confirme até às {refeicao.horarioLimite}
          </Text>
        </View>

        {/* PERGUNTA */}

        <Text style={styles.pergunta}>
          Você vai comer{"\n"}na escola hoje?
        </Text>

        {/* BOTÕES */}

        <View style={styles.botoesContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={confirmarConsumo}
            style={[
              styles.botao,
              styles.botaoSim,
              resposta === "sim" &&
                styles.botaoSimSelecionado,
            ]}
          >
            <Text style={styles.iconeBotao}>✅</Text>

            <Text style={styles.textoBotaoSim}>
              Vou comer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={recusarConsumo}
            style={[
              styles.botao,
              styles.botaoNao,
              resposta === "nao" &&
                styles.botaoNaoSelecionado,
            ]}
          >
            <Text style={styles.iconeBotao}>✖️</Text>

            <Text style={styles.textoBotaoNao}>
              Não vou comer
            </Text>
          </TouchableOpacity>
        </View>

        {/* STATUS */}

        {resposta !== null && (
          <View style={styles.statusBox}>
            <Text style={styles.statusTexto}>
              {resposta === "sim"
                ? "✅ Refeição confirmada."
                : "✖️ Você informou que não irá consumir esta refeição."}
            </Text>
          </View>
        )}

        {/* IMPACTO */}

        <View style={styles.impactoBox}>
          <Text style={styles.percentual}>86%</Text>

          <Text style={styles.impactoTexto}>
            dos alunos já confirmaram — isso ajuda a cozinha
            a preparar a quantidade certa e evitar desperdício.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6FAF1",
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 35,
  },

  botaoVoltar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#DCE8D2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  textoVoltar: {
    fontSize: 22,
    color: "#204A37",
    fontWeight: "700",
  },

  header: {
    marginBottom: 18,
  },

  data: {
    fontSize: 13,
    color: "#5B6B5C",
    fontWeight: "600",
    marginBottom: 4,
  },

  titulo: {
    fontSize: 27,
    fontWeight: "800",
    color: "#204A37",
  },

  cardPrato: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#DCE8D2",
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
    marginBottom: 16,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  circuloExterno: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F2A93B",
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    marginBottom: 16,
  },

  circuloInterno: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    backgroundColor: "#EFF6E7",
    justifyContent: "center",
    alignItems: "center",
  },

  iconePrato: {
    fontSize: 46,
  },

  nomePrato: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E2B21",
    textAlign: "center",
    marginBottom: 8,
  },

  descricao: {
    fontSize: 13,
    color: "#5B6B5C",
    textAlign: "center",
    lineHeight: 20,
  },

  prazoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDECC9",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 15,
    marginBottom: 22,
  },

  prazoIcone: {
    fontSize: 17,
    marginRight: 8,
  },

  prazoTexto: {
    color: "#8A5A0F",
    fontWeight: "700",
    fontSize: 13,
  },

  pergunta: {
    fontSize: 20,
    color: "#1E2B21",
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 27,
    marginBottom: 18,
  },

  botoesContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },

  botao: {
    flex: 1,
    height: 110,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  botaoSim: {
    backgroundColor: "#2F6B4F",
  },

  botaoNao: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E85D4C",
  },

  botaoSimSelecionado: {
    backgroundColor: "#204A37",
    borderWidth: 3,
    borderColor: "#F2A93B",
  },

  botaoNaoSelecionado: {
    backgroundColor: "#FBE1DD",
    borderWidth: 3,
  },

  iconeBotao: {
    fontSize: 28,
    marginBottom: 7,
  },

  textoBotaoSim: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  textoBotaoNao: {
    color: "#E85D4C",
    fontSize: 15,
    fontWeight: "800",
  },

  statusBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE8D2",
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
  },

  statusTexto: {
    color: "#204A37",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 12,
  },

  impactoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6E7",
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 17,
  },

  percentual: {
    fontSize: 23,
    fontWeight: "900",
    color: "#2F6B4F",
    marginRight: 12,
  },

  impactoTexto: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: "#5B6B5C",
  },
});