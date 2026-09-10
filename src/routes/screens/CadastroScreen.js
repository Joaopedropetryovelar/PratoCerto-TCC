import React, { useState } from "react";

import {
  Alert,
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
  updateProfile,
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  auth,
  database,
} from "../../../FireBaseConfig";

export default function CadastroScreen({ navigation }) {
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [turma, setTurma] = useState("");
  const [escola, setEscola] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [listaEscolasAberta, setListaEscolasAberta] = useState(false);
  const [carregando, setCarregando] = useState(false);

  function validarCampos() {
    if (
      !nome.trim() ||
      !matricula.trim() ||
      !turma.trim() ||
      !escola ||
      !email.trim() ||
      !senha
    ) {
      Alert.alert(
        "Atenção",
        "Preencha todos os campos."
      );

      return false;
    }

    if (senha.length < 6) {
      Alert.alert(
        "Senha muito curta",
        "A senha precisa ter pelo menos 6 caracteres."
      );

      return false;
    }

    if (!aceitouTermos) {
      Alert.alert(
        "Consentimento necessário",
        "Leia e aceite os Termos de Uso e a Política de Privacidade para continuar."
      );

      return false;
    }

    return true;
  }

  function escolherEscola(nomeEscola) {
    setEscola(nomeEscola);
    setListaEscolasAberta(false);
  }

  function limparCampos() {
    setNome("");
    setMatricula("");
    setTurma("");
    setEscola("");
    setEmail("");
    setSenha("");
    setAceitouTermos(false);
    setListaEscolasAberta(false);
  }

  async function cadastrar() {
    if (!validarCampos() || carregando) {
      return;
    }

    try {
      setCarregando(true);

      const emailLimpo = email
        .trim()
        .toLowerCase();

      const matriculaLimpa =
        matricula.trim();

      const contaCriada =
        await createUserWithEmailAndPassword(
          auth,
          emailLimpo,
          senha
        );

      const usuario =
        contaCriada.user;

      await updateProfile(
        usuario,
        {
          displayName:
            nome.trim(),
        }
      );

      await setDoc(
        doc(
          database,
          "usuarios",
          usuario.uid
        ),
        {
          uid:
            usuario.uid,

          nome:
            nome.trim(),

          matricula:
            matriculaLimpa,

          turma:
            turma.trim(),

          escola:
            escola,

          email:
            emailLimpo,

          tipoConta:
            "aluno",

          aceitouTermos:
            true,

          dataConsentimento:
            serverTimestamp(),

          dataCadastro:
            serverTimestamp(),
        }
      );

      limparCampos();

      Alert.alert(
        "Conta criada! ✅",
        "Seu cadastro foi realizado com sucesso.",
        [
          {
            text: "Continuar",

            onPress: () => {
              navigation.reset({
                index: 0,

                routes: [
                  {
                    name: "HomeAluno",
                  },
                ],
              });
            },
          },
        ]
      );

    } catch (erro) {
      console.log(
        "Erro ao cadastrar:",
        erro
      );

      let mensagem =
        "Não foi possível criar sua conta.";

      if (
        erro.code ===
        "auth/email-already-in-use"
      ) {
        mensagem =
          "Este e-mail já possui uma conta.";

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
        "auth/network-request-failed"
      ) {
        mensagem =
          "Sem conexão com a internet.";
      }

      Alert.alert(
        "Erro no cadastro",
        mensagem
      );

    } finally {
      setCarregando(false);
    }
  }

  function abrirTermos() {
    navigation.navigate(
      "TermosUso"
    );
  }

  function abrirPolitica() {
    navigation.navigate(
      "PoliticaPrivacidade"
    );
  }

  function voltar() {
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.tela}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F6FAF1"
      />

      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={voltar}
        >
          <Text style={styles.textoVoltar}>
            ‹
          </Text>
        </TouchableOpacity>

        <View style={styles.areaLogo}>
          <View style={styles.logo}>
            <Text style={styles.iconeLogo}>
              🌿
            </Text>
          </View>

          <Text style={styles.nomeLogo}>
            Prato{"\n"}Certo
          </Text>
        </View>

        <Text style={styles.titulo}>
          Criar conta
        </Text>

        <Text style={styles.subtitulo}>
          Preencha seus dados para começar a usar o Prato Certo.
        </Text>

        <Text style={styles.rotulo}>
          Nome completo
        </Text>

        <TextInput
          style={styles.campo}
          value={nome}
          onChangeText={setNome}
          placeholder="Seu nome completo"
          placeholderTextColor="#94A097"
          autoCapitalize="words"
        />

        <Text style={styles.rotulo}>
          Matrícula
        </Text>

        <TextInput
          style={styles.campo}
          value={matricula}
          onChangeText={setMatricula}
          placeholder="Digite sua matrícula"
          placeholderTextColor="#94A097"
        />

        <Text style={styles.rotulo}>
          Turma
        </Text>

        <TextInput
          style={styles.campo}
          value={turma}
          onChangeText={setTurma}
          placeholder="Digite sua turma"
          placeholderTextColor="#94A097"
        />

        <Text style={styles.rotulo}>
          Escola
        </Text>

        <TouchableOpacity
          style={styles.campoEscola}
          onPress={() =>
            setListaEscolasAberta(
              !listaEscolasAberta
            )
          }
        >
          <Text
            style={[
              styles.textoEscola,
              !escola &&
                styles.textoPlaceholder,
            ]}
          >
            {escola ||
              "Selecione sua escola"}
          </Text>

          <Text style={styles.seta}>
            {listaEscolasAberta
              ? "▲"
              : "▼"}
          </Text>
        </TouchableOpacity>

        {listaEscolasAberta && (
          <View style={styles.listaEscolas}>
            <TouchableOpacity
              style={styles.opcaoEscola}
              onPress={() =>
                escolherEscola(
                  "Antônio Guglielmi Sobrinho"
                )
              }
            >
              <Text style={styles.textoOpcao}>
                Antônio Guglielmi Sobrinho
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.opcaoEscola}
              onPress={() =>
                escolherEscola(
                  "Satc"
                )
              }
            >
              <Text style={styles.textoOpcao}>
                Satc
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.rotulo}>
          E-mail
        </Text>

        <TextInput
          style={styles.campo}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="seuemail@escola.edu.br"
          placeholderTextColor="#94A097"
        />

        <Text style={styles.rotulo}>
          Senha
        </Text>

        <TextInput
          style={styles.campo}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Crie uma senha"
          placeholderTextColor="#94A097"
        />

        <View style={styles.aviso}>
          <Text style={styles.iconeAviso}>
            🛡️
          </Text>

          <Text style={styles.textoAviso}>
            Seus dados são protegidos e usados apenas para fins educacionais,
            como identificação, registro de refeições e feedbacks.
          </Text>
        </View>

        <View style={styles.areaTermos}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              aceitouTermos &&
                styles.checkboxMarcado,
            ]}
            onPress={() =>
              setAceitouTermos(
                !aceitouTermos
              )
            }
          >
            {aceitouTermos && (
              <Text style={styles.check}>
                ✓
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.textoTermos}>
            Li e aceito os{" "}

            <Text
              style={styles.link}
              onPress={abrirTermos}
            >
              Termos de Uso
            </Text>

            {" "}e a{" "}

            <Text
              style={styles.link}
              onPress={abrirPolitica}
            >
              Política de Privacidade
            </Text>

            .
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.botaoCadastrar,
            (!aceitouTermos ||
              carregando) &&
              styles.botaoDesativado,
          ]}
          onPress={cadastrar}
          disabled={carregando}
        >
          <Text style={styles.textoBotao}>
            {carregando
              ? "Criando conta..."
              : "Criar conta"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.rodape}>
          Já tem uma conta?{" "}

          <Text
            style={styles.linkEntrar}
            onPress={() =>
              navigation.navigate(
                "TelaLogin"
              )
            }
          >
            Entrar
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: "#F6FAF1",
  },

  conteudo: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 30,
  },

  botaoVoltar: {
    width: 38,
    height: 38,
    justifyContent: "center",
    marginBottom: 10,
  },

  textoVoltar: {
    fontSize: 38,
    lineHeight: 38,
    color: "#204A37",
  },

  areaLogo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#E4F0DA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  iconeLogo: {
    fontSize: 27,
  },

  nomeLogo: {
    fontSize: 25,
    lineHeight: 23,
    fontWeight: "800",
    color: "#205438",
  },

  titulo: {
    fontSize: 29,
    fontWeight: "800",
    color: "#101810",
    marginBottom: 6,
  },

  subtitulo: {
    color: "#4E5D50",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },

  rotulo: {
    fontSize: 13,
    fontWeight: "600",
    color: "#253326",
    marginBottom: 7,
  },

  campo: {
    height: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.3,
    borderColor: "#D6E2D0",
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#1E2B21",
    marginBottom: 15,
  },

  campoEscola: {
    minHeight: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.3,
    borderColor: "#D6E2D0",
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  textoEscola: {
    flex: 1,
    fontSize: 14,
    color: "#1E2B21",
  },

  textoPlaceholder: {
    color: "#94A097",
  },

  seta: {
    color: "#2F6B4F",
    fontSize: 11,
    fontWeight: "800",
  },

  listaEscolas: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.3,
    borderColor: "#D6E2D0",
    borderRadius: 14,
    marginTop: -8,
    marginBottom: 15,
    overflow: "hidden",
  },

  opcaoEscola: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EFE4",
  },

  textoOpcao: {
    fontSize: 14,
    color: "#1E2B21",
    fontWeight: "600",
  },

  aviso: {
    backgroundColor: "#E5F1D9",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 3,
    marginBottom: 18,
  },

  iconeAviso: {
    fontSize: 21,
    marginRight: 10,
  },

  textoAviso: {
    flex: 1,
    color: "#25402C",
    fontSize: 13,
    lineHeight: 19,
  },

  areaTermos: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 22,
  },

  checkbox: {
    width: 26,
    height: 26,
    borderWidth: 2,
    borderColor: "#2F6B4F",
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  checkboxMarcado: {
    backgroundColor: "#2F6B4F",
  },

  check: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  textoTermos: {
    flex: 1,
    color: "#26352A",
    fontSize: 13,
    lineHeight: 20,
  },

  link: {
    color: "#1F5B3D",
    textDecorationLine: "underline",
    fontWeight: "700",
  },

  botaoCadastrar: {
    height: 54,
    backgroundColor: "#2F6B4F",
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  botaoDesativado: {
    backgroundColor: "#AABBAE",
  },

  textoBotao: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  rodape: {
    textAlign: "center",
    marginTop: 25,
    color: "#465248",
    fontSize: 13,
  },

  linkEntrar: {
    color: "#21593D",
    fontWeight: "800",
  },
});