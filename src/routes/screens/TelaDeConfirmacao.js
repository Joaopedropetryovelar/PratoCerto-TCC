import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import {
  database,
  auth,
} from "../../../FireBaseConfig";

export default function TelaDeConfirmacao({
  navigation,
  route,
}) {
  const params = route?.params || {};

  // ==========================================
  // DATA DE HOJE
  // ==========================================

  function pegarDataHoje() {
    const hoje = new Date();

    const ano = hoje.getFullYear();

    const mes = String(
      hoje.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
      hoje.getDate()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  const dataHoje = pegarDataHoje();

  function pegarIdDiaHoje() {
    const dias = {
      1: "seg",
      2: "ter",
      3: "qua",
      4: "qui",
      5: "sex",
    };

    return dias[new Date().getDay()] || null;
  }

  const diaHoje = pegarIdDiaHoje();

  // ==========================================
  // ALUNO
  // ==========================================

  /*
    Primeiro tenta pegar matrícula/aluno
    enviado pela tela anterior.

    Se não existir, tenta pegar o UID
    do Firebase Authentication.

    "aluno_teste" serve apenas para desenvolvimento.
  */

  const alunoId = String(
    params.alunoId ??
      params.matricula ??
      auth.currentUser?.uid ??
      "aluno_teste"
  );

  const alunoNome = String(
    params.alunoNome ??
      params.nomeAluno ??
      auth.currentUser?.displayName ??
      "Aluno"
  );

  const alunoTurma = String(
    params.turma ?? ""
  );

  // ==========================================
  // STATES
  // ==========================================

  const [refeicao, setRefeicao] =
    useState(null);

  const [resposta, setResposta] =
    useState(null);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  // ==========================================
  // FORMATAR DATA
  // ==========================================

  function formatarData(data) {
    if (!data) {
      return "";
    }

    const partes = data.split("-");

    if (partes.length !== 3) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  // ==========================================
  // DIA DA SEMANA
  // ==========================================

  function pegarDiaSemana() {
    const dias = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];

    return dias[new Date().getDay()];
  }

  // ==========================================
  // BUSCA REFEIÇÃO DO DIA
  // ==========================================

  useEffect(() => {
    if (!diaHoje) {
      setRefeicao(null);
      setCarregando(false);
      return;
    }

    const consulta = query(
      collection(database, "NomePratos"),
      where("dia", "==", diaHoje)
    );

    const cancelarListener = onSnapshot(
      consulta,
      (snapshot) => {
        const lista = [];

        snapshot.forEach((documento) => {
          const dados = documento.data();

          if (dados.ativo !== false) {
            lista.push({
              id: documento.id,
              nome:
                dados.nome ||
                "Refeição do dia",

              descricao:
                dados.descricao || "",

              tipo:
                dados.tipo || "Almoço",

              icone:
                dados.icone || "🍛",

              horarioFim:
                dados.horarioFim ||
                "12:30",

              data: dataHoje,
            });
          }
        });

        const refeicaoDoDia =
          lista.find(
            (item) =>
              item.tipo === "Almoço"
          ) ||
          lista[0] ||
          null;

        setRefeicao(
          refeicaoDoDia
        );

        setCarregando(false);
      },

      (erro) => {
        console.log(
          "Erro ao carregar refeição:",
          erro
        );

        setCarregando(false);

        Alert.alert(
          "Erro",
          "Não foi possível carregar a refeição de hoje."
        );
      }
    );

    return () =>
      cancelarListener();
  }, [diaHoje, dataHoje]);

  // ==========================================
  // BUSCA RESPOSTA DO ALUNO
  // ==========================================

  useEffect(() => {
    if (!refeicao) {
      setResposta(null);
      return;
    }

    const confirmacaoId =
      `${refeicao.id}_${alunoId}`;

    const confirmacaoRef = doc(
      database,
      "confirmacoes",
      confirmacaoId
    );

    const cancelarListener =
      onSnapshot(
        confirmacaoRef,

        (snapshot) => {
          if (!snapshot.exists()) {
            setResposta(null);
            return;
          }

          const dados =
            snapshot.data();

          if (
            dados.vaiConsumir ===
            true
          ) {
            setResposta("sim");
          } else if (
            dados.vaiConsumir ===
            false
          ) {
            setResposta("nao");
          }
        },

        (erro) => {
          console.log(
            "Erro ao buscar resposta:",
            erro
          );
        }
      );

    return () => {
      cancelarListener();
    };
  }, [refeicao?.id, alunoId]);

  // ==========================================
  // SALVA A RESPOSTA
  // ==========================================

  async function salvarResposta(
    vaiConsumir
  ) {
    if (!refeicao) {
      return;
    }

    try {
      setSalvando(true);

      const confirmacaoId =
        `${refeicao.id}_${alunoId}`;

      const confirmacaoRef = doc(
        database,
        "confirmacoes",
        confirmacaoId
      );

      await setDoc(
        confirmacaoRef,
        {
          alunoId:
            alunoId,

          alunoNome:
            alunoNome,

          turma:
            alunoTurma,

          refeicaoId:
            refeicao.id,

          refeicaoNome:
            refeicao.nome,

          tipoRefeicao:
            refeicao.tipo,

          data:
            refeicao.data,

          vaiConsumir:
            vaiConsumir,

          resposta:
            vaiConsumir
              ? "confirmado"
              : "recusado",

          dataResposta:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      if (vaiConsumir) {
        setResposta("sim");

        Alert.alert(
          "Presença confirmada! ✅",
          "Você informou que vai consumir esta refeição."
        );
      } else {
        setResposta("nao");

        Alert.alert(
          "Resposta registrada",
          "Você informou que não vai consumir esta refeição."
        );
      }
    } catch (erro) {
      console.log(
        "Erro ao salvar resposta:",
        erro
      );

      Alert.alert(
        "Erro",
        "Não foi possível registrar sua resposta."
      );
    } finally {
      setSalvando(false);
    }
  }

  // ==========================================
  // BOTÃO SIM
  // ==========================================

  function confirmarConsumo() {
    salvarResposta(true);
  }

  // ==========================================
  // BOTÃO NÃO
  // ==========================================

  function recusarConsumo() {
    salvarResposta(false);
  }

  // ==========================================
  // CARREGANDO
  // ==========================================

  if (carregando) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={
            styles.carregandoContainer
          }
        >
          <ActivityIndicator
            size="large"
            color="#2F6B4F"
          />

          <Text
            style={
              styles.carregandoTexto
            }
          >
            Carregando refeição...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // SEM REFEIÇÃO
  // ==========================================

  if (!refeicao) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={
            styles.semRefeicaoContainer
          }
        >
          <Text
            style={
              styles.semRefeicaoIcone
            }
          >
            🍽️
          </Text>

          <Text
            style={
              styles.semRefeicaoTitulo
            }
          >
            Nenhuma refeição cadastrada
          </Text>

          <Text
            style={
              styles.semRefeicaoTexto
            }
          >
            Ainda não existe uma
            refeição cadastrada para
            hoje.
          </Text>

          <TouchableOpacity
            style={
              styles.botaoVoltarGrande
            }
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text
              style={
                styles.botaoVoltarGrandeTexto
              }
            >
              Voltar
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // TELA
  // ==========================================

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* VOLTAR */}

        <TouchableOpacity
          style={
            styles.botaoVoltar
          }
          onPress={() =>
            navigation.goBack()
          }
        >
          <Text
            style={
              styles.textoVoltar
            }
          >
            ←
          </Text>
        </TouchableOpacity>

        {/* CABEÇALHO */}

        <View
          style={styles.header}
        >
          <Text
            style={styles.data}
          >
            {pegarDiaSemana()},{" "}
            {formatarData(
              refeicao.data
            )}
          </Text>

          <Text
            style={styles.titulo}
          >
            {refeicao.tipo} de hoje
          </Text>
        </View>

        {/* PRATO */}

        <View
          style={styles.cardPrato}
        >
          <View
            style={
              styles.circuloExterno
            }
          >
            <View
              style={
                styles.circuloInterno
              }
            >
              <Text
                style={
                  styles.iconePrato
                }
              >
                {refeicao.icone}
              </Text>
            </View>
          </View>

          <Text
            style={
              styles.nomePrato
            }
          >
            {refeicao.nome}
          </Text>

          <Text
            style={
              styles.descricao
            }
          >
            {refeicao.descricao}
          </Text>
        </View>

        {/* PERGUNTA */}

        <Text
          style={
            styles.pergunta
          }
        >
          Você vai comer{"\n"}
          na escola hoje?
        </Text>

        {/* BOTÕES */}

        <View
          style={
            styles.botoesContainer
          }
        >
          <TouchableOpacity
            activeOpacity={0.8}

            onPress={
              confirmarConsumo
            }

            disabled={
              salvando
            }

            style={[
              styles.botao,

              styles.botaoSim,

              resposta ===
                "sim" &&
                styles.botaoSimSelecionado,
            ]}
          >
            <Text
              style={
                styles.iconeBotao
              }
            >
              ✅
            </Text>

            <Text
              style={
                styles.textoBotaoSim
              }
            >
              Vou comer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}

            onPress={
              recusarConsumo
            }

            disabled={
              salvando
            }

            style={[
              styles.botao,

              styles.botaoNao,

              resposta ===
                "nao" &&
                styles.botaoNaoSelecionado,
            ]}
          >
            <Text
              style={
                styles.iconeBotao
              }
            >
              ✖️
            </Text>

            <Text
              style={
                styles.textoBotaoNao
              }
            >
              Não vou comer
            </Text>
          </TouchableOpacity>
        </View>

        {/* SALVANDO */}

        {salvando && (
          <Text
            style={
              styles.salvandoTexto
            }
          >
            Registrando resposta...
          </Text>
        )}

        {/* STATUS */}

        {resposta !== null && (
          <View
            style={
              styles.statusBox
            }
          >
            <Text
              style={
                styles.statusTexto
              }
            >
              {resposta === "sim"
                ? "✅ Refeição confirmada."
                : "✖️ Você informou que não irá consumir esta refeição."}
            </Text>

            <Text
              style={
                styles.statusAjuda
              }
            >
              Você pode alterar sua
              resposta quando quiser.
            </Text>
          </View>
        )}

        {/* IMPACTO */}

        <View
          style={
            styles.impactoBox
          }
        >
          <Text
            style={
              styles.percentual
            }
          >
            🍽️
          </Text>

          <Text
            style={
              styles.impactoTexto
            }
          >
            Sua resposta ajuda a
            cozinha a preparar a
            quantidade certa e evitar
            desperdício.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// ESTILOS
// ==========================================

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

  carregandoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  carregandoTexto: {
    marginTop: 12,
    color: "#5B6B5C",
    fontWeight: "600",
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
    borderColor: "#E85D4C",
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

  salvandoTexto: {
    textAlign: "center",
    color: "#5B6B5C",
    marginBottom: 12,
    fontSize: 12,
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
    fontWeight: "700",
    textAlign: "center",
    fontSize: 12,
  },

  statusAjuda: {
    color: "#5B6B5C",
    textAlign: "center",
    fontSize: 10,
    marginTop: 5,
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
    marginRight: 12,
  },

  impactoTexto: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: "#5B6B5C",
  },

  semRefeicaoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  semRefeicaoIcone: {
    fontSize: 55,
    marginBottom: 15,
  },

  semRefeicaoTitulo: {
    fontSize: 21,
    fontWeight: "800",
    color: "#204A37",
    textAlign: "center",
    marginBottom: 8,
  },

  semRefeicaoTexto: {
    fontSize: 13,
    color: "#5B6B5C",
    textAlign: "center",
    lineHeight: 20,
  },

  botaoVoltarGrande: {
    backgroundColor: "#2F6B4F",
    paddingVertical: 13,
    paddingHorizontal: 30,
    borderRadius: 14,
    marginTop: 20,
  },

  botaoVoltarGrandeTexto: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});