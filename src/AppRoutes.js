import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TelaLogin from "./routes/screens/TelaLogin";
import TelaHomeAluno from "./routes/screens/TelaHomeAluno";
import AdminCardapio from "./routes/screens/AdminCardapio";

const Stack = createNativeStackNavigator();

export default function AppRoutes() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Login"
        component={TelaLogin}
      />

      <Stack.Screen
        name="HomeAluno"
        component={TelaHomeAluno}
      />

      <Stack.Screen
        name="AdminCardapio"
        component={AdminCardapio}
      />
    </Stack.Navigator>
  );
}