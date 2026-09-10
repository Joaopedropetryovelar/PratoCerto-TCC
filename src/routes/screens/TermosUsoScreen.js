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

const TERMOS = [
  {
    titulo: '1. Sobre o Prato Certo',
    texto:
      'O Prato Certo é um aplicativo desenvolvido para ajudar estudantes e responsáveis a acompanhar o cardápio escolar, registrar refeições e enviar feedbacks.',
  },
  {
    titulo: '2. Uso do aplicativo',
    texto:
      'O aplicativo é destinado ao uso no ambiente escolar. O usuário deve utilizar as informações e recursos disponibilizados de forma responsável.',
  },
  {
    titulo: '3. Dados do usuário',
    texto:
      'Os dados fornecidos são utilizados para identificação, vínculo com a escola, registro das refeições e feedbacks, conforme descrito na Política de Privacidade.',
  },
  {
    titulo: '4. Responsabilidades',
    texto:
      'O usuário é responsável por fornecer informações corretas. A escola e os responsáveis pelo sistema devem manter as informações do serviço atualizadas.',
  },
];

export default function TermosUsoScreen({ navigation }) {
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
          Termos de Uso
        </Text>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {TERMOS.map((item) => (
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
    height: 62,
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
    fontSize: 21,
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
