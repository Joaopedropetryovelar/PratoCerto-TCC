import ListaTurmas from '../../components/ListaTurmas';
import FormularioRestricoes from '../../components/FormularioRestricoes';
import { formularioRestricoes, validarRestricoes } from '../../domain/restricoes';
import { VERSAO_APP } from '../../domain/versao';
import React, { useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Botao, Campo, Filtros, Pagina, ui } from '../../components/Interface';
import TurnosEscolha from '../../components/TurnosEscolha';
import { ESCOLAS } from '../../domain/escolas';
import { mensagemAuth, validarCadastro } from '../../domain/contas';
import { cadastrarAluno } from '../../services/contas';
export default function CadastroScreen({ navigation }) {
  const [dados, setDados] = useState({ nome: '', matricula: '', turma: '', turmaId: '', turnos: [], escola: '', email: '', senha: '', confirmarSenha: '', aceitouTermos: false, restricoes: formularioRestricoes() });
  const [erros, setErros] = useState({}); const [erro, setErro] = useState(null); const [ocupado, setOcupado] = useState(false); const bloqueio = useRef(false);
  function mudar(campo, valor) { setDados((d) => ({ ...d, [campo]: valor })); }
  async function cadastrar() { if (bloqueio.current) return; const falhas = validarCadastro(dados); setErros(falhas); if (Object.keys(falhas).length) return; bloqueio.current = true; setOcupado(true); setErro(null); try { const resultado = await cadastrarAluno(dados); mudar('senha',''); mudar('confirmarSenha',''); (navigation.getParent() || navigation).reset({ index: 0, routes: [{ name: 'VerificarEmail', params: resultado }] }); } catch (e) { setErro(mensagemAuth(e)); } finally { bloqueio.current = false; setOcupado(false); } }
  return <Pagina estreita titulo="Criar conta de aluno" subtitulo="Cadastre-se uma vez e use as refeições dos seus turnos.">
    <View style={ui.card}>
      {[['nome','Nome completo'], ['matricula','Matrícula']].map(([id,label]) => <Campo key={id} testID={id} label={label} value={dados[id]} keyboardType={id === 'matricula' ? 'number-pad' : 'default'} ajuda={id === 'matricula' ? 'Exatamente 5 números. Sua matrícula precisa estar autorizada pela escola.' : undefined} onChangeText={(v) => mudar(id,v)} maxLength={id === 'matricula' ? 5 : id === 'turma' ? 80 : 100} editable={!ocupado} erro={erros[id]} />)}
      <TurnosEscolha value={dados.turnos} onChange={(v) => mudar('turnos',v)} disabled={ocupado} />{erros.turnos ? <Text style={ui.erro}>{erros.turnos}</Text> : null}
      <Filtros vertical label="Escola" opcoes={ESCOLAS.map((s) => ({ id: s, nome: s }))} valor={dados.escola} onChange={(v) => setDados(d => ({ ...d, escola:v, turma:'', turmaId:'' }))} />{erros.escola ? <Text style={ui.erro}>{erros.escola}</Text> : null}
      <ListaTurmas escola={dados.escola} valor={dados.turmaId} disabled={ocupado} erro={erros.turma} onChange={(t) => setDados(d => ({ ...d, turma:t.nome, turmaId:t.id }))} />
      <Campo label="E-mail" value={dados.email} onChangeText={(v) => mudar('email',v)} editable={!ocupado} keyboardType="email-address" autoCorrect={false} autoCapitalize="none" erro={erros.email} ajuda="Você receberá uma mensagem para confirmar este endereço." />
      <Campo label="Senha" value={dados.senha} onChangeText={(v) => mudar('senha',v)} secureTextEntry editable={!ocupado} autoCapitalize="none" autoCorrect={false} erro={erros.senha} ajuda="Pelo menos 8 caracteres, uma letra, um número e um símbolo (!, @, *...)." />
      <Campo label="Confirmar senha" value={dados.confirmarSenha} onChangeText={(v) => mudar('confirmarSenha',v)} secureTextEntry editable={!ocupado} autoCapitalize="none" autoCorrect={false} erro={erros.confirmarSenha} />
    </View>
    <FormularioRestricoes valor={dados.restricoes} onChange={(v) => mudar('restricoes', v)} erros={erros.restricoes ? validarRestricoes(dados.restricoes) : {}} disabled={ocupado} />
    <View style={ui.linha}><Botao secundario onPress={() => navigation.navigate('TermosUso')}>Ler termos</Botao><Botao secundario onPress={() => navigation.navigate('PoliticaPrivacidade')}>Ler privacidade</Botao></View>
    <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: dados.aceitouTermos }} disabled={ocupado} onPress={() => mudar('aceitouTermos', !dados.aceitouTermos)} style={ui.card}><Text style={ui.label}>{dados.aceitouTermos ? '☑' : '☐'} Li e aceito os Termos de Uso e a Política de Privacidade.</Text></TouchableOpacity>{erros.termos ? <Text style={ui.erro}>{erros.termos}</Text> : null}
    {erro ? <Text style={ui.erro} accessibilityRole="alert">{erro}</Text> : null}
    <Botao testID="cadastrar-aluno" onPress={cadastrar} carregando={ocupado}>Criar conta e verificar e-mail</Botao>
    <Botao secundario disabled={ocupado} onPress={() => navigation.goBack()}>Voltar</Botao>
    <Text testID="versao-app" style={ui.pequeno}>Versão {VERSAO_APP}</Text>
  </Pagina>;
}
