import { appSchema, tableSchema } from '@hypertill/db';

export default appSchema({
  version: 5,
  tables: [
    tableSchema({
      name: 'decks',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'target_reviews_per_day', type: 'number' },
        { name: 'total_reviews', type: 'number', isOptional: true },
        { name: 'front_language', type: 'string', isOptional: true },
        { name: 'back_language', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'cards',
      columns: [
        { name: 'deck_id', type: 'string', isIndexed: true },
        { name: 'front', type: 'string' },
        { name: 'back', type: 'string' },
        { name: 'difficulty_status', type: 'string', isOptional: true },
        { name: 'next_review_at', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'workspaces',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'color', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'ciclo_configs',
      columns: [
        { name: 'limite_diario_total', type: 'number' },
        { name: 'limite_ativo', type: 'boolean' },
        { name: 'cards_por_conjunto_obrigatorio', type: 'number' },
        { name: 'qtd_conjuntos_atrasados', type: 'number' },
        { name: 'cards_por_conjunto_atrasado', type: 'number' },
        { name: 'cards_erros_anteriores', type: 'number' },
        { name: 'cards_importantes', type: 'number' },
        { name: 'qtd_conjuntos_fixos_por_ciclo', type: 'number' },
        { name: 'cards_por_conjunto_fixo', type: 'number' },
      ],
    }),
  ],
});