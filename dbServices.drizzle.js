import db from './db';
import { sets, cards, cicloConfigs } from './db/schema';
import { eq, sql } from 'drizzle-orm';

function genId() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export async function createDeck(title, description = '', frontLanguage = 'pt-BR', backLanguage = 'en-US') {
  const id = genId();
  await db.insert(sets).values({
    id,
    title,
    description,
    frontLanguage,
    backLanguage,
    next_review_date: 0,
    totalReviews: 0,
  }).run();
  const row = await db.select().from(sets).where(eq(sets.id, id)).get();
  return row || { id, title, description, frontLanguage, backLanguage, next_review_date: 0, totalReviews: 0 };
}

export async function updateDeck(deckId, title, description, frontLanguage, backLanguage) {
  const update = {};
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (frontLanguage !== undefined) update.frontLanguage = frontLanguage;
  if (backLanguage !== undefined) update.backLanguage = backLanguage;
  if (Object.keys(update).length === 0) return;
  await db.update(sets).set(update).where(eq(sets.id, deckId)).run();
}

export async function createCard(setId, front, back) {
  if (!setId) throw new Error('createCard requires a deck id');
  const id = genId();
  const now = Date.now();
  await db.insert(cards).values({
    id,
    set_id: setId,
    front,
    back,
    next_review_date: now,
    ease_factor: 250,
    difficultyStatus: 'new',
  }).run();
  return await db.select().from(cards).where(eq(cards.id, id)).get();
}

export async function updateCardDifficulty(cardId, difficulty) {
  const card = await db.select().from(cards).where(eq(cards.id, cardId)).get();
  if (!card) throw new Error('Card not found');

  let ef = card.ease_factor || 250;
  if (difficulty === 'easy') ef = Math.round(ef * 1.3);
  else if (difficulty === 'good') ef = Math.round(ef * 1.1);
  else if (difficulty === 'hard') ef = Math.max(130, Math.round(ef * 0.9));

  const interval = Math.max(1, Math.round((ef / 100))) * 24 * 60 * 60 * 1000;
  const nextReview = Date.now() + interval;

  await db.update(cards).set({
    ease_factor: ef,
    next_review_date: nextReview,
    difficultyStatus: difficulty,
  }).where(eq(cards.id, cardId)).run();

  await db.update(sets).set({ totalReviews: sql`totalReviews + 1` }).where(eq(sets.id, card.set_id)).run();
}

export async function updateCard(cardId, front, back) {
  const update = {};
  if (front !== undefined) update.front = front;
  if (back !== undefined) update.back = back;
  if (Object.keys(update).length === 0) return;
  await db.update(cards).set(update).where(eq(cards.id, cardId)).run();
}

export async function deleteCard(cardId) {
  await db.delete(cards).where(eq(cards.id, cardId)).run();
}

export async function deleteDeck(deckId) {
  await db.delete(cards).where(eq(cards.set_id, deckId)).run();
  await db.delete(sets).where(eq(sets.id, deckId)).run();
}

export async function createWorkspace(name, color = '#3B9EFF') {
  return createDeck(name);
}

export async function getCycleConfig() {
  return await db.select().from(cicloConfigs).limit(1).get();
}

export async function saveCycleConfig(config) {
  const existing = await getCycleConfig();
  const values = {
    limiteDiarioTotal: config.limiteDiarioTotal,
    limiteAtivo: config.limiteAtivo,
    cardsPorConjuntoObrigatorio: config.cardsPorConjuntoObrigatorio,
    qtdConjuntosAtrasados: config.qtdConjuntosAtrasados,
    cardsPorConjuntoAtrasado: config.cardsPorConjuntoAtrasado,
    cardsErrosAnteriores: config.cardsErrosAnteriores,
    cardsImportantes: config.cardsImportantes,
    qtdConjuntosFixosPorCiclo: config.qtdConjuntosFixosPorCiclo,
    cardsPorConjuntoFixo: config.cardsPorConjuntoFixo,
  };

  if (existing) {
    await db.update(cicloConfigs).set(values).where(eq(cicloConfigs.id, existing.id)).run();
    return existing.id;
  }

  const id = genId();
  await db.insert(cicloConfigs).values({ id, ...values }).run();
  return id;
}

export async function seedInitialData() {
  const existingSets = await db.select().from(sets).all();
  const existingCards = await db.select().from(cards).all();

  if (existingSets.length === 0 && existingCards.length === 0) {
    console.log('Banco de dados vazio. Semeando dados iniciais...');
    const deck = await createDeck('Inglês Essencial', 'Vocabulário básico', 'en-US', 'pt-BR');
    await createCard(deck.id, 'Apple', 'Maçã');
    await createCard(deck.id, 'House', 'Casa');
    await createCard(deck.id, 'Watermelon', 'Melancia');
    console.log('Dados semeados com sucesso!');
  }
}
