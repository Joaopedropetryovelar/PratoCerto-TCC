import React, { useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Botao, Campo, Filtros, Pagina, ui } from '../../components/Interface';
import ListaTurmas from '../../components/ListaTurmas';
import TurnosEscolha from '../../components/TurnosEscolha';
import { ESCOLAS } from '../../domain/escolas';
import { mensagemAuth, validarCadastro } from '../../domain/contas';
import { VERSAO_APP } from '../../domain/versao';
import { cadastrarAluno } from '../../services/contas';

export default function CadastroScreen({ navigation }) {
  const [dados, setDados] = useState({ nome: '', matricula: '', turma: '', turmaId: '', turnos: [], escola: '', email: '', senha: '', confirmarSenha: '', aceitouTermos: false, cientePrivacidade: false });
  const [etapa, setEtapa] = useState(1), [erros, setErros] = useState({}), [erro, setErro] = useState(null), [ocupado, setOcupado] = useState(false), trava = useRef(false);
  function mudar(campo, valor) { setDados(d => ({ ...d, [campo]: valor })); setErro(null); }
  function continuar() {
    const falhas = validarCadastro(dados), campos = ['nome','matricula','turma','escola','turnos'];
    setErros(falhas);
    if (!campos.some(c => falhas[c])) { setEtapa(2); setErros({}); }
  }
  async function cadastrar() {
    if (trava.current) return;
    const falhas = validarCadastro(dados); setErros(falhas);
    if (Object.keys(falhas).length) return;
    trava.current = true; setOcupado(true); setErro(null);
    try {
      const resultado = await cadastrarAluno(dados);
      mudar('senha', ''); mudar('confirmarSenha', '');
      (navigation.getParent() || navigation).reset({ index: 0, routes: [{ name: 'VerificarEmail', params: resultado }] });
    } catch (e) { setErro(mensagemAuth(e)); }
    finally { trava.current = false; setOcupado(false); }
  }
  return <Pagina estreita titulo="Criar conta de aluno" subtitulo={`Etapa ${etapa} de 2 · ${etapa === 1 ? 'Seu vínculo com a escola' : 'Acesso e documentos'}`}>
    <View style={ui.card}>
      {etapa === 1 ? <>
        <Campo testID="nome" label="Nome completo" value={dados.nome} onChangeText={v => mudar('nome', v)} maxLength={100} erro={erros.nome} />
        <Filtros vertical label="Escola" opcoes={ESCOLAS.map(id => ({ id, nome: id }))} valor={dados.escola} onChange={escola => setDados(d => ({ ...d, escola, turma: '', turmaId: '' }))} />
        {erros.escola ? <Text style={ui.erro}>{erros.escola}</Text> : null}
        <Campo testID="matricula" label="Matrícula" value={dados.matricula} onChangeText={v => mudar('matricula',v)} maxLength={5} keyboardType="number-pad" ajuda="Cinco números. A matrícula deve estar autorizada pela direção." erro={erros.matricula} />
        <ListaTurmas escola={dados.escola} valor={dados.turmaId} erro={erros.turma} onChange={t => setDados(d => ({ ...d, turma: t.nome, turmaId: t.id }))} />
        <TurnosEscolha value={dados.turnos} onChange={v => mudar('turnos', v)} />{erros.turnos ? <Text style={ui.erro}>{erros.turnos}</Text> : null}
      </> : <>
        <Campo label="E-mail" value={dados.email} onChangeText={v => mudar('email',v)} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!ocupado} erro={erros.email} ajuda="Use um endereço que você consegue acessar. Se a escola vinculou um e-mail à matrícula, use esse endereço." />
        <Campo label="Senha" value={dados.senha} onChangeText={v => mudar('senha',v)} secureTextEntry editable={!ocupado} autoCapitalize="none" erro={erros.senha} ajuda="8 ou mais caracteres, letra, número e símbolo." />
        <Campo label="Confirmar senha" value={dados.confirmarSenha} onChangeText={v => mudar('confirmarSenha',v)} secureTextEntry editable={!ocupado} autoCapitalize="none" erro={erros.confirmarSenha} />
      </>}
    </View>
    {etapa === 2 ? <>
      <View style={ui.linha}><Botao secundario onPress={() => navigation.navigate('TermosUso')}>Ler termos</Botao><Botao secundario onPress={() => navigation.navigate('PoliticaPrivacidade')}>Ler privacidade</Botao></View>
      {[['aceitouTermos','Aceito os Termos de Uso.','termos'],['cientePrivacidade','Li o aviso de privacidade e sei como meus dados são usados.','privacidade']].map(([id,label,campoErro]) => <View key={id}>
        <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: dados[id], disabled: ocupado }} disabled={ocupado} onPress={() => mudar(id,!dados[id])} style={ui.card}><Text style={ui.texto}>{dados[id] ? '☑' : '☐'} {label}</Text></TouchableOpacity>{erros[campoErro] ? <Text style={ui.erro}>{erros[campoErro]}</Text> : null}
      </View>)}
      <Text style={ui.pequeno}>Restrições alimentares são opcionais e podem ser informadas depois, no perfil, com autorização específica.</Text>
      {erro ? <Text accessibilityRole="alert" style={ui.erro}>{erro}</Text> : null}
      <Botao testID="cadastrar-aluno" carregando={ocupado} onPress={cadastrar}>Criar conta e verificar e-mail</Botao>
    </> : <Botao testID="continuar-cadastro" onPress={continuar}>Continuar</Botao>}
    <Botao secundario disabled={ocupado} onPress={() => etapa === 2 ? setEtapa(1) : navigation.goBack()}>Voltar</Botao>
    <Text style={ui.pequeno}>Versão {VERSAO_APP}</Text>
  </Pagina>;
}