import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// Tabela de conjuntos (sets)
export const sets = sqliteTable('sets', {
  id: text('id').primaryKey().notNull(),
  title: text('title').notNull(),
  description: text('description'),
  frontLanguage: text('frontLanguage').notNull().default('pt-BR'),
  backLanguage: text('backLanguage').notNull().default('en-US'),
  next_review_date: integer('next_review_date').notNull().default(0),
  totalReviews: integer('totalReviews').notNull().default(0),
}, (table) => ({
  idx_next_review_date: index('idx_sets_next_review_date').on(table.next_review_date),
}));

// Tabela de cards
export const cards = sqliteTable('cards', {
  id: text('id').primaryKey().notNull(),
  set_id: text('set_id').notNull().references(() => sets.id),
  front: text('front').notNull(),
  back: text('back').notNull(),
  next_review_date: integer('next_review_date').notNull().default(0),
  ease_factor: integer('ease_factor').notNull().default(250),
  difficultyStatus: text('difficultyStatus').notNull().default('new'),
  isImportant: integer('isImportant').notNull().default(0),
  tag: text('tag'),
}, (table) => ({
  idx_next_review_date: index('idx_cards_next_review_date').on(table.next_review_date),
  idx_set_id: index('idx_cards_set_id').on(table.set_id),
  idx_isImportant: index('idx_cards_isImportant').on(table.isImportant),
}));

export const cicloConfigs = sqliteTable('ciclo_configs', {
  id: text('id').primaryKey().notNull(),
  limiteDiarioTotal: integer('limiteDiarioTotal').notNull().default(0),
  limiteAtivo: integer('limiteAtivo').notNull().default(0),
  cardsPorConjuntoObrigatorio: integer('cardsPorConjuntoObrigatorio').notNull().default(40),
  qtdConjuntosAtrasados: integer('qtdConjuntosAtrasados').notNull().default(5),
  cardsPorConjuntoAtrasado: integer('cardsPorConjuntoAtrasado').notNull().default(20),
  cardsErrosAnteriores: integer('cardsErrosAnteriores').notNull().default(20),
  cardsImportantes: integer('cardsImportantes').notNull().default(20),
  qtdConjuntosFixosPorCiclo: integer('qtdConjuntosFixosPorCiclo').notNull().default(1),
  cardsPorConjuntoFixo: integer('cardsPorConjuntoFixo').notNull().default(20),
  conjuntosFixosSelecionados: text('conjuntosFixosSelecionados').notNull().default('[]'),
  qtdConjuntosAleatorios: integer('qtdConjuntosAleatorios').notNull().default(1),
  cardsPorConjuntoAleatorio: integer('cardsPorConjuntoAleatorio').notNull().default(10),
  globalTagLimit: integer('globalTagLimit').notNull().default(5),
  surpriseTagsCount: integer('surpriseTagsCount').notNull().default(2),
  cardsPerSurpriseTag: integer('cardsPerSurpriseTag').notNull().default(5),
});

export type SetsTable = typeof sets;
export type CardsTable = typeof cards;
export type CicloConfigsTable = typeof cicloConfigs;
