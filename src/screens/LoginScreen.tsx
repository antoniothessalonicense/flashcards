import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import { useStore } from '../store';
import { AppContext } from '../context/AppContext';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [isSigninInProgress, setIsSigninInProgress] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Novos estados para email e senha preenchidos conforme solicitado
  const [email, setEmail] = useState('antoniothessalonicense@yahoo.com.br');
  const [password, setPassword] = useState('123456');

  const setUser = useStore((state) => state.setUser);
  const setIdToken = useStore((state) => state.setIdToken);
  
  const { theme, setUser: setContextUser } = useContext(AppContext);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: 'COLE_AQUI_SEU_WEB_CLIENT_ID.apps.googleusercontent.com',
    });
    
    checkLocalSession();
  }, []);

  const checkLocalSession = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@user');
      const storedToken = await AsyncStorage.getItem('@idToken');
      
      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setContextUser(parsedUser);
        setIdToken(storedToken);
      }
    } catch (e) {
      console.error('Erro ao ler sessão local:', e);
    } finally {
      setIsInitializing(false);
    }
  };

  const saveLocalSession = async (userObj: any, token: string) => {
    try {
      await AsyncStorage.setItem('@user', JSON.stringify(userObj));
      await AsyncStorage.setItem('@idToken', token);
    } catch (e) {
      console.error('Erro ao salvar sessão local:', e);
    }
  };

  const handleLogout = async () => {
    try {
      await GoogleSignin.signOut();
      setUser(null);
      setContextUser(null);
      setIdToken(null);
      await AsyncStorage.removeItem('@user');
      await AsyncStorage.removeItem('@idToken');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      Alert.alert('Erro', 'Não foi possível fazer logout.');
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Por favor, preencha email e senha.');
      return;
    }
    
    setIsSigninInProgress(true);
    try {
      // Simulação de login com email e senha
      const fakeToken = 'simulated_token_' + Date.now();
      const fakeUser = {
        id: 'local_user_' + Date.now(),
        name: email.split('@')[0],
        email: email,
        photo: null,
        familyName: null,
        givenName: null,
      };

      setUser(fakeUser);
      setContextUser(fakeUser);
      setIdToken(fakeToken);
      await saveLocalSession(fakeUser, fakeToken);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao realizar login.');
    } finally {
      setIsSigninInProgress(false);
    }
  };

  const signInGoogle = async () => {
    setIsSigninInProgress(true);
    
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      if (response.data) {
        const userInfo = response.data.user;
        const token = response.data.idToken;
        
        const mappedUser = {
          id: userInfo.id,
          name: userInfo.name || null,
          email: userInfo.email,
          photo: userInfo.photo || null,
          familyName: userInfo.familyName || null,
          givenName: userInfo.givenName || null,
        };
        
        setUser(mappedUser);
        setContextUser(mappedUser);
        setIdToken(token || null);
        
        await saveLocalSession(mappedUser, token || '');
      } else {
        throw new Error('Nenhum dado retornado pelo Google.');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Login cancelado pelo usuário');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Login já progresso');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Erro', 'Google Play Services indisponível ou desatualizado.');
      } else {
        console.error('Erro ao fazer login:', error);
        Alert.alert('Erro', 'Ocorreu um erro ao tentar fazer login.');
      }
    } finally {
      setIsSigninInProgress(false);
    }
  };

  if (isInitializing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.purple} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.icon}>🗂️</Text>
          <Text style={[styles.title, { color: theme.white }]}>Flashcards</Text>
          <Text style={[styles.subtitle, { color: theme.gray }]}>Estude, memorize e evolua.</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.white, color: theme.bg }]}
            placeholder="Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.white, color: theme.bg }]}
            placeholder="Senha"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {isSigninInProgress ? (
          <ActivityIndicator size="large" color={theme.purple} />
        ) : (
          <>
            <TouchableOpacity 
              style={[styles.loginButton, { backgroundColor: theme.purple }]} 
              onPress={handleEmailLogin}
            >
              <Text style={[styles.loginText, { color: theme.white }]}>Entrar</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: theme.gray }]} />
              <Text style={[styles.dividerText, { color: theme.gray }]}>OU</Text>
              <View style={[styles.divider, { backgroundColor: theme.gray }]} />
            </View>

            <TouchableOpacity 
              style={[styles.googleButton, { backgroundColor: theme.white }]} 
              onPress={signInGoogle}
            >
              <Text style={[styles.googleText, { color: theme.bg }]}>Entrar com o Google</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
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
  formContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  loginButton: {
    width: '100%',
    maxWidth: 320,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loginText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: 'bold',
  },
  googleButton: {
    width: '100%',
    maxWidth: 320,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  googleText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});