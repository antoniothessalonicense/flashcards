import { database } from './database';

/**
 * Coleta todos os baralhos e cartões e os envia para um novo Google Doc.
 * @param {string} accessToken Token OAuth 2.0 do Google com escopos de Docs e Drive.
 * @returns {Promise<string>} O ID do Documento gerado.
 */
export const exportDecksToGoogleDocs = async (accessToken) => {
  try {
    // 1. Coletar os dados do banco local (WatermelonDB)
    const allDecks = await database.get('decks').query().fetch();
    let textContent = `Backup de Flashcards - ${new Date().toLocaleDateString()}\n\n`;

    for (const deck of allDecks) {
      textContent += `========================================\n`;
      textContent += `#CONJUNTO: ${deck.title}\n`;
      if (deck.description) textContent += `#DESCRIÇÃO: ${deck.description}\n`;
      textContent += `========================================\n\n`;

      const cards = await deck.cards.fetch();
      cards.forEach(c => {
        textContent += `FRENTE: ${c.front}\nVERSO: ${c.back}\n\n`;
      });
      
      textContent += '\n';
    }

    // 2. Criar um novo documento no Google Docs
    const createDocResponse = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `Flashcards Backup - ${new Date().toLocaleDateString()}`
      })
    });

    if (!createDocResponse.ok) {
      const errorData = await createDocResponse.json();
      throw new Error(`Erro ao criar documento: ${JSON.stringify(errorData)}`);
    }

    const doc = await createDocResponse.json();
    const documentId = doc.documentId;

    // 3. Inserir o texto gerado no documento recém-criado
    const updateDocResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: {
                index: 1, // Insere logo no começo do documento
              },
              text: textContent
            }
          }
        ]
      })
    });

    if (!updateDocResponse.ok) {
      const errorUpdate = await updateDocResponse.json();
      throw new Error(`Erro ao inserir texto no documento: ${JSON.stringify(errorUpdate)}`);
    }

    return documentId;
  } catch (error) {
    console.error("Falha no serviço de backup do Google Docs:", error);
    throw error;
  }
};