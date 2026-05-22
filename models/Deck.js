import { Model } from '@hypertill/db';
import { field, text, date, children, readonly } from '@hypertill/db/decorators';

export default class Deck extends Model {
  static table = 'decks';

  // Relacionamento 1-N: Um Deck tem vários Cards
  static associations = {
    cards: { type: 'has_many', foreignKey: 'deck_id' },
  };

  @text('title') title;
  @text('description') description;
  @field('target_reviews_per_day') targetReviewsPerDay;
  @text('front_language') frontLanguage;
  @text('back_language') backLanguage;

  // Cria um observable para os cartões deste deck
  @children('cards') cards;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}