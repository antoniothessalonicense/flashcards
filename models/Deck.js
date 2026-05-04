import { Model } from '@nozbe/watermelondb';
import { field, text, date, children, readonly } from '@nozbe/watermelondb/decorators';

export default class Deck extends Model {
  static table = 'decks';

  // Relacionamento 1-N: Um Deck tem vários Cards
  static associations = {
    cards: { type: 'has_many', foreignKey: 'deck_id' },
  };

  @text('title') title;
  @text('description') description;
  @field('target_reviews_per_day') targetReviewsPerDay;

  // Cria um observable para os cartões deste deck
  @children('cards') cards;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}