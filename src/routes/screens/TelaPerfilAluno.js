import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TelaPerfilUsuario({ navigation: navegacao }) {
  const [avisosCardapio, definirAvisosCardapio] = useState(true);
  const [lembretePresenca, definirLembretePresenca] = useState(true);

  function abrirTela(nomeDaTela) {
    if (navegacao) {
      navegacao.navigate(nomeDaTela);
    }
  }

  function editarPerfil() {
    Alert.alert('Editar perfil', 'Aqui você pode abrir a tela de edição.');
  }

  function sairDaConta() {
    Alert.alert('Sair da conta', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive' },
    ]);
  }

  return (
    <SafeAreaView style={estilos.tela}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6FAF1" />

      <ScrollView
        style={estilos.rolagem}
        contentContainerStyle={estilos.conteudoRolagem}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.cabecalho}>
          <Text style={estilos.subtituloCabecalho}>Sua conta no Prato Certo</Text>
          <Text style={estilos.titulo}>Meu perfil</Text>
        </View>

        <View style={estilos.cartaoPerfil}>
          <View style={estilos.fotoPerfil}>
            <Text style={estilos.iniciaisUsuario}>SL</Text>
          </View>

          <View style={estilos.informacoesPerfil}>
            <Text style={estilos.nomeUsuario}>Sofia Lima</Text>
            <Text style={estilos.escolaUsuario}>Escola Municipal Girassol</Text>
            <View style={estilos.seloTurma}>
              <Text style={estilos.textoSeloTurma}>ALUNA · 7º B</Text>
            </View>
          </View>

          <TouchableOpacity style={estilos.botaoEditar} onPress={editarPerfil}>
            <Text style={estilos.iconeEditar}>✏️</Text>
          </TouchableOpacity>
        </View>

        <View style={estilos.linhaResumo}>
          <View style={estilos.cartaoResumo}>
            <Text style={estilos.valorResumo}>12</Text>
            <Text style={estilos.rotuloResumo}>REFEIÇÕES{`\n`}CONFIRMADAS</Text>
          </View>
          <View style={estilos.cartaoResumo}>
            <Text style={estilos.valorResumo}>8</Text>
            <Text style={estilos.rotuloResumo}>AVALIAÇÕES{`\n`}ENVIADAS</Text>
          </View>
          <View style={estilos.cartaoResumo}>
            <Text style={estilos.valorResumo}>96%</Text>
            <Text style={estilos.rotuloResumo}>PRESENÇA{`\n`}NO MÊS</Text>
          </View>
        </View>

        <Text style={estilos.tituloSecao}>DADOS DA CONTA</Text>

        <View style={estilos.cartaoConfiguracoes}>
          <TouchableOpacity style={estilos.linhaConfiguracao} onPress={editarPerfil}>
            <View style={estilos.caixaIconeConfiguracao}>
              <Text style={estilos.iconeConfiguracao}>✉️</Text>
            </View>
            <View style={estilos.caixaTextoConfiguracao}>
              <Text style={estilos.tituloConfiguracao}>E-mail</Text>
              <Text style={estilos.descricaoConfiguracao}>
                sofia.lima@escola.com
              </Text>
            </View>
            <Text style={estilos.setaDireita}>›</Text>
          </TouchableOpacity>

          <View style={estilos.divisor} />

          <TouchableOpacity style={estilos.linhaConfiguracao} onPress={editarPerfil}>
            <View style={estilos.caixaIconeConfiguracao}>
              <Text style={estilos.iconeConfiguracao}>🏫</Text>
            </View>
            <View style={estilos.caixaTextoConfiguracao}>
              <Text style={estilos.tituloConfiguracao}>Escola e turma</Text>
              <Text style={estilos.descricaoConfiguracao}>
                Municipal Girassol · 7º B
              </Text>
            </View>
            <Text style={estilos.setaDireita}>›</Text>
          </TouchableOpacity>

          <View style={estilos.divisor} />

          <TouchableOpacity style={estilos.linhaConfiguracao} onPress={editarPerfil}>
            <View style={estilos.caixaIconeConfiguracao}>
              <Text style={estilos.iconeConfiguracao}>🔒</Text>
            </View>
            <View style={estilos.caixaTextoConfiguracao}>
              <Text style={estilos.tituloConfiguracao}>Alterar senha</Text>
              <Text style={estilos.descricaoConfiguracao}>
                Atualize sua senha de acesso
              </Text>
            </View>
            <Text style={estilos.setaDireita}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={estilos.tituloSecao}>PREFERÊNCIAS</Text>

        <View style={estilos.cartaoConfiguracoes}>
          <View style={estilos.linhaConfiguracao}>
            <View style={estilos.caixaIconeConfiguracao}>
              <Text style={estilos.iconeConfiguracao}>🔔</Text>
            </View>
            <View style={estilos.caixaTextoConfiguracao}>
              <Text style={estilos.tituloConfiguracao}>Avisos de cardápio</Text>
              <Text style={estilos.descricaoConfiguracao}>
                Receber novidades da escola
              </Text>
            </View>
            <Switch
              value={avisosCardapio}
              onValueChange={definirAvisosCardapio}
              trackColor={coresInterruptor.trilho}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={estilos.divisor} />

          <View style={estilos.linhaConfiguracao}>
            <View style={estilos.caixaIconeConfiguracao}>
              <Text style={estilos.iconeConfiguracao}>✅</Text>
            </View>
            <View style={estilos.caixaTextoConfiguracao}>
              <Text style={estilos.tituloConfiguracao}>Lembrete de presença</Text>
              <Text style={estilos.descricaoConfiguracao}>
                Avisar antes do fim do prazo
              </Text>
            </View>
            <Switch
              value={lembretePresenca}
              onValueChange={definirLembretePresenca}
              trackColor={coresInterruptor.trilho}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <TouchableOpacity style={estilos.botaoSair} onPress={sairDaConta}>
          <Text style={estilos.iconeSair}>↪</Text>
          <Text style={estilos.textoSair}>Sair da conta</Text>
        </TouchableOpacity>

        <Text style={estilos.textoVersao}>Prato Certo · versão 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const coresInterruptor = {
  trilho: {
    false: '#DCE8D2',
    true: '#2F6B4F',
  },
};

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: '#F6FAF1',
  },
  rolagem: {
    flex: 1,
  },
  conteudoRolagem: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  cabecalho: {
    marginBottom: 18,
  },
  subtituloCabecalho: {
    color: '#5B6B5C',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  titulo: {
    color: '#204A37',
    fontSize: 25,
    fontWeight: '800',
  },
  cartaoPerfil: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE8D2',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
  },
  fotoPerfil: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F6B4F',
    borderRadius: 31,
    marginRight: 13,
  },
  iniciaisUsuario: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  informacoesPerfil: {
    flex: 1,
  },
  nomeUsuario: {
    color: '#1E2B21',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 3,
  },
  escolaUsuario: {
    color: '#5B6B5C',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 7,
  },
  seloTurma: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6E7',
    borderRadius: 100,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  textoSeloTurma: {
    color: '#2F6B4F',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  botaoEditar: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6E7',
    borderRadius: 11,
    marginLeft: 8,
  },
  iconeEditar: {
    fontSize: 14,
  },
  linhaResumo: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  cartaoResumo: {
    flex: 1,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE8D2',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 5,
    paddingVertical: 9,
  },
  valorResumo: {
    color: '#2F6B4F',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 3,
  },
  rotuloResumo: {
    color: '#5B6B5C',
    fontSize: 7.5,
    fontWeight: '800',
    lineHeight: 10,
    textAlign: 'center',
  },
  tituloSecao: {
    color: '#5B6B5C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 9,
  },
  cartaoConfiguracoes: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE8D2',
    borderWidth: 1.5,
    borderRadius: 18,
    paddingHorizontal: 13,
    marginBottom: 20,
  },
  linhaConfiguracao: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
  },
  caixaIconeConfiguracao: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6E7',
    borderRadius: 12,
    marginRight: 11,
  },
  iconeConfiguracao: {
    fontSize: 16,
  },
  caixaTextoConfiguracao: {
    flex: 1,
    paddingVertical: 11,
  },
  tituloConfiguracao: {
    color: '#1E2B21',
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 3,
  },
  descricaoConfiguracao: {
    color: '#5B6B5C',
    fontSize: 10.5,
    lineHeight: 14,
  },
  setaDireita: {
    color: '#5B6B5C',
    fontSize: 24,
    fontWeight: '400',
    marginLeft: 8,
  },
  divisor: {
    height: 1,
    backgroundColor: '#DCE8D2',
    marginLeft: 49,
  },
  botaoSair: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FBE1DD',
    borderRadius: 16,
    marginBottom: 12,
  },
  iconeSair: {
    color: '#E85D4C',
    fontSize: 19,
    fontWeight: '800',
  },
  textoSair: {
    color: '#E85D4C',
    fontSize: 13,
    fontWeight: '800',
  },
  textoVersao: {
    color: '#5B6B5C',
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.7,
  },
});
