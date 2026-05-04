import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import schema from './models/schema';
import Deck from './models/Deck';
import Card from './models/Card';
import Workspace from './models/Workspace';

// Configura o Adapter que fará a ponte entre JS e o SQLite nativo
const adapter = new SQLiteAdapter({
  schema,
  jsi: true, // Garante altíssima performance usando JSI
  onSetUpError: error => {
    console.error("Falha ao inicializar o banco local:", error);
  }
});

export const database = new Database({
  adapter,
  modelClasses: [Deck, Card, Workspace],
});