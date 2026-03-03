// screens/LoginScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validation
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      // Appel POST /login
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Erreur', data.error || 'Email ou mot de passe incorrect');
        return;
      }

      // Stocker token + email + roles
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('userEmail', data.username);
      await AsyncStorage.setItem('userRoles', JSON.stringify(data.roles));

      // Récupérer et stocker userId
      const usersResponse = await fetch(`${BASE_URL}/api/users/all`);
      const users = await usersResponse.json();
      const currentUser = users.find(u => u.email === data.username);

      if (currentUser) {
        await AsyncStorage.setItem('userId', String(currentUser.idUser));
      }

      console.log('Connexion réussie - token et userId stockés');

      Alert.alert('Succès', `Bienvenue ${data.username} !`);

      // ✅ TP4 — Navigation vers la liste des événements
      navigation.replace('EventsList');

    } catch (error) {
      console.error('Erreur :', error.message);
      Alert.alert(
        'Erreur réseau',
        'Impossible de contacter le serveur.\nVérifiez le backend et le Wi-Fi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Evenix</Text>
        <Text style={styles.subtitle}>Connectez-vous</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6200EE',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#6200EE',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#B39DDB',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});