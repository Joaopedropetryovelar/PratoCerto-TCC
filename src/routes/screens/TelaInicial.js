import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function TelaInicial({ navigation }) {
  function abrirLogin() {
    navigation.navigate("Login");
  }

  function abrirCadastro() {
    navigation.navigate("Consentimento", {
      screen: "Cadastro",
    });
  }

  function abrirTermos() {
    navigation.navigate("Consentimento", {
      screen: "TermosUso",
    });
  }

  function abrirPolitica() {
    navigation.navigate("Consentimento", {
      screen: "PoliticaPrivacidade",
    });
  }

  return (
    <SafeAreaView style={styles.tela}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F4F8F3"
      />

      <View style={styles.circuloSuperior} />
      <View style={styles.circuloLateral} />
      <View style={styles.circuloInferior} />

      <View style={styles.conteudo}>
        <View style={styles.topo}>
          <View style={styles.tag}>
            <Text style={styles.tagEmoji}>🌱</Text>
            <Text style={styles.tagTexto}>Menos desperdício</Text>
          </View>
        </View>

        <View style={styles.areaPrincipal}>
          <View style={styles.logoContainer}>
            <View style={styles.logoFundo}>
              <Text style={styles.logoEmoji}>🍽️</Text>
            </View>

            <View style={styles.detalheLogo}>
              <Text style={styles.detalheLogoTexto}>✓</Text>
            </View>
          </View>

          <Text style={styles.titulo}>Prato Certo</Text>

          <Text style={styles.subtitulo}>
            Alimentação escolar mais organizada, prática e inteligente.
          </Text>

          <Text style={styles.descricao}>
            Confirme suas refeições com antecedência e ajude a escola a preparar
            a quantidade certa de alimentos todos os dias.
          </Text>

          <View style={styles.areaBeneficios}>
            <View style={styles.cardBeneficio}>
              <View style={styles.iconeBeneficio}>
                <Text style={styles.iconeTexto}>📅</Text>
              </View>

              <View style={styles.infoBeneficio}>
                <Text style={styles.tituloBeneficio}>
                  Confirmação antecipada
                </Text>
                <Text style={styles.textoBeneficio}>
                  Informe quando você vai realizar sua refeição.
                </Text>
              </View>
            </View>

            <View style={styles.cardBeneficio}>
              <View style={styles.iconeBeneficio}>
                <Text style={styles.iconeTexto}>📊</Text>
              </View>

              <View style={styles.infoBeneficio}>
                <Text style={styles.tituloBeneficio}>
                  Melhor planejamento
                </Text>
                <Text style={styles.textoBeneficio}>
                  A escola prepara os alimentos com mais precisão.
                </Text>
              </View>
            </View>

            <View style={styles.cardBeneficio}>
              <View style={styles.iconeBeneficio}>
                <Text style={styles.iconeTexto}>⭐</Text>
              </View>

              <View style={styles.infoBeneficio}>
                <Text style={styles.tituloBeneficio}>
                  Avalie as refeições
                </Text>
                <Text style={styles.textoBeneficio}>
                  Seu feedback ajuda a melhorar o cardápio.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.indicadores}>
            <View style={[styles.indicador, styles.indicadorAtivo]} />
            <View style={styles.indicador} />
            <View style={styles.indicador} />
          </View>

          <TouchableOpacity
            style={styles.botaoEntrar}
            activeOpacity={0.85}
            onPress={abrirLogin}
          >
            <Text style={styles.textoBotaoEntrar}>Entrar</Text>
            <Text style={styles.setaBotao}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoCriarConta}
            activeOpacity={0.85}
            onPress={abrirCadastro}
          >
            <Text style={styles.textoBotaoCriarConta}>Criar conta</Text>
          </TouchableOpacity>

          <Text style={styles.textoRodape}>
            Ao continuar, você concorda com nossos{" "}
            <Text style={styles.link} onPress={abrirTermos}>
              Termos de Uso
            </Text>{" "}
            e{" "}
            <Text style={styles.link} onPress={abrirPolitica}>
              Política de Privacidade
            </Text>
            .
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: "#F4F8F3",
  },

  conteudo: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 22,
  },

  topo: {
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },

  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E4F1E8",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  tagEmoji: {
    fontSize: 14,
    marginRight: 6,
  },

  tagTexto: {
    fontSize: 13,
    color: "#347A59",
    fontWeight: "700",
  },

  areaPrincipal: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  logoContainer: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    position: "relative",
  },

  logoFundo: {
    width: 92,
    height: 92,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#1F543D",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 14,

    elevation: 6,
  },

  logoEmoji: {
    fontSize: 54,
  },

  detalheLogo: {
    position: "absolute",
    right: 0,
    bottom: 5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#347A59",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#F4F8F3",
  },

  detalheLogoTexto: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },

  titulo: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1F543D",
    marginBottom: 8,
  },

  subtitulo: {
    maxWidth: 330,
    textAlign: "center",
    fontSize: 17,
    lineHeight: 23,
    color: "#35463C",
    fontWeight: "600",
    marginBottom: 8,
  },

  descricao: {
    width: "100%",
    maxWidth: 345,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: "#7A857D",
    marginBottom: 22,
  },

  areaBeneficios: {
    width: "100%",
    maxWidth: 380,
    marginBottom: 22,
  },

  cardBeneficio: {
    width: "100%",
    minHeight: 68,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#1F543D",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 10,

    elevation: 3,
  },

  iconeBeneficio: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EDF6EF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  iconeTexto: {
    fontSize: 21,
  },

  infoBeneficio: {
    flex: 1,
  },

  tituloBeneficio: {
    fontSize: 14,
    fontWeight: "800",
    color: "#284435",
    marginBottom: 3,
  },

  textoBeneficio: {
    fontSize: 12,
    color: "#7C8880",
    lineHeight: 16,
  },

  indicadores: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  indicador: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#CBD7CE",
    marginHorizontal: 4,
  },

  indicadorAtivo: {
    width: 24,
    backgroundColor: "#347A59",
  },

  botaoEntrar: {
    width: "100%",
    maxWidth: 380,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#347A59",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 12,

    shadowColor: "#347A59",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.22,
    shadowRadius: 12,

    elevation: 5,
  },

  textoBotaoEntrar: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  setaBotao: {
    color: "#FFFFFF",
    fontSize: 22,
    position: "absolute",
    right: 24,
  },

  botaoCriarConta: {
    width: "100%",
    maxWidth: 380,
    height: 60,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#347A59",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  textoBotaoCriarConta: {
    color: "#347A59",
    fontSize: 16,
    fontWeight: "800",
  },

  textoRodape: {
    maxWidth: 330,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 17,
    color: "#89938C",
  },

  link: {
    color: "#347A59",
    fontWeight: "700",
  },

  circuloSuperior: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#E3F0E5",
    top: -120,
    right: -90,
  },

  circuloLateral: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#EAF4EC",
    top: "36%",
    left: -75,
  },

  circuloInferior: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#E5F1E8",
    bottom: -110,
    right: -65,
  },
});
