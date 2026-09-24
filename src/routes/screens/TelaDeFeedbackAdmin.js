import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { database } from "../../../FireBaseConfig";

export default function TelaDeFeedbackAdmin() {
  const hoje = new Date();

  const [mesSelecionado, setMesSelecionado] = useState(
    new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  );

  const [turnoEscolhido, setTurnoEscolhido] = useState("manha");

  const [refeicoesMes, setRefeicoesMes] = useState([]);
  const [confirmacoes, setConfirmacoes] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  const [carregandoRefeicoes, setCarregandoRefeicoes] = useState(true);
  const [carregandoConfirmacoes, setCarregandoConfirmacoes] = useState(true);
  const [carregandoFeedbacks, setCarregandoFeedbacks] = useState(true);

  const turnos = [
    {
      id: "manha",
      nome: "Manhã",
      icone: "☀️",
    },
    {
      id: "tarde",
      nome: "Tarde",
      icone: "🌤️",
    },
    {
      id: "noite",
      nome: "Noite",
      icone: "🌙",
    },
  ];

  function montarData(ano, mes, dia) {
    return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(
      2,
      "0"
    )}`;
  }

  function pegarLimitesMes() {
    const ano = mesSelecionado.getFullYear();
    const mes = mesSelecionado.getMonth() + 1;

    const ultimoDia = new Date(ano, mes, 0).getDate();

    return {
      inicio: montarData(ano, mes, 1),
      fim: montarData(ano, mes, ultimoDia),
    };
  }

  const limitesMes = pegarLimitesMes();

  function nomeMesAtual() {
    const nome = mesSelecionado.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });

    return nome.charAt(0).toUpperCase() + nome.slice(1);
  }

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

  function pegarDiaSemana(data) {
    if (!data) {
      return "";
    }

    const [ano, mes, dia] = data.split("-").map(Number);

    const dataLocal = new Date(ano, mes - 1, dia);

    const dias = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];

    return dias[dataLocal.getDay()];
  }

  function voltarMes() {
    setMesSelecionado(
      new Date(
        mesSelecionado.getFullYear(),
        mesSelecionado.getMonth() - 1,
        1
      )
    );
  }

  function avancarMes() {
    const proximoMes = new Date(
      mesSelecionado.getFullYear(),
      mesSelecionado.getMonth() + 1,
      1
    );

    const mesAtual = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      1
    );

    if (proximoMes <= mesAtual) {
      setMesSelecionado(proximoMes);
    }
  }

  const mesAtualCalendario = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    1
  );

  const podeAvancar = mesSelecionado < mesAtualCalendario;

  useEffect(() => {
    setCarregandoRefeicoes(true);

    const consulta = query(
      collection(database, "NomePratos"),
      where("data", ">=", limitesMes.inicio),
      where("data", "<=", limitesMes.fim)
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

        setRefeicoesMes(lista);
        setCarregandoRefeicoes(false);
      },
      (erro) => {
        console.log("Erro ao carregar refeições do mês:", erro);
        setRefeicoesMes([]);
        setCarregandoRefeicoes(false);
      }
    );

    return () => cancelarListener();
  }, [limitesMes.inicio, limitesMes.fim]);

  useEffect(() => {
    setCarregandoConfirmacoes(true);

    const consulta = query(
      collection(database, "confirmacoes"),
      where("data", ">=", limitesMes.inicio),
      where("data", "<=", limitesMes.fim)
    );

    const cancelarListener = onSnapshot(
      consulta,
      (snapshot) => {
        const lista = [];

        snapshot.forEach((documento) => {
          lista.push({
            id: documento.id,
            ...documento.data(),
          });
        });

        setConfirmacoes(lista);
        setCarregandoConfirmacoes(false);
      },
      (erro) => {
        console.log("Erro ao buscar confirmações:", erro);
        setConfirmacoes([]);
        setCarregandoConfirmacoes(false);
      }
    );

    return () => cancelarListener();
  }, [limitesMes.inicio, limitesMes.fim]);

  useEffect(() => {
    setCarregandoFeedbacks(true);

    const consulta = query(
      collection(database, "feedbacks"),
      where("data", ">=", limitesMes.inicio),
      where("data", "<=", limitesMes.fim)
    );

    const cancelarListener = onSnapshot(
      consulta,
      (snapshot) => {
        const lista = [];

        snapshot.forEach((documento) => {
          lista.push({
            id: documento.id,
            ...documento.data(),
          });
        });

        lista.sort((a, b) => {
          return String(b.data || "").localeCompare(
            String(a.data || "")
          );
        });

        setFeedbacks(lista);
        setCarregandoFeedbacks(false);
      },
      (erro) => {
        console.log("Erro ao buscar feedbacks:", erro);
        setFeedbacks([]);
        setCarregandoFeedbacks(false);
      }
    );

    return () => cancelarListener();
  }, [limitesMes.inicio, limitesMes.fim]);

  function pegarTurnoDoRegistro(registro) {
    if (registro.turno) {
      return registro.turno;
    }

    const refeicaoRelacionada = refeicoesMes.find(
      (item) => item.id === registro.refeicaoId
    );

    return refeicaoRelacionada?.turno || "manha";
  }

  function pegarEmoji(feedback) {
    if (feedback.emoji) {
      return feedback.emoji;
    }

    if (feedback.nota === 5) {
      return "😍";
    }

    if (feedback.nota === 4) {
      return "🙂";
    }

    if (feedback.nota === 3) {
      return "😐";
    }

    if (feedback.nota <= 2) {
      return "🙁";
    }

    return "💬";
  }

  function pegarRefeicaoDoDia(data) {
    return (
      refeicoesMes.find(
        (item) =>
          item.data === data &&
          (item.turno || "manha") === turnoEscolhido
      ) || null
    );
  }

  const confirmacoesDoTurno = confirmacoes.filter(
    (item) => pegarTurnoDoRegistro(item) === turnoEscolhido
  );

  const feedbacksDoTurno = feedbacks.filter(
    (item) => pegarTurnoDoRegistro(item) === turnoEscolhido
  );

  const confirmados = confirmacoesDoTurno.filter(
    (item) => item.vaiConsumir === true
  ).length;

  const recusados = confirmacoesDoTurno.filter(
    (item) => item.vaiConsumir === false
  ).length;

  const totalRespostas = confirmacoesDoTurno.length;

  const porcentagemConfirmados =
    totalRespostas > 0
      ? Math.round((confirmados / totalRespostas) * 100)
      : 0;

  const porcentagemRecusados =
    totalRespostas > 0
      ? Math.round((recusados / totalRespostas) * 100)
      : 0;

  const feedbacksComNota = feedbacksDoTurno.filter(
    (item) => typeof item.nota === "number"
  );

  const notaMedia =
    feedbacksComNota.length > 0
      ? feedbacksComNota.reduce(
          (total, item) => total + item.nota,
          0
        ) / feedbacksComNota.length
      : 0;

  const diasComFeedback = [
    ...new Set(
      feedbacksDoTurno
        .map((item) => item.data)
        .filter(Boolean)
    ),
  ].sort((a, b) => b.localeCompare(a));

  const carregando =
    carregandoRefeicoes ||
    carregandoConfirmacoes ||
    carregandoFeedbacks;

  if (carregando) {
    return (
      <SafeAreaView style={styles.tela}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F7F9F5"
        />

        <View style={styles.carregando}>
          <ActivityIndicator
            size="large"
            color="#347A59"
          />

          <Text style={styles.textoCarregando}>
            Carregando feedbacks...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.tela}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F7F9F5"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.conteudo}
      >
        <View style={styles.cabecalho}>
          <Text style={styles.titulo}>
            Feedbacks
          </Text>

          <Text style={styles.subtitulo}>
            Acompanhe as avaliações das refeições escolares.
          </Text>
        </View>

        <View style={styles.seletorMes}>
          <TouchableOpacity
            style={styles.botaoSeta}
            onPress={voltarMes}
          >
            <Text style={styles.seta}>‹</Text>
          </TouchableOpacity>

          <View style={styles.centroMes}>
            <Text style={styles.textoPeriodo}>
              Período
            </Text>

            <Text style={styles.textoMes}>
              {nomeMesAtual()}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.botaoSeta,
              !podeAvancar && styles.botaoDesativado,
            ]}
            onPress={avancarMes}
            disabled={!podeAvancar}
          >
            <Text
              style={[
                styles.seta,
                !podeAvancar && styles.setaDesativada,
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.turnos}>
          {turnos.map((turno) => {
            const ativo = turno.id === turnoEscolhido;

            return (
              <TouchableOpacity
                key={turno.id}
                style={[
                  styles.botaoTurno,
                  ativo && styles.botaoTurnoAtivo,
                ]}
                onPress={() => setTurnoEscolhido(turno.id)}
              >
                <Text style={styles.iconeTurno}>
                  {turno.icone}
                </Text>

                <Text
                  style={[
                    styles.nomeTurno,
                    ativo && styles.nomeTurnoAtivo,
                  ]}
                >
                  {turno.nome}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.tituloSecao}>
          Resumo mensal
        </Text>

        <View style={styles.cardResumo}>
          <View style={styles.itemResumo}>
            <Text style={styles.numeroVerde}>
              {confirmados}
            </Text>

            <Text style={styles.textoResumo}>
              Vão comer
            </Text>
          </View>

          <View style={styles.divisorVertical} />

          <View style={styles.itemResumo}>
            <Text style={styles.numeroVermelho}>
              {recusados}
            </Text>

            <Text style={styles.textoResumo}>
              Recusaram
            </Text>
          </View>

          <View style={styles.divisorVertical} />

          <View style={styles.itemResumo}>
            <Text style={styles.numeroNormal}>
              {totalRespostas}
            </Text>

            <Text style={styles.textoResumo}>
              Respostas
            </Text>
          </View>
        </View>

        <Text style={styles.tituloSecao}>
          Aceitação
        </Text>

        <View style={styles.cardAceitacao}>
          <View style={styles.linhaAceitacao}>
            <View>
              <Text style={styles.rotuloAceitacao}>
                Aprovação
              </Text>

              <Text style={styles.numeroPorcentagem}>
                {porcentagemConfirmados}%
              </Text>
            </View>

            <Text style={styles.emojiGrande}>
              👍
            </Text>
          </View>

          <View style={styles.barraFundo}>
            <View
              style={[
                styles.barraAprovacao,
                {
                  width: `${porcentagemConfirmados}%`,
                },
              ]}
            />
          </View>

          <View style={styles.linhaInferior}>
            <Text style={styles.textoSecundario}>
              Rejeição
            </Text>

            <Text style={styles.valorRejeicao}>
              {porcentagemRecusados}%
            </Text>
          </View>
        </View>

        <Text style={styles.tituloSecao}>
          Avaliações
        </Text>

        <View style={styles.cardAvaliacao}>
          <View style={styles.avaliacaoPrincipal}>
            <Text style={styles.estrela}>
              ⭐
            </Text>

            <View>
              <Text style={styles.nota}>
                {feedbacksComNota.length > 0
                  ? notaMedia.toFixed(1)
                  : "-"}
              </Text>

              <Text style={styles.textoSecundario}>
                Nota média
              </Text>
            </View>
          </View>

          <View style={styles.dadosAvaliacao}>
            <View style={styles.dadoAvaliacao}>
              <Text style={styles.valorDado}>
                {feedbacksDoTurno.length}
              </Text>

              <Text style={styles.rotuloDado}>
                Avaliações
              </Text>
            </View>

            <View style={styles.dadoAvaliacao}>
              <Text style={styles.valorDado}>
                {diasComFeedback.length}
              </Text>

              <Text style={styles.rotuloDado}>
                Dias
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cabecalhoFeedbacks}>
          <View>
            <Text style={styles.tituloSecaoSemMargem}>
              Feedbacks por dia
            </Text>

            <Text style={styles.descricaoSecao}>
              Histórico de {nomeMesAtual().toLowerCase()}
            </Text>
          </View>

          <View style={styles.quantidadeFeedback}>
            <Text style={styles.quantidadeFeedbackTexto}>
              {feedbacksDoTurno.length}
            </Text>
          </View>
        </View>

        {diasComFeedback.length === 0 ? (
          <View style={styles.semFeedback}>
            <Text style={styles.semFeedbackEmoji}>
              💬
            </Text>

            <Text style={styles.semFeedbackTitulo}>
              Nenhuma avaliação
            </Text>

            <Text style={styles.semFeedbackTexto}>
              Ainda não existem feedbacks registrados neste período.
            </Text>
          </View>
        ) : (
          diasComFeedback.map((data) => {
            const feedbacksDoDia = feedbacksDoTurno.filter(
              (item) => item.data === data
            );

            const feedbacksComNotaDoDia = feedbacksDoDia.filter(
              (item) => typeof item.nota === "number"
            );

            const mediaDoDia =
              feedbacksComNotaDoDia.length > 0
                ? feedbacksComNotaDoDia.reduce(
                    (total, item) => total + item.nota,
                    0
                  ) / feedbacksComNotaDoDia.length
                : 0;

            const refeicaoDoDia = pegarRefeicaoDoDia(data);

            const nomeRefeicao =
              feedbacksDoDia.find(
                (item) => item.refeicaoNome
              )?.refeicaoNome ||
              refeicaoDoDia?.nome ||
              "Refeição";

            return (
              <View
                key={data}
                style={styles.grupoDia}
              >
                <View style={styles.topoDia}>
                  <View>
                    <Text style={styles.diaSemana}>
                      {pegarDiaSemana(data)}
                    </Text>

                    <Text style={styles.data}>
                      {formatarData(data)}
                    </Text>
                  </View>

                  <View style={styles.notaDiaContainer}>
                    <Text style={styles.notaDia}>
                      {feedbacksComNotaDoDia.length > 0
                        ? `${mediaDoDia.toFixed(1)} ⭐`
                        : "-"}
                    </Text>
                  </View>
                </View>

                <View style={styles.refeicao}>
                  <Text style={styles.refeicaoEmoji}>
                    🍽️
                  </Text>

                  <Text style={styles.refeicaoNome}>
                    {nomeRefeicao}
                  </Text>
                </View>

                {feedbacksDoDia.map((feedback) => (
                  <View
                    key={feedback.id}
                    style={styles.feedback}
                  >
                    <View style={styles.feedbackTopo}>
                      <View style={styles.aluno}>
                        <Text style={styles.nomeAluno}>
                          {feedback.alunoNome || "Aluno"}
                        </Text>

                        {feedback.turma ? (
                          <Text style={styles.turmaAluno}>
                            {feedback.turma}
                          </Text>
                        ) : null}
                      </View>

                      <View style={styles.feedbackNota}>
                        <Text style={styles.feedbackEmoji}>
                          {pegarEmoji(feedback)}
                        </Text>

                        {typeof feedback.nota === "number" && (
                          <Text style={styles.numeroNota}>
                            {feedback.nota}/5
                          </Text>
                        )}
                      </View>
                    </View>

                    {feedback.comentario ? (
                      <Text style={styles.comentario}>
                        {feedback.comentario}
                      </Text>
                    ) : (
                      <Text style={styles.semComentario}>
                        Sem comentário.
                      </Text>
                    )}

                    {Array.isArray(feedback.etiquetas) &&
                      feedback.etiquetas.length > 0 && (
                        <View style={styles.etiquetas}>
                          {feedback.etiquetas.map(
                            (etiqueta, index) => (
                              <View
                                key={`${feedback.id}-${index}`}
                                style={styles.etiqueta}
                              >
                                <Text style={styles.etiquetaTexto}>
                                  {etiqueta}
                                </Text>
                              </View>
                            )
                          )}
                        </View>
                      )}
                  </View>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: "#F7F9F5",
  },

  conteudo: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 40,
  },

  carregando: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  textoCarregando: {
    marginTop: 12,
    color: "#6C786F",
    fontSize: 14,
  },

  cabecalho: {
    marginBottom: 24,
  },

  titulo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#214C39",
  },

  subtitulo: {
    fontSize: 14,
    lineHeight: 20,
    color: "#758078",
    marginTop: 5,
  },

  seletorMes: {
    height: 70,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E1E8DE",
  },

  botaoSeta: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EFF4EC",
    alignItems: "center",
    justifyContent: "center",
  },

  botaoDesativado: {
    backgroundColor: "#F4F5F3",
  },

  seta: {
    fontSize: 28,
    color: "#347A59",
    lineHeight: 30,
  },

  setaDesativada: {
    color: "#C5CBC6",
  },

  centroMes: {
    flex: 1,
    alignItems: "center",
  },

  textoPeriodo: {
    fontSize: 10,
    color: "#98A099",
    textTransform: "uppercase",
    fontWeight: "700",
  },

  textoMes: {
    fontSize: 16,
    color: "#214C39",
    fontWeight: "800",
    marginTop: 2,
  },

  turnos: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
  },

  botaoTurno: {
    flex: 1,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E1E8DE",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },

  botaoTurnoAtivo: {
    backgroundColor: "#347A59",
    borderColor: "#347A59",
  },

  iconeTurno: {
    fontSize: 14,
  },

  nomeTurno: {
    fontSize: 12,
    fontWeight: "700",
    color: "#657168",
  },

  nomeTurnoAtivo: {
    color: "#FFFFFF",
  },

  tituloSecao: {
    fontSize: 13,
    fontWeight: "800",
    color: "#425148",
    marginBottom: 10,
  },

  tituloSecaoSemMargem: {
    fontSize: 13,
    fontWeight: "800",
    color: "#425148",
  },

  cardResumo: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E1E8DE",
    paddingVertical: 20,
    flexDirection: "row",
    marginBottom: 26,
  },

  itemResumo: {
    flex: 1,
    alignItems: "center",
  },

  divisorVertical: {
    width: 1,
    backgroundColor: "#E9EDE8",
  },

  numeroVerde: {
    fontSize: 24,
    fontWeight: "800",
    color: "#347A59",
  },

  numeroVermelho: {
    fontSize: 24,
    fontWeight: "800",
    color: "#D8655B",
  },

  numeroNormal: {
    fontSize: 24,
    fontWeight: "800",
    color: "#33453A",
  },

  textoResumo: {
    fontSize: 10,
    color: "#8A948C",
    marginTop: 4,
  },

  cardAceitacao: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E1E8DE",
    padding: 18,
    marginBottom: 26,
  },

  linhaAceitacao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rotuloAceitacao: {
    fontSize: 11,
    color: "#7D887F",
    marginBottom: 2,
  },

  numeroPorcentagem: {
    fontSize: 32,
    fontWeight: "800",
    color: "#214C39",
  },

  emojiGrande: {
    fontSize: 30,
  },

  barraFundo: {
    width: "100%",
    height: 9,
    borderRadius: 10,
    backgroundColor: "#E8EEE7",
    overflow: "hidden",
    marginTop: 16,
  },

  barraAprovacao: {
    height: "100%",
    backgroundColor: "#347A59",
    borderRadius: 10,
  },

  linhaInferior: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  textoSecundario: {
    fontSize: 11,
    color: "#8A948C",
  },

  valorRejeicao: {
    fontSize: 11,
    color: "#D8655B",
    fontWeight: "700",
  },

  cardAvaliacao: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E1E8DE",
    padding: 18,
    marginBottom: 30,
  },

  avaliacaoPrincipal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },

  estrela: {
    fontSize: 28,
  },

  nota: {
    fontSize: 28,
    fontWeight: "800",
    color: "#214C39",
  },

  dadosAvaliacao: {
    flexDirection: "row",
    gap: 10,
  },

  dadoAvaliacao: {
    flex: 1,
    backgroundColor: "#F7F9F5",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },

  valorDado: {
    fontSize: 17,
    fontWeight: "800",
    color: "#347A59",
  },

  rotuloDado: {
    fontSize: 10,
    color: "#8A948C",
    marginTop: 3,
  },

  cabecalhoFeedbacks: {
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  descricaoSecao: {
    fontSize: 11,
    color: "#929A94",
    marginTop: 3,
  },

  quantidadeFeedback: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E8F1E6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  quantidadeFeedbackTexto: {
    fontWeight: "800",
    color: "#347A59",
    fontSize: 12,
  },

  grupoDia: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E1E8DE",
    padding: 16,
    marginBottom: 14,
  },

  topoDia: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  diaSemana: {
    fontSize: 15,
    fontWeight: "800",
    color: "#253C2F",
  },

  data: {
    fontSize: 10,
    color: "#929B94",
    marginTop: 2,
  },

  notaDiaContainer: {
    backgroundColor: "#F2F6EE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  notaDia: {
    fontSize: 11,
    fontWeight: "700",
    color: "#536158",
  },

  refeicao: {
    backgroundColor: "#F7F9F5",
    borderRadius: 12,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  refeicaoEmoji: {
    fontSize: 16,
    marginRight: 8,
  },

  refeicaoNome: {
    fontSize: 12,
    fontWeight: "700",
    color: "#536158",
  },

  feedback: {
    borderTopWidth: 1,
    borderTopColor: "#EEF1ED",
    paddingTop: 14,
    marginTop: 4,
    marginBottom: 8,
  },

  feedbackTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  aluno: {
    flex: 1,
  },

  nomeAluno: {
    fontSize: 13,
    fontWeight: "700",
    color: "#28382E",
  },

  turmaAluno: {
    fontSize: 10,
    color: "#939C95",
    marginTop: 2,
  },

  feedbackNota: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  feedbackEmoji: {
    fontSize: 17,
  },

  numeroNota: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6F7A72",
  },

  comentario: {
    marginTop: 9,
    fontSize: 12,
    lineHeight: 18,
    color: "#667169",
  },

  semComentario: {
    marginTop: 9,
    fontSize: 11,
    fontStyle: "italic",
    color: "#A0A7A1",
  },

  etiquetas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },

  etiqueta: {
    backgroundColor: "#EDF4E9",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },

  etiquetaTexto: {
    fontSize: 9,
    fontWeight: "700",
    color: "#47705A",
  },

  semFeedback: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E1E8DE",
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 24,
  },

  semFeedbackEmoji: {
    fontSize: 30,
    marginBottom: 10,
  },

  semFeedbackTitulo: {
    fontSize: 14,
    fontWeight: "800",
    color: "#33443A",
  },

  semFeedbackTexto: {
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    color: "#929B94",
    marginTop: 5,
  },
});