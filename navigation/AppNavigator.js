// navigation/AppNavigator.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import des écrans
import LoginScreen from '../screens/LoginScreen';
import EventsListScreen from '../screens/EventsListScreen';
import EventDetailScreen from '../screens/EventDetailScreen';

// Créer le Stack Navigator
// C'est un objet qui contient 2 composants : Navigator et Screen
const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    // NavigationContainer : conteneur obligatoire, gère l'état de navigation
    <NavigationContainer>
      {/* Stack.Navigator : définit la pile d'écrans */}
      {/* initialRouteName : premier écran affiché au lancement */}
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: '#6200EE' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {/* Écran 1 : Login */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        {/* Écran 2 : Liste des événements */}
        <Stack.Screen
          name="EventsList"
          component={EventsListScreen}
          options={{ title: 'Événements' }}
        />

        {/* Écran 3 : Détail d'un événement */}
        <Stack.Screen
          name="EventDetail"
          component={EventDetailScreen}
          options={{ title: 'Détail' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
