import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

interface DiagnosticState {
  isDiagnosing: boolean;
  jsImported: boolean | null;
  nativeLinked: boolean | null;
  playServicesAvailable: boolean | null;
  errorLog: string | null;
}

export default function GoogleSigninDiagnostic() {
  const [state, setState] = useState<DiagnosticState>({
    isDiagnosing: true,
    jsImported: null,
    nativeLinked: null,
    playServicesAvailable: null,
    errorLog: null,
  });

  useEffect(() => {
    runDeepDiagnostic();
  }, []);

  const runDeepDiagnostic = async () => {
    setState((prev) => ({ ...prev, isDiagnosing: true, errorLog: null }));

    let jsImported = false;
    let nativeLinked = false;
    let playServicesAvailable = false;
    let errorLog = null;

    try {
      // 1. Verificando a importação JS da biblioteca
      if (typeof GoogleSignin !== 'undefined' && GoogleSignin !== null) {
        jsImported = true;
      } else {
        throw new Error('Objeto GoogleSignin é undefined. A importação JS falhou.');
      }

      /* 
       * 2 e 3. Verificando o Link Nativo e o Play Services
       * Chamamos um método nativo (hasPlayServices) sem ter chamado configure().
       * - No Expo Go (padrão): Isso lançará um TypeError porque o módulo nativo RNGoogleSignin não existe.
       * - No Development Build (EAS): Isso vai se comunicar com o código Java/Kotlin e retornar true/false, 
       *   ou lançar um erro específico nativo (ex: sobre play services desatualizado), mas NÃO um TypeError de undefined.
       */
      const hasServices = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: false });
      
      // Se a promise resolveu sem crachar a ponte JS, o código nativo foi compilado corretamente!
      nativeLinked = true;
      playServicesAvailable = hasServices;

    } catch (error: any) {
      errorLog = error?.message || String(error);
      console.log('[Sanity Check Error]', errorLog);

      // Interpretando o erro para deduzir o status do link nativo
      if (
        errorLog.includes('Cannot read property') || 
        errorLog.includes('null is not an object') || 
        errorLog.includes('RNGoogleSignin') ||
        errorLog.includes('NativeModule.RNGoogleSignin is null')
      ) {
        // Erro clássico de biblioteca com código nativo rodando em ambiente sem o plugin (Expo Go)
        nativeLinked = false;
      } else {
        // Se for outro erro, a ponte JS->Nativo funcionou, mas a biblioteca reportou um problema (ex: Play Services ausente no emulador)
        nativeLinked = true;
      }
    } finally {
      setState({
        isDiagnosing: false,
        jsImported,
        nativeLinked,
        playServicesAvailable,
        errorLog,
      });
    }
  };

  const renderStatusItem = (label: string, status: boolean | null) => {
    let icon = '⏳';
    let color = '#888';
    if (status === true) {
      icon = '✅';
      color = '#2e7d32'; // Verde
    } else if (status === false) {
      icon = '❌';
      color = '#d32f2f'; // Vermelho
    }

    return (
      <View style={styles.statusRow}>
        <Text style={styles.statusIcon}>{icon}</Text>
        <Text style={[styles.statusLabel, { color }]}>{label}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Diagnóstico: Google Signin</Text>
      
      <View style={styles.card}>
        {state.isDiagnosing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1976d2" />
            <Text style={styles.loadingText}>Executando Sanity Check...</Text>
          </View>
        ) : (
          <View>
            {renderStatusItem('Biblioteca JS Importada', state.jsImported)}
            {renderStatusItem('Link Nativo Encontrado', state.nativeLinked)}
            {renderStatusItem('Google Play Services', state.playServicesAvailable)}

            {state.errorLog && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Último Log/Erro:</Text>
                <ScrollView style={styles.errorScroll}>
                  <Text style={styles.errorText}>{state.errorLog}</Text>
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Como interpretar?</Text>
        <Text style={styles.infoText}>
          <Text style={styles.bold}>Expo Go:</Text> O "Link Nativo" deve falhar (❌) com um erro do tipo "null is not an object". Isso é esperado, pois o Expo Go não possui os binários dessa biblioteca.
        </Text>
        <Text style={styles.infoText}>
          <Text style={styles.bold}>Dev Build (EAS):</Text> O "Link Nativo" deve passar (✅). Se falhar, significa que o App foi compilado sem o plugin ou houve erro na injeção do "app.json".
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorBox: {
    marginTop: 16,
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorTitle: {
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 4,
  },
  errorScroll: {
    maxHeight: 100,
  },
  errorText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#b71c1c',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
  },
  infoTitle: {
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#0d47a1',
    marginBottom: 6,
    lineHeight: 18,
  },
  bold: {
    fontWeight: 'bold',
  },
});
