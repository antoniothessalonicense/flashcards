import { Database, createPlatformAdapter } from '@hypertill/db';
import schema from './models/schema';
import Deck from './models/Deck';
import Card from './models/Card';
import Workspace from './models/Workspace';
import CicloConfig from './models/CicloConfig';

// Configura o Adapter multiplataforma
const adapter = createPlatformAdapter({
  schema,
  sqlite: {
    jsi: true, // Garante altíssima performance usando JSI no SQLite
    onSetUpError: error => {
      console.error("Falha ao inicializar o banco local:", error);
    }
  }
});

export const database = new Database({
  adapter,
  modelClasses: [Deck, Card, Workspace, CicloConfig],
});