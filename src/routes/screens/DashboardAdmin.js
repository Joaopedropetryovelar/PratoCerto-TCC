import React, { useEffect, useMemo, useState } from "react";
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

const TURNOS = [
  { id: "todos", nome: "Todos" },
  { id: "manha", nome: "Manhã", icone: "☀️" },
  { id: "tarde", nome: "Tarde", icone: "🌤️" },
  { id: "noite", nome: "Noite", icone: "🌙" },
];

function pegarDataHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarDataCompleta() {
  const hoje = new Date();

  const texto = hoje.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function nomeDoTurno(turno) {
  if (turno === "tarde") return "Tarde";
  if (turno === "noite") return "Noite";
  return "Manhã";
}

function iconeDoTurno(turno) {
  if (turno === "tarde") return "🌤️";
  if (turno === "noite") return "🌙";
  return "☀️";
}

export default function DashboardAdmin({ navigation }) {
  const dataHoje = pegarDataHoje();

  const [turnoEscolhido, setTurnoEscolhido] = useState("todos");
  const [refeicoes, setRefeicoes] = useState([]);
  const [confirmacoes, setConfirmacoes] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  const [carregandoRefeicoes, setCarregandoRefeicoes] = useState(true);
  const [carregandoConfirmacoes, setCarregandoConfirmacoes] = useState(true);
  const [carregandoFeedbacks, setCarregandoFeedbacks] = useState(true);

  useEffect(() => {
    const consulta = query(
      collection(database, "NomePratos"),
      where("data", "==", dataHoje)
    );

    const parar = onSnapshot(
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

        const ordemTurnos = {
          manha: 1,
          tarde: 2,
          noite: 3,
        };

        lista.sort(
          (a, b) =>
            (ordemTurnos[a.turno] || 4) -
            (ordemTurnos[b.turno] || 4)
        );

        setRefeicoes(lista);
        setCarregandoRefeicoes(false);
      },
      (erro) => {
        console.log("Erro ao carregar refeições do dashboard:", erro);
        setRefeicoes([]);
        setCarregandoRefeicoes(false);
      }
    );

    return () => parar();
  }, [dataHoje]);

  useEffect(() => {
    const consulta = query(
      collection(database, "confirmacoes"),
      where("data", "==", dataHoje)
    );

    const parar = onSnapshot(
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
        console.log("Erro ao carregar confirmações do dashboard:", erro);
        setConfirmacoes([]);
        setCarregandoConfirmacoes(false);
      }
    );

    return () => parar();
  }, [dataHoje]);

  useEffect(() => {
    const consulta = query(
      collection(database, "feedbacks"),
      where("data", "==", dataHoje)
    );

    const parar = onSnapshot(
      consulta,
      (snapshot) => {
        const lista = [];

        snapshot.forEach((documento) => {
          lista.push({
            id: documento.id,
            ...documento.data(),
          });
        });

        setFeedbacks(lista);
        setCarregandoFeedbacks(false);
      },
      (erro) => {
        console.log("Erro ao carregar feedbacks do dashboard:", erro);
        setFeedbacks([]);
        setCarregandoFeedbacks(false);
      }
    );

    return () => parar();
  }, [dataHoje]);

  const filtrarPorTurno = (lista) => {
    if (turnoEscolhido === "todos") {
      return lista;
    }

    return lista.filter(
      (item) => (item.turno || "manha") === turnoEscolhido
    );
  };

  const refeicoesFiltradas = filtrarPorTurno(refeicoes);
  const confirmacoesFiltradas = filtrarPorTurno(confirmacoes);
  const feedbacksFiltrados = filtrarPorTurno(feedbacks);

  const confirmados = confirmacoesFiltradas.filter(
    (item) => item.vaiConsumir === true
  ).length;

  const recusados = confirmacoesFiltradas.filter(
    (item) => item.vaiConsumir === false
  ).length;

  const totalRespostas = confirmados + recusados;

  const taxaConfirmacao =
    totalRespostas > 0
      ? Math.round((confirmados / totalRespostas) * 100)
      : 0;

  const feedbacksComNota = feedbacksFiltrados.filter(
    (item) => typeof item.nota === "number"
  );

  const notaMedia =
    feedbacksComNota.length > 0
      ? feedbacksComNota.reduce(
          (total, item) => total + item.nota,
          0
        ) / feedbacksComNota.length
      : 0;

  const comentariosRecentes = useMemo(() => {
    return feedbacksFiltrados
      .filter((item) => item.comentario && item.comentario.trim())
      .sort((a, b) => {
        const tempoA = a.dataResposta?.seconds || 0;
        const tempoB = b.dataResposta?.seconds || 0;
        return tempoB - tempoA;
      })
      .slice(0, 2);
  }, [feedbacksFiltrados]);

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

        <View style={styles.areaCarregando}>
          <ActivityIndicator size="large" color="#347A59" />
          <Text style={styles.textoCarregando}>
            Carregando painel...
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
          <View>
            <Text style={styles.titulo}>Painel administrativo</Text>
            <Text style={styles.dataHoje}>{formatarDataCompleta()}</Text>
          </View>

          <View style={styles.iconeAdmin}>
            <Text style={styles.iconeAdminTexto}>🛡️</Text>
          </View>
        </View>

        <Text style={styles.textoIntroducao}>
          Acompanhe as refeições, confirmações e avaliações de hoje.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listaTurnos}
        >
          {TURNOS.map((turno) => {
            const ativo = turno.id === turnoEscolhido;

            return (
              <TouchableOpacity
                key={turno.id}
                style={[
                  styles.botaoTurno,
                  ativo && styles.botaoTurnoAtivo,
                ]}
                activeOpacity={0.8}
                onPress={() => setTurnoEscolhido(turno.id)}
              >
                {turno.icone ? (
                  <Text style={styles.iconeTurno}>{turno.icone}</Text>
                ) : null}

                <Text
                  style={[
                    styles.textoTurno,
                    ativo && styles.textoTurnoAtivo,
                  ]}
                >
                  {turno.nome}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.tituloSecao}>Resumo de hoje</Text>

        <View style={styles.linhaCards}>
          <View style={styles.cardNumero}>
            <Text style={styles.rotuloCard}>Confirmados</Text>
            <Text style={styles.numeroVerde}>{confirmados}</Text>
            <Text style={styles.rodapeCard}>vão realizar a refeição</Text>
          </View>

          <View style={styles.cardNumero}>
            <Text style={styles.rotuloCard}>Recusaram</Text>
            <Text style={styles.numeroVermelho}>{recusados}</Text>
            <Text style={styles.rodapeCard}>não vão realizar a refeição</Text>
          </View>
        </View>

        <View style={styles.linhaCards}>
          <View style={styles.cardNumero}>
            <Text style={styles.rotuloCard}>Confirmação</Text>
            <Text style={styles.numeroEscuro}>{taxaConfirmacao}%</Text>
            <Text style={styles.rodapeCard}>das respostas recebidas</Text>
          </View>

          <View style={styles.cardNumero}>
            <Text style={styles.rotuloCard}>Nota média</Text>
            <Text style={styles.numeroEscuro}>
              {feedbacksComNota.length > 0 ? notaMedia.toFixed(1) : "-"}
            </Text>
            <Text style={styles.rodapeCard}>
              {feedbacksFiltrados.length} avaliações hoje
            </Text>
          </View>
        </View>

        <View style={styles.cardPlanejamento}>
          <View style={styles.planejamentoTopo}>
            <View>
              <Text style={styles.planejamentoTitulo}>
                Planejamento de hoje
              </Text>
              <Text style={styles.planejamentoDescricao}>
                Dados atuais para auxiliar a preparação das refeições.
              </Text>
            </View>

            <Text style={styles.planejamentoEmoji}>🍽️</Text>
          </View>

          <View style={styles.planejamentoLinha}>
            <Text style={styles.planejamentoRotulo}>
              Respostas recebidas
            </Text>
            <Text style={styles.planejamentoValor}>{totalRespostas}</Text>
          </View>

          <View style={styles.separador} />

          <View style={styles.planejamentoLinha}>
            <Text style={styles.planejamentoRotulo}>
              Refeições cadastradas
            </Text>
            <Text style={styles.planejamentoValor}>
              {refeicoesFiltradas.length}
            </Text>
          </View>
        </View>

        <View style={styles.cabecalhoSecaoComAcao}>
          <Text style={styles.tituloSecaoSemMargem}>Refeições de hoje</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("CardapioAdmin")}
          >
            <Text style={styles.linkAcao}>Gerenciar</Text>
          </TouchableOpacity>
        </View>

        {refeicoesFiltradas.length === 0 ? (
          <View style={styles.estadoVazio}>
            <Text style={styles.estadoVazioEmoji}>🍽️</Text>
            <Text style={styles.estadoVazioTitulo}>
              Nenhuma refeição cadastrada
            </Text>
            <Text style={styles.estadoVazioTexto}>
              Cadastre o cardápio para começar a receber confirmações.
            </Text>

            <TouchableOpacity
              style={styles.botaoEstadoVazio}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("CardapioAdmin")}
            >
              <Text style={styles.botaoEstadoVazioTexto}>
                Ir para o cardápio
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          refeicoesFiltradas.map((refeicao) => (
            <View key={refeicao.id} style={styles.cardRefeicao}>
              <View style={styles.iconeRefeicao}>
                <Text style={styles.iconeRefeicaoTexto}>
                  {refeicao.icone || "🍽️"}
                </Text>
              </View>

              <View style={styles.infoRefeicao}>
                <Text style={styles.nomeRefeicao}>{refeicao.nome}</Text>

                <View style={styles.linhaDetalhesRefeicao}>
                  <Text style={styles.turnoRefeicao}>
                    {iconeDoTurno(refeicao.turno)} {nomeDoTurno(refeicao.turno)}
                  </Text>

                  {refeicao.horarioLimite ? (
                    <Text style={styles.horarioRefeicao}>
                      Confirmação até {refeicao.horarioLimite}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          ))
        )}

        <View style={styles.cabecalhoSecaoComAcao}>
          <Text style={styles.tituloSecaoSemMargem}>Feedback recente</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("FeedbackAdmin")}
          >
            <Text style={styles.linkAcao}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {comentariosRecentes.length === 0 ? (
          <View style={styles.feedbackVazio}>
            <Text style={styles.feedbackVazioTexto}>
              Ainda não existem comentários registrados hoje.
            </Text>
          </View>
        ) : (
          comentariosRecentes.map((feedback) => (
            <View key={feedback.id} style={styles.cardComentario}>
              <View style={styles.comentarioTopo}>
                <Text style={styles.nomeAluno}>
                  {feedback.alunoNome || "Aluno"}
                </Text>

                <Text style={styles.notaComentario}>
                  {typeof feedback.nota === "number"
                    ? `${feedback.nota}/5 ⭐`
                    : "💬"}
                </Text>
              </View>

              <Text style={styles.textoComentario}>
                {feedback.comentario}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.tituloSecao}>Acesso rápido</Text>

        <TouchableOpacity
          style={styles.acaoRapida}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("CardapioAdmin")}
        >
          <View style={styles.acaoIcone}>
            <Text style={styles.acaoIconeTexto}>🍽️</Text>
          </View>

          <View style={styles.acaoInfo}>
            <Text style={styles.acaoTitulo}>Gerenciar cardápio</Text>
            <Text style={styles.acaoDescricao}>
              Adicione ou edite as refeições da semana.
            </Text>
          </View>

          <Text style={styles.acaoSeta}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.acaoRapida}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("FeedbackAdmin")}
        >
          <View style={styles.acaoIcone}>
            <Text style={styles.acaoIconeTexto}>💬</Text>
          </View>

          <View style={styles.acaoInfo}>
            <Text style={styles.acaoTitulo}>Relatórios e feedbacks</Text>
            <Text style={styles.acaoDescricao}>
              Consulte avaliações e o histórico mensal.
            </Text>
          </View>

          <Text style={styles.acaoSeta}>›</Text>
        </TouchableOpacity>
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
    paddingTop: 20,
    paddingBottom: 36,
  },

  areaCarregando: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  textoCarregando: {
    marginTop: 10,
    fontSize: 13,
    color: "#748078",
  },

  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  titulo: {
    fontSize: 25,
    fontWeight: "800",
    color: "#214C39",
  },

  dataHoje: {
    marginTop: 4,
    fontSize: 12,
    color: "#89938C",
  },

  iconeAdmin: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2E5",
  },

  iconeAdminTexto: {
    fontSize: 22,
  },

  textoIntroducao: {
    marginTop: 18,
    fontSize: 13,
    lineHeight: 19,
    color: "#66736A",
  },

  listaTurnos: {
    gap: 8,
    paddingVertical: 20,
  },

  botaoTurno: {
    minWidth: 82,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E7DD",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  botaoTurnoAtivo: {
    backgroundColor: "#347A59",
    borderColor: "#347A59",
  },

  iconeTurno: {
    fontSize: 13,
  },

  textoTurno: {
    fontSize: 11,
    fontWeight: "700",
    color: "#657168",
  },

  textoTurnoAtivo: {
    color: "#FFFFFF",
  },

  tituloSecao: {
    fontSize: 13,
    fontWeight: "800",
    color: "#405047",
    marginBottom: 10,
    marginTop: 4,
  },

  tituloSecaoSemMargem: {
    fontSize: 13,
    fontWeight: "800",
    color: "#405047",
  },

  linhaCards: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },

  cardNumero: {
    flex: 1,
    minHeight: 126,
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E0E7DD",
    padding: 15,
    justifyContent: "space-between",
  },

  rotuloCard: {
    fontSize: 11,
    fontWeight: "700",
    color: "#78837B",
  },

  numeroVerde: {
    fontSize: 27,
    fontWeight: "900",
    color: "#347A59",
  },

  numeroVermelho: {
    fontSize: 27,
    fontWeight: "900",
    color: "#D8655B",
  },

  numeroEscuro: {
    fontSize: 27,
    fontWeight: "900",
    color: "#274536",
  },

  rodapeCard: {
    fontSize: 9,
    lineHeight: 13,
    color: "#98A099",
  },

  cardPlanejamento: {
    backgroundColor: "#214C39",
    borderRadius: 18,
    padding: 18,
    marginTop: 4,
    marginBottom: 28,
  },

  planejamentoTopo: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  planejamentoTitulo: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  planejamentoDescricao: {
    marginTop: 4,
    maxWidth: 260,
    fontSize: 10,
    lineHeight: 15,
    color: "#CFE0D5",
  },

  planejamentoEmoji: {
    fontSize: 24,
  },

  planejamentoLinha: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  planejamentoRotulo: {
    fontSize: 11,
    color: "#D7E5DC",
  },

  planejamentoValor: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  separador: {
    height: 1,
    backgroundColor: "#426453",
    marginVertical: 12,
  },

  cabecalhoSecaoComAcao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  linkAcao: {
    fontSize: 11,
    fontWeight: "800",
    color: "#347A59",
  },

  cardRefeicao: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E7DD",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  iconeRefeicao: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#F0F5EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  iconeRefeicaoTexto: {
    fontSize: 22,
  },

  infoRefeicao: {
    flex: 1,
  },

  nomeRefeicao: {
    fontSize: 13,
    fontWeight: "800",
    color: "#293C31",
  },

  linhaDetalhesRefeicao: {
    marginTop: 5,
    gap: 2,
  },

  turnoRefeicao: {
    fontSize: 10,
    color: "#68756C",
  },

  horarioRefeicao: {
    fontSize: 9,
    color: "#939C95",
  },

  estadoVazio: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E0E7DD",
    paddingHorizontal: 24,
    paddingVertical: 28,
    marginBottom: 28,
  },

  estadoVazioEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },

  estadoVazioTitulo: {
    fontSize: 13,
    fontWeight: "800",
    color: "#33443A",
  },

  estadoVazioTexto: {
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    color: "#8E9891",
    marginTop: 4,
  },

  botaoEstadoVazio: {
    marginTop: 14,
    backgroundColor: "#347A59",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  botaoEstadoVazioTexto: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  feedbackVazio: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E7DD",
    padding: 16,
    marginBottom: 28,
  },

  feedbackVazioTexto: {
    fontSize: 11,
    color: "#8C9690",
  },

  cardComentario: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E7DD",
    padding: 14,
    marginBottom: 9,
  },

  comentarioTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  nomeAluno: {
    fontSize: 11,
    fontWeight: "800",
    color: "#33443A",
  },

  notaComentario: {
    fontSize: 10,
    fontWeight: "700",
    color: "#66736A",
  },

  textoComentario: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 17,
    color: "#66736A",
  },

  acaoRapida: {
    minHeight: 70,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E7DD",
    padding: 12,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
  },

  acaoIcone: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: "#EFF5EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  acaoIconeTexto: {
    fontSize: 20,
  },

  acaoInfo: {
    flex: 1,
  },

  acaoTitulo: {
    fontSize: 12,
    fontWeight: "800",
    color: "#33443A",
  },

  acaoDescricao: {
    fontSize: 9,
    lineHeight: 13,
    color: "#8B958E",
    marginTop: 3,
  },

  acaoSeta: {
    fontSize: 26,
    color: "#8C9990",
    marginLeft: 8,
  },
});
