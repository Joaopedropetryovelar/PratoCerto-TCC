import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Botao, Carregando, Falha, Pagina, ui } from '../../components/Interface';
import { Alert } from '../../components/Alerta';
import { useColecaoEscola, usePerfil } from '../../hooks/useDados';
import { auth, chamarFuncao } from '../../services/backend';

export default function TelaEquipeAdmin({ navigation }) {
  const perfil = usePerfil(), equipe = useColecaoEscola('usuarios', perfil.perfil, [['tipoConta', '==', 'admin']]);
  const [ocupado, setOcupado] = useState(false), [erro, setErro] = useState(null), trava = useRef(false);
  async function alterar(pessoa) {
    if (trava.current) return;
    trava.current = true; setOcupado(true); setErro(null);
    try { await chamarFuncao('alterarAcessoEquipe', { uid: pessoa.id, ativo: pessoa.acessoAtivo === false }); }
    catch (e) { setErro(e.message); }
    finally { trava.current = false; setOcupado(false); }
  }
  return <Pagina titulo="Equipe da direção" subtitulo="Cada integrante usa sua própria conta.">
    <Botao onPress={() => navigation.navigate('CadastroAdmin')}>Autorizar novo administrador</Botao>
    {erro ? <Text accessibilityRole="alert" style={ui.erro}>{erro}</Text> : null}
    {equipe.carregando ? <Carregando /> : equipe.erro ? <Falha mensagem={equipe.erro} tentarNovamente={equipe.tentarNovamente} /> : equipe.dados.map(p => <View key={p.id} style={ui.card}>
      <Text style={ui.secao}>{p.nome}</Text><Text style={ui.texto}>{p.email}</Text><Text style={ui.selo}>{p.acessoAtivo === false ? 'Acesso desativado' : 'Acesso ativo'}</Text>
      {p.id === auth.currentUser?.uid ? <Text style={ui.pequeno}>Esta é sua conta.</Text> : <Botao secundario disabled={ocupado} onPress={() => Alert.alert(p.acessoAtivo === false ? 'Reativar acesso?' : 'Desativar acesso?', p.acessoAtivo === false ? 'A conta poderá entrar novamente.' : 'Esta conta perderá acesso aos dados da escola.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Confirmar', onPress: () => alterar(p) }])}>{p.acessoAtivo === false ? 'Reativar acesso' : 'Desativar acesso'}</Botao>}
    </View>)}
    <Botao secundario onPress={() => navigation.goBack()}>Voltar</Botao>
  </Pagina>;
}