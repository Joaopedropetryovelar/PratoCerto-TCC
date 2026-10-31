import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icone from './Icone';
import { Alert } from './Alerta';
import { cores } from './Interface';
export const SECOES_MENU_ADMIN = [
  {
    titulo: 'Refeições',
    itens: [
      {
        rota: 'DashboardAdmin',
        nome: 'Início',
        icone: 'inicio',
      },
      {
        rota: 'CardapioAdmin',
        nome: 'Cardápio',
        icone: 'cardapio',
      },
      {
        rota: 'Producao',
        nome: 'Produção',
        icone: 'producao',
      },
      {
        rota: 'Relatorios',
        nome: 'Relatórios',
        icone: 'relatorios',
      },
      {
        rota: 'FeedbackAdmin',
        nome: 'Avaliações dos alunos',
        icone: 'feedback',
      },
      {
        rota: 'RestricoesAdmin',
        nome: 'Restrições alimentares',
        icone: 'cardapio',
      },
    ],
  },
  {
    titulo: 'Escola',
    itens: [
      {
        rota: 'MatriculasAdmin',
        nome: 'Matrículas',
        icone: 'matriculas',
      },
      {
        rota: 'TurmasAdmin',
        nome: 'Turmas',
        icone: 'matriculas',
      },
      {
        rota: 'EquipeAdmin',
        nome: 'Equipe da direção',
        icone: 'perfil',
      },
      {
        rota: 'CatalogoAdmin',
        nome: 'Catálogo de refeições',
        icone: 'cardapio',
      },
      {
        rota: 'PrivacidadeAdmin',
        nome: 'Pedidos de privacidade',
        icone: 'relatorios',
      },
      {
        rota: 'ConfiguracaoAdmin',
        nome: 'Privacidade da instituição',
        icone: 'relatorios',
      },
      {
        rota: 'ContaAdmin',
        nome: 'Minha conta',
        icone: 'perfil',
      },
    ],
  },
];
export default function MenuLateralAdmin({
  aberto,
  rotaAtual,
  escola,
  onFechar,
  onSelecionar,
  onSair,
}) {
  const { width } = useWindowDimensions();
  const [ocupado, setOcupado] = useState(false),
    [erro, setErro] = useState(null);
  useEffect(() => {
    if (aberto) setErro(null);
  }, [aberto]);
  function confirmarSaida() {
    Alert.alert('Sair da conta?', 'Você voltará à tela de acesso.', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Sair',
        onPress: async () => {
          setOcupado(true);
          setErro(null);
          try {
            await onSair();
          } catch {
            setErro('Não foi possível sair. Tente novamente.');
          } finally {
            setOcupado(false);
          }
        },
      },
    ]);
  }
  return (
    <Modal
      visible={aberto}
      transparent
      animationType="fade"
      onRequestClose={() => !ocupado && onFechar()}
    >
      <View style={estilos.fundo}>
        <TouchableOpacity
          testID="fechar-menu-fundo"
          accessibilityRole="button"
          accessibilityLabel="Fechar menu lateral"
          disabled={ocupado}
          style={StyleSheet.absoluteFillObject}
          onPress={onFechar}
        />
        <SafeAreaView
          testID="menu-lateral-admin"
          accessibilityViewIsModal
          style={[estilos.painel, criarEstiloDimensoes(Math.min(width - 32, 340))]}
        >
          <View style={estilos.cabecalho}>
            <View style={estilosLocais.container}>
              <Text style={estilos.marca}>Prato Certo</Text>
              <Text style={estilos.escola}>{escola || 'Direção escolar'}</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Fechar menu"
              disabled={ocupado}
              onPress={onFechar}
              style={estilos.fechar}
            >
              <Text style={estilos.cruz}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={estilos.lista} keyboardShouldPersistTaps="handled">
            {SECOES_MENU_ADMIN.map((secao) => (
              <View key={secao.titulo} style={estilosLocais.grupo}>
                <Text accessibilityRole="header" style={estilos.secao}>
                  {secao.titulo}
                </Text>
                {secao.itens.map((item) => {
                  const selecionado = item.rota === rotaAtual;
                  return (
                    <TouchableOpacity
                      key={item.rota}
                      testID={`menu-${item.rota}`}
                      accessibilityRole="button"
                      accessibilityLabel={item.nome}
                      accessibilityState={{
                        selected: selecionado,
                        disabled: ocupado,
                      }}
                      disabled={ocupado}
                      onPress={() => onSelecionar(item.rota)}
                      style={[estilos.item, selecionado && estilos.ativo]}
                    >
                      <Icone
                        nome={item.icone}
                        tamanho={22}
                        cor={selecionado ? '#FFFFFF' : cores.verde}
                      />
                      <Text style={[estilos.nome, selecionado && estilosLocais.texto]}>
                        {item.nome}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
          <View style={estilos.rodape}>
            {erro ? (
              <Text accessibilityRole="alert" style={criarEstiloTexto(cores.vermelho)}>
                {erro}
              </Text>
            ) : null}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Sair da conta"
              disabled={ocupado}
              onPress={confirmarSaida}
              style={estilos.item}
            >
              <Text style={estilos.nome}>{ocupado ? 'Saindo…' : 'Sair da conta'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
const estilos = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: '#0008',
    alignItems: 'flex-start',
  },
  painel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: cores.linha,
  },
  marca: {
    color: cores.escuro,
    fontSize: 22,
    fontWeight: '800',
  },
  escola: {
    color: cores.texto,
    fontSize: 14,
    marginTop: 5,
  },
  fechar: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cruz: {
    fontSize: 32,
    color: cores.escuro,
  },
  lista: {
    padding: 12,
    gap: 16,
  },
  secao: {
    fontSize: 13,
    color: cores.texto,
    fontWeight: '700',
    margin: 8,
  },
  item: {
    minHeight: 50,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  ativo: {
    backgroundColor: cores.verde,
  },
  nome: {
    flexShrink: 1,
    color: cores.escuro,
    fontSize: 15,
    fontWeight: '600',
  },
  rodape: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: cores.linha,
  },
});
const estilosLocais = StyleSheet.create({
  container: {
    flex: 1,
  },
  grupo: {
    gap: 4,
  },
  texto: {
    color: '#FFFFFF',
  },
});
function criarEstiloDimensoes(largura) {
  return {
    width: largura,
  };
}
function criarEstiloTexto(corTexto) {
  return {
    color: corTexto,
  };
}
