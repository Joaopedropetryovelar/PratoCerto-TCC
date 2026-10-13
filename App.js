import React from "react";
import { NavigationContainer } from "@react-navigation/native";

import { SafeAreaProvider } from "react-native-safe-area-context";

import AppRoutes from "./src/AppRoutes";

export default function App() {
  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <AppRoutes />
    </NavigationContainer>
    </SafeAreaProvider>
  );
}