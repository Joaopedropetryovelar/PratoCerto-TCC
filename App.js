import React from "react";
import { ProvedorSessao } from "./src/hooks/useSessao";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import useRetornoInicio from "./src/hooks/useRetornoInicio";

import { SafeAreaProvider } from "react-native-safe-area-context";

import AppRoutes from "./src/AppRoutes";

export default function App() {
  const navegacao = useNavigationContainerRef();
  useRetornoInicio(navegacao);
  return (
    <SafeAreaProvider>
    <ProvedorSessao><NavigationContainer ref={navegacao}>
      <AppRoutes />
    </NavigationContainer></ProvedorSessao>
    </SafeAreaProvider>
  );
}