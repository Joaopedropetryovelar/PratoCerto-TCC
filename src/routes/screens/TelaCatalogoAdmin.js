import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Botao, Campo, Carregando, Falha, Pagina, ui } from '../../components/Interface';
import { usePerfil } from '../../hooks/useDados';
import { usePaginaEscola } from '../../hooks/usePaginaEscola';
import { salvarPrato } from '../../services/cardapio';

export default function TelaCatalogoAdmin({ navigation }) {
  const perfil = usePerfil(), lista = usePaginaEscola('pratos', perfil.perfil?.escola);
  const [edicao, setEdicao] = useState(null), [nome, setNome] = useState(''), [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState(null), [ocupado, setOcupado] = useState(false), trava = useRef(false);
  function abrir(prato) { setEdicao(prato || {}); setNome(prato?.nome || ''); setDescricao(prato?.descricao || ''); setErro(null); }
  async function salvar() {
    if (trava.current) return;
    trava.current = true; setOcupado(true); setErro(null);
    try { await salvarPrato({ nome, descricao, id: edicao.id, revisaoEsperada: edicao.revisao || 0 }); setEdicao(null); lista.tentarNovamente(); }
    catch (e) { setErro(e.message); }
    finally { trava.current = false; setOcupado(false); }
  }
  return <Pagina titulo="Catálogo de refeições" subtitulo="Cadastre e edite refeições para reutilizar no cardápio.">
    {edicao ? <View style={ui.card}>
      <Campo label="Nome da refeição" value={nome} onChangeText={setNome} maxLength={100} editable={!ocupado} />
      <Campo label="Descrição" value={descricao} onChangeText={setDescricao} maxLength={300} multiline editable={!ocupado} />
      <Text style={ui.pequeno}>Alterar o catálogo não modifica refeições já publicadas.</Text>
      {erro ? <Text accessibilityRole="alert" style={ui.erro}>{erro}</Text> : null}
      <Botao carregando={ocupado} onPress={salvar}>Salvar no catálogo</Botao>
      <Botao secundario disabled={ocupado} onPress={() => setEdicao(null)}>Cancelar</Botao>
    </View> : <Botao onPress={() => abrir()}>Cadastrar no catálogo</Botao>}
    {lista.carregando ? <Carregando /> : lista.erro ? <Falha mensagem={lista.erro} tentarNovamente={lista.tentarNovamente} /> : <>
      {!lista.dados.length ? <Text style={ui.texto}>Nenhuma refeição cadastrada nesta página.</Text> : lista.dados.map(p => <View key={p.id} style={ui.card}><Text style={ui.secao}>{p.nome}</Text><Text style={ui.texto}>{p.descricao}</Text><Botao secundario onPress={() => abrir(p)}>Editar no catálogo</Botao></View>)}
      <Text style={ui.pequeno}>Página {lista.pagina}</Text><View style={ui.linha}><Botao secundario disabled={lista.pagina === 1} onPress={lista.anterior}>Anterior</Botao><Botao secundario disabled={!lista.temMais} onPress={lista.proxima}>Próxima</Botao></View>
    </>}
    <Botao secundario onPress={() => navigation.goBack()}>Voltar</Botao>
  </Pagina>;
}