import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  StatusBar,
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

import { database, auth } from "../../../FireBaseConfig";

const OPCOES_EMOJI = [
  { valor: "amei", emoji: "😍", rotulo: "Amei", nota: 5 },
  { valor: "gostei", emoji: "🙂", rotulo: "Gostei", nota: 4 },
  { valor: "ok", emoji: "😐", rotulo: "Ok", nota: 3 },
  { valor: "nao_gostei", emoji: "🙁", rotulo: "Não gostei", nota: 2 },
];

const ETIQUETAS_DISPONIVEIS = [
  "Tinha bastante comida",
  "Pouco tempero",
  "Repetir esse prato",
  "Estava frio",
];

export default function TelaDeFeedbackAluno({ navigation, route }) {
  const params = route?.params || {};

  const aluno = params.aluno || params.usuario || params.user || {};

  const idRecebido =
    params.alunoId ??
    params.matricula ??
    aluno.id ??
    aluno.matricula ??
    auth.currentUser?.uid ??
    null;

  const alunoId = idRecebido ? String(idRecebido) : null;

  const alunoNome = String(
    params.alunoNome ??
      params.nomeAluno ??
      aluno.nome ??
      auth.currentUser?.displayName ??
      "Aluno"
  );

  const alunoTurma = String(params.turma ?? aluno.turma ?? "");

  const [turnoAluno, setTurnoAluno] = useState(
    params.turno ?? aluno.turno ?? null
  );

  useEffect(() => {
    const usuarioLogado = auth.currentUser;

    if (!usuarioLogado) return;

    const usuarioRef = doc(
      database,
      "usuarios",
      usuarioLogado.uid
    );

    const cancelarListener = onSnapshot(
      usuarioRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const dados = snapshot.data();
          setTurnoAluno(
            dados.turno || params.turno || aluno.turno || null
          );
        }
      },
      (erro) => {
        console.log("Erro ao carregar turno do aluno:", erro);
      }
    );

    return () => cancelarListener();
  }, []);

  function pegarDataHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  const dataHoje = pegarDataHoje();

  const [refeicao, setRefeicao] = useState(params.refeicao || null);
  const [carregandoRefeicao, setCarregandoRefeicao] = useState(
    !params.refeicao
  );
  const [carregandoFeedback, setCarregandoFeedback] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const [feedbackSalvo, setFeedbackSalvo] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);

  const [emojiEscolhido, setEmojiEscolhido] = useState("gostei");
  const [etiquetasEscolhidas, setEtiquetasEscolhidas] = useState([]);
  const [comentario, setComentario] = useState("");

  // Busca a refeição de hoje (caso não tenha vindo pela navegação).
  useEffect(() => {
    if (params.refeicao) {
      setRefeicao(params.refeicao);
      setCarregandoRefeicao(false);
      return;
    }

    const consulta = query(
      collection(database, "NomePratos"),
      where("data", "==", dataHoje)
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
              nome: dados.nome || "Refeição do dia",
              descricao: dados.descricao || "",
              tipo: dados.tipo || "Almoço",
              turno: dados.turno || "manha",
              icone: dados.icone || "🍽️",
              data: dados.data || dataHoje,
            });
          }
        });

        const refeicaoEncontrada =
          lista.find(
            (item) => (item.turno || "manha") === turnoAluno
          ) || null;

        setRefeicao(refeicaoEncontrada);
        setCarregandoRefeicao(false);
      },
      (erro) => {
        console.log("Erro ao carregar refeição:", erro);
        setRefeicao(null);
        setCarregandoRefeicao(false);
      }
    );

    return () => cancelarListener();
  }, [params.refeicao, dataHoje, turnoAluno]);

  // Escuta se o aluno já enviou uma avaliação hoje.
  useEffect(() => {
    if (!alunoId) {
      setCarregandoFeedback(false);
      return;
    }

    const feedbackId = `${dataHoje}_${alunoId}`;

    const feedbackRef = doc(database, "feedbacks", feedbackId);

    const cancelarListener = onSnapshot(
      feedbackRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const dados = snapshot.data();

          setFeedbackSalvo(dados);
          setEmojiEscolhido(dados.emojiValor || "gostei");
          setEtiquetasEscolhidas(
            Array.isArray(dados.etiquetas) ? dados.etiquetas : []
          );
          setComentario(dados.comentario || "");
        } else {
          setFeedbackSalvo(null);
        }

        setCarregandoFeedback(false);
      },
      (erro) => {
        console.log("Erro ao buscar feedback:", erro);
        setCarregandoFeedback(false);
      }
    );

    return () => cancelarListener();
  }, [alunoId, dataHoje]);

  function alternarEtiqueta(etiqueta) {
    setEtiquetasEscolhidas((atual) =>
      atual.includes(etiqueta)
        ? atual.filter((item) => item !== etiqueta)
        : [...atual, etiqueta]
    );
  }

  async function enviarAvaliacao() {
    if (!alunoId) {
      Alert.alert(
        "Aluno não identificado",
        "Não foi possível identificar o aluno."
      );
      return;
    }

    if (!turnoAluno) {
      Alert.alert(
        "Turno não cadastrado",
        "Seu turno precisa estar definido no cadastro antes de enviar um feedback."
      );
      return;
    }

    if (
      refeicao?.turno &&
      refeicao.turno !== turnoAluno
    ) {
      Alert.alert(
        "Refeição de outro turno",
        "Você só pode avaliar a refeição do seu próprio turno."
      );
      return;
    }

    if (!emojiEscolhido) {
      Alert.alert(
        "Escolha uma opção",
        "Toque em um emoji para avaliar o sabor da refeição."
      );
      return;
    }

    if (enviando) return;

    const opcaoEscolhida = OPCOES_EMOJI.find(
      (item) => item.valor === emojiEscolhido
    );

    try {
      setEnviando(true);

      const feedbackId = `${dataHoje}_${alunoId}`;

      const feedbackRef = doc(database, "feedbacks", feedbackId);

      await setDoc(
        feedbackRef,
        {
          alunoId: alunoId,
          alunoNome: alunoNome,
          turma: alunoTurma,
          turno: turnoAluno,
          refeicaoId: refeicao?.id || null,
          refeicaoNome: refeicao?.nome || null,
          data: dataHoje,
          nota: opcaoEscolhida?.nota || null,
          emoji: opcaoEscolhida?.emoji || "💬",
          emojiValor: emojiEscolhido,
          comentario: comentario.trim(),
          etiquetas: etiquetasEscolhidas,
          dataResposta: serverTimestamp(),
          criadoEm: serverTimestamp(),
        },
        { merge: true }
      );

      setModoEdicao(false);

      Alert.alert(
        "Avaliação enviada! 🙌",
        "Obrigado por ajudar a cantina a melhorar o cardápio."
      );
    } catch (erro) {
      console.log("Erro ao enviar avaliação:", erro);

      Alert.alert(
        "Erro",
        "Não foi possível enviar sua avaliação. Tente novamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (carregandoRefeicao || carregandoFeedback) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F6FAF1" />

        <View style={styles.carregandoContainer}>
          <ActivityIndicator size="large" color="#2F6B4F" />

          <Text style={styles.carregandoTexto}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const jaEnviouHoje = feedbackSalvo && !modoEdicao;

  if (jaEnviouHoje) {
    const opcaoSalva =
      OPCOES_EMOJI.find((item) => item.valor === feedbackSalvo.emojiValor) ||
      OPCOES_EMOJI.find((item) => item.nota === feedbackSalvo.nota);

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F6FAF1" />

        <View style={styles.sucessoContainer}>
          <View style={styles.sucessoSelo}>
            <Text style={styles.sucessoSeloTexto}>✅</Text>
          </View>

          <Text style={styles.sucessoTitulo}>Avaliação enviada!</Text>

          <Text style={styles.sucessoSubtitulo}>
            Obrigado por ajudar a cantina a preparar refeições melhores.
          </Text>

          <View style={styles.recapCard}>
            <View style={styles.recapLinha}>
              <Text style={styles.recapEmoji}>
                {opcaoSalva?.emoji || feedbackSalvo.emoji || "🙂"}
              </Text>

              <Text style={styles.recapTexto}>
                {opcaoSalva?.rotulo || "Avaliação registrada"}
              </Text>
            </View>

            {feedbackSalvo.comentario ? (
              <Text style={styles.recapComentario}>
                "{feedbackSalvo.comentario}"
              </Text>
            ) : null}

            {Array.isArray(feedbackSalvo.etiquetas) &&
              feedbackSalvo.etiquetas.length > 0 && (
                <View style={styles.recapEtiquetas}>
                  {feedbackSalvo.etiquetas.map((etiqueta) => (
                    <View key={etiqueta} style={styles.miniEtiqueta}>
                      <Text style={styles.miniEtiquetaTexto}>{etiqueta}</Text>
                    </View>
                  ))}
                </View>
              )}
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setModoEdicao(true)}
          >
            <Text style={styles.editarLink}>Editar resposta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6FAF1" />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greet}>Como foi o almoço?</Text>

          <Text style={styles.titulo}>Avaliar refeição</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>O que você achou do sabor?</Text>

          <Text style={styles.cardSub}>
            Sua opinião ajuda a cantina a melhorar o cardápio
          </Text>

          <View style={styles.linhaEmoji}>
            {OPCOES_EMOJI.map((opcao) => {
              const selecionado = opcao.valor === emojiEscolhido;

              return (
                <TouchableOpacity
                  key={opcao.valor}
                  activeOpacity={0.7}
                  style={[
                    styles.opcaoEmoji,
                    selecionado && styles.opcaoEmojiSelecionada,
                  ]}
                  onPress={() => setEmojiEscolhido(opcao.valor)}
                >
                  <Text style={styles.emojiTexto}>{opcao.emoji}</Text>

                  <Text
                    style={[
                      styles.emojiRotulo,
                      selecionado && styles.emojiRotuloSelecionado,
                    ]}
                  >
                    {opcao.rotulo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Quer contar mais alguma coisa?</Text>

          <View style={styles.linhaEtiquetas}>
            {ETIQUETAS_DISPONIVEIS.map((etiqueta) => {
              const ligada = etiquetasEscolhidas.includes(etiqueta);

              return (
                <TouchableOpacity
                  key={etiqueta}
                  activeOpacity={0.7}
                  style={[styles.etiqueta, ligada && styles.etiquetaLigada]}
                  onPress={() => alternarEtiqueta(etiqueta)}
                >
                  <Text
                    style={[
                      styles.etiquetaTexto,
                      ligada && styles.etiquetaTextoLigado,
                    ]}
                  >
                    {etiqueta}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.campoComentario}
            placeholder="Toque para escrever um comentário (opcional)..."
            placeholderTextColor="#5B6B5C"
            multiline
            maxLength={240}
            value={comentario}
            onChangeText={setComentario}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.botaoEnviar,
            enviando && styles.botaoEnviarDesabilitado,
          ]}
          onPress={enviarAvaliacao}
          disabled={enviando}
        >
          {enviando ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.textoBotaoEnviar}>
              {modoEdicao ? "Salvar alteração" : "Enviar avaliação"}
            </Text>
          )}
        </TouchableOpacity>

        {modoEdicao && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setModoEdicao(false)}
          >
            <Text style={styles.cancelarLink}>Cancelar edição</Text>
          </TouchableOpacity>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
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

  header: {
    marginBottom: 16,
  },

  greet: {
    fontSize: 12,
    color: "#5B6B5C",
    fontWeight: "600",
  },

  titulo: {
    fontWeight: "800",
    fontSize: 23,
    color: "#204A37",
    marginTop: 2,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#DCE8D2",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },

  cardTitulo: {
    fontWeight: "700",
    fontSize: 14.5,
    color: "#1E2B21",
    marginBottom: 2,
  },

  cardSub: {
    fontSize: 11.5,
    color: "#5B6B5C",
    marginBottom: 14,
  },

  linhaEmoji: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  opcaoEmoji: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
  },

  opcaoEmojiSelecionada: {
    backgroundColor: "#EFF6E7",
    borderColor: "#2F6B4F",
  },

  emojiTexto: {
    fontSize: 24,
  },

  emojiRotulo: {
    fontSize: 9,
    fontWeight: "700",
    color: "#5B6B5C",
    marginTop: 3,
  },

  emojiRotuloSelecionado: {
    color: "#204A37",
  },

  linhaEtiquetas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },

  etiqueta: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: "#DCE8D2",
    backgroundColor: "#FFFFFF",
  },

  etiquetaLigada: {
    backgroundColor: "#2F6B4F",
    borderColor: "#2F6B4F",
  },

  etiquetaTexto: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#5B6B5C",
  },

  etiquetaTextoLigado: {
    color: "#FFFFFF",
  },

  campoComentario: {
    marginTop: 12,
    backgroundColor: "#EFF6E7",
    borderRadius: 14,
    padding: 12,
    fontSize: 12.5,
    color: "#1E2B21",
    minHeight: 60,
    textAlignVertical: "top",
  },

  botaoEnviar: {
    backgroundColor: "#2F6B4F",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  botaoEnviarDesabilitado: {
    opacity: 0.7,
  },

  textoBotaoEnviar: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },

  cancelarLink: {
    textAlign: "center",
    color: "#5B6B5C",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 14,
  },

  sucessoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  sucessoSelo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EFF6E7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  sucessoSeloTexto: {
    fontSize: 28,
  },

  sucessoTitulo: {
    fontWeight: "800",
    fontSize: 19,
    color: "#204A37",
    marginBottom: 6,
  },

  sucessoSubtitulo: {
    fontSize: 12.5,
    color: "#5B6B5C",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
  },

  recapCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#DCE8D2",
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },

  recapLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },

  recapEmoji: {
    fontSize: 18,
  },

  recapTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E2B21",
  },

  recapComentario: {
    fontSize: 11.5,
    color: "#5B6B5C",
    fontStyle: "italic",
    marginBottom: 6,
  },

  recapEtiquetas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },

  miniEtiqueta: {
    backgroundColor: "#EFF6E7",
    borderRadius: 100,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  miniEtiquetaTexto: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#2F6B4F",
  },

  editarLink: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2F6B4F",
    padding: 6,
  },
});