import RestricoesAluno from '../../components/RestricoesAluno';
import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Botao, Campo, Carregando, Falha, Pagina, ui } from '../../components/Interface';
import { Alert } from '../../components/Alerta';
import { usePerfil } from '../../hooks/useDados';
import { auth, signOut } from '../../services/backend';
import { estaEmDemo } from '../../services/demo';
import { alterarTurma, alterarSenha, solicitarNovoEmail } from '../../services/contas';
import { solicitarExclusaoDados } from '../../services/privacidade';
import { mensagemAuth } from '../../domain/contas';
import { turnosDoPerfil, TURNOS_ALUNO } from '../../domain/escolas';
export default function TelaPerfilAluno({ navigation }) {
  const perfil=usePerfil();const [turma,setTurma]=useState('');const [email,setEmail]=useState('');const [atual,setAtual]=useState('');const [nova,setNova]=useState('');const [confirmar,setConfirmar]=useState('');const [justificativa,setJustificativa]=useState('');const [acao,setAcao]=useState(null);const [ocupado,setOcupado]=useState(false);const [erro,setErro]=useState(null);const bloqueio=useRef(false);
  useEffect(()=>{if(perfil.perfil)setTurma(perfil.perfil.turma||'');},[perfil.perfil?.turma]);
  function abrir(tipo){setAcao(tipo);setErro(null);setAtual('');setNova('');setConfirmar('');setEmail('');setJustificativa('');}
  async function executar(fn){if(bloqueio.current)return;bloqueio.current=true;setOcupado(true);setErro(null);try{await fn();}catch(e){setErro(mensagemAuth(e));}finally{bloqueio.current=false;setOcupado(false);}}
  async function salvar(){if(acao==='turma'){await alterarTurma(turma);setAcao(null);Alert.alert('Turma atualizada','Seu perfil foi atualizado.');}else if(acao==='email'){await solicitarNovoEmail(email,atual);setAtual('');setAcao(null);Alert.alert('Confirme o novo e-mail','Abra o link enviado ao novo endereço. Depois entre novamente com ele. Seu e-mail atual permanece até a confirmação.');}else if(acao==='lgpd'){await solicitarExclusaoDados(justificativa);setJustificativa('');setAcao(null);Alert.alert('Pedido registrado','A equipe da sua escola recebeu sua solicitação. A análise considera os registros que a instituição precisa manter por obrigação escolar.');}else{if(nova!==confirmar)throw new Error('As senhas precisam ser iguais.');await alterarSenha(atual,nova);setAtual('');setNova('');setConfirmar('');setAcao(null);Alert.alert('Senha alterada','Use a nova senha no próximo login.');}}
  const demo=estaEmDemo();
  return <Pagina titulo="Meu perfil" subtitulo="Sua conta e seus dados escolares.">
    {perfil.carregando?<Carregando/>:perfil.erro?<Falha mensagem={perfil.erro} tentarNovamente={perfil.tentarNovamente}/>:<>
      <View style={ui.card}><Text style={ui.secao}>{perfil.perfil.nome}</Text><Text style={ui.texto}>{auth.currentUser?.email||perfil.perfil.email}</Text><Text style={ui.texto}>Escola: {perfil.perfil.escola}</Text><Text style={ui.texto}>Matrícula: {perfil.perfil.matricula}</Text><Text style={ui.texto}>Turma: {perfil.perfil.turma}</Text><Text style={ui.texto}>Turnos: {turnosDoPerfil(perfil.perfil).map(id=>TURNOS_ALUNO.find(t=>t.id===id)?.nome).join(' e ')}</Text><Text style={ui.pequeno}>Escola e matrícula ficam fixas. Se houver erro no cadastro, procure a equipe.</Text></View>
      <RestricoesAluno />
      {acao?<View style={ui.card}>
        {acao==='turma'?<Campo label="Turma" value={turma} onChangeText={setTurma} maxLength={80} editable={!ocupado}/>:acao==='lgpd'?<>
          <Text style={ui.secao}>Pedir revisão ou exclusão de dados</Text><Text style={ui.texto}>Seu pedido será registrado para a equipe da sua escola. A declaração alimentar pode ser retirada diretamente no perfil; outros dados passam por conferência da instituição antes de exclusão, anonimização ou conservação obrigatória.</Text>
          <Campo label="Mensagem opcional" value={justificativa} onChangeText={setJustificativa} multiline maxLength={500} editable={!ocupado} ajuda="Use este campo se quiser explicar o motivo ou apontar algum dado específico."/>
        </>:<>
          {acao==='email'?<Campo label="Novo e-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!ocupado}/>:<><Campo label="Nova senha" value={nova} onChangeText={setNova} secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!ocupado} ajuda="8 ou mais caracteres, letra, número e símbolo."/><Campo label="Confirmar nova senha" value={confirmar} onChangeText={setConfirmar} secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!ocupado}/></>}
          <Campo label="Senha atual" value={atual} onChangeText={setAtual} secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!ocupado}/>
        </>}
        {erro?<Text style={ui.erro} accessibilityRole="alert">{erro}</Text>:null}<Botao testID={acao==='lgpd'?'registrar-solicitacao-lgpd':undefined} carregando={ocupado} onPress={()=>executar(salvar)}>{acao==='email'?'Enviar confirmação ao novo e-mail':acao==='lgpd'?'Registrar solicitação':'Salvar alteração'}</Botao><Botao secundario disabled={ocupado} onPress={()=>abrir(null)}>Cancelar</Botao>
      </View>:<><Botao secundario onPress={()=>abrir('turma')}>Alterar turma</Botao><Botao secundario disabled={demo} onPress={()=>abrir('email')}>Alterar e-mail</Botao><Botao secundario disabled={demo} onPress={()=>abrir('senha')}>Alterar senha</Botao>{demo?<Text style={ui.pequeno}>Trocas de e-mail e senha usam uma conta real. Na demonstração, teste a alteração de turma.</Text>:null}</>}
      <View style={ui.card}><Text style={ui.secao}>Privacidade</Text><Text style={ui.texto}>Você pode consultar os documentos aceitos, atualizar ou retirar a declaração alimentar e registrar um pedido sobre seus dados.</Text><View style={ui.linha}><Botao secundario onPress={()=>((navigation.getParent&&navigation.getParent())||navigation).navigate('Consentimento',{screen:'TermosUso'})}>Termos de Uso</Botao><Botao secundario onPress={()=>((navigation.getParent&&navigation.getParent())||navigation).navigate('Consentimento',{screen:'PoliticaPrivacidade'})}>Política de Privacidade</Botao></View><Botao testID="solicitar-exclusao-dados" secundario disabled={ocupado} onPress={()=>abrir('lgpd')}>Pedir revisão ou exclusão de dados</Botao></View>
      <Botao secundario disabled={ocupado} onPress={()=>Alert.alert('Sair da conta?','Você voltará à tela inicial.',[{text:'Cancelar',style:'cancel'},{text:'Sair',onPress:()=>executar(async()=>{await signOut(auth);(navigation.getParent()||navigation).reset({index:0,routes:[{name:'Inicial'}]});})}])}>Sair da conta</Botao>
    </>}
  </Pagina>;
}
