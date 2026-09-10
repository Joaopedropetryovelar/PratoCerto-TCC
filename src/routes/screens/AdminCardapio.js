import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';

import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

import { database } from '../../../FireBaseConfig';

function formatarDataBanco(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

function gerarDiasDaSemanaAtual() {
  const hoje = new Date();
  const diaDaSemana = hoje.getDay();

  const diferencaParaSegunda =
    diaDaSemana === 0 ? -6 : 1 - diaDaSemana;

  const segunda = new Date(hoje);

  segunda.setHours(12, 0, 0, 0);
  segunda.setDate(hoje.getDate() + diferencaParaSegunda);

  const nomesDosDias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
  const diasDaSemana = [];

  for (let i = 0; i < 5; i++) {
    const data = new Date(segunda);

    data.setDate(segunda.getDate() + i);

    diasDaSemana.push({
      id: formatarDataBanco(data),
      nome: nomesDosDias[i],
      numero: String(data.getDate()).padStart(2, '0'),
      data,
    });
  }

  return diasDaSemana;
}

function formatarTituloDoDia(data) {
  if (!data) {
    return '';
  }

  const nomesDosDias = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];

  const nomesDosMeses = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ];

  const nomeDia = nomesDosDias[data.getDay()];
  const numeroDia = String(data.getDate()).padStart(2, '0');
  const nomeMes = nomesDosMeses[data.getMonth()];

  return `${nomeDia}, ${numeroDia} de ${nomeMes}`;
}

function pegarDiaInicial(dias) {
  const hoje = formatarDataBanco(new Date());

  const diaAtual = dias.find((dia) => dia.id === hoje);

  if (diaAtual) {
    return diaAtual.id;
  }

  return dias[0].id;
}

export default function AdminCardapio() {
  const dias = gerarDiasDaSemanaAtual();

  const [diaEscolhido, setDiaEscolhido] = useState(
    () => pegarDiaInicial(dias)
  );

  const [refeicoesPorDia, setRefeicoesPorDia] = useState({});
  const [nomePrato, setNomePrato] = useState('');
  const [modalAdicionar, setModalAdicionar] = useState(false);
  const [pratoEditando, setPratoEditando] = useState(null);

  useEffect(() => {
    const pararDeEscutar = onSnapshot(
      collection(database, 'NomePratos'),

      (snapshot) => {
        const refeicoesDoBanco = {};

        dias.forEach((dia) => {
          refeicoesDoBanco[dia.id] = [];
        });

        snapshot.forEach((documento) => {
          const dados = documento.data();
          const dataDaRefeicao = dados.data;

          if (refeicoesDoBanco[dataDaRefeicao]) {
            refeicoesDoBanco[dataDaRefeicao].push({
              id: documento.id,
              icone: dados.icone || '🍽️',
              tipo: dados.tipo || 'Almoço',
              nome: dados.nome,
              descricao: dados.descricao || '',
              horarioLimite: dados.horarioLimite || '09:00',
              horarioFim: dados.horarioFim || '12:30',
              ativo: dados.ativo !== false,
              data: dados.data,
            });
          }
        });

        setRefeicoesPorDia(refeicoesDoBanco);
      },

      (erro) => {
        console.log('Erro ao buscar refeições:', erro);
      }
    );

    return () => pararDeEscutar();
  }, []);

  const listaDoDia = refeicoesPorDia[diaEscolhido] || [];

  const diaSelecionado = dias.find(
    (dia) => dia.id === diaEscolhido
  );

  function adicionarRefeicao() {
    setPratoEditando(null);
    setNomePrato('');
    setModalAdicionar(true);
  }

  function editarRefeicao(refeicao) {
    setPratoEditando(refeicao);
    setNomePrato(refeicao.nome);
    setModalAdicionar(true);
  }

  function fecharModal() {
    setNomePrato('');
    setPratoEditando(null);
    setModalAdicionar(false);
  }

  async function confirmarSalvarRefeicao() {
    if (!nomePrato.trim()) {
      Alert.alert('Atenção', 'Digite o nome do prato.');
      return;
    }

    try {
      if (pratoEditando) {
        await updateDoc(
          doc(database, 'NomePratos', pratoEditando.id),
          {
            nome: nomePrato.trim(),
          }
        );

        Alert.alert(
          'Sucesso',
          'Refeição editada com sucesso!'
        );
      } else {
        await addDoc(
          collection(database, 'NomePratos'),
          {
            nome: nomePrato.trim(),
            tipo: 'Almoço',
            data: diaEscolhido,
            diaSemana: diaSelecionado?.nome || '',
            icone: '🍛',
            horarioLimite: '09:00',
            horarioFim: '12:30',
            ativo: true,
            criadoEm: serverTimestamp(),
          }
        );

        Alert.alert(
          'Sucesso',
          'Refeição adicionada com sucesso!'
        );
      }

      fecharModal();
    } catch (erro) {
      console.log('Erro ao salvar refeição:', erro);

      Alert.alert(
        'Erro',
        'Não foi possível salvar a refeição.'
      );
    }
  }

  async function deletarAlimento(id) {
    try {
      await deleteDoc(
        doc(database, 'NomePratos', id)
      );

      Alert.alert(
        'Sucesso',
        'Refeição removida com sucesso!'
      );
    } catch (erro) {
      console.log('Erro ao excluir:', erro);

      Alert.alert(
        'Erro',
        'Não foi possível remover a refeição.'
      );
    }
  }

  function confirmarExclusao(refeicao) {
    Alert.alert(
      'Excluir refeição',
      `Deseja excluir "${refeicao.nome}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deletarAlimento(refeicao.id),
        },
      ]
    );
  }

  function salvarCardapio() {
    Alert.alert(
      'Cardápio',
      'Cardápio salvo e publicado com sucesso!'
    );
  }

  return (
    <SafeAreaView style={estilos.tela}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <Modal
          visible={modalAdicionar}
          transparent
          animationType="fade"
          onRequestClose={fecharModal}
        >
          <View style={estilos.fundoModal}>
            <View style={estilos.modal}>
              <Text style={estilos.tituloModal}>
                {pratoEditando
                  ? 'Editar refeição'
                  : 'Adicionar refeição'}
              </Text>

              <Text style={estilos.subtituloModal}>
                {pratoEditando
                  ? 'Altere o nome do prato'
                  : 'Digite o nome do prato'}
              </Text>

              <TextInput
                style={estilos.inputPrato}
                placeholder="Ex: Arroz, feijão e frango"
                placeholderTextColor="#8A978B"
                value={nomePrato}
                onChangeText={setNomePrato}
                autoFocus
              />

              <View style={estilos.botoesModal}>
                <TouchableOpacity
                  style={estilos.botaoCancelar}
                  onPress={fecharModal}
                >
                  <Text style={estilos.textoCancelar}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={estilos.botaoAdicionarModal}
                  onPress={confirmarSalvarRefeicao}
                >
                  <Text style={estilos.textoAdicionarModal}>
                    {pratoEditando ? 'Salvar' : 'Adicionar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={estilos.cabecalho}>
          <Text style={estilos.saudacao}>
            Escola Municipal Girassol
          </Text>

          <Text style={estilos.titulo}>
            Cardápio da semana
          </Text>
        </View>

        <View style={estilos.linhaDias}>
          {dias.map((dia) => {
            const ativo = dia.id === diaEscolhido;

            const pronto =
              (refeicoesPorDia[dia.id] || []).length > 0;

            return (
              <TouchableOpacity
                key={dia.id}
                style={[
                  estilos.pilulaDia,
                  ativo && estilos.pilulaDiaAtiva,
                ]}
                onPress={() => setDiaEscolhido(dia.id)}
              >
                {pronto && (
                  <View style={estilos.marcaPronto}>
                    <Text style={estilos.marcaProntoTexto}>
                      ✓
                    </Text>
                  </View>
                )}

                <Text
                  style={[
                    estilos.nomeDia,
                    ativo && estilos.textoDiaAtivo,
                  ]}
                >
                  {dia.nome}
                </Text>

                <Text
                  style={[
                    estilos.numeroDia,
                    ativo && estilos.textoDiaAtivo,
                  ]}
                >
                  {dia.numero}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={estilos.rotuloSecao}>
          {formatarTituloDoDia(diaSelecionado?.data)}
        </Text>

        {listaDoDia.length === 0 && (
          <Text style={estilos.textoVazio}>
            Nenhuma refeição cadastrada para este dia.
          </Text>
        )}

        {listaDoDia.map((refeicao) => (
          <View
            key={refeicao.id}
            style={estilos.cartaoRefeicao}
          >
            <View style={estilos.iconePrato}>
              <Text style={estilos.iconePratoTexto}>
                {refeicao.icone}
              </Text>
            </View>

            <View style={estilos.infoRefeicao}>
              <Text style={estilos.tipoRefeicao}>
                {refeicao.tipo}
              </Text>

              <Text style={estilos.nomeRefeicao}>
                {refeicao.nome}
              </Text>
            </View>

            <TouchableOpacity
              style={estilos.botaoIcone}
              onPress={() => editarRefeicao(refeicao)}
            >
              <Text>✏️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                estilos.botaoIcone,
                estilos.botaoIconeExcluir,
              ]}
              onPress={() => confirmarExclusao(refeicao)}
            >
              <Text>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={estilos.botaoAdicionar}
          onPress={adicionarRefeicao}
        >
          <Text style={estilos.botaoAdicionarTexto}>
            + Adicionar refeição a este dia
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.botaoPrincipal}
          onPress={salvarCardapio}
        >
          <Text style={estilos.botaoPrincipalTexto}>
            Salvar e publicar cardápio
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const cores = {
  fundo: '#F6FAF1',
  texto: '#1E2B21',
  textoClaro: '#5B6B5C',
  verde: '#2F6B4F',
  verdeEscuro: '#204A37',
  verdeClaro: '#EFF6E7',
  vermelhoClaro: '#FBE1DD',
  linha: '#DCE8D2',
  branco: '#FFFFFF',
};

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },

  conteudo: {
    padding: 20,
    paddingBottom: 12,
  },

  cabecalho: {
    marginBottom: 14,
  },

  saudacao: {
    fontSize: 12,
    color: cores.textoClaro,
    fontWeight: '600',
  },

  titulo: {
    fontSize: 23,
    fontWeight: '800',
    color: cores.verdeEscuro,
    marginTop: 2,
  },

  linhaDias: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },

  pilulaDia: {
    flex: 1,
    backgroundColor: cores.branco,
    borderWidth: 1.5,
    borderColor: cores.linha,
    borderRadius: 16,
    paddingVertical: 9,
    alignItems: 'center',
  },

  pilulaDiaAtiva: {
    backgroundColor: cores.verde,
    borderColor: cores.verde,
  },

  marcaPronto: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: cores.verde,
    borderWidth: 1.5,
    borderColor: cores.branco,
    alignItems: 'center',
    justifyContent: 'center',
  },

  marcaProntoTexto: {
    color: cores.branco,
    fontSize: 8,
  },

  nomeDia: {
    fontSize: 10,
    fontWeight: '700',
    color: cores.textoClaro,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  numeroDia: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
    color: cores.texto,
  },

  textoDiaAtivo: {
    color: cores.branco,
  },

  rotuloSecao: {
    fontSize: 11,
    fontWeight: '700',
    color: cores.textoClaro,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 6,
    marginBottom: 10,
  },

  textoVazio: {
    fontSize: 12.5,
    color: cores.textoClaro,
    marginBottom: 12,
  },

  cartaoRefeicao: {
    backgroundColor: cores.branco,
    borderWidth: 1.5,
    borderColor: cores.linha,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 9,
  },

  iconePrato: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: cores.verdeClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconePratoTexto: {
    fontSize: 20,
  },

  infoRefeicao: {
    flex: 1,
  },

  tipoRefeicao: {
    fontSize: 10,
    fontWeight: '700',
    color: cores.verde,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  nomeRefeicao: {
    fontSize: 14.5,
    fontWeight: '700',
    marginTop: 2,
    color: cores.texto,
  },

  botaoIcone: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: cores.verdeClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },

  botaoIconeExcluir: {
    backgroundColor: cores.vermelhoClaro,
  },

  botaoAdicionar: {
    borderWidth: 1.6,
    borderColor: '#B9CDAC',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },

  botaoAdicionarTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: cores.verde,
  },

  botaoPrincipal: {
    backgroundColor: cores.verde,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },

  botaoPrincipalTexto: {
    color: cores.branco,
    fontWeight: '700',
    fontSize: 14.5,
  },

  fundoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 25,
  },

  modal: {
    backgroundColor: cores.branco,
    borderRadius: 20,
    padding: 20,
  },

  tituloModal: {
    fontSize: 20,
    fontWeight: '800',
    color: cores.verdeEscuro,
  },

  subtituloModal: {
    fontSize: 12,
    color: cores.textoClaro,
    marginTop: 5,
    marginBottom: 12,
  },

  inputPrato: {
    borderWidth: 1.5,
    borderColor: cores.linha,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: cores.texto,
    backgroundColor: cores.fundo,
  },

  botoesModal: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },

  botaoCancelar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: cores.linha,
  },

  textoCancelar: {
    color: cores.textoClaro,
    fontWeight: '700',
  },

  botaoAdicionarModal: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: cores.verde,
  },

  textoAdicionarModal: {
    color: cores.branco,
    fontWeight: '700',
  },
});