#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const destPath = path.join(process.cwd(), 'flashcards.db');
const migrationSqlPath = path.join(__dirname, '..', 'drizzle', 'migrations', '0001_init.sql');

if (!fs.existsSync(migrationSqlPath)) {
  console.error('Migration SQL não encontrada:', migrationSqlPath);
  process.exit(1);
}

const sql = fs.readFileSync(migrationSqlPath, 'utf8');
const db = new Database(destPath);
try {
  db.exec(sql);
  console.log('Banco inicializado em', destPath);
} catch (err) {
  console.error('Erro ao aplicar migration:', err.message);
  process.exit(1);
} finally {
  db.close();
}
