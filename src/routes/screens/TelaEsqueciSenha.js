import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Botao, Campo, Pagina, ui } from '../../components/Interface';
import { recuperarSenha } from '../../services/contas';
import { mensagemAuth } from '../../domain/contas';
export default function TelaEsqueciSenha({ navigation, route }) {
  const [email, setEmail] = useState(route?.params?.email || ''); const [erro, setErro] = useState(null); const [enviado, setEnviado] = useState(false); const [ocupado, setOcupado] = useState(false); const bloqueio = useRef(false);
  async function enviar() { if (bloqueio.current) return; bloqueio.current = true; setOcupado(true); setErro(null); try { await recuperarSenha(email); setEnviado(true); } catch (e) { setErro(mensagemAuth(e)); } finally { bloqueio.current = false; setOcupado(false); } }
  return <Pagina estreita titulo="Recuperar senha" subtitulo="Use o e-mail cadastrado na sua conta.">
    {enviado ? <View style={ui.card}><Text style={ui.secao}>Confira seu e-mail</Text><Text style={ui.texto}>Se houver uma conta para esse endereço, você receberá um link para definir uma nova senha. Confira também a pasta de spam.</Text></View> : <Campo label="E-mail" testID="email-recuperacao" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" editable={!ocupado} />}
    {erro ? <Text style={ui.erro} accessibilityRole="alert">{erro}</Text> : null}
    {!enviado ? <Botao testID="recuperar-senha" carregando={ocupado} onPress={enviar}>Enviar link de recuperação</Botao> : null}
    <Botao secundario disabled={ocupado} onPress={() => navigation.goBack()}>Voltar ao login</Botao>
  </Pagina>;
}
