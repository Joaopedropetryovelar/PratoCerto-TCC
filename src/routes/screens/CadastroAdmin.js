import React, {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  signOut,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  deleteApp,
  getApp,
  initializeApp,
} from "firebase/app";

import {
  auth,
  database,
} from "../../../FireBaseConfig";

export default function CadastroAdmin({
  navigation,
}) {
  const [nome, setNome] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [senha, setSenha] =
    useState("");

  const [
    confirmarSenha,
    setConfirmarSenha,
  ] = useState("");

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    adminAtual,
    setAdminAtual,
  ] = useState(null);

  useEffect(() => {
    verificarPermissao();
  }, []);

  async function verificarPermissao() {
    try {
      const usuario =
        auth.currentUser;

      if (!usuario) {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "VerificarAdmin",
            },
          ],
        });

        return;
      }

      const referencia = doc(
        database,
        "usuarios",
        usuario.uid
      );

      const snapshot =
        await getDoc(referencia);

      if (!snapshot.exists()) {
        await signOut(auth);

        navigation.reset({
          index: 0,
          routes: [
            {
              name: "VerificarAdmin",
            },
          ],
        });

        return;
      }

      const dados =
        snapshot.data();

      const tipoConta = String(
        dados.tipoConta || ""
      )
        .trim()
        .toLowerCase();

      if (tipoConta !== "admin") {
        await signOut(auth);

        navigation.reset({
          index: 0,
          routes: [
            {
              name: "VerificarAdmin",
            },
          ],
        });

        return;
      }

      setAdminAtual({
        uid: usuario.uid,

        nome:
          dados.nome ||
          "Administrador",

        email:
          usuario.email ||
          dados.email ||
          "",

        escola: String(
          dados.escola || ""
        ).trim(),
      });
    } catch (erro) {
      console.log(
        "ERRO VERIFICAR PERMISSÃO:",
        erro
      );

      Alert.alert(
        "Erro",
        "Não foi possível verificar o administrador."
      );
    } finally {
      setCarregando(false);
    }
  }

  function validarCampos() {
    if (
      !nome.trim() ||
      !email.trim() ||
      !senha ||
      !confirmarSenha
    ) {
      Alert.alert(
        "Atenção",
        "Preencha todos os campos."
      );

      return false;
    }

    if (
      !email.trim().includes("@")
    ) {
      Alert.alert(
        "E-mail inválido",
        "Digite um e-mail válido."
      );

      return false;
    }

    if (senha.length < 6) {
      Alert.alert(
        "Senha inválida",
        "A senha precisa ter pelo menos 6 caracteres."
      );

      return false;
    }

    if (
      senha !== confirmarSenha
    ) {
      Alert.alert(
        "Senhas diferentes",
        "As senhas precisam ser iguais."
      );

      return false;
    }

    return true;
  }

  async function cadastrarAdministrador() {
    if (
      !validarCampos() ||
      salvando
    ) {
      return;
    }

    if (!adminAtual) {
      Alert.alert(
        "Erro",
        "Administrador autorizador não encontrado."
      );

      return;
    }

    setSalvando(true);

    let appSecundario = null;
    let authSecundario = null;
    let novoUsuario = null;
    let perfilSalvo = false;

    try {
      /*
        Segunda instância do Firebase.

        Assim o João continua logado
        enquanto criamos a nova conta.
      */

      appSecundario =
        initializeApp(
          getApp().options,
          `cadastro-admin-${Date.now()}`
        );

      authSecundario =
        getAuth(appSecundario);

      const resultado =
        await createUserWithEmailAndPassword(
          authSecundario,
          email
            .trim()
            .toLowerCase(),
          senha
        );

      novoUsuario =
        resultado.user;

      await updateProfile(
        novoUsuario,
        {
          displayName:
            nome.trim(),
        }
      );

      /*
        Cria o novo admin no Firestore.

        O ID do documento será o UID.
      */

      await setDoc(
        doc(
          database,
          "usuarios",
          novoUsuario.uid
        ),
        {
          uid:
            novoUsuario.uid,

          nome:
            nome.trim(),

          email:
            email
              .trim()
              .toLowerCase(),

          escola:
            adminAtual.escola,

          tipoConta:
            "admin",

          criadoPorAdminUid:
            adminAtual.uid,

          criadoPorAdminNome:
            adminAtual.nome,

          criadoPorAdminEmail:
            adminAtual.email,

          dataCadastro:
            serverTimestamp(),

          dataAutorizacaoAdmin:
            serverTimestamp(),
        }
      );

      perfilSalvo = true;

      await signOut(
        authSecundario
      );

      console.log(
        "NOVO ADMIN CRIADO:",
        novoUsuario.uid
      );

      Alert.alert(
        "Sucesso",
        "Administrador cadastrado com sucesso."
      );

      /*
        Não dependemos do botão do Alert
        para navegar.
      */

      navigation.reset({
        index: 0,
        routes: [
          {
            name: "HomeAdmin",
          },
        ],
      });
    } catch (erro) {
      console.log(
        "ERRO CADASTRAR ADMIN:",
        erro
      );

      if (
        novoUsuario &&
        !perfilSalvo
      ) {
        try {
          await deleteUser(
            novoUsuario
          );
        } catch (erroExcluir) {
          console.log(
            "ERRO EXCLUIR CONTA:",
            erroExcluir
          );
        }
      }

      let mensagem =
        "Não foi possível cadastrar o administrador.";

      if (
        erro.code ===
        "auth/email-already-in-use"
      ) {
        mensagem =
          "Esse e-mail já está cadastrado.";
      } else if (
        erro.code ===
        "auth/invalid-email"
      ) {
        mensagem =
          "Digite um e-mail válido.";
      } else if (
        erro.code ===
        "auth/weak-password"
      ) {
        mensagem =
          "A senha precisa ter pelo menos 6 caracteres.";
      } else if (
        erro.code ===
        "permission-denied"
      ) {
        mensagem =
          "O Firestore bloqueou a criação do administrador.";
      }

      Alert.alert(
        "Erro",
        mensagem
      );
    } finally {
      if (
        authSecundario?.currentUser
      ) {
        try {
          await signOut(
            authSecundario
          );
        } catch (erro) {
          console.log(erro);
        }
      }

      if (appSecundario) {
        try {
          await deleteApp(
            appSecundario
          );
        } catch (erro) {
          console.log(erro);
        }
      }

      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <SafeAreaView
        style={styles.carregando}
      >
        <ActivityIndicator
          size="large"
          color="#2F6B4F"
        />

        <Text
          style={styles.textoCarregando}
        >
          Verificando administrador...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.tela}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F6FAF1"
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.conteudo
          }
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text
              style={styles.setaVoltar}
            >
              ←
            </Text>
          </TouchableOpacity>

          <Text style={styles.titulo}>
            Novo administrador
          </Text>

          <Text style={styles.subtitulo}>
            Cadastre uma nova pessoa para administrar
            sua escola.
          </Text>

          <View
            style={styles.cardAdmin}
          >
            <Text
              style={
                styles.cardAdminTitulo
              }
            >
              🛡️ Administrador autorizador
            </Text>

            <Text
              style={styles.adminNome}
            >
              {adminAtual?.nome}
            </Text>

            <Text
              style={styles.adminEmail}
            >
              {adminAtual?.email}
            </Text>

            <Text
              style={styles.adminEscola}
            >
              Escola:{" "}
              {adminAtual?.escola}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.rotulo}>
              NOME
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              value={nome}
              onChangeText={setNome}
            />

            <Text style={styles.rotulo}>
              E-MAIL
            </Text>

            <TextInput
              style={styles.input}
              placeholder="admin@escola.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.rotulo}>
              SENHA
            </Text>

            <View style={styles.areaSenha}>
              <TextInput
                style={styles.inputSenha}
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={
                  !mostrarSenha
                }
              />

              <TouchableOpacity
                onPress={() =>
                  setMostrarSenha(
                    !mostrarSenha
                  )
                }
              >
                <Text style={styles.mostrar}>
                  {mostrarSenha
                    ? "Ocultar"
                    : "Mostrar"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.rotulo}>
              CONFIRMAR SENHA
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Digite novamente"
              value={confirmarSenha}
              onChangeText={
                setConfirmarSenha
              }
              secureTextEntry={
                !mostrarSenha
              }
            />

            <TouchableOpacity
              style={[
                styles.botaoCadastrar,

                salvando &&
                  styles.botaoDesativado,
              ]}
              onPress={
                cadastrarAdministrador
              }
              disabled={salvando}
            >
              {salvando ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.botaoTexto
                  }
                >
                  Cadastrar administrador
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  tela: {
    flex: 1,
    backgroundColor: "#F6FAF1",
  },

  carregando: {
    flex: 1,
    backgroundColor: "#F6FAF1",
    alignItems: "center",
    justifyContent: "center",
  },

  textoCarregando: {
    marginTop: 10,
    color: "#667368",
  },

  conteudo: {
    padding: 24,
    paddingBottom: 40,
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
    marginBottom: 24,
  },

  setaVoltar: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2F6B4F",
  },

  titulo: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1E2B21",
  },

  subtitulo: {
    fontSize: 14,
    color: "#667368",
    marginTop: 6,
    marginBottom: 20,
  },

  cardAdmin: {
    backgroundColor: "#E8F3E4",
    padding: 17,
    borderRadius: 18,
    marginBottom: 17,
  },

  cardAdminTitulo: {
    color: "#2F6B4F",
    fontWeight: "800",
    fontSize: 12,
  },

  adminNome: {
    marginTop: 7,
    fontSize: 17,
    fontWeight: "900",
    color: "#1E2B21",
  },

  adminEmail: {
    marginTop: 2,
    fontSize: 12,
    color: "#667368",
  },

  adminEscola: {
    marginTop: 7,
    fontWeight: "700",
    color: "#2F6B4F",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE8D2",
    borderRadius: 20,
    padding: 20,
  },

  rotulo: {
    fontSize: 11,
    fontWeight: "800",
    color: "#667368",
    marginBottom: 7,
  },

  input: {
    borderWidth: 1.5,
    borderColor: "#DCE8D2",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    marginBottom: 17,
  },

  areaSenha: {
    borderWidth: 1.5,
    borderColor: "#DCE8D2",
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 17,
  },

  inputSenha: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
  },

  mostrar: {
    color: "#2F6B4F",
    fontWeight: "800",
    fontSize: 12,
  },

  botaoCadastrar: {
    backgroundColor: "#2F6B4F",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 5,
  },

  botaoDesativado: {
    opacity: 0.6,
  },

  botaoTexto: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
});