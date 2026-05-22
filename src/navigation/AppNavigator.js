import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DeckListScreen from '../screens/DeckListScreen';
import DeckDetailsScreen from '../screens/DeckDetailsScreen';
import ReviewScreen from '../screens/ReviewScreen';
import PracticePicker from '../screens/PracticePicker';
import StatisticsScreen from '../screens/StatisticsScreen';
import ConfiguracaoCicloScreen from '../screens/ConfiguracaoCicloScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="List" component={DeckListScreen} />
        <Stack.Screen name="DeckDetails" component={DeckDetailsScreen} />
        <Stack.Screen name="Review" component={ReviewScreen} />
        <Stack.Screen name="Practice" component={PracticePicker} />
        <Stack.Screen name="Statistics" component={StatisticsScreen} />
        <Stack.Screen name="Configuracoes" component={ConfiguracaoCicloScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
