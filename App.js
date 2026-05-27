import 'react-native-get-random-values';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { SQLiteProvider } from 'expo-sqlite';
import { AppProvider, AppContext } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';

// Função de inicialização e migração rápida
const initializeDatabase = async (db) => {
  try {
    // 1. Cria a tabela garantindo que a coluna exista para NOVAS instalações
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS sets (
        id INTEGER PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT, -- Adicionada aqui para novos bancos
        created_at DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Sistema simples de Migração para bancos ANTIGOS
    // Verifica a versão atual do banco de dados do usuário
    const result = await db.getFirstAsync('PRAGMA user_version');
    const currentDbVersion = result.user_version;

    if (currentDbVersion === 0) {
      // Se a versão for 0 (banco antigo que não tinha description), nós alteramos a tabela.
      // O bloco try/catch interno evita que o app quebre se a coluna já existir de alguma forma.
      try {
        await db.execAsync('ALTER TABLE sets ADD COLUMN description TEXT;');
        console.log('Migração: Coluna description adicionada com sucesso!');
      } catch (e) {
         // Ignora se a coluna já existir
      }
      
      // Atualiza a versão do banco para 1
      await db.execAsync('PRAGMA user_version = 1;');
    }

    // 3. Semeando dados (agora a coluna description com certeza existe)
    // Insira sua lógica de popular banco aqui...

    console.log('Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar o banco:', error);
  }
};

function Root() {
  const { isDark, theme } = React.useContext(AppContext);
  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} translucent={false} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        {/* O SQLiteProvider garante que a árvore de componentes (Root) 
            só renderize APÓS a inicialização e migração do banco */}
        <SQLiteProvider databaseName="flashcards.db" onInit={initializeDatabase}>
          <Root />
        </SQLiteProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
