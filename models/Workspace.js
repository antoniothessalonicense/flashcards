import { Model } from '@nozbe/watermelondb';
import { text, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Workspace extends Model {
  static table = 'workspaces';

  @text('name') name;
  @text('color') color; // Para salvar a cor da barra esquerda do conjunto

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}