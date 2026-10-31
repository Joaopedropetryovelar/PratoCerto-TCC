import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  StyleSheet,
} from 'react-native';
import { Botao, Campo, Carregando, Falha, ui } from './Interface';
import { useColecao } from '../hooks/useDados';
export default function ListaTurmas({ escola, valor, onChange, disabled = false, erro }) {
  const [aberta, setAberta] = useState(false),
    [busca, setBusca] = useState('');
  const { height } = useWindowDimensions();
  const lista = useColecao(
    'turmas',
    [
      ['escola', '==', escola || ''],
      ['ativa', '==', true],
    ],
    Boolean(escola),
  );
  const opcoes = lista.dados
    .filter(
      (turma) =>
        turma.escola === escola &&
        turma.ativa === true &&
        typeof turma.nome === 'string' &&
        turma.nome.trim(),
    )
    .sort((primeiroRegistro, segundoRegistro) =>
      primeiroRegistro.nome.localeCompare(segundoRegistro.nome, 'pt-BR', {
        numeric: true,
      }),
    );
  const selecionada = opcoes.find((turma) => turma.id === valor);
  const normalizar = (texto) =>
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  const visiveis = opcoes.filter((turma) => normalizar(turma.nome).includes(normalizar(busca)));
  useEffect(() => {
    setAberta(false);
    setBusca('');
  }, [escola, disabled]);
  function fechar() {
    setAberta(false);
    setBusca('');
  }
  function escolher(turma) {
    Keyboard.dismiss();
    onChange(turma);
    fechar();
  }
  const bloqueada = disabled || !escola;
  return (
    <View style={ui.campo}>
      <Text style={ui.label}>Turma</Text>
      <TouchableOpacity
        testID="selecionar-turma"
        accessibilityRole="button"
        accessibilityLabel={selecionada ? `Turma: ${selecionada.nome}` : 'Selecionar turma'}
        accessibilityState={{
          expanded: aberta,
          disabled: bloqueada,
        }}
        disabled={bloqueada}
        onPress={() => {
          Keyboard.dismiss();
          setAberta(true);
        }}
        style={[ui.input, bloqueada && ui.desativado]}
      >
        <Text style={ui.texto}>{selecionada?.nome || 'Selecionar turma'}</Text>
      </TouchableOpacity>
      {!escola ? (
        <Text style={ui.pequeno}>Escolha a escola para consultar as turmas.</Text>
      ) : lista.carregando ? (
        <Carregando />
      ) : lista.erro ? (
        <Falha mensagem={lista.erro} tentarNovamente={lista.tentarNovamente} />
      ) : !opcoes.length ? (
        <Text style={ui.pequeno}>
          A escola ainda não disponibilizou turmas. Solicite o cadastro à equipe.
        </Text>
      ) : null}
      {erro ? (
        <Text style={ui.erro} accessibilityRole="alert">
          {erro}
        </Text>
      ) : null}
      <Modal
        testID="modal-turmas"
        visible={aberta && !bloqueada}
        transparent
        animationType="fade"
        onRequestClose={fechar}
      >
        <View style={estilosLocais.fundoModal}>
          <View style={[ui.card, criarEstiloDimensoes(Math.min(520, height * 0.8))]}>
            <Text style={ui.secao}>Selecione sua turma</Text>
            <Text style={ui.pequeno}>{escola}</Text>
            {!lista.carregando && !lista.erro && opcoes.length > 0 ? (
              <Campo
                testID="buscar-turma"
                label="Buscar turma"
                value={busca}
                onChangeText={setBusca}
                autoCorrect={false}
              />
            ) : null}
            <ScrollView
              style={estilosLocais.container}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={estilosLocais.grupo}
            >
              {lista.carregando ? (
                <Carregando />
              ) : lista.erro ? (
                <Falha mensagem={lista.erro} tentarNovamente={lista.tentarNovamente} />
              ) : visiveis.length ? (
                visiveis.map((turma) => (
                  <Botao
                    key={turma.id}
                    testID={`turma-${turma.id}`}
                    secundario
                    selecionado={turma.id === valor}
                    onPress={() => escolher(turma)}
                  >
                    {turma.nome}
                  </Botao>
                ))
              ) : (
                <Text style={ui.texto}>
                  {opcoes.length
                    ? 'Nenhuma turma corresponde à busca.'
                    : 'A escola ainda não disponibilizou turmas. Solicite o cadastro à equipe.'}
                </Text>
              )}
            </ScrollView>
            <Botao secundario onPress={fechar}>
              Fechar
            </Botao>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const estilosLocais = StyleSheet.create({
  fundoModal: {
    flex: 1,
    backgroundColor: '#0007',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    flex: 1,
  },
  grupo: {
    gap: 8,
  },
});
function criarEstiloDimensoes(altura) {
  return {
    height: altura,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  };
}
