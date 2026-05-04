import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 3,
  tables: [
    tableSchema({
      name: 'decks',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'target_reviews_per_day', type: 'number' },
        { name: 'total_reviews', type: 'number', isOptional: true },
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
  ],
});