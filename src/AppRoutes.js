import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ContextoCabecalho } from './components/Interface';
import AreaProtegida from './components/AreaProtegida';
import Icone from './components/Icone';
import MenuLateralAdmin from './components/MenuLateralAdmin';
import { auth, signOut } from './services/backend';
import { usePerfil } from './hooks/useDados';
import TelaInicial from './routes/screens/TelaInicial';
import TelaLogin from './routes/screens/TelaLogin';
import TelaEsqueciSenha from './routes/screens/TelaEsqueciSenha';
import TelaVerificarEmail from './routes/screens/TelaVerificarEmail';
import EscolhaCadastro from './routes/screens/EscolhaCadastro';
import VerificarAdmin from './routes/screens/VerificarAdmin';
import ConsentimentoNavigator from './routes/screens/ConsentimentoNavigator';
import TelaHomeAluno from './routes/screens/TelaHomeAluno';
import TelaCardapioAluno from './routes/screens/TelaCardapioAluno';
import TelaMinhasRefeicoes from './routes/screens/TelaMinhasRefeicoes';
import TelaDeConfirmacao from './routes/screens/TelaDeConfirmacao';
import TelaFeedbackAluno from './routes/screens/TelaFeedbackAluno';
import TelaPerfilAluno from './routes/screens/TelaPerfilAluno';
import DashboardAdmin from './routes/screens/DashboardAdmin';
import AdminCardapio from './routes/screens/AdminCardapio';
import TelaRefeicaoDiaAdmin from './routes/screens/TelaRefeicaoDiaAdmin';
import TelaProducao from './routes/screens/TelaProducao';
import TelaRelatorios from './routes/screens/TelaRelatorios';
import TelaDeFeedbackAdmin from './routes/screens/TelaDeFeedbackAdmin';
import TelaRestricoesAdmin from './routes/screens/TelaRestricoesAdmin';
import TelaMatriculasAdmin from './routes/screens/TelaMatriculasAdmin';
import TelaTurmasAdmin from './routes/screens/TelaTurmasAdmin';
import TelaEquipeAdmin from './routes/screens/TelaEquipeAdmin';
import CadastroAdmin from './routes/screens/CadastroAdmin';
import TelaCatalogoAdmin from './routes/screens/TelaCatalogoAdmin';
import TelaPrivacidadeAdmin from './routes/screens/TelaPrivacidadeAdmin';
import TelaConfiguracaoAdmin from './routes/screens/TelaConfiguracaoAdmin';
import TelaGestaoEscolarAdmin from './routes/screens/TelaGestaoEscolarAdmin';
const Principal = createNativeStackNavigator();
const Equipe = createNativeStackNavigator();
const AbasAluno = createBottomTabNavigator();
function MenuAluno({ navigation }) {
  return (
    <AreaProtegida tipoConta="aluno" navigation={navigation}>
      <AbasAluno.Navigator
        initialRouteName="InicioAluno"
        backBehavior="initialRoute"
        screenOptions={opcoesAluno}
      >
        <AbasAluno.Screen
          name="InicioAluno"
          component={TelaHomeAluno}
          options={{
            title: 'Início',
            tabBarIcon: ({ color }) => <Icone nome="inicio" cor={color} />,
          }}
        />
        <AbasAluno.Screen
          name="Cardapio"
          component={TelaCardapioAluno}
          options={{
            title: 'Cardápio',
            tabBarIcon: ({ color }) => <Icone nome="calendario" cor={color} />,
          }}
        />
        <AbasAluno.Screen
          name="MinhasRefeicoes"
          component={TelaMinhasRefeicoes}
          options={{
            title: 'Minhas refeições',
            tabBarIcon: ({ color }) => <Icone nome="cardapio" cor={color} />,
          }}
        />
        <AbasAluno.Screen
          name="PerfilAluno"
          component={TelaPerfilAluno}
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color }) => <Icone nome="perfil" cor={color} />,
          }}
        />
      </AbasAluno.Navigator>
    </AreaProtegida>
  );
}
function MenuEquipe({ navigation }) {
  const perfil = usePerfil();
  const [menu, setMenu] = useState(null);
  function selecionar(rota) {
    const rotas =
      rota === 'DashboardAdmin'
        ? [
            {
              name: rota,
            },
          ]
        : [
            {
              name: 'DashboardAdmin',
            },
            {
              name: rota,
            },
          ];
    menu.navigation.reset({
      index: rotas.length - 1,
      routes: rotas,
    });
    setMenu(null);
  }
  async function sair() {
    await signOut(auth);
    setMenu(null);
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Inicial',
        },
      ],
    });
  }
  return (
    <AreaProtegida tipoConta="admin" navigation={navigation}>
      <ContextoCabecalho.Provider value={true}>
        <View style={estilosLocais.container}>
          <Equipe.Navigator
            initialRouteName="DashboardAdmin"
            screenOptions={({ navigation: interna, route }) => ({
              title: 'Prato Certo',
              headerTintColor: '#173F32',
              headerStyle: estilosLocais.cartao,
              headerLeft: () => (
                <TouchableOpacity
                  testID="abrir-menu-admin"
                  accessibilityRole="button"
                  accessibilityLabel="Abrir menu da direção"
                  onPress={() =>
                    setMenu({
                      navigation: interna,
                      rota: route.name,
                    })
                  }
                  style={estilos.abrirMenu}
                >
                  <Icone nome="menu" tamanho={26} />
                </TouchableOpacity>
              ),
            })}
          >
            <Equipe.Screen name="DashboardAdmin" component={DashboardAdmin} />
            <Equipe.Screen name="CardapioAdmin" component={AdminCardapio} />
            <Equipe.Screen name="RefeicaoDiaAdmin" component={TelaRefeicaoDiaAdmin} />
            <Equipe.Screen name="Producao" component={TelaProducao} />
            <Equipe.Screen name="Relatorios" component={TelaRelatorios} />
            <Equipe.Screen name="FeedbackAdmin" component={TelaDeFeedbackAdmin} />
            <Equipe.Screen name="RestricoesAdmin" component={TelaRestricoesAdmin} />
            <Equipe.Screen name="MatriculasAdmin" component={TelaMatriculasAdmin} />
            <Equipe.Screen name="TurmasAdmin" component={TelaTurmasAdmin} />
            <Equipe.Screen name="EquipeAdmin" component={TelaEquipeAdmin} />
            <Equipe.Screen name="CadastroAdmin" component={CadastroAdmin} />
            <Equipe.Screen name="CatalogoAdmin" component={TelaCatalogoAdmin} />
            <Equipe.Screen name="PrivacidadeAdmin" component={TelaPrivacidadeAdmin} />
            <Equipe.Screen name="ConfiguracaoAdmin" component={TelaConfiguracaoAdmin} />
            <Equipe.Screen name="GestaoEscolarAdmin" component={TelaGestaoEscolarAdmin} />
            <Equipe.Screen name="ContaAdmin" component={TelaPerfilAluno} />
          </Equipe.Navigator>
          <MenuLateralAdmin
            aberto={Boolean(menu)}
            rotaAtual={menu?.rota}
            escola={perfil.perfil?.escola}
            onFechar={() => setMenu(null)}
            onSelecionar={selecionar}
            onSair={sair}
          />
        </View>
      </ContextoCabecalho.Provider>
    </AreaProtegida>
  );
}
export default function AppRoutes() {
  return (
    <Principal.Navigator
      initialRouteName="Inicial"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Principal.Screen name="Inicial" component={TelaInicial} />
      <Principal.Screen name="Login" component={TelaLogin} />
      <Principal.Screen name="EsqueciSenha" component={TelaEsqueciSenha} />
      <Principal.Screen name="VerificarEmail" component={TelaVerificarEmail} />
      <Principal.Screen name="EscolhaCadastro" component={EscolhaCadastro} />
      <Principal.Screen name="VerificarAdmin" component={VerificarAdmin} />
      <Principal.Screen name="Consentimento" component={ConsentimentoNavigator} />
      <Principal.Screen name="Confirmacao">
        {(props) => (
          <AreaProtegida tipoConta="aluno" navigation={props.navigation}>
            <TelaDeConfirmacao {...props} />
          </AreaProtegida>
        )}
      </Principal.Screen>
      <Principal.Screen
        name="Feedback"
        options={{
          headerShown: true,
          title: 'Avaliação',
          headerTintColor: '#173F32',
        }}
      >
        {(props) => (
          <AreaProtegida tipoConta="aluno" navigation={props.navigation}>
            <ContextoCabecalho.Provider value={true}>
              <TelaFeedbackAluno {...props} />
            </ContextoCabecalho.Provider>
          </AreaProtegida>
        )}
      </Principal.Screen>
      <Principal.Screen name="HomeAluno" component={MenuAluno} />
      <Principal.Screen name="HomeAdmin" component={MenuEquipe} />
    </Principal.Navigator>
  );
}
const estilos = StyleSheet.create({
  abrirMenu: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  barraAluno: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E5EDE7',
    borderTopWidth: 1,
    paddingTop: 8,
    minHeight: 76,
    elevation: 6,
  },
});
const estilosLocais = StyleSheet.create({
  container: {
    flex: 1,
  },
  cartao: {
    backgroundColor: '#FFFFFF',
  },
});
function criarEstiloTexto(corTexto) {
  return {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: corTexto,
    textAlign: 'center',
  };
}
const opcoesAluno = {
  headerShown: false,
  tabBarActiveTintColor: '#23624B',
  tabBarInactiveTintColor: '#6A7D73',
  tabBarStyle: estilos.barraAluno,
  tabBarLabelPosition: 'below-icon',
  tabBarLabel: ({ children, color }) => (
    <Text numberOfLines={2} style={criarEstiloTexto(color)}>
      {children}
    </Text>
  ),
};
