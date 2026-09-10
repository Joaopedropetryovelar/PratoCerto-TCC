import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CadastroScreen from './CadastroScreen';
import TermosUsoScreen from './TermosUsoScreen';
import PoliticaPrivacidadeScreen from './PoliticaPrivacidadeScreen';

const Stack = createNativeStackNavigator();

export default function ConsentimentoNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Cadastro"
        component={CadastroScreen}
      />

      <Stack.Screen
        name="TermosUso"
        component={TermosUsoScreen}
      />

      <Stack.Screen
        name="PoliticaPrivacidade"
        component={PoliticaPrivacidadeScreen}
      />
    </Stack.Navigator>
  );
}
