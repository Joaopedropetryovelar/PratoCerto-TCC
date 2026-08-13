import React, { useState } from 'react';

import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';


const dias = [
  { id: 'seg', nome: 'Seg', numero: '03', pronto: true },
  { id: 'ter', nome: 'Ter', numero: '04', pronto: true },
  { id: 'qua', nome: 'Qua', numero: '05', pronto: false },
  { id: 'qui', nome: 'Qui', numero: '06', pronto: false },
  { id: 'sex', nome: 'Sex', numero: '07', pronto: false },
];


const tituloDoDia = {
  seg: 'Segunda-feira, 03 de agosto',
  ter: 'Terça-feira, 04 de agosto',
  qua: 'Quarta-feira, 05 de agosto',
  qui: 'Quinta-feira, 06 de agosto',
  sex: 'Sexta-feira, 07 de agosto',
};


const refeicoesIniciais = {
  seg: [
    {
      id: 's1',
      icone: '🍛',
      tipo: 'Almoço',
      nome: 'Arroz, feijão e carne moída',
    },
  ],

  ter: [
    {
      id: 't1',
      icone: '🥗',
      tipo: 'Almoço',
      nome: 'Arroz, feijão, frango grelhado e salada',
    },

    {
      id: 't2',
      icone: '🍎',
      tipo: 'Lanche da tarde',
      nome: 'Fruta da estação e suco natural',
    },
  ],

  qua: [],
  qui: [],
  sex: [],
};


export default function TelaCardapio() {

  const [diaEscolhido, setDiaEscolhido] = useState('seg');

  const [refeicoesPorDia, setRefeicoesPorDia] =
    useState(refeicoesIniciais);


  const listaDoDia =
    refeicoesPorDia[diaEscolhido] || [];


  function editarRefeicao(id) {

    Alert.alert(
      'Editar refeição',
      `Editar refeição ${id}`
    );

  }


  function removerRefeicao(id) {

    Alert.alert(
      'Excluir refeição',
      'Deseja realmente excluir esta refeição?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },

        {
          text: 'Excluir',
          style: 'destructive',

          onPress: () => {

            setRefeicoesPorDia((estadoAnterior) => ({
              ...estadoAnterior,

              [diaEscolhido]:
                estadoAnterior[diaEscolhido].filter(
                  (refeicao) => refeicao.id !== id
                ),
            }));

          },
        },
      ]
    );

  }


  function adicionarRefeicao() {

    Alert.alert(
      'Adicionar refeição',
      `Adicionar refeição em ${tituloDoDia[diaEscolhido]}`
    );

  }


  function salvarCardapio() {

    Alert.alert(
      'Cardápio',
      'Cardápio salvo com sucesso!'
    );

  }


  return (

    <SafeAreaView style={estilos.tela}>

      <ScrollView contentContainerStyle={estilos.conteudo}>

        <View style={estilos.cabecalho}>

          <Text style={estilos.saudacao}>
            Escola Municipal Girassol
          </Text>

          <Text style={estilos.titulo}>
            Cardápio da semana
          </Text>

        </View>


        {/* Seletor de dias */}

        <View style={estilos.linhaDias}>

          {dias.map((dia) => {

            const ativo =
              dia.id === diaEscolhido;

            return (

              <TouchableOpacity
                key={dia.id}
                style={[
                  estilos.pilulaDia,
                  ativo && estilos.pilulaDiaAtiva,
                ]}
                onPress={() =>
                  setDiaEscolhido(dia.id)
                }
                activeOpacity={0.8}
              >

                {dia.pronto && (

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

          {tituloDoDia[diaEscolhido]}

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
              onPress={() =>
                editarRefeicao(refeicao.id)
              }
            >

              <Text>✏️</Text>

            </TouchableOpacity>


            <TouchableOpacity
              style={[
                estilos.botaoIcone,
                estilos.botaoIconeExcluir,
              ]}
              onPress={() =>
                removerRefeicao(refeicao.id)
              }
            >

              <Text>🗑️</Text>

            </TouchableOpacity>

          </View>

        ))}


        <TouchableOpacity
          style={estilos.botaoAdicionar}
          onPress={adicionarRefeicao}
          activeOpacity={0.7}
        >

          <Text style={estilos.botaoAdicionarTexto}>

            + Adicionar refeição a este dia

          </Text>

        </TouchableOpacity>


        <TouchableOpacity
          style={estilos.botaoPrincipal}
          onPress={salvarCardapio}
          activeOpacity={0.85}
        >

          <Text style={estilos.botaoPrincipalTexto}>

            Salvar e publicar cardápio

          </Text>

        </TouchableOpacity>

      </ScrollView>


      <View style={estilos.menuInferior}>

        <View style={estilos.itemMenu}>

          <Text style={estilos.iconeMenu}>
            📅
          </Text>

          <Text
            style={[
              estilos.textoMenu,
              estilos.textoMenuAtivo,
            ]}
          >
            Cardápio
          </Text>

        </View>


        <View
          style={[
            estilos.itemMenu,
            estilos.itemMenuInativo,
          ]}
        >

          <Text style={estilos.iconeMenu}>
            💬
          </Text>

          <Text style={estilos.textoMenu}>
            Feedback
          </Text>

        </View>


        <View
          style={[
            estilos.itemMenu,
            estilos.itemMenuInativo,
          ]}
        >

          <Text style={estilos.iconeMenu}>
            👥
          </Text>

          <Text style={estilos.textoMenu}>
            Alunos
          </Text>

        </View>


        <View
          style={[
            estilos.itemMenu,
            estilos.itemMenuInativo,
          ]}
        >

          <Text style={estilos.iconeMenu}>
            👤
          </Text>

          <Text style={estilos.textoMenu}>
            Perfil
          </Text>

        </View>

      </View>

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
  laranja: '#F2A93B',
  laranjaClaro: '#FDECC9',
  vermelho: '#E85D4C',
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
  selo: {
    alignSelf: 'flex-start',
    backgroundColor: cores.verdeEscuro,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    marginBottom: 8,
  },
  seloTexto: {
    color: cores.branco,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  saudacao: {
    fontSize: 12,
    color: cores.textoClaro,
    fontWeight: '600',
  },
  titulo: {
    fontWeight: '800',
    fontSize: 23,
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
    fontWeight: '700',
    fontSize: 16,
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
    fontWeight: '700',
    fontSize: 14.5,
    marginTop: 2,
    color: cores.texto,
    lineHeight: 18,
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
    backgroundColor: 'rgba(255,255,255,0.4)',
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
    shadowColor: cores.verde,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  botaoPrincipalTexto: {
    color: cores.branco,
    fontWeight: '700',
    fontSize: 14.5,
  },

  // Navegação inferior
  menuInferior: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1.5,
    borderTopColor: cores.linha,
    backgroundColor: cores.branco,
  },
  itemMenu: {
    alignItems: 'center',
    opacity: 1,
  },
  itemMenuInativo: {
    opacity: 0.4,
  },
  iconeMenu: {
    fontSize: 16,
  },
  textoMenu: {
    fontSize: 9.5,
    fontWeight: '700',
    color: cores.verdeEscuro,
    marginTop: 2,
  },
  textoMenuAtivo: {
    opacity: 1,
  },
});