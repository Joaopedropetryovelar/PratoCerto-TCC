import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TelaLogin({ navigation }) {
  const [tipoConta, setTipoConta] = useState('aluno');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  function entrar() {
    
    console.log('Entrar com:', tipoConta, email, senha);
    navigation.navigate("HomeAluno");
  }

  return (
    <SafeAreaView style={styles.tela}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6FAF1" />
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.logo}>
          <Text style={styles.logoEmoji}>🥗</Text>
        </View>

        <Text style={styles.titulo}>Bem-vindo de volta</Text>
        <Text style={styles.subtitulo}>
          Entre para ver o cardápio da semana e confirmar suas refeições.
        </Text>

        <View style={styles.trocaTipo}>
          <TouchableOpacity
            style={[styles.opcao, tipoConta === 'aluno' && styles.opcaoAtiva]}
            onPress={() => setTipoConta('aluno')}
          >
            <Text style={[styles.opcaoTexto, tipoConta === 'aluno' && styles.opcaoTextoAtivo]}>
              Aluno / Responsável
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.opcao, tipoConta === 'equipe' && styles.opcaoAtiva]}
            onPress={() => setTipoConta('equipe')}
          >
            <Text style={[styles.opcaoTexto, tipoConta === 'equipe' && styles.opcaoTextoAtivo]}>
              Equipe da escola
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.campo}>
          <Text style={styles.rotulo}>E-MAIL</Text>
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
            <Text style={styles.iconeCaixa}>✉️</Text>
          </View>
        </View>

        <View style={styles.campo}>
          <Text style={styles.rotulo}>SENHA</Text>
          <View style={styles.caixa}>
            <TextInput
              style={styles.entrada}
              placeholder="••••••••••"
              placeholderTextColor="#5B6B5C"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!mostrarSenha}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)}>
              <Text style={styles.textoMostrar}>{mostrarSenha ? 'Ocultar' : 'Mostrar'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.esqueciWrap}
          onPress={() => navigation?.navigate('EsqueciSenha')}
        >
          <Text style={styles.esqueciTexto}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botao} onPress={entrar}>
          <Text style={styles.botaoTexto}>Entrar</Text>
        </TouchableOpacity>

        <View style={styles.divisor}>
          <View style={styles.linha} />
          <Text style={styles.divisorTexto}>ou continue com</Text>
          <View style={styles.linha} />
        </View>

        <View style={styles.linhaSociais}>
          <TouchableOpacity style={styles.botaoSocial}>
            <Text style={styles.botaoSocialTexto}>🔵 Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botaoSocial}>
            <Text style={styles.botaoSocialTexto}> Apple</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.trocarTela}
          onPress={() => navigation?.navigate('Cadastro')}
        >
          <Text style={styles.trocarTelaTexto}>
            Não tem conta? <Text style={styles.trocarTelaNegrito}>Cadastre-se</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: '#F6FAF1',
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
    backgroundColor: '#2F6B4F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    elevation: 6,
  },
  logoEmoji: {
    fontSize: 26,
  },
  titulo: {
    fontWeight: '800',
    fontSize: 26,
    color: '#1E2B21',
    marginBottom: 6,
  },
  subtitulo: {
    fontSize: 14,
    color: '#5B6B5C',
    lineHeight: 20,
    marginBottom: 22,
  },
  trocaTipo: {
    flexDirection: 'row',
    backgroundColor: '#EFF6E7',
    borderRadius: 16,
    padding: 4,
    marginBottom: 22,
  },
  opcao: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 12,
  },
  opcaoAtiva: {
    backgroundColor: '#2F6B4F',
    elevation: 3,
  },
  opcaoTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B6B5C',
  },
  opcaoTextoAtivo: {
    color: '#FFFFFF',
  },
  campo: {
    marginBottom: 16,
  },
  rotulo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5B6B5C',
    letterSpacing: 0.5,
    marginBottom: 7,
  },
  caixa: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DCE8D2',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entrada: {
    flex: 1,
    fontSize: 14,
    color: '#1E2B21',
    fontWeight: '600',
    padding: 0,
  },
  iconeCaixa: {
    fontSize: 15,
    marginLeft: 8,
  },
  textoMostrar: {
    fontSize: 12,
    color: '#2F6B4F',
    fontWeight: '700',
    marginLeft: 8,
  },
  esqueciWrap: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  esqueciTexto: {
    fontSize: 12.5,
    color: '#2F6B4F',
    fontWeight: '700',
  },
  botao: {
    backgroundColor: '#2F6B4F',
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    elevation: 5,
  },
  botaoTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  divisor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  linha: {
    flex: 1,
    height: 1,
    backgroundColor: '#DCE8D2',
  },
  divisorTexto: {
    marginHorizontal: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#5B6B5C',
  },
  linhaSociais: {
    flexDirection: 'row',
    gap: 12,
  },
  botaoSocial: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DCE8D2',
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoSocialTexto: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E2B21',
  },
  trocarTela: {
    marginTop: 24,
    alignItems: 'center',
  },
  trocarTelaTexto: {
    fontSize: 13,
    color: '#5B6B5C',
  },
  trocarTelaNegrito: {
    color: '#2F6B4F',
    fontWeight: '700',
  },
});