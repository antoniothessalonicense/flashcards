import * as SQLite from 'expo-sqlite';
// Nota: `drizzle-orm/expo-sqlite` fornece integrações para usar Drizzle com `expo-sqlite`.
// A seguir é um inicializador simples que expõe a instância `db` para uso na UI.
import { drizzle as createDrizzle } from 'drizzle-orm/expo-sqlite';

// Abra o arquivo de banco de dados do app (local)
const sqliteDb = SQLite.openDatabaseSync('flashcards.db');

// Cria a instância Drizzle ligada ao driver do Expo SQLite
export const db = createDrizzle(sqliteDb);

export default db;
