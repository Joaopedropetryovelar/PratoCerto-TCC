import React, {
  useState,
} from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  database,
} from "../../../FireBaseConfig";

export default function TelaLogin({
  navigation,
  route,
}) {
  const cadastrarAdmin =
    route?.params?.cadastrarAdmin === true;

  const [email, setEmail] =
    useState("");

  const [escola, setEscola] =
    useState("");

  const [senha, setSenha] =
    useState("");

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false);

  const [
    mostrarEscolas,
    setMostrarEscolas,
  ] = useState(false);

  const entrarNaConta = async () => {
    if (!email || !senha || !escola) {
      Alert.alert(
        "Atenção",
        "Preencha o e-mail, selecione a escola e digite a senha!"
      );

      return;
    }

    try {
      const credencialUsuario =
        await signInWithEmailAndPassword(
          auth,
          email.trim().toLowerCase(),
          senha.trim()
        );

      const usuario =
        credencialUsuario.user;

      const usuarioRef = doc(
        database,
        "usuarios",
        usuario.uid
      );

      const usuarioSnapshot =
        await getDoc(usuarioRef);

      if (!usuarioSnapshot.exists()) {
        await signOut(auth);

        Alert.alert(
          "Perfil não encontrado",
          "A conta existe no Firebase Authentication, mas não possui um perfil na coleção usuarios do Firestore."
        );

        return;
      }

      const dadosUsuario =
        usuarioSnapshot.data();

      const tipoConta = String(
        dadosUsuario.tipoConta || ""
      )
        .trim()
        .toLowerCase();

      const escolaCadastrada =
        String(
          dadosUsuario.escola || ""
        ).trim();

      if (
        escolaCadastrada &&
        escolaCadastrada !== escola
      ) {
        await signOut(auth);

        Alert.alert(
          "Escola incorreta",
          `Sua conta está vinculada à escola: ${escolaCadastrada}.`
        );

        return;
      }

      if (tipoConta === "admin") {
        /*
          Se veio da opção:
          Criar conta > Administrador

          significa que esse admin está entrando
          apenas para autorizar a criação de outro.
        */

        if (cadastrarAdmin) {
          navigation.reset({
            index: 1,

            routes: [
              {
                name: "HomeAdmin",

                params: {
                  escola:
                    escolaCadastrada ||
                    escola,
                },
              },

              {
                name: "CadastroAdmin",
              },
            ],
          });

          return;
        }

        navigation.reset({
          index: 0,

          routes: [
            {
              name: "HomeAdmin",

              params: {
                escola:
                  escolaCadastrada ||
                  escola,
              },
            },
          ],
        });

        return;
      }

      if (tipoConta === "aluno") {
        /*
          Se um aluno tentar autorizar
          a criação de admin, bloqueia.
        */

        if (cadastrarAdmin) {
          await signOut(auth);

          Alert.alert(
            "Conta sem permissão",
            "Para cadastrar um administrador, entre com uma conta que já seja administradora."
          );

          return;
        }

        navigation.reset({
          index: 0,

          routes: [
            {
              name: "HomeAluno",

              params: {
                escola:
                  escolaCadastrada ||
                  escola,
              },
            },
          ],
        });

        return;
      }

      await signOut(auth);

      Alert.alert(
        "Tipo de conta inválido",
        "O perfil não possui um tipoConta válido. Use 'admin' ou 'aluno' no Firestore."
      );
    } catch (erro) {
      if (auth.currentUser) {
        try {
          await signOut(auth);
        } catch (erroLogout) {
          console.log(
            "ERRO AO ENCERRAR SESSÃO:",
            erroLogout.message
          );
        }
      }

      console.log(
        "CÓDIGO DO ERRO:",
        erro.code
      );

      console.log(
        "ERRO COMPLETO:",
        erro.message
      );

      let mensagem =
        "Não foi possível entrar na conta.";

      if (
        erro.code ===
        "auth/invalid-email"
      ) {
        mensagem =
          "Digite um e-mail válido.";
      } else if (
        erro.code ===
          "auth/user-not-found" ||
        erro.code ===
          "auth/wrong-password" ||
        erro.code ===
          "auth/invalid-credential"
      ) {
        mensagem =
          "E-mail ou senha incorretos.";
      } else if (
        erro.code ===
        "auth/too-many-requests"
      ) {
        mensagem =
          "Muitas tentativas erradas. Tente novamente mais tarde.";
      } else if (
        erro.code ===
        "auth/network-request-failed"
      ) {
        mensagem =
          "Sem conexão com a internet.";
      } else if (
        erro.code ===
        "permission-denied"
      ) {
        mensagem =
          "O Firestore bloqueou a leitura do perfil. Verifique as regras de segurança da coleção usuarios.";
      }

      Alert.alert(
        "Erro no login",
        mensagem
      );
    }
  };

  function selecionarEscola(
    nomeEscola
  ) {
    setEscola(nomeEscola);
    setMostrarEscolas(false);
  }

  return (
    <SafeAreaView style={styles.tela}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F6FAF1"
      />

      <ScrollView
        contentContainerStyle={
          styles.conteudo
        }
      >
        <View style={styles.logo}>
          <Text style={styles.logoEmoji}>
            🥗
          </Text>
        </View>

        <Text style={styles.titulo}>
          Seja Bem-vindo de volta
        </Text>

        <Text style={styles.subtitulo}>
          {cadastrarAdmin
            ? "Entre com uma conta de administrador já autorizada para liberar o cadastro de um novo admin."
            : "Entre para ver o cardápio da semana e confirmar suas refeições."}
        </Text>

        <Text style={styles.Login}>
          FAÇA SEU LOGIN!
        </Text>

        <View style={styles.campo}>
          <Text style={styles.rotulo}>
            E-MAIL
          </Text>

          <View style={styles.caixa}>
            <TextInput
              style={styles.entrada}
              placeholder="seu@email.com"
              placeholderTextColor="#5B6B5C"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.iconeCaixa}>
              ✉️
            </Text>
          </View>
        </View>

        <View style={styles.campo}>
          <Text style={styles.rotulo}>
            ESCOLA
          </Text>

          <TouchableOpacity
            style={styles.caixa}
            onPress={() =>
              setMostrarEscolas(
                !mostrarEscolas
              )
            }
          >
            <Text
              style={[
                styles.escolaTexto,

                !escola &&
                  styles.escolaPlaceholder,
              ]}
            >
              {escola ||
                "Selecione sua escola"}
            </Text>

            <Text style={styles.seta}>
              {mostrarEscolas
                ? "▲"
                : "▼"}
            </Text>
          </TouchableOpacity>

          {mostrarEscolas && (
            <View
              style={
                styles.listaEscolas
              }
            >
              <TouchableOpacity
                style={
                  styles.opcaoEscola
                }
                onPress={() =>
                  selecionarEscola(
                    "Antônio Guglielmi Sobrinho"
                  )
                }
              >
                <Text
                  style={
                    styles.opcaoEscolaTexto
                  }
                >
                  Antônio Guglielmi
                  Sobrinho
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.opcaoEscola
                }
                onPress={() =>
                  selecionarEscola(
                    "Satc"
                  )
                }
              >
                <Text
                  style={
                    styles.opcaoEscolaTexto
                  }
                >
                  Satc
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.campo}>
          <Text style={styles.rotulo}>
            SENHA
          </Text>

          <View style={styles.caixa}>
            <TextInput
              style={styles.entrada}
              placeholder="••••••••••"
              placeholderTextColor="#5B6B5C"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={
                !mostrarSenha
              }
              autoCapitalize="none"
            />

            <TouchableOpacity
              onPress={() =>
                setMostrarSenha(
                  !mostrarSenha
                )
              }
            >
              <Text
                style={
                  styles.textoMostrar
                }
              >
                {mostrarSenha
                  ? "Ocultar"
                  : "Mostrar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.esqueciWrap}
          onPress={() =>
            navigation?.navigate(
              "EsqueciSenha"
            )
          }
        >
          <Text
            style={styles.esqueciTexto}
          >
            Esqueci minha senha
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botao}
          activeOpacity={0.8}
          onPress={entrarNaConta}
        >
          <Text style={styles.botaoTexto}>
            Entrar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.trocarTela}
          onPress={() =>
            navigation?.navigate(
              "EscolhaCadastro"
            )
          }
        >
          <Text
            style={
              styles.trocarTelaTexto
            }
          >
            Não tem conta?{" "}

            <Text
              style={
                styles.trocarTelaNegrito
              }
            >
              Cadastre-se
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    tela: {
      flex: 1,
      backgroundColor: "#F6FAF1",
    },

    conteudo: {
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 24,
    },

    logo: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: "#2F6B4F",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
      elevation: 6,
    },

    logoEmoji: {
      fontSize: 26,
    },

    titulo: {
      fontWeight: "800",
      fontSize: 26,
      color: "#1E2B21",
      marginBottom: 6,
    },

    subtitulo: {
      fontSize: 14,
      color: "#5B6B5C",
      lineHeight: 20,
      marginBottom: 22,
    },

    campo: {
      marginBottom: 16,
    },

    rotulo: {
      fontSize: 11,
      fontWeight: "700",
      color: "#5B6B5C",
      letterSpacing: 0.5,
      marginBottom: 7,
    },

    caixa: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1.5,
      borderColor: "#DCE8D2",
      borderRadius: 16,
      paddingHorizontal: 15,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      minHeight: 48,
    },

    entrada: {
      flex: 1,
      fontSize: 14,
      color: "#1E2B21",
      fontWeight: "600",
      padding: 0,
    },

    iconeCaixa: {
      fontSize: 15,
      marginLeft: 8,
    },

    escolaTexto: {
      flex: 1,
      fontSize: 14,
      color: "#1E2B21",
      fontWeight: "600",
    },

    escolaPlaceholder: {
      color: "#5B6B5C",
    },

    seta: {
      fontSize: 11,
      color: "#2F6B4F",
      fontWeight: "800",
      marginLeft: 10,
    },

    listaEscolas: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1.5,
      borderColor: "#DCE8D2",
      borderRadius: 16,
      marginTop: 7,
      overflow: "hidden",
    },

    opcaoEscola: {
      paddingHorizontal: 15,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor:
        "#EEF3EA",
    },

    opcaoEscolaTexto: {
      fontSize: 14,
      color: "#1E2B21",
      fontWeight: "600",
    },

    textoMostrar: {
      fontSize: 12,
      color: "#2F6B4F",
      fontWeight: "700",
      marginLeft: 8,
    },

    esqueciWrap: {
      alignItems: "flex-end",
      marginBottom: 20,
    },

    esqueciTexto: {
      fontSize: 12.5,
      color: "#2F6B4F",
      fontWeight: "700",
    },

    botao: {
      backgroundColor: "#2F6B4F",
      borderRadius: 18,
      paddingVertical: 17,
      alignItems: "center",
      elevation: 5,
    },

    botaoTexto: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 16,
    },

    trocarTela: {
      marginTop: 24,
      alignItems: "center",
    },

    trocarTelaTexto: {
      fontSize: 13,
      color: "#5B6B5C",
    },

    trocarTelaNegrito: {
      color: "#2F6B4F",
      fontWeight: "700",
    },

    Login: {
      fontSize: 18,
      fontWeight: "800",
      marginBottom: 14,
      color: "#2F6B4F",
    },
  });