import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Botao, Campo, Carregando, Falha, Pagina, ui } from '../../components/Interface';
import { Alert } from '../../components/Alerta';
import ListaTurmas from '../../components/ListaTurmas';
import TurnosEscolha from '../../components/TurnosEscolha';
import RestricoesAluno from '../../components/RestricoesAluno';
import PrivacidadeAluno from '../../components/PrivacidadeAluno';
import AvisoInstitucional from '../../components/AvisoInstitucional';
import { usePerfil } from '../../hooks/useDados';
import { auth, signOut } from '../../services/backend';
import { alterarDadosEscolares, alterarSenha, solicitarNovoEmail } from '../../services/contas';
import { mensagemAuth } from '../../domain/contas';
import { turnosDoPerfil, TURNOS_ALUNO } from '../../domain/escolas';

export default function TelaPerfilAluno({ navigation }) {
  const perfil = usePerfil(), [acao,setAcao] = useState(null), [turma,setTurma] = useState(''), [turnos,setTurnos] = useState([]);
  const [email,setEmail] = useState(''), [atual,setAtual] = useState(''), [nova,setNova] = useState(''), [confirmar,setConfirmar] = useState('');
  const [erro,setErro] = useState(null), [ocupado,setOcupado] = useState(false), trava = useRef(false);
  const aluno = perfil.perfil?.tipoConta === 'aluno';
  useEffect(() => { setTurma(perfil.perfil?.turmaId || ''); setTurnos(turnosDoPerfil(perfil.perfil)); }, [perfil.perfil?.turmaId, JSON.stringify(perfil.perfil?.turnos)]);
  function abrir(tipo) { setAcao(tipo); setErro(null); setAtual(''); setNova(''); setConfirmar(''); setEmail(''); }
  async function executar(fn) {
    if (trava.current) return;
    trava.current = true; setOcupado(true); setErro(null);
    try { await fn(); } catch (e) { setErro(mensagemAuth(e)); }
    finally { trava.current = false; setOcupado(false); }
  }
  async function salvar() {
    if (acao === 'escola') { await alterarDadosEscolares(turma,turnos); }
    else if (acao === 'email') { await solicitarNovoEmail(email, atual); Alert.alert('Confirme o novo e-mail','Abra o link recebido. Seu e-mail atual permanece até a confirmação.'); }
    else { if (nova !== confirmar) throw new Error('As senhas precisam ser iguais.'); await alterarSenha(atual,nova); }
    abrir(null);
    Alert.alert('Solicitação concluída', acao === 'email' ? 'Confira a mensagem no novo endereço.' : 'Suas informações foram atualizadas.');
  }
  const principal = navigation.getParent?.() || navigation;
  return <Pagina titulo="Minha conta" subtitulo="Escolha o que deseja consultar ou atualizar.">
    {perfil.carregando ? <Carregando /> : perfil.erro ? <Falha mensagem={perfil.erro} tentarNovamente={perfil.tentarNovamente} /> : <>
      <View style={ui.card}><Text style={ui.secao}>{perfil.perfil.nome}</Text><Text style={ui.texto}>{auth.currentUser?.email || perfil.perfil.email}</Text><Text style={ui.texto}>{perfil.perfil.escola}</Text></View>
      {acao === null ? <>
        {aluno ? <Botao secundario onPress={() => abrir('escola')}>Dados escolares e turnos</Botao> : null}
        <Botao secundario onPress={() => abrir('email')}>Alterar e-mail</Botao><Botao secundario onPress={() => abrir('senha')}>Alterar senha</Botao>
        {aluno ? <Botao secundario onPress={() => abrir('restricoes')}>Restrições alimentares</Botao> : null}
        <Botao secundario onPress={() => abrir('privacidade')}>Privacidade e ajuda</Botao>
      </> : <>
        {acao === 'restricoes' ? <RestricoesAluno /> : acao === 'privacidade' ? <>
          <AvisoInstitucional escolaInicial={perfil.perfil.escola} />
          <View style={ui.linha}><Botao secundario onPress={() => principal.navigate('Consentimento',{screen:'TermosUso'})}>Termos de Uso</Botao><Botao secundario onPress={() => principal.navigate('Consentimento',{screen:'PoliticaPrivacidade'})}>Política de Privacidade</Botao></View>
          {aluno ? <PrivacidadeAluno /> : null}
        </> : <View style={ui.card}>
          {acao === 'escola' ? <><Text style={ui.texto}>Matrícula: {perfil.perfil.matricula}</Text><Text style={ui.pequeno}>Escola e matrícula permanecem vinculadas ao seu cadastro.</Text><ListaTurmas escola={perfil.perfil.escola} valor={turma} disabled={ocupado} onChange={t => setTurma(t.id)} /><TurnosEscolha value={turnos} onChange={setTurnos} disabled={ocupado} /></> : <>
            {acao === 'email' ? <Campo label="Novo e-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" editable={!ocupado} /> : <><Campo label="Nova senha" value={nova} onChangeText={setNova} secureTextEntry editable={!ocupado} autoCapitalize="none" ajuda="8 ou mais caracteres, letra, número e símbolo." /><Campo label="Confirmar nova senha" value={confirmar} onChangeText={setConfirmar} secureTextEntry editable={!ocupado} autoCapitalize="none" /></>}
            <Campo label="Senha atual" value={atual} onChangeText={setAtual} secureTextEntry editable={!ocupado} autoCapitalize="none" />
          </>}
          {erro ? <Text accessibilityRole="alert" style={ui.erro}>{erro}</Text> : null}<Botao carregando={ocupado} onPress={() => executar(salvar)}>Salvar alteração</Botao>
        </View>}
        <Botao secundario disabled={ocupado} onPress={() => abrir(null)}>Voltar às opções da conta</Botao>
      </>}
      <Botao secundario disabled={ocupado} onPress={() => Alert.alert('Sair da conta?','Você voltará à tela inicial.',[{text:'Cancelar',style:'cancel'},{text:'Sair',onPress:() => executar(async () => { await signOut(auth); principal.reset({index:0,routes:[{name:'Inicial'}]}); })}])}>Sair da conta</Botao>
      {!aluno ? <Botao secundario onPress={() => navigation.goBack()}>Voltar à gestão</Botao> : null}
    </>}
  </Pagina>;
}