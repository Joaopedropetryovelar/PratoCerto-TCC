import TelaRefeicaoDiaAdmin from './routes/screens/TelaRefeicaoDiaAdmin';
import TelaMatriculasAdmin from './routes/screens/TelaMatriculasAdmin';
import TelaPrivacidadeAdmin from './routes/screens/TelaPrivacidadeAdmin';
import TelaTurmasAdmin from './routes/screens/TelaTurmasAdmin';
import TelaRestricoesAdmin from './routes/screens/TelaRestricoesAdmin';
import Icone from './components/Icone';
import React from "react";

import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";

import {
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";

import TelaInicial from "./routes/screens/TelaInicial";
import TelaEsqueciSenha from "./routes/screens/TelaEsqueciSenha";
import TelaVerificarEmail from "./routes/screens/TelaVerificarEmail";
import TelaLogin from "./routes/screens/TelaLogin";
import TelaHomeAluno from "./routes/screens/TelaHomeAluno";
import TelaCardapioAdmin from "./routes/screens/AdminCardapio";
import DashboardAdmin from "./routes/screens/DashboardAdmin";
import TelaDeConfirmacao from "./routes/screens/TelaDeConfirmacao";
import TelaPerfilAluno from "./routes/screens/TelaPerfilAluno";
import TelaDeFeedbackAdmin from "./routes/screens/TelaDeFeedbackAdmin";
import TelaDeFeedbackAluno from "./routes/screens/TelaFeedbackAluno";

import CadastroAdmin from "./routes/screens/CadastroAdmin";
import EscolhaCadastro from "./routes/screens/EscolhaCadastro";
import VerificarAdmin from "./routes/screens/VerificarAdmin";

import ConsentimentoNavigator from "./routes/screens/ConsentimentoNavigator";

import TelaProducao from "./routes/screens/TelaProducao";
import TelaRelatorios from "./routes/screens/TelaRelatorios";
import AreaProtegida from "./components/AreaProtegida";

const NavegadorPrincipal =
  createNativeStackNavigator();

const NavegadorAbas =
  createBottomTabNavigator();

function MenuAluno({ navigation }) {
  return (
    <AreaProtegida tipoConta="aluno" navigation={navigation}><View style={{ flex: 1 }}>
    <NavegadorAbas.Navigator
      initialRouteName="Cardapio"
      screenOptions={opcoesMenuInferior}
    >
      <NavegadorAbas.Screen
        name="Cardapio"
        component={TelaHomeAluno}
        options={{
          title: "Cardápio",

          tabBarIcon: ({
            focused: estaSelecionado,
          }) => (
            <Icone nome="inicio" cor={estaSelecionado ? "#23624B" : "#6A7D73"} />
          ),
        }}
      />

      <NavegadorAbas.Screen
        name="Confirmacao"
        component={TelaDeConfirmacao}
        options={{
          title: "Confirmar",

          tabBarIcon: ({
            focused: estaSelecionado,
          }) => (
            <Icone nome="confirmar" cor={estaSelecionado ? "#23624B" : "#6A7D73"} />
          ),
        }}
      />

      <NavegadorAbas.Screen
        name="Feedback"
        component={TelaDeFeedbackAluno}
        options={{
          title: "Feedback",

          tabBarIcon: ({
            focused: estaSelecionado,
          }) => (
            <Icone nome="feedback" cor={estaSelecionado ? "#23624B" : "#6A7D73"} />
          ),
        }}
      />

      <NavegadorAbas.Screen
        name="PerfilAluno"
        component={TelaPerfilAluno}
        options={{
          title: "Perfil",

          tabBarIcon: ({
            focused: estaSelecionado,
          }) => (
            <Icone nome="perfil" cor={estaSelecionado ? "#23624B" : "#6A7D73"} />
          ),
        }}
      />
    </NavegadorAbas.Navigator>
    </View></AreaProtegida>
  );
}

function MenuEquipe({ navigation }) {
  return (
    <AreaProtegida tipoConta="admin" navigation={navigation}><View style={{ flex: 1 }}>
    <NavegadorAbas.Navigator
      initialRouteName="DashboardAdmin"
      screenOptions={opcoesMenuInferior}
    >
      <NavegadorAbas.Screen
        name="DashboardAdmin"
        component={DashboardAdmin}
        options={{
          title: "Início",

          tabBarIcon: ({
            focused: estaSelecionado,
          }) => (
            <Icone nome="inicio" cor={estaSelecionado ? "#23624B" : "#6A7D73"} />
          ),
        }}
      />

      <NavegadorAbas.Screen
        name="CardapioAdmin"
        component={TelaCardapioAdmin}
        options={{
          title: "Cardápio",

          tabBarIcon: ({
            focused: estaSelecionado,
          }) => (
            <Icone nome="cardapio" cor={estaSelecionado ? "#23624B" : "#6A7D73"} />
          ),
        }}
      />

      <NavegadorAbas.Screen name="Producao" component={TelaProducao} options={{ title: "Produção", tabBarIcon: ({ focused }) => <Icone nome="producao" cor={focused ? "#23624B" : "#6A7D73"} /> }} />
      <NavegadorAbas.Screen name="Relatorios" component={TelaRelatorios} options={{ title: "Relatórios", tabBarIcon: ({ focused }) => <Icone nome="relatorios" cor={focused ? "#23624B" : "#6A7D73"} /> }} />

      <NavegadorAbas.Screen
        name="FeedbackAdmin"
        component={TelaDeFeedbackAdmin}
        options={{
          title: "Feedback",

          tabBarIcon: ({
            focused: estaSelecionado,
          }) => (
            <Icone nome="feedback" cor={estaSelecionado ? "#23624B" : "#6A7D73"} />
          ),
        }}
      />
    </NavegadorAbas.Navigator>
    </View></AreaProtegida>
  );
}

export default function RotasAplicativo() {
  return (
    <NavegadorPrincipal.Navigator
      initialRouteName="Inicial"
      screenOptions={{
        headerShown: false,
      }}
    >
      <NavegadorPrincipal.Screen
        name="Inicial"
        component={TelaInicial}
      />

      <NavegadorPrincipal.Screen name="RefeicaoDiaAdmin">{(props) => <AreaProtegida tipoConta="admin" navigation={props.navigation}><TelaRefeicaoDiaAdmin {...props} /></AreaProtegida>}</NavegadorPrincipal.Screen>
      <NavegadorPrincipal.Screen name="MatriculasAdmin" component={TelaMatriculasAdmin} />
      <NavegadorPrincipal.Screen name="PrivacidadeAdmin" component={TelaPrivacidadeAdmin} />
      <NavegadorPrincipal.Screen name="TurmasAdmin" component={TelaTurmasAdmin} />
      <NavegadorPrincipal.Screen name="RestricoesAdmin">{(props) => <AreaProtegida tipoConta="admin" navigation={props.navigation}><TelaRestricoesAdmin {...props} /></AreaProtegida>}</NavegadorPrincipal.Screen>
      <NavegadorPrincipal.Screen name="EsqueciSenha" component={TelaEsqueciSenha} />
      <NavegadorPrincipal.Screen name="VerificarEmail" component={TelaVerificarEmail} />

      <NavegadorPrincipal.Screen
        name="Login"
        component={TelaLogin}
      />

      <NavegadorPrincipal.Screen
        name="EscolhaCadastro"
        component={EscolhaCadastro}
      />

      <NavegadorPrincipal.Screen
        name="VerificarAdmin"
        component={VerificarAdmin}
      />

      <NavegadorPrincipal.Screen
        name="CadastroAdmin"
        component={CadastroAdmin}
      />

      <NavegadorPrincipal.Screen
        name="Consentimento"
        component={ConsentimentoNavigator}
      />

      <NavegadorPrincipal.Screen
        name="HomeAluno"
        component={MenuAluno}
      />

      <NavegadorPrincipal.Screen
        name="HomeAdmin"
        component={MenuEquipe}
      />
    </NavegadorPrincipal.Navigator>
  );
}

const estilos = StyleSheet.create({
  barraNavegacao: {
    backgroundColor: "#FFFFFF",
    borderTopColor: "#DCE8D2",
    borderTopWidth: 1,
    paddingTop: 8,
    minHeight: 66,
  },

  textoAba: {
    fontSize: 12,
    fontWeight: "700",
  },

  iconeSelecionado: {
    fontSize: 24,
  },

  iconeNaoSelecionado: {
    fontSize: 21,
  },
});

const opcoesMenuInferior = {
  headerShown: false,

  tabBarActiveTintColor:
    "#2F6B4F",

  tabBarInactiveTintColor:
    "#8A978B",

  tabBarStyle:
    estilos.barraNavegacao,

  tabBarLabelStyle:
    estilos.textoAba,
};