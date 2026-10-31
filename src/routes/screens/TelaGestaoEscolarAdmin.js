import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Botao, Pagina, ui } from '../../components/Interface';
import { usePerfil } from '../../hooks/useDados';
export default function TelaGestaoEscolarAdmin({ navigation }) {
  const perfil = usePerfil();
  const itens = [
    ['Matrículas', 'Autorize alunos individualmente ou importe uma lista.', 'MatriculasAdmin'],
    ['Turmas', 'Organize as turmas disponíveis para os alunos.', 'TurmasAdmin'],
    ['Equipe da direção', 'Autorize integrantes e gerencie o acesso.', 'EquipeAdmin'],
    [
      'Catálogo de refeições',
      'Cadastre refeições para reutilizar em outros dias.',
      'CatalogoAdmin',
    ],
    [
      'Pedidos de privacidade',
      'Acompanhe pedidos e execute as providências cabíveis.',
      'PrivacidadeAdmin',
    ],
    [
      'Privacidade da instituição',
      'Publique os contatos e critérios definidos pela escola.',
      'ConfiguracaoAdmin',
    ],
    ['Minha conta', 'Altere e-mail ou senha da sua conta.', 'ContaAdmin'],
  ];
  return (
    <Pagina titulo="Gestão escolar" subtitulo={perfil.perfil?.escola || 'Sua escola'}>
      <View style={ui.linha}>
        {itens.map(([titulo, texto, rota]) => (
          <View key={rota} style={[ui.card, estilosLocais.container]}>
            <Text style={ui.secao}>{titulo}</Text>
            <Text style={ui.texto}>{texto}</Text>
            <Botao secundario onPress={() => navigation.navigate(rota)}>
              Abrir {titulo.toLocaleLowerCase('pt-BR')}
            </Botao>
          </View>
        ))}
      </View>
      <Botao secundario onPress={() => navigation.goBack()}>
        Voltar ao início
      </Botao>
    </Pagina>
  );
}
const estilosLocais = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexBasis: 300,
  },
});
