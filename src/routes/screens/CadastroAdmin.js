import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Botao, Campo, Carregando, Falha, Pagina, ui } from '../../components/Interface';
import { usePerfil } from '../../hooks/useDados';
import { auth, convidarAdministrador, sendPasswordResetEmail } from '../../services/backend';
import { emailNormalizado, emailValido } from '../../domain/contas';

export default function CadastroAdmin({ navigation }) {
  const perfil = usePerfil();
  const [nome, setNome] = useState(''), [email, setEmail] = useState('');
  const [erros, setErros] = useState({}), [erro, setErro] = useState(null), [ocupado, setOcupado] = useState(false);
  const [convite, setConvite] = useState(null), [enviado, setEnviado] = useState(false), trava = useRef(false);
  const autorizado = perfil.perfil?.tipoConta === 'admin' && perfil.perfil.acessoAtivo !== false && auth.currentUser?.emailVerified;
  async function enviarLink(destino) {
    await sendPasswordResetEmail(auth, destino.email);
    setEnviado(true);
  }
  async function adicionar() {
    if (trava.current || !autorizado) return;
    const falhas = {};
    if (nome.trim().length < 3 || nome.trim().length > 100) falhas.nome = 'Informe o nome completo, de 3 a 100 caracteres.';
    if (!emailValido(email)) falhas.email = 'Informe um e-mail que a pessoa consiga acessar.';
    setErros(falhas); setErro(null);
    if (Object.keys(falhas).length) return;
    trava.current = true; setOcupado(true); setEnviado(false);
    try {
      const resultado = await convidarAdministrador({ nome: nome.trim(), email: emailNormalizado(email) });
      setConvite(resultado);
      try { await enviarLink(resultado); }
      catch { setErro('O acesso já está autorizado, mas o envio falhou. Toque em Enviar link novamente.'); }
    } catch (e) {
      if (['functions/permission-denied','functions/unauthenticated'].includes(e.code)) setErro('Entre novamente com uma conta ativa da direção.');
      else if (['functions/internal','functions/unavailable','functions/deadline-exceeded','functions/not-found'].includes(e.code) || /publicar as funções/i.test(e.message || '')) setErro('O serviço de autorização está indisponível. Tente novamente; se continuar, procure o responsável pelo aplicativo.');
      else setErro(e.message || 'Não foi possível autorizar o acesso. Tente novamente.');
    } finally { trava.current = false; setOcupado(false); }
  }
  async function reenviar() {
    if (trava.current || !convite || !autorizado) return;
    trava.current = true; setOcupado(true); setErro(null);
    try { await enviarLink(convite); }
    catch { setErro('Não foi possível enviar o e-mail. Confira a conexão e tente novamente.'); }
    finally { trava.current = false; setOcupado(false); }
  }
  function novo() { setConvite(null); setNome(''); setEmail(''); setErros({}); setErro(null); setEnviado(false); }
  return <Pagina estreita titulo="Novo administrador" subtitulo={perfil.perfil?.escola || 'Equipe da direção'}>
    {perfil.carregando ? <Carregando /> : perfil.erro ? <Falha mensagem={perfil.erro} tentarNovamente={perfil.tentarNovamente} /> : !autorizado ? <View style={ui.card}><Text style={ui.texto}>Somente um administrador ativo e com e-mail confirmado pode autorizar novos integrantes da própria escola.</Text></View> : convite ? <View testID="convite-admin-criado" style={ui.card}>
      <Text style={ui.secao}>{convite.jaExistia ? 'Acesso já autorizado' : 'Administrador autorizado'}</Text>
      <Text style={ui.label}>{convite.nome}</Text><Text selectable style={ui.texto}>{convite.email}</Text>
      <Text accessibilityLiveRegion="polite" style={ui.selo}>{enviado ? 'Link de senha enviado por e-mail.' : 'Falta enviar o link de senha.'}</Text>
      <Text style={ui.texto}>A pessoa abre o e-mail, define a própria senha e entra no aplicativo escolhendo {convite.escola}. Se o app pedir confirmação do endereço, ela segue o link de verificação.</Text>
      <Botao testID="reenviar-convite-admin" secundario carregando={ocupado} onPress={reenviar}>Enviar link novamente</Botao>
      <Botao disabled={ocupado} onPress={novo}>Adicionar outra pessoa</Botao>
      <Botao secundario disabled={ocupado} onPress={() => navigation.navigate('EquipeAdmin')}>Ver equipe da direção</Botao>
    </View> : <>
      <View style={ui.card}>
        <Text style={ui.texto}>Informe quem fará parte da direção. A escola será vinculada automaticamente à sua.</Text>
        <Campo testID="nome-novo-admin" label="Nome completo" value={nome} onChangeText={setNome} erro={erros.nome} maxLength={100} editable={!ocupado} autoCapitalize="words" />
        <Campo testID="email-novo-admin" label="E-mail do novo administrador" value={email} onChangeText={setEmail} erro={erros.email} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!ocupado} maxLength={254} />
      </View>
      <Botao testID="autorizar-novo-admin" carregando={ocupado} onPress={adicionar}>Autorizar e enviar acesso</Botao>
      <Text style={ui.pequeno}>O novo integrante recebe um link para definir a senha. Sua conta continua conectada.</Text>
    </>}
    {erro ? <Text accessibilityRole="alert" style={ui.erro}>{erro}</Text> : null}
    <Botao secundario disabled={ocupado} onPress={() => navigation.goBack()}>Voltar</Botao>
  </Pagina>;
}