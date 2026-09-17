import React, {
  useEffect,
  useState,
} from "react";

import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import {
  database,
} from "../../../FireBaseConfig";

export default function TelaDeFeedbackAdmin({
  navigation,
}) {
  const [refeicao, setRefeicao] =
    useState(null);

  const [refeicoesHoje, setRefeicoesHoje] =
    useState([]);

  const [turnoEscolhido, setTurnoEscolhido] =
    useState("manha");

  const turnos = [
    { id: "manha", nome: "Manhã", icone: "☀️" },
    { id: "tarde", nome: "Tarde", icone: "🌤️" },
    { id: "noite", nome: "Noite", icone: "🌙" },
  ];

  const [
    confirmacoes,
    setConfirmacoes,
  ] = useState([]);

  const [
    feedbacks,
    setFeedbacks,
  ] = useState([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  function pegarDataHoje() {
    const hoje = new Date();

    const ano =
      hoje.getFullYear();

    const mes = String(
      hoje.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
      hoje.getDate()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  const dataHoje =
    pegarDataHoje();

  function formatarData(data) {
    if (!data) {
      return "";
    }

    const partes =
      data.split("-");

    if (
      partes.length !== 3
    ) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

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

    return dias[
      new Date().getDay()
    ];
  }

  useEffect(() => {
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
              ...dados,
              turno: dados.turno || "manha",
            });
          }
        });

        setRefeicoesHoje(lista);
      },
      (erro) => {
        console.log("Erro ao carregar refeição:", erro);
        setRefeicoesHoje([]);
      }
    );

    return () => cancelarListener();
  }, [dataHoje]);

  useEffect(() => {
    const refeicaoDoTurno =
      refeicoesHoje.find(
        (item) => (item.turno || "manha") === turnoEscolhido
      ) || null;

    setRefeicao(refeicaoDoTurno);
  }, [refeicoesHoje, turnoEscolhido]);

  useEffect(() => {
    const consulta = query(
      collection(
        database,
        "confirmacoes"
      ),

      where(
        "data",
        "==",
        dataHoje
      )
    );

    const cancelarListener =
      onSnapshot(
        consulta,

        (snapshot) => {
          const lista = [];

          snapshot.forEach(
            (documento) => {
              lista.push({
                id:
                  documento.id,

                ...documento.data(),
              });
            }
          );

          setConfirmacoes(
            lista
          );

          setCarregando(
            false
          );
        },

        (erro) => {
          console.log(
            "Erro ao buscar confirmações:",
            erro
          );

          setCarregando(
            false
          );
        }
      );

    return () => {
      cancelarListener();
    };
  }, [dataHoje]);

  useEffect(() => {
    const consulta = query(
      collection(
        database,
        "feedbacks"
      ),

      where(
        "data",
        "==",
        dataHoje
      )
    );

    const cancelarListener =
      onSnapshot(
        consulta,

        (snapshot) => {
          const lista = [];

          snapshot.forEach(
            (documento) => {
              lista.push({
                id:
                  documento.id,

                ...documento.data(),
              });
            }
          );

          lista.sort(
            (a, b) => {
              const tempoA =
                a.dataResposta
                  ?.seconds ||
                a.criadoEm
                  ?.seconds ||
                0;

              const tempoB =
                b.dataResposta
                  ?.seconds ||
                b.criadoEm
                  ?.seconds ||
                0;

              return (
                tempoB -
                tempoA
              );
            }
          );

          setFeedbacks(
            lista
          );
        },

        (erro) => {
          console.log(
            "Erro ao buscar feedbacks:",
            erro
          );
        }
      );

    return () => {
      cancelarListener();
    };
  }, [dataHoje]);

  function pegarTurnoDoRegistro(registro) {
    if (registro.turno) {
      return registro.turno;
    }

    const refeicaoRelacionada =
      refeicoesHoje.find(
        (item) => item.id === registro.refeicaoId
      );

    return refeicaoRelacionada?.turno || "manha";
  }

  const confirmacoesDoTurno =
    confirmacoes.filter(
      (item) =>
        pegarTurnoDoRegistro(item) === turnoEscolhido
    );

  const feedbacksDoTurno =
    feedbacks.filter(
      (item) =>
        pegarTurnoDoRegistro(item) === turnoEscolhido
    );

  const confirmados =
    confirmacoesDoTurno.filter(
      (item) =>
        item.vaiConsumir ===
        true
    ).length;

  const recusados =
    confirmacoesDoTurno.filter(
      (item) =>
        item.vaiConsumir ===
        false
    ).length;

  const totalRespostas =
    confirmacoesDoTurno.length;

  const porcentagemConfirmados =
    totalRespostas > 0
      ? Math.round(
          (confirmados /
            totalRespostas) *
            100
        )
      : 0;

  const porcentagemRecusados =
    totalRespostas > 0
      ? Math.round(
          (recusados /
            totalRespostas) *
            100
        )
      : 0;

  const feedbacksComNota =
    feedbacksDoTurno.filter(
      (item) =>
        typeof item.nota ===
        "number"
    );

  let notaMedia = 0;

  if (
    feedbacksComNota.length >
    0
  ) {
    const soma =
      feedbacksComNota.reduce(
        (total, item) =>
          total + item.nota,
        0
      );

    notaMedia =
      soma /
      feedbacksComNota.length;
  }

  function pegarEmoji(
    feedback
  ) {
    if (feedback.emoji) {
      return feedback.emoji;
    }

    if (
      feedback.nota === 5
    ) {
      return "😍";
    }

    if (
      feedback.nota === 4
    ) {
      return "🙂";
    }

    if (
      feedback.nota === 3
    ) {
      return "😐";
    }

    if (
      feedback.nota <= 2
    ) {
      return "🙁";
    }

    return "💬";
  }

  if (carregando) {
    return (
      <SafeAreaView
        style={estilos.tela}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F6FAF1"
        />

        <View
          style={
            estilos.carregando
          }
        >
          <ActivityIndicator
            size="large"
            color="#2F6B4F"
          />

          <Text
            style={
              estilos.textoCarregando
            }
          >
            Carregando dados...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={estilos.tela}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F6FAF1"
      />

      <ScrollView
        style={estilos.rolagem}
        contentContainerStyle={
          estilos.conteudoRolagem
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={
            estilos.cabecalho
          }
        >
          <View
            style={
              estilos.seloAdmin
            }
          >
            <Text
              style={
                estilos.textoSeloAdmin
              }
            >
              🛡️ ADMINISTRADOR
            </Text>
          </View>

          <Text
            style={
              estilos.subtituloCabecalho
            }
          >
            {pegarDiaSemana()},{" "}
            {formatarData(
              dataHoje
            )}
            {" · "}
            {turnos.find(
              (item) => item.id === turnoEscolhido
            )?.nome || "Turno"}
            {" · "}
            {refeicao?.tipo ||
              "Refeição"}
          </Text>

          <Text
            style={
              estilos.titulo
            }
          >
            Feedback dos alunos
          </Text>

          {refeicao && (
            <Text
              style={
                estilos.nomeRefeicao
              }
            >
              {refeicao.icone ||
                "🍛"}{" "}
              {refeicao.nome}
            </Text>
          )}
        </View>

        <View style={estilos.linhaTurnos}>
          {turnos.map((turno) => {
            const ativo = turno.id === turnoEscolhido;

            return (
              <TouchableOpacity
                key={turno.id}
                style={[
                  estilos.botaoTurno,
                  ativo && estilos.botaoTurnoAtivo,
                ]}
                onPress={() => setTurnoEscolhido(turno.id)}
              >
                <Text style={estilos.iconeTurno}>
                  {turno.icone}
                </Text>

                <Text
                  style={[
                    estilos.textoTurno,
                    ativo && estilos.textoTurnoAtivo,
                  ]}
                >
                  {turno.nome}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={
            estilos.linhaEstatisticas
          }
        >
          <View
            style={
              estilos.cartaoEstatistica
            }
          >
            <Text
              style={
                estilos.valorEstatistica
              }
            >
              {confirmados}
            </Text>

            <Text
              style={
                estilos.rotuloEstatistica
              }
            >
              VÃO{"\n"}
              COMER
            </Text>
          </View>

          <View
            style={
              estilos.cartaoEstatistica
            }
          >
            <Text
              style={
                estilos.valorAlerta
              }
            >
              {recusados}
            </Text>

            <Text
              style={
                estilos.rotuloEstatistica
              }
            >
              NÃO VÃO{"\n"}
              COMER
            </Text>
          </View>

          <View
            style={
              estilos.cartaoEstatistica
            }
          >
            <Text
              style={
                estilos.valorTotal
              }
            >
              {totalRespostas}
            </Text>

            <Text
              style={
                estilos.rotuloEstatistica
              }
            >
              RESPOSTAS{"\n"}
              HOJE
            </Text>
          </View>
        </View>

        <View
          style={
            estilos.cartaoAvaliacao
          }
        >
          <View
            style={
              estilos.cabecalhoAvaliacao
            }
          >
            <Text
              style={
                estilos.notaMedia
              }
            >
              {
                porcentagemConfirmados
              }
              <Text
                style={
                  estilos.notaMaxima
                }
              >
                %
              </Text>
            </Text>

            <Text
              style={
                estilos.tituloAvaliacao
              }
            >
              CONFIRMAÇÕES DA
              REFEIÇÃO DE HOJE
            </Text>
          </View>

          <View
            style={
              estilos.linhaBarra
            }
          >
            <Text
              style={
                estilos.emojiAvaliacao
              }
            >
              ✅
            </Text>

            <View
              style={
                estilos.trilhoBarra
              }
            >
              <View
                style={[
                  estilos.barraConfirmados,

                  {
                    width: `${porcentagemConfirmados}%`,
                  },
                ]}
              />
            </View>

            <Text
              style={
                estilos.porcentagem
              }
            >
              {
                porcentagemConfirmados
              }
              %
            </Text>
          </View>

          <View
            style={
              estilos.ultimaLinhaBarra
            }
          >
            <Text
              style={
                estilos.emojiAvaliacao
              }
            >
              ✖️
            </Text>

            <View
              style={
                estilos.trilhoBarra
              }
            >
              <View
                style={[
                  estilos.barraRecusados,

                  {
                    width: `${porcentagemRecusados}%`,
                  },
                ]}
              />
            </View>

            <Text
              style={
                estilos.porcentagem
              }
            >
              {
                porcentagemRecusados
              }
              %
            </Text>
          </View>
        </View>

        {feedbacksComNota.length >
          0 && (
          <View
            style={
              estilos.resumoFeedback
            }
          >
            <Text
              style={
                estilos.emojiNota
              }
            >
              ⭐
            </Text>

            <View>
              <Text
                style={
                  estilos.textoNotaTitulo
                }
              >
                Nota média
              </Text>

              <Text
                style={
                  estilos.textoNota
                }
              >
                {notaMedia.toFixed(
                  1
                )}
                /5 ·{" "}
                {
                  feedbacksComNota.length
                }{" "}
                avaliações
              </Text>
            </View>
          </View>
        )}

        <Text
          style={
            estilos.tituloSecao
          }
        >
          COMENTÁRIOS RECENTES
        </Text>

        {feedbacksDoTurno.length ===
          0 && (
          <View
            style={
              estilos.semComentarios
            }
          >
            <Text
              style={
                estilos.iconeSemComentarios
              }
            >
              💬
            </Text>

            <Text
              style={
                estilos.tituloSemComentarios
              }
            >
              Nenhum comentário ainda
            </Text>

            <Text
              style={
                estilos.textoSemComentarios
              }
            >
              Os feedbacks dos alunos
              aparecerão aqui depois
              que forem enviados.
            </Text>
          </View>
        )}

        {feedbacksDoTurno.map(
          (feedback) => (
            <View
              key={feedback.id}
              style={
                estilos.cartaoComentario
              }
            >
              <View
                style={
                  estilos.cabecalhoComentario
                }
              >
                <Text
                  style={
                    estilos.nomeAluno
                  }
                >
                  {feedback.alunoNome ||
                    "Aluno"}

                  {feedback.turma ? (
                    <Text
                      style={
                        estilos.turmaAluno
                      }
                    >
                      {" "}
                      ·{" "}
                      {
                        feedback.turma
                      }
                    </Text>
                  ) : null}
                </Text>

                <Text
                  style={
                    estilos.emojiComentario
                  }
                >
                  {pegarEmoji(
                    feedback
                  )}
                </Text>
              </View>

              {feedback.comentario ? (
                <Text
                  style={
                    estilos.textoComentario
                  }
                >
                  {
                    feedback.comentario
                  }
                </Text>
              ) : (
                <Text
                  style={
                    estilos.textoComentarioVazio
                  }
                >
                  Avaliação enviada
                  sem comentário.
                </Text>
              )}

              {Array.isArray(
                feedback.etiquetas
              ) &&
                feedback.etiquetas
                  .length > 0 && (
                  <View
                    style={
                      estilos.linhaEtiquetas
                    }
                  >
                    {feedback.etiquetas.map(
                      (
                        etiqueta,
                        index
                      ) => (
                        <View
                          key={`${feedback.id}-${index}`}
                          style={
                            estilos.etiqueta
                          }
                        >
                          <Text
                            style={
                              estilos.textoEtiqueta
                            }
                          >
                            {
                              etiqueta
                            }
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                )}
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos =
  StyleSheet.create({
    tela: {
      flex: 1,
      backgroundColor:
        "#F6FAF1",
    },

    rolagem: {
      flex: 1,
    },

    conteudoRolagem: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 24,
    },

    carregando: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
    },

    textoCarregando: {
      marginTop: 10,
      color: "#5B6B5C",
      fontWeight: "600",
    },

    cabecalho: {
      marginBottom: 18,
    },

    seloAdmin: {
      alignSelf:
        "flex-start",
      backgroundColor:
        "#204A37",
      borderRadius: 100,
      paddingHorizontal: 11,
      paddingVertical: 6,
      marginBottom: 9,
    },

    textoSeloAdmin: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.4,
    },

    subtituloCabecalho: {
      color: "#5B6B5C",
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 2,
    },

    titulo: {
      color: "#204A37",
      fontSize: 25,
      fontWeight: "800",
    },

    nomeRefeicao: {
      color: "#5B6B5C",
      fontSize: 12,
      fontWeight: "600",
      marginTop: 5,
    },

    linhaTurnos: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 14,
    },

    botaoTurno: {
      flex: 1,
      minHeight: 48,
      backgroundColor: "#FFFFFF",
      borderColor: "#DCE8D2",
      borderWidth: 1.5,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 5,
    },

    botaoTurnoAtivo: {
      backgroundColor: "#2F6B4F",
      borderColor: "#2F6B4F",
    },

    iconeTurno: {
      fontSize: 15,
    },

    textoTurno: {
      color: "#5B6B5C",
      fontSize: 11,
      fontWeight: "800",
    },

    textoTurnoAtivo: {
      color: "#FFFFFF",
    },

    linhaEstatisticas: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 14,
    },

    cartaoEstatistica: {
      flex: 1,
      minHeight: 80,
      alignItems: "center",
      justifyContent:
        "center",
      backgroundColor:
        "#FFFFFF",
      borderColor:
        "#DCE8D2",
      borderWidth: 1.5,
      borderRadius: 16,
      paddingHorizontal: 6,
      paddingVertical: 10,
    },

    valorEstatistica: {
      color: "#2F6B4F",
      fontSize: 19,
      fontWeight: "800",
      marginBottom: 3,
    },

    valorAlerta: {
      color: "#E85D4C",
      fontSize: 19,
      fontWeight: "800",
      marginBottom: 3,
    },

    valorTotal: {
      color: "#204A37",
      fontSize: 19,
      fontWeight: "800",
      marginBottom: 3,
    },

    rotuloEstatistica: {
      color: "#5B6B5C",
      fontSize: 8,
      fontWeight: "800",
      lineHeight: 11,
      textAlign: "center",
    },

    cartaoAvaliacao: {
      backgroundColor:
        "#FFFFFF",
      borderColor:
        "#DCE8D2",
      borderWidth: 1.5,
      borderRadius: 18,
      padding: 15,
      marginBottom: 14,
    },

    cabecalhoAvaliacao: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginBottom: 14,
    },

    notaMedia: {
      color: "#204A37",
      fontSize: 32,
      fontWeight: "900",
    },

    notaMaxima: {
      color: "#5B6B5C",
      fontSize: 13,
      fontWeight: "600",
    },

    tituloAvaliacao: {
      flex: 1,
      color: "#5B6B5C",
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.7,
      lineHeight: 14,
    },

    linhaBarra: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginBottom: 9,
    },

    ultimaLinhaBarra: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },

    emojiAvaliacao: {
      width: 22,
      fontSize: 17,
    },

    trilhoBarra: {
      flex: 1,
      height: 8,
      overflow: "hidden",
      backgroundColor:
        "#DCE8D2",
      borderRadius: 100,
    },

    barraConfirmados: {
      height: "100%",
      backgroundColor:
        "#2F6B4F",
      borderRadius: 100,
    },

    barraRecusados: {
      height: "100%",
      backgroundColor:
        "#E85D4C",
      borderRadius: 100,
    },

    porcentagem: {
      width: 34,
      color: "#5B6B5C",
      fontSize: 10,
      fontWeight: "700",
      textAlign: "right",
    },

    resumoFeedback: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        "#FFFFFF",
      borderColor:
        "#DCE8D2",
      borderWidth: 1.5,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 18,
    },

    emojiNota: {
      fontSize: 25,
      marginRight: 10,
    },

    textoNotaTitulo: {
      color: "#5B6B5C",
      fontSize: 10,
      fontWeight: "800",
      textTransform:
        "uppercase",
    },

    textoNota: {
      color: "#204A37",
      fontSize: 16,
      fontWeight: "800",
      marginTop: 2,
    },

    tituloSecao: {
      color: "#5B6B5C",
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.8,
      marginBottom: 10,
    },

    cartaoComentario: {
      backgroundColor:
        "#FFFFFF",
      borderColor:
        "#DCE8D2",
      borderWidth: 1.5,
      borderRadius: 16,
      padding: 13,
      marginBottom: 10,
    },

    cabecalhoComentario: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 6,
    },

    nomeAluno: {
      color: "#1E2B21",
      fontSize: 13,
      fontWeight: "800",
    },

    turmaAluno: {
      color: "#5B6B5C",
      fontSize: 11,
      fontWeight: "600",
    },

    emojiComentario: {
      fontSize: 18,
    },

    textoComentario: {
      color: "#5B6B5C",
      fontSize: 12,
      lineHeight: 18,
    },

    textoComentarioVazio: {
      color: "#8A968B",
      fontSize: 11,
      fontStyle: "italic",
    },

    linhaEtiquetas: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 9,
    },

    etiqueta: {
      backgroundColor:
        "#EFF6E7",
      borderRadius: 100,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },

    textoEtiqueta: {
      color: "#2F6B4F",
      fontSize: 9,
      fontWeight: "800",
    },

    semComentarios: {
      backgroundColor:
        "#FFFFFF",
      borderColor:
        "#DCE8D2",
      borderWidth: 1.5,
      borderRadius: 16,
      paddingVertical: 25,
      paddingHorizontal: 20,
      alignItems: "center",
    },

    iconeSemComentarios: {
      fontSize: 30,
      marginBottom: 7,
    },

    tituloSemComentarios: {
      color: "#204A37",
      fontSize: 14,
      fontWeight: "800",
    },

    textoSemComentarios: {
      color: "#5B6B5C",
      fontSize: 11,
      lineHeight: 16,
      textAlign: "center",
      marginTop: 4,
    },
  });