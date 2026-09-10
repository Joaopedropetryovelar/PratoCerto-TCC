import React, { useState } from 'react';
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
} from 'react-native';

export default function CadastroScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [aceitou, setAceitou] = useState(false);

  function validarCadastro() {
    if (!nome || !matricula || !email || !senha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return false;
    }

    if (!aceitou) {
      Alert.alert(
        'Consentimento necessário',
        'Leia e aceite os Termos de Uso e a Política de Privacidade para continuar.'
      );
      return false;
    }

    return true;
  }

  function criarConta() {
    const cadastroValido = validarCadastro();

    if (!cadastroValido) {
      return;
    }

    Alert.alert(
      'Tudo certo!',
      'Consentimento registrado. Agora você pode criar a conta.'
    );

    // Depois você pode salvar no Firestore.
  }

  function abrirTermos() {
    navigation.navigate('TermosUso');
  }

  function abrirPoliticaPrivacidade() {
    navigation.navigate('PoliticaPrivacidade');
  }

  function voltar() {
    navigation?.goBack?.();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F6FAF1"
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={voltar}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.logoRow}>
          <View style={styles.logo}>
            <Text style={styles.logoLeaf}>🌿</Text>
          </View>

          <Text style={styles.logoText}>
            Prato{'\n'}Certo
          </Text>
        </View>

        <Text style={styles.title}>Criar conta</Text>

        <Text style={styles.subtitle}>
          Preencha seus dados para começar a usar o Prato Certo.
        </Text>

        <Text style={styles.label}>Nome completo</Text>

        <TextInput
          style={styles.input}
          value={nome}
          onChangeText={setNome}
          placeholder="Seu nome completo"
          placeholderTextColor="#94A097"
        />

        <Text style={styles.label}>Matrícula</Text>

        <TextInput
          style={styles.input}
          value={matricula}
          onChangeText={setMatricula}
          placeholder="Digite sua matrícula"
          placeholderTextColor="#94A097"
        />

        <Text style={styles.label}>E-mail</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="seuemail@escola.edu.br"
          placeholderTextColor="#94A097"
        />

        <Text style={styles.label}>Senha</Text>

        <TextInput
          style={styles.input}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          placeholder="Crie uma senha"
          placeholderTextColor="#94A097"
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>🛡️</Text>

          <Text style={styles.infoText}>
            Seus dados são protegidos e usados apenas para fins educacionais,
            como identificação, registro de refeições e feedbacks.
          </Text>
        </View>

        <View style={styles.consentRow}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              aceitou && styles.checkboxChecked,
            ]}
            onPress={() => setAceitou(!aceitou)}
          >
            {aceitou && (
              <Text style={styles.check}>✓</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.consentText}>
            Li e aceito os{' '}
            <Text
              style={styles.link}
              onPress={abrirTermos}
            >
              Termos de Uso
            </Text>{' '}
            e a{' '}
            <Text
              style={styles.link}
              onPress={abrirPoliticaPrivacidade}
            >
              Política de Privacidade
            </Text>
            .
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            !aceitou && styles.buttonDisabled,
          ]}
          onPress={criarConta}
        >
          <Text style={styles.buttonText}>
            Criar conta
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Já tem uma conta?{' '}
          <Text style={styles.footerLink}>
            Entrar
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6FAF1',
  },

  container: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 30,
  },

  backButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    marginBottom: 10,
  },

  backText: {
    fontSize: 38,
    lineHeight: 38,
    color: '#204A37',
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E4F0DA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  logoLeaf: {
    fontSize: 27,
  },

  logoText: {
    fontSize: 25,
    lineHeight: 23,
    fontWeight: '800',
    color: '#205438',
  },

  title: {
    fontSize: 29,
    fontWeight: '800',
    color: '#101810',
    marginBottom: 6,
  },

  subtitle: {
    color: '#4E5D50',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#253326',
    marginBottom: 7,
  },

  input: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.3,
    borderColor: '#D6E2D0',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1E2B21',
    marginBottom: 15,
  },

  infoBox: {
    backgroundColor: '#E5F1D9',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 3,
    marginBottom: 18,
  },

  infoIcon: {
    fontSize: 21,
    marginRight: 10,
  },

  infoText: {
    flex: 1,
    color: '#25402C',
    fontSize: 13,
    lineHeight: 19,
  },

  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 22,
  },

  checkbox: {
    width: 26,
    height: 26,
    borderWidth: 2,
    borderColor: '#2F6B4F',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },

  checkboxChecked: {
    backgroundColor: '#2F6B4F',
  },

  check: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  consentText: {
    flex: 1,
    color: '#26352A',
    fontSize: 13,
    lineHeight: 20,
  },

  link: {
    color: '#1F5B3D',
    textDecorationLine: 'underline',
    fontWeight: '700',
  },

  button: {
    height: 54,
    backgroundColor: '#2F6B4F',
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonDisabled: {
    backgroundColor: '#AABBAE',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  footer: {
    textAlign: 'center',
    marginTop: 25,
    color: '#465248',
    fontSize: 13,
  },

  footerLink: {
    color: '#21593D',
    fontWeight: '800',
  },
});
