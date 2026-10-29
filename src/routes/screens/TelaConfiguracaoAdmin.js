import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Botao, Campo, Carregando, Falha, Pagina, ui } from '../../components/Interface';
import { useDocumento, usePerfil } from '../../hooks/useDados';
import { auth, database, doc, serverTimestamp, setDoc } from '../../services/backend';
import { chaveEscola } from '../../domain/escolas';

export default function TelaConfiguracaoAdmin({ navigation }) {
  const perfil = usePerfil(), config = useDocumento('configuracoesEscola', perfil.perfil?.escola ? chaveEscola(perfil.perfil.escola) : null);
  const [dados, setDados] = useState({ controlador: '', contato: '', retencao: '', baseLegal: '' });
  const [editando, setEditando] = useState(false), [mensagem, setMensagem] = useState(null), [ocupado, setOcupado] = useState(false), trava = useRef(false);
  useEffect(() => { if (config.dados && !editando) setDados(({ controlador, contato, retencao, baseLegal }) => ({ controlador: config.dados.controlador || controlador, contato: config.dados.contato || contato, retencao: config.dados.retencao || retencao, baseLegal: config.dados.baseLegal || baseLegal })); }, [config.dados, editando]);
  async function salvar() {
    if (trava.current || !perfil.perfil) return;
    const limpos = Object.fromEntries(Object.entries(dados).map(([k,v]) => [k, v.trim()]));
    if (limpos.controlador.length < 3 || limpos.contato.length < 5 || limpos.retencao.length < 10 || limpos.baseLegal.length < 10) { setMensagem('Preencha todos os campos com as informações definidas pela instituição.'); return; }
    trava.current = true; setOcupado(true); setMensagem(null);
    try { await setDoc(doc(database, 'configuracoesEscola', chaveEscola(perfil.perfil.escola)), { ...limpos, escola: perfil.perfil.escola, atualizadoPorUid: auth.currentUser.uid, atualizadoEm: serverTimestamp() }); setMensagem('Informações publicadas no aviso da escola.'); setEditando(false); }
    catch (e) { setMensagem(e.message); }
    finally { trava.current = false; setOcupado(false); }
  }
  return <Pagina titulo="Privacidade da instituição" subtitulo="Estas informações serão públicas. Preencha com a orientação da escola.">
    {config.carregando ? <Carregando /> : config.erro ? <Falha mensagem={config.erro} tentarNovamente={config.tentarNovamente} /> : <View style={ui.card}>
      {[['controlador','Instituição responsável pelos dados',150],['contato','Canal de atendimento de privacidade',254],['baseLegal','Finalidades e bases legais definidas pela instituição',1500],['retencao','Critérios e prazos de conservação dos dados e comprovantes',1500]].map(([id,label,max]) => <Campo key={id} label={label} value={dados[id]} maxLength={max} multiline={max > 254} editable={!ocupado} onChangeText={v => { setEditando(true); setDados(d => ({...d,[id]:v})); }} />)}
      <Botao carregando={ocupado} onPress={salvar}>Salvar informações da escola</Botao>
    </View>}
    {mensagem ? <Text accessibilityRole="alert" style={ui.texto}>{mensagem}</Text> : null}<Botao secundario onPress={() => navigation.goBack()}>Voltar</Botao>
  </Pagina>;
}