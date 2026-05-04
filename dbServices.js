import { database } from './database';

/**
 * Cria um novo Baralho (Deck)
 */
export async function createDeck(title, description = '', targetReviewsPerDay = 20) {
  return await database.write(async () => {
    return await database.get('decks').create(deck => {
      deck.title = title;
      deck.description = description;
      deck.targetReviewsPerDay = targetReviewsPerDay;
      deck.totalReviews = 0;
    });
  });
}

/**
 * Atualiza os dados de um Baralho existente
 */
export async function updateDeck(deckId, title, description) {
  await database.write(async () => {
    const deck = await database.get('decks').find(deckId);
    await deck.update(d => {
      if (title !== undefined) d.title = title;
      if (description !== undefined) d.description = description;
    });
  });
}

/**
 * Adiciona um novo Cartão (Card) a um Baralho
 */
export async function createCard(deck, front, back) {
  return await database.write(async () => {
    return await database.get('cards').create(card => {
      card.deck.set(deck); // Vincula o cartão ao baralho via decorator @relation
      card.front = front;
      card.back = back;
      card.difficultyStatus = 'new'; // Valor padrão inicial (novo cartão, não memorizado)
      card.nextReviewAt = Date.now(); // Pronto para revisar hoje
    });
  });
}

/**
 * Atualiza a dificuldade de um Cartão e incrementa os treinos do Baralho
 */
export async function updateCardDifficulty(cardId, difficulty) {
  await database.write(async () => {
    const card = await database.get('cards').find(cardId);
    const deck = await card.deck.fetch();
    
    await card.update(c => {
      c.difficultyStatus = difficulty;
    });
    
    await deck.update(d => {
      d.totalReviews = (d.totalReviews || 0) + 1;
    });
  });
}

/**
 * Exclui um Baralho e todos os seus cartões (Soft Delete)
 * O WatermelonDB prefere "markAsDeleted" ao invés de destruir o registro,
 * pois isso permite que a deleção seja sincronizada com seu servidor no futuro.
 */
export async function deleteDeck(deckId) {
  await database.write(async () => {
    const deck = await database.get('decks').find(deckId);
    
    // Busca todos os cartões vinculados a este deck para deletá-los também
    const cards = await deck.cards.fetch();
    
    // Preparamos as operações de deleção para rodar todas de uma vez em lote (batch)
    const deleteOperations = cards.map(card => card.prepareMarkAsDeleted());
    deleteOperations.push(deck.prepareMarkAsDeleted());
    
    // Executa as exclusões de forma ultra rápida usando o modo batch
    await database.batch(...deleteOperations);
  });
}

/**
 * Cria um novo Workspace (Conjunto de baralhos)
 */
export async function createWorkspace(name, color = '#3B9EFF') {
  return await database.write(async () => {
    return await database.get('workspaces').create(ws => {
      ws.name = name;
      ws.color = color;
    });
  });
}

/**
 * Função utilitária para "semear" o banco de dados com alguns cartões para testar.
 * Ela só roda se o banco estiver vazio.
 */
export async function seedInitialData() {
  const decksCollection = database.get('decks');
  const workspacesCollection = database.get('workspaces');
  
  const decksCount = await decksCollection.query().fetchCount();
  const workspacesCount = await workspacesCollection.query().fetchCount();
  
  if (decksCount === 0 && workspacesCount === 0) {
    console.log("Banco de dados vazio. Semeando dados iniciais...");
    
    // Criar workspaces primeiro
    const ws1 = await createWorkspace('Inglês', '#3B9EFF');
    const ws2 = await createWorkspace('Estudos', '#7B5CF5');
    const ws3 = await createWorkspace('Pessoal', '#FF6B6B');
    
    // Criar deck vinculado a um workspace
    const newDeck = await createDeck('Inglês Essencial', 'Vocabulário do dia a dia', 15);
    await createCard(newDeck, 'Apple', 'Maçã');
    await createCard(newDeck, 'House', 'Casa');
    await createCard(newDeck, 'Watermelon', 'Melancia');
    
    console.log("Dados semeados com sucesso!");
  }
}