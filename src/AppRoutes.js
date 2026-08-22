import React from "react";
import { Text } from "react-native";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import TelaLogin from "./routes/screens/TelaLogin";
import TelaHomeAluno from "./routes/screens/TelaHomeAluno";
import AdminCardapio from "./routes/screens/AdminCardapio";
import TelaDeConfirmacao from "./routes/screens/TelaDeConfirmacao";
import TelaPerfilAluno from "./routes/screens/TelaPerfilAluno";
import TelaDeFeedbackAdmin from "./routes/screens/TelaDeFeedbackAdmin";


const Stack = createNativeStackNavigator();
const TabAluno = createBottomTabNavigator();
const TabAdmin = createBottomTabNavigator();

const opcoesTabBar = {
  headerShown: false,
  tabBarActiveTintColor: "#2F6B4F",
  tabBarInactiveTintColor: "#8A978B",
  tabBarStyle: {
    height: 70,
    backgroundColor: "#FFFFFF",
    borderTopColor: "#DCE8D2",
    borderTopWidth: 1,
    paddingTop: 7,
    paddingBottom: 8,
  },
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: "700",
  },
};

function MenuAluno() {
  return (
    <TabAluno.Navigator initialRouteName="Inicio" screenOptions={opcoesTabBar}>
      <TabAluno.Screen
        name="Inicio"
        component={TelaHomeAluno}
        options={{
          title: "Início",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 24 : 21 }}>🏠</Text>
          ),
        }}
      />

      <TabAluno.Screen
        name="Confirmacao"
        component={TelaDeConfirmacao}
        options={{
          title: "Confirmar",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 24 : 21 }}>✅</Text>
          ),
        }}
      />
      <TabAluno.Screen
        name="Perfil"
        component={TelaPerfilAluno}
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 24 : 21 }}>👤</Text>
          ),
        }}
      />
    </TabAluno.Navigator>
  );
}

function MenuAdmin() {
  return (
    <TabAdmin.Navigator initialRouteName="CardapioAdmin" screenOptions={opcoesTabBar}>
      <TabAdmin.Screen
        name="CardapioAdmin"
        component={AdminCardapio}
        options={{
          title: "Cardápio",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 24 : 21 }}>🍽️</Text>
          ),
        }}
      />
      <TabAdmin.Screen
        name="FeedbackAdmin"
        component={TelaDeFeedbackAdmin}
        options={{
          title: "Feedbacks",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 24 : 21 }}>💬</Text>
          ),
        }}
      />
    </TabAdmin.Navigator>
  );
}


export default function AppRoutes() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={TelaLogin} />
      <Stack.Screen name="HomeAluno" component={MenuAluno} />
      <Stack.Screen name="HomeAdmin" component={MenuAdmin} />
    </Stack.Navigator>
  );
}