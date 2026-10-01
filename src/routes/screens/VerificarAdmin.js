import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";

import {
  auth,
  database,
} from "../../../FireBaseConfig";

export default function VerificarAdmin({ navigation }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function buscarPerfil(usuario) {
    // Primeiro tenta encontrar pelo UID
    const referencia = doc(
      database,
      "usuarios",
      usuario.uid
    );

    const snapshot = await getDoc(referencia);

    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        dados: snapshot.data(),
      };
    }

    // Caso o documento tenha ID diferente,
    // tenta localizar pelo e-mail
    const emailUsuario = String(
      usuario.email || ""
    )
      .trim()
      .toLowerCase();

    const consulta = query(
      collection(database, "usuarios"),
      where("email", "==", emailUsuario),
      limit(1)
    );

    const resultado = await getDocs(consulta);

    if (resultado.empty) {
      return null;
    }

    const documento = resultado.docs[0];

    return {
      id: documento.id,
      dados: documento.data(),
    };
  }

  async function verificarAdministrador() {
    if (!email.trim() || !senha) {
      Alert.alert(
        "Atenção",
        "Digite o e-mail e a senha do administrador."
      );

      return;
    }

    setCarregando(true);

    try {
      // 1. Verifica e-mail e senha
      const resultadoLogin =
        await signInWithEmailAndPassword(
          auth,
          email.trim().toLowerCase(),
          senha
        );

      const usuario = resultadoLogin.user;

      console.log(
        "UID DO USUÁRIO:",
        usuario.uid
      );

      console.log(
        "EMAIL:",
        usuario.email
      );

      // 2. Busca o perfil no Firestore
      const perfil = await buscarPerfil(usuario);

      if (!perfil) {
        await signOut(auth);

        Alert.alert(
          "Perfil não encontrado",
          "A conta existe no Authentication, mas não possui cadastro na coleção usuarios."
        );

        return;
      }

      console.log(
        "DOCUMENTO ENCONTRADO:",
        perfil.id
      );

      console.log(
        "DADOS:",
        perfil.dados
      );

      // 3. Verifica o tipo da conta
      const tipoConta = String(
        perfil.dados.tipoConta || ""
      )
        .trim()
        .toLowerCase();

      console.log(
        "TIPO DA CONTA:",
        tipoConta
      );

      if (tipoConta !== "admin") {
        await signOut(auth);

        Alert.alert(
          "Acesso negado",
          "Essa conta não possui permissão de administrador."
        );

        return;
      }

      console.log(
        "ADMIN CONFIRMADO:",
        perfil.dados.nome
      );

      /*
        IMPORTANTE:

        Não usamos Alert antes da navegação.
        No Expo Web isso pode causar problema.

        Aqui a navegação acontece imediatamente.
      */

      console.log(
        "ABRINDO CADASTRO ADMIN..."
      );

      navigation.reset({
        index: 0,
        routes: [
          {
            name: "CadastroAdmin",
          },
        ],
      });

      return;
    } catch (erro) {
      console.log(
        "ERRO VERIFICAR ADMIN:",
        erro
      );

      let mensagem =
        "Não foi possível verificar o administrador.";

      if (
        erro.code === "auth/invalid-credential" ||
        erro.code === "auth/wrong-password" ||
        erro.code === "auth/user-not-found"
      ) {
        mensagem =
          "E-mail ou senha incorretos.";
      } else if (
        erro.code === "auth/invalid-email"
      ) {
        mensagem =
          "Digite um e-mail válido.";
      } else if (
        erro.code === "auth/too-many-requests"
      ) {
        mensagem =
          "Muitas tentativas. Aguarde alguns minutos.";
      } else if (
        erro.code ===
        "auth/network-request-failed"
      ) {
        mensagem =
          "Sem conexão com a internet.";
      } else if (
        erro.code === "permission-denied"
      ) {
        mensagem =
          "O Firestore bloqueou a consulta.";
      }

      Alert.alert(
        "Erro",
        mensagem
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.tela}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F6FAF1"
      />

      <View style={styles.conteudo}>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() =>
            navigation.goBack()
          }
        >
          <Text style={styles.setaVoltar}>
            ←
          </Text>
        </TouchableOpacity>

        <View style={styles.iconeContainer}>
          <Text style={styles.icone}>
            🛡️
          </Text>
        </View>

        <Text style={styles.titulo}>
          Verificar administrador
        </Text>

        <Text style={styles.subtitulo}>
          Confirme os dados de um administrador já
          autorizado para liberar o cadastro de uma
          nova conta administrativa.
        </Text>

        <View style={styles.card}>
          <Text style={styles.rotulo}>
            E-MAIL DO ADMINISTRADOR
          </Text>

          <TextInput
            style={styles.input}
            placeholder="joao@admin.com"
            placeholderTextColor="#8A978B"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <Text style={styles.rotulo}>
            SENHA
          </Text>

          <View style={styles.areaSenha}>
            <TextInput
              style={styles.inputSenha}
              placeholder="Digite sua senha"
              placeholderTextColor="#8A978B"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!mostrarSenha}
              autoCapitalize="none"
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

          <TouchableOpacity
            style={[
              styles.botao,
              carregando &&
                styles.botaoDesativado,
            ]}
            onPress={verificarAdministrador}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={styles.botaoTexto}
              >
                Verificar administrador
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.aviso}>
          <Text style={styles.avisoTitulo}>
            🔒 Verificação segura
          </Text>

          <Text style={styles.avisoTexto}>
            Além de conferir o e-mail e a senha,
            o sistema verifica no Firestore se a
            conta realmente possui tipoConta
            igual a admin.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: "#F6FAF1",
  },

  conteudo: {
    flex: 1,
    padding: 24,
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
    marginBottom: 26,
  },

  setaVoltar: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2F6B4F",
  },

  iconeContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#E8F3E4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  icone: {
    fontSize: 34,
  },

  titulo: {
    fontSize: 27,
    fontWeight: "900",
    color: "#1E2B21",
  },

  subtitulo: {
    marginTop: 8,
    marginBottom: 25,
    fontSize: 14,
    lineHeight: 21,
    color: "#667368",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DCE8D2",
    padding: 20,
  },

  rotulo: {
    fontSize: 11,
    fontWeight: "800",
    color: "#667368",
    marginBottom: 7,
  },

  input: {
    backgroundColor: "#FAFCF8",
    borderWidth: 1.5,
    borderColor: "#DCE8D2",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: "#1E2B21",
    marginBottom: 18,
  },

  areaSenha: {
    backgroundColor: "#FAFCF8",
    borderWidth: 1.5,
    borderColor: "#DCE8D2",
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  inputSenha: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: "#1E2B21",
  },

  mostrar: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2F6B4F",
  },

  botao: {
    backgroundColor: "#2F6B4F",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },

  botaoDesativado: {
    opacity: 0.6,
  },

  botaoTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  aviso: {
    marginTop: 16,
    backgroundColor: "#E8F3E4",
    borderRadius: 17,
    padding: 16,
  },

  avisoTitulo: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2F6B4F",
  },

  avisoTexto: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: "#667368",
  },
});