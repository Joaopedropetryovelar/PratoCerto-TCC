import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Botao, Campo, Carregando, Falha, Pagina, ui } from '../../components/Interface';
import { usePerfil } from '../../hooks/useDados';
import { usePaginaEscola } from '../../hooks/usePaginaEscola';
import { salvarPrato } from '../../services/cardapio';

export default function TelaCatalogoAdmin({ navigation }) {
  const dadosPerfil = usePerfil();
  const administradorAutorizado = dadosPerfil.perfil?.tipoConta === 'admin';
  const listaRefeicoes = usePaginaEscola(
    'pratos',
    administradorAutorizado ? dadosPerfil.perfil?.escola : null,
  );
  const [refeicaoEmEdicao, setRefeicaoEmEdicao] = useState(null);
  const [nomeRefeicao, setNomeRefeicao] = useState('');
  const [descricaoRefeicao, setDescricaoRefeicao] = useState('');
  const [mensagemErro, setMensagemErro] = useState(null);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);
  const salvamentoEmAndamento = useRef(false);

  function abrirFormulario(refeicao = {}) {
    if (salvamentoEmAndamento.current) return;
    setRefeicaoEmEdicao(refeicao);
    setNomeRefeicao(refeicao.nome || '');
    setDescricaoRefeicao(refeicao.descricao || '');
    setMensagemErro(null);
    setMensagemSucesso('');
  }

  async function salvarRefeicaoNoCatalogo() {
    if (salvamentoEmAndamento.current || !refeicaoEmEdicao) return;
    salvamentoEmAndamento.current = true;
    setSalvando(true);
    setMensagemErro(null);
    try {
      await salvarPrato({
        nome: nomeRefeicao,
        descricao: descricaoRefeicao,
        id: refeicaoEmEdicao.id,
        revisaoEsperada: refeicaoEmEdicao.revisao || 0,
      });
      setRefeicaoEmEdicao(null);
      setMensagemSucesso('Refeição salva. Ela já pode ser escolhida no cardápio.');
      listaRefeicoes.tentarNovamente();
    } catch (erro) {
      setMensagemErro(erro.message || 'Não foi possível salvar a refeição. Tente novamente.');
    } finally {
      salvamentoEmAndamento.current = false;
      setSalvando(false);
    }
  }

  function usarNoCardapio(refeicao) {
    navigation.navigate('RefeicaoDiaAdmin', {
      pratoId: refeicao.id,
      refeicaoId: null,
      data: null,
      turno: 'manha',
    });
  }

  return (
    <Pagina titulo="Catálogo de refeições" subtitulo="Salve refeições para usar em outros dias.">
      {dadosPerfil.carregando ? (
        <Carregando />
      ) : dadosPerfil.erro ? (
        <Falha mensagem={dadosPerfil.erro} tentarNovamente={dadosPerfil.tentarNovamente} />
      ) : !administradorAutorizado ? (
        <Text style={ui.erro}>Esta área é exclusiva da direção.</Text>
      ) : (
        <>
          <View style={[ui.card, estilos.orientacao]}>
            <Text style={ui.texto}>
              Adicione o nome e a descrição da refeição. Toque em Usar no cardápio para escolher o
              dia e o turno.
            </Text>
          </View>
          {mensagemSucesso ? (
            <Text accessibilityLiveRegion="polite" style={ui.selo}>
              {mensagemSucesso}
            </Text>
          ) : null}
          {refeicaoEmEdicao ? (
            <View testID="formulario-catalogo" style={ui.card}>
              <Text style={ui.secao}>
                {refeicaoEmEdicao.id ? 'Editar refeição salva' : 'Adicionar refeição'}
              </Text>
              <Campo
                testID="nome-refeicao-catalogo"
                label="Nome da refeição"
                placeholder="Arroz, feijão e frango"
                value={nomeRefeicao}
                onChangeText={setNomeRefeicao}
                maxLength={100}
                editable={!salvando}
              />
              <Campo
                testID="descricao-refeicao-catalogo"
                label="Descrição (opcional)"
                placeholder="Informações sobre o que será servido"
                value={descricaoRefeicao}
                onChangeText={setDescricaoRefeicao}
                maxLength={300}
                multiline
                editable={!salvando}
              />
              {mensagemErro ? (
                <Text accessibilityRole="alert" style={ui.erro}>
                  {mensagemErro}
                </Text>
              ) : null}
              <Botao
                testID="salvar-refeicao-catalogo"
                carregando={salvando}
                onPress={salvarRefeicaoNoCatalogo}
              >
                Salvar refeição
              </Botao>
              <Botao secundario disabled={salvando} onPress={() => setRefeicaoEmEdicao(null)}>
                Cancelar
              </Botao>
              <Text style={ui.pequeno}>Os cardápios já publicados mantêm seu histórico.</Text>
            </View>
          ) : (
            <Botao testID="adicionar-refeicao-catalogo" onPress={() => abrirFormulario()}>
              Adicionar refeição
            </Botao>
          )}
          {listaRefeicoes.carregando ? (
            <Carregando />
          ) : listaRefeicoes.erro ? (
            <Falha
              mensagem={listaRefeicoes.erro}
              tentarNovamente={listaRefeicoes.tentarNovamente}
            />
          ) : (
            <>
              <Text style={ui.secao}>Refeições salvas</Text>
              {!listaRefeicoes.dados.length ? (
                <View style={ui.card}>
                  <Text style={ui.texto}>
                    Nenhuma refeição salva. Toque em Adicionar refeição para começar.
                  </Text>
                </View>
              ) : (
                listaRefeicoes.dados.map((refeicao) => (
                  <View key={refeicao.id} style={ui.card}>
                    <Text style={ui.secao}>{refeicao.nome}</Text>
                    {refeicao.descricao ? <Text style={ui.texto}>{refeicao.descricao}</Text> : null}
                    <Botao
                      testID={`usar-catalogo-${refeicao.id}`}
                      disabled={salvando}
                      onPress={() => usarNoCardapio(refeicao)}
                    >
                      Usar no cardápio
                    </Botao>
                    <Botao
                      testID={`editar-catalogo-${refeicao.id}`}
                      secundario
                      disabled={salvando}
                      onPress={() => abrirFormulario(refeicao)}
                    >
                      Editar refeição salva
                    </Botao>
                  </View>
                ))
              )}
              {listaRefeicoes.pagina > 1 || listaRefeicoes.temMais ? (
                <View style={estilos.paginacao}>
                  <Text style={ui.pequeno}>Página {listaRefeicoes.pagina}</Text>
                  <View style={ui.linha}>
                    <Botao
                      secundario
                      disabled={salvando || listaRefeicoes.pagina === 1}
                      onPress={listaRefeicoes.anterior}
                    >
                      Anterior
                    </Botao>
                    <Botao
                      secundario
                      disabled={salvando || !listaRefeicoes.temMais}
                      onPress={listaRefeicoes.proxima}
                    >
                      Próxima
                    </Botao>
                  </View>
                </View>
              ) : null}
            </>
          )}
        </>
      )}
      <Botao secundario disabled={salvando} onPress={() => navigation.goBack()}>
        Voltar
      </Botao>
    </Pagina>
  );
}

const estilos = StyleSheet.create({
  orientacao: {
    backgroundColor: '#EDF5EE',
  },
  paginacao: {
    gap: 12,
  },
});
