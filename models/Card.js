import { Model } from '@hypertill/db';
import { field, text, date, relation, readonly } from '@hypertill/db/decorators';

export default class Card extends Model {
  static table = 'cards';

  // Relacionamento N-1: Um Card pertence a um Deck
  static associations = {
    decks: { type: 'belongs_to', key: 'deck_id' },
  };

  @relation('decks', 'deck_id') deck;

  @text('front') front;
  @text('back') back;
  @field('difficulty_status') difficultyStatus; // Ex: 'easy', 'good', 'hard'
  @date('next_review_at') nextReviewAt;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}