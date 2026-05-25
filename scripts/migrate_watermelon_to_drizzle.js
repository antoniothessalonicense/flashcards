#!/usr/bin/env node
/**
 * Script de migração: copia dados de um SQLite do WatermelonDB para o banco alvo (Drizzle/Expo SQLite)
 * Uso: node scripts/migrate_watermelon_to_drizzle.js <caminho_watermelon_db> [<caminho_destino_db>]
 * Dependências: instalar `better-sqlite3` localmente (`npm install better-sqlite3`)
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

const srcPath = process.argv[2];
const destPath = process.argv[3] || path.join(process.cwd(), 'flashcards.db');

if (!srcPath) {
  console.error('Uso: node scripts/migrate_watermelon_to_drizzle.js <caminho_watermelon_db> [<caminho_destino_db>]');
  process.exit(1);
}

if (!fs.existsSync(srcPath)) {
  console.error('Arquivo de origem não encontrado:', srcPath);
  process.exit(1);
}

console.log('Fonte:', srcPath);
console.log('Destino:', destPath);

const srcDb = new Database(srcPath, { readonly: true });
const destDb = new Database(destPath);

// Aplica esquema inicial (caso ainda não exista)
const migrationSql = fs.readFileSync(path.join(__dirname, '..', 'drizzle', 'migrations', '0001_init.sql'), 'utf8');
destDb.exec(migrationSql);

function tryColumn(row, candidates, fallback) {
  for (const c of candidates) if (row.hasOwnProperty(c)) return row[c];
  return fallback;
}

// Migrar workspaces -> sets
try {
  const srcWorkspaces = srcDb.prepare('SELECT * FROM workspaces').all();
  console.log(`Encontrados ${srcWorkspaces.length} workspaces na origem (tentando migrar)...`);

  const insertSet = destDb.prepare('INSERT OR REPLACE INTO sets (id, title, next_review_date) VALUES (?, ?, ?)');
  const insertSetTx = destDb.transaction((rows) => {
    for (const r of rows) {
      const id = tryColumn(r, ['id', '_raw_id', '_id'], uuidv4());
      const title = tryColumn(r, ['title', 'name'], 'Sem título');
      const nextReview = tryColumn(r, ['next_review_date', 'nextReviewDate', 'next_review'], 0) || 0;
      insertSet.run(id, title, nextReview);
    }
  });

  insertSetTx(srcWorkspaces);
  console.log('Workspaces migrados para `sets`.');
} catch (err) {
  console.warn('Não foi possível migrar workspaces automaticamente:', err.message);
}

// Migrar cards
try {
  const srcCards = srcDb.prepare('SELECT * FROM cards').all();
  console.log(`Encontrados ${srcCards.length} cards na origem (tentando migrar)...`);

  const insertCard = destDb.prepare('INSERT OR REPLACE INTO cards (id, set_id, front, back, next_review_date, ease_factor) VALUES (?, ?, ?, ?, ?, ?)');
  const insertCardTx = destDb.transaction((rows) => {
    for (const r of rows) {
      const id = tryColumn(r, ['id', '_raw_id', '_id'], uuidv4());
      const setId = tryColumn(r, ['set_id', 'workspace_id', 'deck_id'], null);
      const front = tryColumn(r, ['front', 'question', 'prompt'], '');
      const back = tryColumn(r, ['back', 'answer'], '');
      const nextReview = tryColumn(r, ['next_review_date', 'nextReviewDate', 'next_review'], 0) || 0;
      const ef = tryColumn(r, ['ease_factor', 'easeFactor', 'ef'], 250) || 250;

      // Se o setId não existir no destino, cria um set placeholder
      let finalSetId = setId;
      if (!finalSetId) {
        finalSetId = uuidv4();
        destDb.prepare('INSERT OR IGNORE INTO sets (id, title, next_review_date) VALUES (?, ?, ?)').run(finalSetId, 'Importado (sem set)', 0);
      }

      insertCard.run(id, finalSetId, front, back, nextReview, ef);
    }
  });

  insertCardTx(srcCards);
  console.log('Cards migrados para `cards`.');
} catch (err) {
  console.warn('Não foi possível migrar cards automaticamente:', err.message);
}

console.log('Migração concluída. Verifique o arquivo de destino e execute testes.');

srcDb.close();
destDb.close();
