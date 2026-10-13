import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Botao, Pagina, ui } from '../../components/Interface';
import { auth, signOut } from '../../services/backend';
import { reenviarVerificacao, verificarEmailConfirmado } from '../../services/contas';
import { mensagemAuth } from '../../domain/contas';
import { usePerfil } from '../../hooks/useDados';
import RestricoesAluno from '../../components/RestricoesAluno';
export default function TelaVerificarEmail({ navigation, route }) {
  const perfil = usePerfil();
  const [erro, setErro] = useState(null); const [mensagem, setMensagem] = useState(route?.params?.emailEnviado === false ? 'Sua conta foi criada, mas o envio do e-mail falhou. Use Reenviar.' : 'Abra o link de confirmação recebido no seu e-mail.'); const [ocupado, setOcupado] = useState(false); const bloqueio = useRef(false);
  async function executar(acao) { if (bloqueio.current) return; bloqueio.current = true; setOcupado(true); setErro(null); try { await acao(); } catch (e) { setErro(mensagemAuth(e)); } finally { bloqueio.current = false; setOcupado(false); } }
  async function conferir() { const perfil = await verificarEmailConfirmado(); if (route?.params?.cadastrarAdmin && perfil.tipoConta === 'admin') navigation.reset({ index: 1, routes: [{ name: 'HomeAdmin' }, { name: 'CadastroAdmin' }] }); else navigation.reset({ index: 0, routes: [{ name: perfil.tipoConta === 'admin' ? 'HomeAdmin' : 'HomeAluno' }] }); }
  return <Pagina estreita titulo="Confirme seu e-mail" subtitulo={auth.currentUser?.email || 'Entre novamente se sua sessão terminou.'}>
    <View style={ui.card}><Text style={ui.texto}>{mensagem}</Text><Text style={ui.pequeno}>Confira também o spam. Só depois da confirmação sua conta acessará o cardápio e as respostas da escola.</Text></View>
    {erro ? <Text accessibilityRole="alert" style={ui.erro}>{erro}</Text> : null}
    <Botao testID="conferir-email" carregando={ocupado} onPress={() => executar(conferir)}>Já confirmei meu e-mail</Botao>
    <Botao secundario disabled={ocupado} onPress={() => executar(async () => { await reenviarVerificacao(); setMensagem('Mensagem enviada. Abra o link no seu e-mail.'); })}>Reenviar confirmação</Botao>
    {perfil.perfil?.tipoConta === 'aluno' ? <><Text style={ui.pequeno}>Enquanto aguarda a confirmação, você pode atualizar ou retirar sua declaração alimentar.</Text><RestricoesAluno /></> : null}
    <Botao secundario disabled={ocupado} onPress={() => executar(async () => { await signOut(auth); navigation.reset({ index: 0, routes: [{ name: 'Inicial' }] }); })}>Voltar à tela inicial</Botao>
  </Pagina>;
}
