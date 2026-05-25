PRAGMA foreign_keys = ON;

-- Tabela de conjuntos (sets)
CREATE TABLE IF NOT EXISTS sets (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  frontLanguage TEXT NOT NULL DEFAULT 'pt-BR',
  backLanguage TEXT NOT NULL DEFAULT 'en-US',
  next_review_date INTEGER NOT NULL DEFAULT 0,
  totalReviews INTEGER NOT NULL DEFAULT 0
);

-- Índice para consultas rápidas por data de revisão
CREATE INDEX IF NOT EXISTS idx_sets_next_review_date ON sets(next_review_date);

-- Tabela de cards
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY NOT NULL,
  set_id TEXT NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  next_review_date INTEGER NOT NULL DEFAULT 0,
  ease_factor INTEGER NOT NULL DEFAULT 250,
  difficultyStatus TEXT NOT NULL DEFAULT 'new',
  FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cards_next_review_date ON cards(next_review_date);
CREATE INDEX IF NOT EXISTS idx_cards_set_id ON cards(set_id);

-- Configurações de ciclo de estudo
CREATE TABLE IF NOT EXISTS ciclo_configs (
  id TEXT PRIMARY KEY NOT NULL,
  limiteDiarioTotal INTEGER NOT NULL DEFAULT 0,
  limiteAtivo INTEGER NOT NULL DEFAULT 0,
  cardsPorConjuntoObrigatorio INTEGER NOT NULL DEFAULT 40,
  qtdConjuntosAtrasados INTEGER NOT NULL DEFAULT 5,
  cardsPorConjuntoAtrasado INTEGER NOT NULL DEFAULT 20,
  cardsErrosAnteriores INTEGER NOT NULL DEFAULT 20,
  cardsImportantes INTEGER NOT NULL DEFAULT 20,
  qtdConjuntosFixosPorCiclo INTEGER NOT NULL DEFAULT 1,
  cardsPorConjuntoFixo INTEGER NOT NULL DEFAULT 20
);
