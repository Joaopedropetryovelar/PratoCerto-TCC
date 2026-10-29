import React from "react";
import { ProvedorSessao } from "./src/hooks/useSessao";
import { NavigationContainer } from "@react-navigation/native";

import { SafeAreaProvider } from "react-native-safe-area-context";

import AppRoutes from "./src/AppRoutes";

export default function App() {
  return (
    <SafeAreaProvider>
    <ProvedorSessao><NavigationContainer>
      <AppRoutes />
    </NavigationContainer></ProvedorSessao>
    </SafeAreaProvider>
  );
}