import { VERSAO_APP } from '../../domain/versao';
import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Botao, Campo, Filtros, Pagina, ui } from '../../components/Interface';
import { entrarConta, reenviarVerificacao } from '../../services/contas';
import { mensagemAuth } from '../../domain/contas';
import { ESCOLAS } from '../../domain/escolas';
export default function TelaLogin({ navigation, route }) {
  const [email, setEmail] = useState(route?.params?.email || ''); const [senha, setSenha] = useState(''); const [escola, setEscola] = useState(route?.params?.escola || '');
  const [mostrar, setMostrar] = useState(false); const [erro, setErro] = useState(null); const [ocupado, setOcupado] = useState(false); const bloqueio = useRef(false);
  async function entrar() {
    if (bloqueio.current) return; bloqueio.current = true; setOcupado(true); setErro(null);
    try {
      const { perfil, verificado } = await entrarConta({ email, senha, escola, apenasAdmin: route?.params?.cadastrarAdmin === true });
      setSenha('');
      if (!verificado) {
        let emailEnviado;
        if (perfil.tipoConta === 'admin') {
          try { await reenviarVerificacao(); emailEnviado = true; } catch { emailEnviado = false; }
        }
        navigation.reset({ index: 0, routes: [{ name: 'VerificarEmail', params: { cadastrarAdmin: route?.params?.cadastrarAdmin === true, emailEnviado } }] });
      }
      else if (route?.params?.cadastrarAdmin) navigation.reset({ index: 0, routes: [{ name: 'HomeAdmin', params: { screen: 'CadastroAdmin' } }] });
      else navigation.reset({ index: 0, routes: [{ name: perfil.tipoConta === 'admin' ? 'HomeAdmin' : 'HomeAluno' }] });
    } catch (falha) { setErro(mensagemAuth(falha)); }
    finally { bloqueio.current = false; setOcupado(false); }
  }
  return <Pagina estreita titulo="Bem-vindo de volta" subtitulo={route?.params?.cadastrarAdmin ? 'Entre com uma conta de equipe já autorizada.' : 'Entre com sua conta e escolha a escola vinculada a ela.'}>
    {route?.params?.cadastroConcluido ? <View style={ui.card}><Text testID="cadastro-concluido" style={ui.texto}>{route.params.emailEnviado ? 'Conta criada! Confirme o e-mail pelo link enviado e faça login para acessar o aplicativo.' : 'Conta criada! Não foi possível enviar o e-mail de confirmação agora. Faça login para reenviar o link.'}</Text></View> : null}
    <View style={ui.card}><Campo label="E-mail" testID="email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" editable={!ocupado} /><Filtros vertical label="Escola" opcoes={ESCOLAS.map((s) => ({ id: s, nome: s }))} valor={escola} onChange={setEscola} /><Campo label="Senha" testID="senha" value={senha} onChangeText={setSenha} secureTextEntry={!mostrar} autoCapitalize="none" autoCorrect={false} editable={!ocupado} /><Botao secundario onPress={() => setMostrar(!mostrar)}>{mostrar ? 'Ocultar senha' : 'Mostrar senha'}</Botao></View>
    {erro ? <Text accessibilityRole="alert" style={ui.erro}>{erro}</Text> : null}
    <Botao testID="entrar-conta" carregando={ocupado} onPress={entrar}>Entrar</Botao>
    <Botao secundario disabled={ocupado} onPress={() => navigation.navigate('EsqueciSenha', { email })}>Esqueci minha senha</Botao>
    <Botao secundario disabled={ocupado} onPress={() => navigation.navigate('EscolhaCadastro')}>Criar conta</Botao>
    <Botao secundario disabled={ocupado} onPress={() => navigation.goBack()}>Voltar</Botao>
    <Text testID="versao-app" style={ui.pequeno}>Versão {VERSAO_APP}</Text>
  </Pagina>;
}