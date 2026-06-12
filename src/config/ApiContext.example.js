/**
 * Example: How to integrate apiConfig with AppContext
 * 
 * Este é um exemplo de como integrar a configuração de API com seu AppContext
 * para que a BASE_URL esteja disponível globalmente em toda sua aplicação.
 * 
 * COPIAR E ADAPTAR ESTE CÓDIGO PARA SEU AppContext.js
 */

import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiConfig from '../config/api.config';

export const ApiContext = createContext();

/**
 * ApiProvider component
 * Fornece a configuração de API para toda a aplicação
 */
export const ApiProvider = ({ children }) => {
  const [apiBaseUrl, setApiBaseUrl] = useState(apiConfig.BASE_URL);
  const [isApiReady, setIsApiReady] = useState(true);

  // ======================================================================
  // INTEGRAÇÃO COM SEU AppProvider EXISTENTE
  // ======================================================================
  // 
  // Se você já tem um AppProvider, MESCLE este código:
  //
  // export const AppProvider = ({ children }) => {
  //   // ... seu código existente ...
  //
  //   // Adicione estas linhas:
  //   const [apiBaseUrl, setApiBaseUrl] = useState(apiConfig.BASE_URL);
  //   const apiContextValue = { apiBaseUrl, apiConfig, /* ... */ };
  //
  //   // E passe para um novo contexto:
  //   <ApiContext.Provider value={apiContextValue}>
  //     {/* seu conteúdo */}
  //   </ApiContext.Provider>
  //
  // Ou encapsule seu AppProvider com ApiProvider:
  // <ApiProvider>
  //   <AppProvider>
  //     {/* seu app */}
  //   </AppProvider>
  // </ApiProvider>
  // ======================================================================

  useEffect(() => {
    initializeApi();
  }, []);

  const initializeApi = async () => {
    try {
      // Log de inicialização para debugging
      console.log('🔌 Initializing API configuration...');
      console.log(apiConfig.getDebugInfo());

      // Salvar configuração inicial no AsyncStorage (opcional)
      await AsyncStorage.setItem(
        'apiConfig',
        JSON.stringify(apiConfig.getDebugInfo())
      );

      setApiBaseUrl(apiConfig.BASE_URL);
      setIsApiReady(true);
    } catch (error) {
      console.error('❌ Failed to initialize API:', error);
      setIsApiReady(false);
    }
  };

  // Valor que será fornecido para todo o contexto
  const value = {
    // API Base URL
    apiBaseUrl,
    apiConfig,

    // Flags
    isApiReady,

    // Helper functions
    getEndpoint: (path) => apiConfig.getEndpoint(path),
    getDebugInfo: () => apiConfig.getDebugInfo(),

    // Reinitialize if needed
    reinitializeApi: initializeApi,
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};

// ============================================================================
// COMO USAR EM COMPONENTES
// ============================================================================

/**
 * Hook personalizado para usar o API context
 * 
 * EXEMPLO DE USO:
 * 
 * const MyComponent = () => {
 *   const { apiBaseUrl, getEndpoint } = useApiContext();
 *   
 *   const fetchData = async () => {
 *     const url = getEndpoint('/users');
 *     const response = await fetch(url);
 *     // ...
 *   };
 *   
 *   return <View>{/* seu componente */}</View>;
 * };
 */
export const useApiContext = () => {
  const context = React.useContext(ApiContext);

  if (!context) {
    throw new Error(
      'useApiContext deve ser usado dentro de um ApiProvider'
    );
  }

  return context;
};

// ============================================================================
// INTEGRAÇÃO COM SERVIÇOS DE API EXISTENTES
// ============================================================================

/**
 * ANTES (sem usar contexto):
 * ──────────────────────────────
 * // Em algum service.js
 * const BASE_URL = 'http://hardcoded-url:3000';
 * 
 * export const fetchUsers = async () => {
 *   const response = await fetch(`${BASE_URL}/users`);
 *   return response.json();
 * };
 * 
 * DEPOIS (usando contexto):
 * ──────────────────────────────
 * // Em algum service.js
 * import { useApiContext } from '../context/ApiContext';
 * 
 * export const useFetchUsers = () => {
 *   const { apiBaseUrl } = useApiContext();
 *   
 *   return async () => {
 *     const response = await fetch(`${apiBaseUrl}/users`);
 *     return response.json();
 *   };
 * };
 * 
 * // Em seu componente:
 * const MyScreen = () => {
 *   const fetchUsers = useFetchUsers();
 *   
 *   const handlePress = async () => {
 *     const users = await fetchUsers();
 *   };
 * };
 */

// ============================================================================
// ESTRUTURA RECOMENDADA FINAL
// ============================================================================

/**
 * Seu App.js deveria ficar assim:
 * 
 * import React from 'react';
 * import { SafeAreaProvider } from 'react-native-safe-area-context';
 * import { SQLiteProvider } from 'expo-sqlite';
 * import { ApiProvider } from './src/context/ApiContext';
 * import { AppProvider } from './src/context/AppContext';
 * import AppNavigator from './src/navigation/AppNavigator';
 * import { initializeDatabase } from './src/db/init';
 * 
 * export default function App() {
 *   return (
 *     <SafeAreaProvider>
 *       <SQLiteProvider databaseName="flashcards.db" onInit={initializeDatabase}>
 *         <ApiProvider>
 *           <AppProvider>
 *             <AppNavigator />
 *           </AppProvider>
 *         </ApiProvider>
 *       </SQLiteProvider>
 *     </SafeAreaProvider>
 *   );
 * }
 */

export default ApiProvider;
