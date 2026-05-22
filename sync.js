import { synchronize } from '@hypertill/db/sync';
import { database } from './database';

/**
 * Função de Sincronização Incremental
 * 
 * Executará rotinas de Pull (puxar o que mudou no server)
 * e Push (enviar o que mudou localmente).
 * 
 * Com WatermelonDB, a UI não trava durante a sync,
 * pois todo o processo pesado de diffing é resolvido em Background/JSI.
 */
export async function syncDatabase() {
  await synchronize({
    database,
    
    // PULL: O app pede ao backend as atualizações ocorridas desde `lastPulledAt`
    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      const response = await fetch(`https://sua-api.com/sync?lastPulledAt=${lastPulledAt || 0}`);
      
      if (!response.ok) {
        throw new Error('Falha ao obter atualizações do servidor');
      }

      const { changes, timestamp } = await response.json();
      
      return {
        changes, // Formato esperado: { decks: { created: [], updated: [], deleted: [] }, cards: { ... } }
        timestamp,
      };
    },
    
    // PUSH: O app envia ao backend os registros locais que foram modificados/criados em modo offline
    pushChanges: async ({ changes, lastPulledAt }) => {
      const response = await fetch(`https://sua-api.com/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes, lastPulledAt }),
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar modificações locais para o servidor');
      }
    },

    // Previne perda de dados em conflito transformando Criações offline perdidas em Updates
    sendCreatedAsUpdated: true,
    
    // Ajuda a depurar gargalos na sincronização dos seus 25k cards (remova em PRD)
    log: process.env.NODE_ENV === 'development' ? console.log : undefined,
  });
}