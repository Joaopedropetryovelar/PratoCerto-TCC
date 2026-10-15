import { VERSAO_APP } from '../../domain/versao';
import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Botao, Campo, Filtros, Pagina, ui } from '../../components/Interface';
import { entrarConta } from '../../services/contas';
import { mensagemAuth } from '../../domain/contas';
import { ESCOLAS } from '../../domain/escolas';
export default function TelaLogin({ navigation, route }) {
  const [email, setEmail] = useState(''); const [senha, setSenha] = useState(''); const [escola, setEscola] = useState('');
  const [mostrar, setMostrar] = useState(false); const [erro, setErro] = useState(null); const [ocupado, setOcupado] = useState(false); const bloqueio = useRef(false);
  async function entrar() {
    if (bloqueio.current) return; bloqueio.current = true; setOcupado(true); setErro(null);
    try {
      const { perfil, verificado } = await entrarConta({ email, senha, escola, apenasAdmin: route?.params?.cadastrarAdmin === true });
      setSenha('');
      if (!verificado) navigation.reset({ index: 0, routes: [{ name: 'VerificarEmail', params: { cadastrarAdmin: route?.params?.cadastrarAdmin === true } }] });
      else if (route?.params?.cadastrarAdmin) navigation.reset({ index: 1, routes: [{ name: 'HomeAdmin' }, { name: 'CadastroAdmin' }] });
      else navigation.reset({ index: 0, routes: [{ name: perfil.tipoConta === 'admin' ? 'HomeAdmin' : 'HomeAluno' }] });
    } catch (falha) { setErro(mensagemAuth(falha)); }
    finally { bloqueio.current = false; setOcupado(false); }
  }
  return <Pagina estreita titulo="Bem-vindo de volta" subtitulo={route?.params?.cadastrarAdmin ? 'Entre com uma conta de equipe já autorizada.' : 'Entre com sua conta e escolha a escola vinculada a ela.'}>
    <View style={ui.card}><Campo label="E-mail" testID="email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" editable={!ocupado} /><Filtros vertical label="Escola" opcoes={ESCOLAS.map((s) => ({ id: s, nome: s }))} valor={escola} onChange={setEscola} /><Campo label="Senha" testID="senha" value={senha} onChangeText={setSenha} secureTextEntry={!mostrar} autoCapitalize="none" autoCorrect={false} editable={!ocupado} /><Botao secundario onPress={() => setMostrar(!mostrar)}>{mostrar ? 'Ocultar senha' : 'Mostrar senha'}</Botao></View>
    {erro ? <Text accessibilityRole="alert" style={ui.erro}>{erro}</Text> : null}
    <Botao testID="entrar-conta" carregando={ocupado} onPress={entrar}>Entrar</Botao>
    <Botao secundario disabled={ocupado} onPress={() => navigation.navigate('EsqueciSenha', { email })}>Esqueci minha senha</Botao>
    <Botao secundario disabled={ocupado} onPress={() => navigation.navigate('EscolhaCadastro')}>Criar conta</Botao>
    <Botao secundario disabled={ocupado} onPress={() => navigation.goBack()}>Voltar</Botao>
    <Text testID="versao-app" style={ui.pequeno}>Versão {VERSAO_APP}</Text>
  </Pagina>;
}
