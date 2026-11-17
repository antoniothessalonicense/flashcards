import 'react-native-get-random-values';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { SQLiteProvider, deleteDatabaseAsync } from 'expo-sqlite';
import { AppProvider, AppContext } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
// Inicializa tags customizadas (ex.: <en>, <mudo>)
try { require('./src/utils/initTags'); } catch (e) { /* noop if not present yet */ }

// Função de inicialização e migração rápida
const initializeDatabase = async (db) => {
  try {
    if (__DEV__) {
      // =================================================================
      // MODO PROTOTIPAGEM RÁPIDA (DEV)
      // =================================================================
      // Para resetar estruturalmente o banco de dados (Drop DB):
      // 1. Descomente as três linhas de código abaixo
      // 2. Salve e recarregue o app no emulador (R)
      // 3. Comente as linhas novamente após o reload
      //
      // await db.closeAsync();
      // await deleteDatabaseAsync('flashcards.db');
      // throw new Error('Banco deletado para prototipagem. Recomente e reinicie o app.');
    }

    // =================================================================
    // MODO PRODUÇÃO ROBUSTO (MIGRATIONS)
    // =================================================================
    await db.execAsync('PRAGMA journal_mode = WAL;');

    // 1. Cria a estrutura das tabelas base caso ainda não existam
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sets (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        frontLanguage TEXT DEFAULT 'pt-BR',
        backLanguage TEXT DEFAULT 'en-US',
        next_review_date INTEGER DEFAULT 0,
        totalReviews INTEGER DEFAULT 0,
        priority INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY NOT NULL,
        set_id TEXT NOT NULL,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        next_review_date INTEGER NOT NULL DEFAULT 0,
        ease_factor INTEGER NOT NULL DEFAULT 250,
        difficultyStatus TEXT NOT NULL DEFAULT 'new',
        isImportant INTEGER NOT NULL DEFAULT 0,
        tag TEXT
      );
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_sets_next_review_date ON sets(next_review_date);
    `);
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_cards_set_id ON cards(set_id);
    `);
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_cards_next_review_date ON cards(next_review_date);
    `);

    // 2. Migração Inteligente (Self-Healing):
    // Inspeciona as colunas que realmente existem nas tabelas físicas
    const setsInfo = await db.getAllAsync("PRAGMA table_info('sets');");
    const setsColumns = setsInfo.map(col => col.name);

    if (!setsColumns.includes('description')) {
      await db.execAsync("ALTER TABLE sets ADD COLUMN description TEXT;");
    }
    if (!setsColumns.includes('frontLanguage')) {
      await db.execAsync("ALTER TABLE sets ADD COLUMN frontLanguage TEXT DEFAULT 'pt-BR';");
      console.log("Migração: Coluna frontLanguage recuperada!");
    }
    if (!setsColumns.includes('backLanguage')) {
      await db.execAsync("ALTER TABLE sets ADD COLUMN backLanguage TEXT DEFAULT 'en-US';");
      console.log("Migração: Coluna backLanguage recuperada!");
    }
    if (!setsColumns.includes('next_review_date')) {
      await db.execAsync("ALTER TABLE sets ADD COLUMN next_review_date INTEGER DEFAULT 0;");
    }
    if (!setsColumns.includes('last_review_date')) {
      await db.execAsync("ALTER TABLE sets ADD COLUMN last_review_date INTEGER DEFAULT 0;");
    }
    if (!setsColumns.includes('totalReviews')) {
      await db.execAsync("ALTER TABLE sets ADD COLUMN totalReviews INTEGER DEFAULT 0;");
    }
    if (!setsColumns.includes('priority')) {
      await db.execAsync("ALTER TABLE sets ADD COLUMN priority INTEGER NOT NULL DEFAULT 0;");
      console.log("Migração: Coluna priority adicionada!");
    }

    const cardsInfo = await db.getAllAsync("PRAGMA table_info('cards');");
    const cardsColumns = cardsInfo.map(col => col.name);

    if (!cardsColumns.includes('set_id')) {
      await db.execAsync("ALTER TABLE cards ADD COLUMN set_id TEXT NOT NULL DEFAULT '';");
    }
    if (!cardsColumns.includes('front')) {
      await db.execAsync("ALTER TABLE cards ADD COLUMN front TEXT NOT NULL DEFAULT '';");
    }
    if (!cardsColumns.includes('back')) {
      await db.execAsync("ALTER TABLE cards ADD COLUMN back TEXT NOT NULL DEFAULT '';");
    }
    if (!cardsColumns.includes('next_review_date')) {
      await db.execAsync("ALTER TABLE cards ADD COLUMN next_review_date INTEGER NOT NULL DEFAULT 0;");
    }
    if (!cardsColumns.includes('ease_factor')) {
      await db.execAsync("ALTER TABLE cards ADD COLUMN ease_factor INTEGER NOT NULL DEFAULT 250;");
    }
    if (!cardsColumns.includes('difficultyStatus')) {
      await db.execAsync("ALTER TABLE cards ADD COLUMN difficultyStatus TEXT NOT NULL DEFAULT 'new';");
    }
    if (!cardsColumns.includes('isImportant')) {
      await db.execAsync("ALTER TABLE cards ADD COLUMN isImportant INTEGER NOT NULL DEFAULT 0;");
      console.log("Migração: Coluna isImportant adicionada!");
    }
    if (!cardsColumns.includes('tag')) {
      await db.execAsync("ALTER TABLE cards ADD COLUMN tag TEXT;");
      console.log("Migração: Coluna tag adicionada!");
    }
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_cards_isImportant ON cards(isImportant);`);

    // Sincroniza a data de próxima revisão de todos os conjuntos (corrige conjuntos com data zerada ou desatualizada)
    await db.execAsync(`
      UPDATE sets 
      SET next_review_date = (
        SELECT MIN(next_review_date) FROM cards WHERE cards.set_id = sets.id
      )
      WHERE EXISTS (
        SELECT 1 FROM cards WHERE cards.set_id = sets.id
      );
    `);
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_sets_last_review_date ON sets(last_review_date);`);

    // 3. Criação/migração da tabela ciclo_configs
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ciclo_configs (
        id TEXT PRIMARY KEY NOT NULL,
        limiteDiarioTotal INTEGER NOT NULL DEFAULT 0,
        limiteAtivo INTEGER NOT NULL DEFAULT 0,
        cardsPorConjuntoObrigatorio INTEGER NOT NULL DEFAULT 40,
        qtdConjuntosAtrasados INTEGER NOT NULL DEFAULT 5,
        cardsPorConjuntoAtrasado INTEGER NOT NULL DEFAULT 20,
        cardsErrosAnteriores INTEGER NOT NULL DEFAULT 20,
        cardsImportantes INTEGER NOT NULL DEFAULT 20,
        qtdConjuntosFixosPorCiclo INTEGER NOT NULL DEFAULT 1,
        cardsPorConjuntoFixo INTEGER NOT NULL DEFAULT 20,
        conjuntosFixosSelecionados TEXT NOT NULL DEFAULT '[]',
        qtdConjuntosAleatorios INTEGER NOT NULL DEFAULT 1,
        cardsPorConjuntoAleatorio INTEGER NOT NULL DEFAULT 10,
        globalTagLimit INTEGER NOT NULL DEFAULT 5,
        surpriseTagsCount INTEGER NOT NULL DEFAULT 2,
        cardsPerSurpriseTag INTEGER NOT NULL DEFAULT 5,
        apenasNaoAprendidosObrigatorio INTEGER NOT NULL DEFAULT 0
      );
    `);

    const configInfo = await db.getAllAsync("PRAGMA table_info('ciclo_configs');");
    const configColumns = configInfo.map(col => col.name);
    if (!configColumns.includes('conjuntosFixosSelecionados')) {
      await db.execAsync("ALTER TABLE ciclo_configs ADD COLUMN conjuntosFixosSelecionados TEXT NOT NULL DEFAULT '[]';");
    }
    if (!configColumns.includes('qtdConjuntosAleatorios')) {
      await db.execAsync("ALTER TABLE ciclo_configs ADD COLUMN qtdConjuntosAleatorios INTEGER NOT NULL DEFAULT 1;");
    }
    if (!configColumns.includes('cardsPorConjuntoAleatorio')) {
      await db.execAsync("ALTER TABLE ciclo_configs ADD COLUMN cardsPorConjuntoAleatorio INTEGER NOT NULL DEFAULT 10;");
    }
    if (!configColumns.includes('globalTagLimit')) {
      await db.execAsync("ALTER TABLE ciclo_configs ADD COLUMN globalTagLimit INTEGER NOT NULL DEFAULT 5;");
    }
    if (!configColumns.includes('surpriseTagsCount')) {
      await db.execAsync("ALTER TABLE ciclo_configs ADD COLUMN surpriseTagsCount INTEGER NOT NULL DEFAULT 2;");
    }
    if (!configColumns.includes('cardsPerSurpriseTag')) {
      await db.execAsync("ALTER TABLE ciclo_configs ADD COLUMN cardsPerSurpriseTag INTEGER NOT NULL DEFAULT 5;");
    }
    if (!configColumns.includes('apenasNaoAprendidosObrigatorio')) {
      await db.execAsync("ALTER TABLE ciclo_configs ADD COLUMN apenasNaoAprendidosObrigatorio INTEGER NOT NULL DEFAULT 0;");
    }

    // 4. Semeando dados (agora as colunas obrigatórias estão garantidas)
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
