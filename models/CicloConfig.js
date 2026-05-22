import { Model } from '@hypertill/db';
import { field, action } from '@hypertill/db/decorators';

export default class CicloConfig extends Model {
  static table = 'ciclo_configs';

  @field('limite_diario_total') limiteDiarioTotal;
  @field('limite_ativo') limiteAtivo;
  @field('cards_por_conjunto_obrigatorio') cardsPorConjuntoObrigatorio;
  @field('qtd_conjuntos_atrasados') qtdConjuntosAtrasados;
  @field('cards_por_conjunto_atrasado') cardsPorConjuntoAtrasado;
  @field('cards_erros_anteriores') cardsErrosAnteriores;
  @field('cards_importantes') cardsImportantes;
  @field('qtd_conjuntos_fixos_por_ciclo') qtdConjuntosFixosPorCiclo;
  @field('cards_por_conjunto_fixo') cardsPorConjuntoFixo;
}
