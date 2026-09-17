import React, { useEffect, useState } from "react";

import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  database,
  auth,
} from "../../../FireBaseConfig";


function formatarDataBanco(data) {
  const ano = data.getFullYear();

  const mes = String(
    data.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    data.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}


function gerarDiasDaSemanaAtual() {
  const hoje = new Date();

  const diaDaSemana =
    hoje.getDay();

  const diferencaParaSegunda =
    diaDaSemana === 0
      ? -6
      : 1 - diaDaSemana;

  const segunda =
    new Date(hoje);

  segunda.setHours(
    12,
    0,
    0,
    0
  );

  segunda.setDate(
    hoje.getDate() +
      diferencaParaSegunda
  );

  const nomesDosDias = [
    "Seg",
    "Ter",
    "Qua",
    "Qui",
    "Sex",
  ];

  const diasDaSemana = [];

  for (
    let i = 0;
    i < 5;
    i++
  ) {
    const data =
      new Date(segunda);

    data.setDate(
      segunda.getDate() + i
    );

    diasDaSemana.push({
      id: formatarDataBanco(
        data
      ),

      nome:
        nomesDosDias[i],

      numero:
        String(
          data.getDate()
        ).padStart(
          2,
          "0"
        ),

      data: data,
    });
  }

  return diasDaSemana;
}


function formatarTituloDoDia(
  data
) {
  if (!data) {
    return "";
  }

  const nomesDosDias = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];

  const nomesDosMeses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];

  const nomeDia =
    nomesDosDias[
      data.getDay()
    ];

  const numeroDia =
    String(
      data.getDate()
    ).padStart(
      2,
      "0"
    );

  const nomeMes =
    nomesDosMeses[
      data.getMonth()
    ];

  return `${nomeDia}, ${numeroDia} de ${nomeMes}`;
}


function pegarDiaInicial(
  dias
) {
  const hoje =
    formatarDataBanco(
      new Date()
    );

  const diaAtual =
    dias.find(
      (dia) =>
        dia.id === hoje
    );

  if (diaAtual) {
    return diaAtual.id;
  }

  return dias[0].id;
}


const turnos = [
  { id: "manha", nome: "Manhã", tipo: "Lanche da manhã", icone: "☀️" },
  { id: "tarde", nome: "Tarde", tipo: "Lanche da tarde", icone: "🌤️" },
  { id: "noite", nome: "Noite", tipo: "Lanche da noite", icone: "🌙" },
];


export default function TelaHomeAluno({
  navigation,
  route,
}) {
  const params =
    route?.params || {};

  /*
    Tenta pegar o aluno
    independentemente de como
    ele veio da tela de login.
  */
  const aluno =
    params.aluno ||
    params.usuario ||
    params.user ||
    {};


  const alunoId =
    params.alunoId ??
    params.matricula ??
    aluno.id ??
    aluno.matricula ??
    auth.currentUser?.uid ??
    null;


  const alunoNome =
    params.alunoNome ??
    params.nomeAluno ??
    aluno.nome ??
    auth.currentUser
      ?.displayName ??
    "Aluno";


  const alunoTurma =
    params.turma ??
    aluno.turma ??
    "";


  const dias =
    gerarDiasDaSemanaAtual();


  const [
    diaEscolhido,
    setDiaEscolhido,
  ] = useState(
    () =>
      pegarDiaInicial(
        dias
      )
  );


  const [
    refeicoesPorDia,
    setRefeicoesPorDia,
  ] = useState({});


  const [
    turnoEscolhido,
    setTurnoEscolhido,
  ] = useState("manha");

  const [
    turnoAluno,
    setTurnoAluno,
  ] = useState(
    params.turno ??
      aluno.turno ??
      null
  );

  const [
    carregandoTurno,
    setCarregandoTurno,
  ] = useState(true);


  useEffect(() => {
    const usuarioLogado =
      auth.currentUser;

    if (!usuarioLogado) {
      setCarregandoTurno(false);
      return;
    }

    const usuarioRef = doc(
      database,
      "usuarios",
      usuarioLogado.uid
    );

    const pararDeEscutarUsuario =
      onSnapshot(
        usuarioRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const dados =
              snapshot.data();

            const turnoSalvo =
              dados.turno ||
              params.turno ||
              aluno.turno ||
              null;

            setTurnoAluno(
              turnoSalvo
            );

            if (turnoSalvo) {
              setTurnoEscolhido(
                turnoSalvo
              );
            }
          }

          setCarregandoTurno(
            false
          );
        },
        (erro) => {
          console.log(
            "Erro ao carregar turno do aluno:",
            erro
          );

          setCarregandoTurno(
            false
          );
        }
      );

    return () => {
      pararDeEscutarUsuario();
    };
  }, []);


  useEffect(() => {
    const pararDeEscutar =
      onSnapshot(
        collection(
          database,
          "NomePratos"
        ),

        (snapshot) => {
          const refeicoesDoBanco =
            {};

          dias.forEach(
            (dia) => {
              refeicoesDoBanco[
                dia.id
              ] = [];
            }
          );


          snapshot.forEach(
            (documento) => {
              const dados =
                documento.data();

              const dataDaRefeicao =
                dados.data;

              if (
                refeicoesDoBanco[
                  dataDaRefeicao
                ]
              ) {
                refeicoesDoBanco[
                  dataDaRefeicao
                ].push({
                  id:
                    documento.id,

                  nome:
                    dados.nome,

                  tipo:
                    dados.tipo ||
                    "Almoço",

                  turno:
                    dados.turno ||
                    "manha",

                  icone:
                    dados.icone ||
                    "🍽️",

                  descricao:
                    dados.descricao ||
                    "",

                  horarioLimite:
                    dados.horarioLimite ||
                    "09:00",

                  horarioFim:
                    dados.horarioFim ||
                    "12:30",

                  ativo:
                    dados.ativo !==
                    false,

                  data:
                    dataDaRefeicao,
                });
              }
            }
          );

          setRefeicoesPorDia(
            refeicoesDoBanco
          );
        },

        (erro) => {
          console.log(
            "Erro ao buscar refeições:",
            erro
          );
        }
      );


    return () => {
      pararDeEscutar();
    };

  }, []);


  const listaDoDia =
    refeicoesPorDia[
      diaEscolhido
    ] || [];


  const listaDoTurno =
    turnoAluno
      ? listaDoDia.filter(
          (refeicao) =>
            (refeicao.turno ||
              "manha") ===
            turnoAluno
        )
      : [];


  const turnoSelecionado =
    turnos.find(
      (turno) =>
        turno.id ===
        turnoAluno
    );


  const diaSelecionado =
    dias.find(
      (dia) =>
        dia.id ===
        diaEscolhido
    );


  return (
    <SafeAreaView
      style={estilos.tela}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F6FAF1"
      />

      <ScrollView
        style={
          estilos.conteudo
        }
        contentContainerStyle={
          estilos.conteudoInterno
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
          <Text
            style={
              estilos.saudacao
            }
          >
            Bom dia, {alunoNome} 👋
          </Text>

          <Text
            style={
              estilos.titulo
            }
          >
            🌿 Cardápio da semana
          </Text>
        </View>


        <View
          style={
            estilos.linhaDias
          }
        >
          {dias.map(
            (item) => {

              const ativo =
                item.id ===
                diaEscolhido;

              const temRefeicao =
                (
                  refeicoesPorDia[
                    item.id
                  ] || []
                ).length > 0;


              return (
                <TouchableOpacity
                  key={
                    item.id
                  }
                  style={[
                    estilos.dia,

                    ativo &&
                      estilos.diaAtivo,
                  ]}
                  onPress={() =>
                    setDiaEscolhido(
                      item.id
                    )
                  }
                >
                  <Text
                    style={[
                      estilos.diaAbrev,

                      ativo &&
                        estilos.textoClaro,
                    ]}
                  >
                    {item.nome}
                  </Text>

                  <Text
                    style={[
                      estilos.diaNumero,

                      ativo &&
                        estilos.textoClaro,
                    ]}
                  >
                    {item.numero}
                  </Text>

                  {temRefeicao && (
                    <View
                      style={[
                        estilos.bolinha,

                        ativo &&
                          estilos.bolinhaAtiva,
                      ]}
                    />
                  )}

                </TouchableOpacity>
              );
            }
          )}
        </View>


        <Text
          style={
            estilos.rotuloSecao
          }
        >
          {formatarTituloDoDia(
            diaSelecionado?.data
          )}
        </Text>


        <View
          style={
            estilos.linhaTurnos
          }
        >
          {turnos.map(
            (turno) => {
              const ativo =
                turno.id ===
                turnoAluno;

              const bloqueado =
                turnoAluno &&
                turno.id !==
                  turnoAluno;

              return (
                <TouchableOpacity
                  key={turno.id}
                  style={[
                    estilos.botaoTurno,
                    ativo &&
                      estilos.botaoTurnoAtivo,
                    bloqueado &&
                      estilos.botaoTurnoBloqueado,
                  ]}
                  disabled={
                    bloqueado ||
                    !turnoAluno
                  }
                  onPress={() => {
                    if (
                      turno.id ===
                      turnoAluno
                    ) {
                      setTurnoEscolhido(
                        turno.id
                      );
                    }
                  }}
                >
                  <Text
                    style={
                      estilos.iconeTurno
                    }
                  >
                    {turno.icone}
                  </Text>

                  <Text
                    style={[
                      estilos.textoTurno,
                      ativo &&
                        estilos.textoTurnoAtivo,
                    ]}
                  >
                    {turno.nome}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>

        {!carregandoTurno &&
          !turnoAluno && (
            <View
              style={
                estilos.avisoTurno
              }
            >
              <Text
                style={
                  estilos.avisoTurnoTexto
                }
              >
                Seu turno ainda não foi cadastrado. Atualize o campo "turno" no cadastro do aluno para liberar o cardápio correto.
              </Text>
            </View>
          )}

        <Text
          style={
            estilos.tituloTurno
          }
        >
          {turnoSelecionado?.tipo}
        </Text>


        {listaDoTurno.length ===
        0 ? (
          <Text
            style={
              estilos.textoVazio
            }
          >
            Nenhuma refeição
            cadastrada neste
            turno.
          </Text>
        ) : (

          listaDoTurno.map(
            (refeicao) => (

              <TouchableOpacity
                key={
                  refeicao.id
                }
                style={
                  estilos.cartaoRefeicao
                }

                onPress={() => {
                  navigation.navigate(
                    "Confirmacao",
                    {
                      refeicao:
                        refeicao,

                      alunoId:
                        alunoId,

                      matricula:
                        alunoId,

                      alunoNome:
                        alunoNome,

                      turma:
                        alunoTurma,

                      turno:
                        turnoAluno,
                    }
                  );
                }}
              >

                <View
                  style={
                    estilos.icone
                  }
                >
                  <Text
                    style={
                      estilos.icTexto
                    }
                  >
                    {
                      refeicao.icone
                    }
                  </Text>
                </View>


                <View
                  style={
                    estilos.info
                  }
                >
                  <Text
                    style={
                      estilos.tipo
                    }
                  >
                    {
                      refeicao.tipo
                    }
                  </Text>

                  <Text
                    style={
                      estilos.nome
                    }
                  >
                    {
                      refeicao.nome
                    }
                  </Text>
                </View>


                <View
                  style={
                    estilos.selo
                  }
                >
                  <Text
                    style={
                      estilos.seloTexto
                    }
                  >
                    Disponível
                  </Text>
                </View>

              </TouchableOpacity>
            )
          )
        )}

      </ScrollView>
    </SafeAreaView>
  );
}


const cores = {
  bg: "#F6FAF1",
  ink: "#1E2B21",
  inkSoft: "#5B6B5C",
  primary: "#2F6B4F",
  primaryDark: "#204A37",
  card: "#EFF6E7",
  mango: "#F2A93B",
  line: "#DCE8D2",
  white: "#FFFFFF",
};


const estilos =
  StyleSheet.create({

    tela: {
      flex: 1,
      backgroundColor:
        cores.bg,
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
      fontWeight: "600",
      color:
        cores.inkSoft,
    },

    titulo: {
      fontWeight: "800",
      fontSize: 23,
      color:
        cores.primaryDark,
      marginTop: 7,
    },

    linhaDias: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 20,
    },

    dia: {
      flex: 1,
      backgroundColor:
        cores.white,
      borderWidth: 1.5,
      borderColor:
        cores.line,
      borderRadius: 16,
      paddingVertical: 9,
      alignItems: "center",
    },

    diaAtivo: {
      backgroundColor:
        cores.primary,
      borderColor:
        cores.primary,
    },

    diaAbrev: {
      fontSize: 10,
      fontWeight: "700",
      color:
        cores.inkSoft,
      textTransform:
        "uppercase",
    },

    diaNumero: {
      fontWeight: "700",
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
      backgroundColor:
        cores.mango,
      marginTop: 4,
    },

    bolinhaAtiva: {
      backgroundColor:
        cores.white,
    },

    rotuloSecao: {
      fontSize: 11,
      fontWeight: "700",
      color:
        cores.inkSoft,
      textTransform:
        "uppercase",
      letterSpacing: 0.5,
      marginBottom: 10,
    },

    linhaTurnos: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },

    botaoTurno: {
      flex: 1,
      backgroundColor:
        cores.white,
      borderWidth: 1.5,
      borderColor:
        cores.line,
      borderRadius: 14,
      paddingVertical: 10,
      alignItems: "center",
    },

    botaoTurnoBloqueado: {
    opacity: 0.35,
  },

  avisoTurno: {
    backgroundColor: "#FFF7E8",
    borderWidth: 1,
    borderColor: "#F2D7A5",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },

  avisoTurnoTexto: {
    color: "#7A5A1B",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },

  botaoTurnoAtivo: {
      backgroundColor:
        cores.card,
      borderColor:
        cores.primary,
    },

    iconeTurno: {
      fontSize: 18,
      marginBottom: 3,
    },

    textoTurno: {
      fontSize: 11,
      fontWeight: "700",
      color:
        cores.inkSoft,
    },

    textoTurnoAtivo: {
      color:
        cores.primaryDark,
    },

    tituloTurno: {
      fontSize: 12,
      fontWeight: "800",
      color:
        cores.primaryDark,
      marginBottom: 10,
    },

    textoVazio: {
      fontSize: 13,
      color:
        cores.inkSoft,
      marginBottom: 15,
    },

    cartaoRefeicao: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor:
        cores.white,
      borderWidth: 1.5,
      borderColor:
        cores.line,
      borderRadius: 20,
      padding: 14,
      marginBottom: 14,
    },

    icone: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor:
        cores.card,
      alignItems: "center",
      justifyContent:
        "center",
    },

    icTexto: {
      fontSize: 22,
    },

    info: {
      flex: 1,
    },

    tipo: {
      fontSize: 10,
      fontWeight: "700",
      color:
        cores.primary,
      textTransform:
        "uppercase",
    },

    nome: {
      fontWeight: "700",
      fontSize: 14.5,
      color: cores.ink,
      marginTop: 2,
      lineHeight: 19,
    },

    selo: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 100,
      backgroundColor:
        cores.card,
    },

    seloTexto: {
      fontSize: 10,
      fontWeight: "700",
      color:
        cores.primary,
    },

  });