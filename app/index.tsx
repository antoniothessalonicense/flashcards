import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';

export default function LoginScreen() {
  const [isSigninInProgress, setIsSigninInProgress] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsSigninInProgress(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      console.log('Login bem-sucedido! Dados do Usuário:', userInfo);
      Alert.alert(
        'Bem-vindo!',
        `Login realizado com sucesso.\nUsuário: ${userInfo.user.name}`
      );
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Login cancelado pelo usuário.');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Login já está em andamento.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Google Play Services não disponível no dispositivo.');
        Alert.alert('Erro', 'O Google Play Services não está disponível ou está desatualizado.');
      } else {
        console.error('Erro desconhecido no Google Sign-In:', error);
        Alert.alert('Erro no Login', 'Ocorreu um erro inesperado ao tentar fazer login.');
      }
    } finally {
      setIsSigninInProgress(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Flashcards App</Text>
        <Text style={styles.subtitle}>Acesse sua conta para continuar</Text>
      </View>

      <View style={styles.buttonContainer}>
        {isSigninInProgress ? (
          <ActivityIndicator size="large" color="#4285F4" />
        ) : (
          <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={handleGoogleLogin}
            disabled={isSigninInProgress}
            style={styles.googleButton}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  googleButton: {
    width: 312,
    height: 48,
  },
});