import db from './db';
import { sets, cards, cicloConfigs } from './db/schema';
import { eq, sql, inArray } from 'drizzle-orm';

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
    priority: 0,
  });
  const rows = await db.select().from(sets).where(eq(sets.id, id));
  return rows[0] || { id, title, description, frontLanguage, backLanguage, next_review_date: 0, totalReviews: 0, priority: 0 };
}

export async function updateDeck(deckId, title, description, frontLanguage, backLanguage) {
  const update = {};
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (frontLanguage !== undefined) update.frontLanguage = frontLanguage;
  if (backLanguage !== undefined) update.backLanguage = backLanguage;
  if (Object.keys(update).length === 0) return;
  await db.update(sets).set(update).where(eq(sets.id, deckId)).returning();
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
  }).returning();
  const rows = await db.select().from(cards).where(eq(cards.id, id));
  return rows[0];
}

export async function updateCardDifficulty(cardId, difficulty) {
  const cardRows = await db.select().from(cards).where(eq(cards.id, cardId));
  const card = cardRows[0];
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
  }).where(eq(cards.id, cardId)).returning();

  await db.update(sets).set({ totalReviews: sql`totalReviews + 1` }).where(eq(sets.id, card.set_id)).returning();
}

export async function updateCard(cardId, front, back) {
  const update = {};
  if (front !== undefined) update.front = front;
  if (back !== undefined) update.back = back;
  if (Object.keys(update).length === 0) return;
  await db.update(cards).set(update).where(eq(cards.id, cardId)).returning();
}

export async function deleteCard(cardId) {
  await db.delete(cards).where(eq(cards.id, cardId)).returning();
}

export async function deleteDeck(deckId) {
  await db.delete(cards).where(eq(cards.set_id, deckId)).returning();
  await db.delete(sets).where(eq(sets.id, deckId)).returning();
}

export async function createWorkspace(name, color = '#3B9EFF') {
  return createDeck(name);
}

export async function getCycleConfig() {
  const rows = await db.select().from(cicloConfigs).limit(1);
  return rows[0];
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
    conjuntosFixosSelecionados: config.conjuntosFixosSelecionados ? JSON.stringify(config.conjuntosFixosSelecionados) : '[]',
    qtdConjuntosAleatorios: config.qtdConjuntosAleatorios,
    cardsPorConjuntoAleatorio: config.cardsPorConjuntoAleatorio,
    globalTagLimit: config.globalTagLimit,
    surpriseTagsCount: config.surpriseTagsCount,
    cardsPerSurpriseTag: config.cardsPerSurpriseTag,
  };

  if (existing) {
    await db.update(cicloConfigs).set(values).where(eq(cicloConfigs.id, existing.id));
    return existing.id;
  }

  const id = genId();
  await db.insert(cicloConfigs).values({ id, ...values });
  return id;
}

// ── Toggle de card importante (coração) ──
export async function toggleCardImportant(cardId) {
  const rows = await db.select({ isImportant: cards.isImportant }).from(cards).where(eq(cards.id, cardId));
  const card = rows[0];
  if (!card) return;
  const newValue = card.isImportant === 1 ? 0 : 1;
  await db.update(cards).set({ isImportant: newValue }).where(eq(cards.id, cardId));
  return newValue;
}

export async function buildCycleCards(config) {
  const resultado = {
    atrasados: [],
    obrigatorios: [],
    erros: [],
    importantes: [],
    fixos: [],
    aleatorios: [],
  };

  const tagCounts = {};
  const idsCardsJaSelecionados = new Set();
  const idsAtrasadosSet = new Set();

  // 1. CONJUNTOS ATRASADOS
  // Pega os N conjuntos com next_review_date mais antigo (mais atrasados)
  const now = Date.now();
  const setsAtrasados = await db.select()
    .from(sets)
    .where(sql`${sets.next_review_date} <= ${now}`)
    .orderBy(sql`${sets.next_review_date} ASC`)
    .limit(config.qtdConjuntosAtrasados);

  for (const s of setsAtrasados) {
    idsAtrasadosSet.add(s.id);
    const cardsDoSet = await db.select()
      .from(cards)
      .where(eq(cards.set_id, s.id))
      .orderBy(sql`${cards.next_review_date} ASC`)
      .limit(config.cardsPorConjuntoAtrasado + 50);

    const filtrados = [];
    const rejeitados = [];

    for (const card of cardsDoSet) {
      if (filtrados.length >= config.cardsPorConjuntoAtrasado) break;
      if (idsCardsJaSelecionados.has(card.id)) continue;
      
      const t = card.tag || 'sem_tag';
      if ((tagCounts[t] || 0) < config.globalTagLimit) {
        filtrados.push(card);
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      } else {
        rejeitados.push(card);
      }
    }

    // Fallback: ignorando tags
    let i = 0;
    while (filtrados.length < config.cardsPorConjuntoAtrasado && i < rejeitados.length) {
      filtrados.push(rejeitados[i]);
      i++;
    }

    resultado.atrasados.push(...filtrados);
    filtrados.forEach(c => idsCardsJaSelecionados.add(c.id));
  }

  // 2. REVISÃO OBRIGATÓRIA (Progressão Kumon)
  // Conjuntos com menor % de memorização (good/easy sobre total)
  const statsAll = await db.select({
    setId: cards.set_id,
    total: sql`count(${cards.id})`.mapWith(Number),
    memorized: sql`sum(CASE WHEN ${cards.difficultyStatus} IN ('good', 'easy') THEN 1 ELSE 0 END)`.mapWith(Number),
    priority: sets.priority,
  }).from(cards)
    .leftJoin(sets, eq(cards.set_id, sets.id))
    .groupBy(cards.set_id, sets.priority);

  const setsOrdenados = statsAll
    .map(s => ({ ...s, pct: s.total > 0 ? (s.memorized || 0) / s.total : 0, priority: s.priority ?? 9999 }))
    .sort((a, b) => {
      return a.priority - b.priority;
    });

  let obrigatoriosRestantes = config.cardsPorConjuntoObrigatorio;
  for (const s of setsOrdenados) {
    if (obrigatoriosRestantes <= 0) break;
    const cardsDoSet = await db.select()
      .from(cards)
      .where(eq(cards.set_id, s.setId))
      .orderBy(sql`${cards.next_review_date} ASC`)
      .limit(obrigatoriosRestantes);

    const novos = cardsDoSet.filter(c => !idsCardsJaSelecionados.has(c.id));
    resultado.obrigatorios.push(...novos);
    novos.forEach(c => idsCardsJaSelecionados.add(c.id));
    obrigatoriosRestantes -= novos.length;
  }

  // 3. ERROS ANTERIORES (difficultyStatus = 'hard')
  const cardsErros = await db.select()
    .from(cards)
    .where(eq(cards.difficultyStatus, 'hard'))
    .orderBy(sql`${cards.next_review_date} ASC`)
    .limit(config.cardsErrosAnteriores + resultado.atrasados.length + resultado.obrigatorios.length);

  const errosFiltrados = cardsErros
    .filter(c => !idsCardsJaSelecionados.has(c.id))
    .slice(0, config.cardsErrosAnteriores);
  resultado.erros.push(...errosFiltrados);
  errosFiltrados.forEach(c => idsCardsJaSelecionados.add(c.id));

  // 4. CARDS IMPORTANTES (isImportant = 1)
  const cardsImportantes = await db.select()
    .from(cards)
    .where(eq(cards.isImportant, 1))
    .orderBy(sql`${cards.next_review_date} ASC`)
    .limit(config.cardsImportantes + idsCardsJaSelecionados.size);

  const importantesFiltrados = cardsImportantes
    .filter(c => !idsCardsJaSelecionados.has(c.id))
    .slice(0, config.cardsImportantes);
  resultado.importantes.push(...importantesFiltrados);
  importantesFiltrados.forEach(c => idsCardsJaSelecionados.add(c.id));

  // 5. CONJUNTOS FIXOS (priorizando selecionados se existirem, senão os mais atrasados)
  let setsFixosFiltrados = [];
  
  if (config.conjuntosFixosSelecionados && config.conjuntosFixosSelecionados.length > 0) {
    const setsFixos = await db.select()
      .from(sets)
      .where(inArray(sets.id, config.conjuntosFixosSelecionados));
    
    setsFixosFiltrados = setsFixos
      .filter(s => !idsAtrasadosSet.has(s.id))
      .slice(0, config.qtdConjuntosFixosPorCiclo);
  } else {
    const setsFixos = await db.select()
      .from(sets)
      .orderBy(sql`${sets.next_review_date} ASC`)
      .limit(config.qtdConjuntosFixosPorCiclo + setsAtrasados.length);

    setsFixosFiltrados = setsFixos
      .filter(s => !idsAtrasadosSet.has(s.id))
      .slice(0, config.qtdConjuntosFixosPorCiclo);
  }

  for (const s of setsFixosFiltrados) {
    const cardsDoSet = await db.select()
      .from(cards)
      .where(eq(cards.set_id, s.id))
      .orderBy(sql`${cards.next_review_date} ASC`)
      .limit(config.cardsPorConjuntoFixo + idsCardsJaSelecionados.size + 50);

    const pool = cardsDoSet.filter(c => !idsCardsJaSelecionados.has(c.id));
    const filtrados = [];
    const rejeitados = [];

    for (const card of pool) {
      if (filtrados.length >= config.cardsPorConjuntoFixo) break;
      const t = card.tag || 'sem_tag';
      if ((tagCounts[t] || 0) < config.globalTagLimit) {
        filtrados.push(card);
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      } else {
        rejeitados.push(card);
      }
    }

    // Fallback: ignorando tags
    let i = 0;
    while (filtrados.length < config.cardsPorConjuntoFixo && i < rejeitados.length) {
      filtrados.push(rejeitados[i]);
      i++;
    }

    resultado.fixos.push(...filtrados);
    filtrados.forEach(c => idsCardsJaSelecionados.add(c.id));
  }

  // 6. TAGS SURPRESA (Prática Intercalada)
  if (config.surpriseTagsCount > 0 && config.cardsPerSurpriseTag > 0) {
    const randomTagsResult = await db.select({ tag: cards.tag })
      .from(cards)
      .where(sql`${cards.tag} IS NOT NULL AND ${cards.tag} != ''`)
      .groupBy(cards.tag)
      .orderBy(sql`RANDOM()`)
      .limit(config.surpriseTagsCount);

    const randomTags = randomTagsResult.map(r => r.tag).filter(t => t);

    for (const tagVal of randomTags) {
      const cardsDaTag = await db.select()
        .from(cards)
        .where(eq(cards.tag, tagVal))
        .orderBy(sql`RANDOM()`)
        .limit(config.cardsPerSurpriseTag + idsCardsJaSelecionados.size);

      const novosAleatorios = cardsDaTag
        .filter(c => !idsCardsJaSelecionados.has(c.id))
        .slice(0, config.cardsPerSurpriseTag);

      resultado.aleatorios.push(...novosAleatorios);
      novosAleatorios.forEach(c => idsCardsJaSelecionados.add(c.id));
    }
  }

  // Monta o array final (todos os cards sem duplicatas)
  const todosCards = [
    ...resultado.atrasados,
    ...resultado.obrigatorios,
    ...resultado.erros,
    ...resultado.importantes,
    ...resultado.fixos,
    ...resultado.aleatorios,
  ];

  // Aplica limite diário se ativo
  const totalFinal = config.limiteAtivo && config.limiteDiarioTotal > 0
    ? todosCards.slice(0, config.limiteDiarioTotal)
    : todosCards;

  return {
    cards: totalFinal,
    resumo: {
      atrasados: resultado.atrasados.length,
      obrigatorios: resultado.obrigatorios.length,
      erros: resultado.erros.length,
      importantes: resultado.importantes.length,
      fixos: resultado.fixos.length,
      aleatorios: resultado.aleatorios.length,
      total: totalFinal.length,
    },
  };
}

export async function seedInitialData() {
  const existingSets = await db.select().from(sets);
  const existingCards = await db.select().from(cards);

  if (existingSets.length === 0 && existingCards.length === 0) {
    console.log('Banco de dados vazio. Semeando dados iniciais...');
    const deck = await createDeck('Inglês Essencial', 'Vocabulário básico', 'en-US', 'pt-BR');
    await createCard(deck.id, 'Apple', 'Maçã');
    await createCard(deck.id, 'House', 'Casa');
    await createCard(deck.id, 'Watermelon', 'Melancia');
    console.log('Dados semeados com sucesso!');
  }
}
