const { execSync } = require('child_process');
const fs = require('fs');
const Database = require('better-sqlite3');

const deviceId = '192.168.100.2:42915';

function pullBinaryFile(remotePath, localPath) {
  try {
    const cmd = `adb -s ${deviceId} shell "run-as com.antoniothessalonicense.flashcards cat ${remotePath}"`;
    const content = execSync(cmd, { encoding: 'buffer', maxBuffer: 10 * 1024 * 1024 });
    fs.writeFileSync(localPath, content);
    console.log(`Arquivo extraído com sucesso: ${localPath} (${content.length} bytes)`);
  } catch (err) {
    console.error(`Erro ao puxar arquivo ${remotePath}:`, err.message);
  }
}

async function run() {
  console.log('=== Extraindo APENAS o banco principal do celular ===');
  
  pullBinaryFile('files/SQLite/flashcards.db', 'flashcards_check.db');
  
  console.log('\n=== Conectando ao banco de dados SQLite local extraído ===');
  try {
    const db = new Database('flashcards_check.db');
    
    // Consulta todos os conjuntos (tabela sets)
    const decks = db.prepare('SELECT id, title, description FROM sets').all();
    console.log(`\nBaralhos encontrados (${decks.length}):`);
    decks.forEach(d => {
      console.log(`- ID: ${d.id} | Título: "${d.title}" | Descrição: "${d.description || ''}"`);
    });
    
    // Consulta o total de cartões
    const cardsCount = db.prepare('SELECT count(*) as count FROM cards').all();
    console.log(`\nTotal de cartões salvos no SQLite do celular: ${cardsCount[0].count}`);
    
    db.close();
    
    // Limpeza de arquivo local temporário
    fs.unlinkSync('flashcards_check.db');
  } catch (err) {
    console.error('Erro ao conectar ou ler banco de dados SQLite local:', err.message);
  }
}

run().catch(console.error);
