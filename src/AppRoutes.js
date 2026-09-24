import React from "react";

import { StyleSheet, Text } from "react-native";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import TelaInicial from "./routes/screens/TelaInicial";
import TelaLogin from "./routes/screens/TelaLogin";
import TelaHomeAluno from "./routes/screens/TelaHomeAluno";
import TelaCardapioAdmin from "./routes/screens/AdminCardapio";
import TelaDeConfirmacao from "./routes/screens/TelaDeConfirmacao";
import TelaPerfilAluno from "./routes/screens/TelaPerfilAluno";
import TelaDeFeedbackAdmin from "./routes/screens/TelaDeFeedbackAdmin";
import TelaDeFeedbackAluno from "./routes/screens/TelaFeedbackAluno";

import ConsentimentoNavigator from "./routes/screens/ConsentimentoNavigator";


const NavegadorPrincipal = createNativeStackNavigator();
const NavegadorAbas = createBottomTabNavigator();


function MenuAluno() {
  return (
    <NavegadorAbas.Navigator
      initialRouteName="Cardapio"
      screenOptions={opcoesMenuInferior}
    >
      <NavegadorAbas.Screen
        name="Cardapio"
        component={TelaHomeAluno}
        options={{
          title: "Cardápio",

          tabBarIcon: ({ focused: estaSelecionado }) => (
            <Text
              style={
                estaSelecionado
                  ? estilos.iconeSelecionado
                  : estilos.iconeNaoSelecionado
              }
            >
              🏠
            </Text>
          ),
        }}
      />

      <NavegadorAbas.Screen
        name="Confirmacao"
        component={TelaDeConfirmacao}
        options={{
          title: "Confirmar",

          tabBarIcon: ({ focused: estaSelecionado }) => (
            <Text
              style={
                estaSelecionado
                  ? estilos.iconeSelecionado
                  : estilos.iconeNaoSelecionado
              }
            >
              ✅
            </Text>
          ),
        }}
      />

      <NavegadorAbas.Screen
        name="Feedback"
        component={TelaDeFeedbackAluno}
        options={{
          title: "Feedback",

          tabBarIcon: ({ focused: estaSelecionado }) => (
            <Text
              style={
                estaSelecionado
                  ? estilos.iconeSelecionado
                  : estilos.iconeNaoSelecionado
              }
            >
              💬
            </Text>
          ),
        }}
      />

      <NavegadorAbas.Screen
        name="PerfilAluno"
        component={TelaPerfilAluno}
        options={{
          title: "Perfil",

          tabBarIcon: ({ focused: estaSelecionado }) => (
            <Text
              style={
                estaSelecionado
                  ? estilos.iconeSelecionado
                  : estilos.iconeNaoSelecionado
              }
            >
              👤
            </Text>
          ),
        }}
      />
    </NavegadorAbas.Navigator>
  );
}


function MenuEquipe() {
  return (
    <NavegadorAbas.Navigator
      initialRouteName="CardapioAdmin"
      screenOptions={opcoesMenuInferior}
    >
      <NavegadorAbas.Screen
        name="CardapioAdmin"
        component={TelaCardapioAdmin}
        options={{
          title: "Cardápio",

          tabBarIcon: ({ focused: estaSelecionado }) => (
            <Text
              style={
                estaSelecionado
                  ? estilos.iconeSelecionado
                  : estilos.iconeNaoSelecionado
              }
            >
              🍽️
            </Text>
          ),
        }}
      />

      <NavegadorAbas.Screen
        name="FeedbackAdmin"
        component={TelaDeFeedbackAdmin}
        options={{
          title: "Feedback",

          tabBarIcon: ({ focused: estaSelecionado }) => (
            <Text
              style={
                estaSelecionado
                  ? estilos.iconeSelecionado
                  : estilos.iconeNaoSelecionado
              }
            >
              💬
            </Text>
          ),
        }}
      />
    </NavegadorAbas.Navigator>
  );
}


export default function RotasAplicativo() {
  return (
    <NavegadorPrincipal.Navigator
      initialRouteName="Inicial"
      screenOptions={{ headerShown: false }}
    >
      <NavegadorPrincipal.Screen
        name="Inicial"
        component={TelaInicial}
      />

      <NavegadorPrincipal.Screen
        name="Login"
        component={TelaLogin}
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
    height: 70,
    backgroundColor: "#FFFFFF",
    borderTopColor: "#DCE8D2",
    borderTopWidth: 1,
    paddingTop: 7,
    paddingBottom: 8,
  },

  textoAba: {
    fontSize: 11,
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

  tabBarActiveTintColor: "#2F6B4F",

  tabBarInactiveTintColor: "#8A978B",

  tabBarStyle: estilos.barraNavegacao,

  tabBarLabelStyle: estilos.textoAba,
};