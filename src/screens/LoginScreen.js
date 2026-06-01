import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { AppContext } from '../context/AppContext';

export default function LoginScreen() {
  const { theme, setUser } = useContext(AppContext);
  const insets = useSafeAreaInsets();
  const [isSigninInProgress, setIsSigninInProgress] = useState(false);

  useEffect(() => {
    // Inicializa a configuração do Google Auth.
    // Lembre-se: Essas chaves precisarão ser geradas no Google Cloud Console futuramente.
    GoogleSignin.configure({
      // webClientId é frequentemente usado para obter idToken que servem para backends (ex: Firebase)
      webClientId: 'SUA_WEB_CLIENT_ID_AQUI.apps.googleusercontent.com', 
      offlineAccess: true,
    });
  }, []);

  const signIn = async () => {
    try {
      setIsSigninInProgress(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      // Ao obter as informações com sucesso, atualizamos o estado global
      setUser(userInfo.user); 
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // Usuário cancelou o login
        console.log('Login cancelado');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Operação já em andamento
        console.log('Login em andamento');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Play services indisponível no dispositivo
        Alert.alert('Erro', 'O Google Play Services não está disponível ou está desatualizado no seu dispositivo.');
      } else {
        // Outros erros
        console.error('Erro desconhecido:', error);
        
        // Em ambiente Expo Go sem Development Build, a API falhará.
        // Como MOCK/fallback provisório para não travar seus testes antes de gerar a build real, 
        // caso dê erro de API DEVELOPER_ERROR nós injetamos um usuário fake.
        if (error.message && error.message.includes('DEVELOPER_ERROR')) {
          console.warn("Utilizando Mock User temporário por causa da falta de Client ID/Build Nativa");
          setUser({ id: 'fake-id', name: 'Usuário de Teste', email: 'teste@teste.com' });
        } else {
          Alert.alert('Erro no Login', 'Não foi possível realizar o login com o Google no momento.');
        }
      }
    } finally {
      setIsSigninInProgress(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.icon}>🗂️</Text>
          <Text style={[styles.title, { color: theme.white }]}>Flashcards</Text>
          <Text style={[styles.subtitle, { color: theme.gray }]}>Estude, memorize e evolua.</Text>
        </View>

        {isSigninInProgress ? (
          <ActivityIndicator size="large" color={theme.purple} />
        ) : (
          <GoogleSigninButton
            style={{ width: 312, height: 60, marginTop: 40 }}
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={signIn}
            disabled={isSigninInProgress}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});