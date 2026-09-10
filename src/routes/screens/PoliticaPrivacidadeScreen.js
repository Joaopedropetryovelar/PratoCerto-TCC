import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const POLITICA = [
  {
    titulo: '1. Quais dados coletamos',
    texto:
      'Podemos coletar informações como nome, matrícula, e-mail, escola, turma, registros de refeições e feedbacks enviados pelo usuário.',
  },
  {
    titulo: '2. Como usamos seus dados',
    texto:
      'Os dados são utilizados para identificar a conta, vincular o usuário à escola, exibir o cardápio correto, registrar refeições e receber avaliações sobre a alimentação escolar.',
  },
  {
    titulo: '3. Compartilhamento de dados',
    texto:
      'Os dados não devem ser compartilhados com terceiros sem uma finalidade legítima e sem observar as regras aplicáveis de privacidade e proteção de dados.',
  },
  {
    titulo: '4. Seus direitos',
    texto:
      'O usuário ou responsável pode solicitar acesso, correção e outras providências relacionadas aos seus dados pelos canais definidos pela instituição responsável pelo aplicativo.',
  },
  {
    titulo: '5. Segurança',
    texto:
      'São adotadas medidas de segurança para reduzir riscos de acesso, alteração ou divulgação não autorizada dos dados armazenados.',
  },
];

export default function PoliticaPrivacidadeScreen({ navigation }) {
  function voltar() {
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F6FAF1"
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={voltar}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Política de Privacidade
        </Text>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {POLITICA.map((item) => (
            <View
              key={item.titulo}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>
                {item.titulo}
              </Text>

              <Text style={styles.text}>
                {item.texto}
              </Text>
            </View>
          ))}

          <View style={styles.versionBox}>
            <Text style={styles.version}>
              Versão: 1.0
            </Text>

            <Text style={styles.version}>
              Consulte a data de atualização publicada pela instituição.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={voltar}
        >
          <Text style={styles.buttonText}>
            Concordo e continuar
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6FAF1',
  },

  header: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  backButton: {
    width: 40,
  },

  backText: {
    fontSize: 38,
    lineHeight: 40,
    color: '#204A37',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '800',
    color: '#101810',
  },

  headerSpace: {
    width: 40,
  },

  container: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E9DA',
    padding: 20,
    marginTop: 10,
  },

  section: {
    marginBottom: 19,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#101810',
    marginBottom: 7,
  },

  text: {
    fontSize: 14,
    lineHeight: 21,
    color: '#303C32',
  },

  versionBox: {
    marginTop: 3,
  },

  version: {
    fontSize: 12,
    lineHeight: 18,
    color: '#69756B',
  },

  button: {
    backgroundColor: '#2F6B4F',
    borderRadius: 17,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
