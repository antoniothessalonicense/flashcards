import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export interface CicloConfig {
  limiteDiarioTotal: number;
  limiteAtivo: boolean;
  cardsPorConjuntoObrigatorio: number;
  qtdConjuntosAtrasados: number;
  cardsPorConjuntoAtrasado: number;
  cardsErrosAnteriores: number;
  cardsImportantes: number;
  qtdConjuntosFixosPorCiclo: number;
  cardsPorConjuntoFixo: number;
  conjuntosFixosSelecionados: string[];
}

interface CicloConfigActions {
  /** Atualiza campos parciais (merge) */
  updateConfig: (partial: Partial<CicloConfig>) => void;
  /** Restaura todos os campos para os valores padrão */
  resetToDefaults: () => void;
  /** Hidrata a store inteira a partir de uma row do banco */
  hydrateFromDB: (row: Record<string, any>) => void;
}

type CicloConfigStore = CicloConfig & CicloConfigActions;

// ─────────────────────────────────────────────
// Defaults (fonte única de verdade)
// ─────────────────────────────────────────────

export const CICLO_DEFAULTS: CicloConfig = {
  limiteDiarioTotal: 0,
  limiteAtivo: false,
  cardsPorConjuntoObrigatorio: 40,
  qtdConjuntosAtrasados: 5,
  cardsPorConjuntoAtrasado: 20,
  cardsErrosAnteriores: 20,
  cardsImportantes: 20,
  qtdConjuntosFixosPorCiclo: 1,
  cardsPorConjuntoFixo: 20,
  conjuntosFixosSelecionados: [],
};

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useCicloConfigStore = create<CicloConfigStore>()(
  persist(
    (set) => ({
      // Estado inicial
      ...CICLO_DEFAULTS,

      // Ações
      updateConfig: (partial) => set((state) => ({ ...state, ...partial })),

      resetToDefaults: () => set(CICLO_DEFAULTS),

      hydrateFromDB: (row) =>
        set({
          limiteDiarioTotal: row.limiteDiarioTotal ?? CICLO_DEFAULTS.limiteDiarioTotal,
          limiteAtivo: Boolean(row.limiteAtivo),
          cardsPorConjuntoObrigatorio: row.cardsPorConjuntoObrigatorio ?? CICLO_DEFAULTS.cardsPorConjuntoObrigatorio,
          qtdConjuntosAtrasados: row.qtdConjuntosAtrasados ?? CICLO_DEFAULTS.qtdConjuntosAtrasados,
          cardsPorConjuntoAtrasado: row.cardsPorConjuntoAtrasado ?? CICLO_DEFAULTS.cardsPorConjuntoAtrasado,
          cardsErrosAnteriores: row.cardsErrosAnteriores ?? CICLO_DEFAULTS.cardsErrosAnteriores,
          cardsImportantes: row.cardsImportantes ?? CICLO_DEFAULTS.cardsImportantes,
          qtdConjuntosFixosPorCiclo: row.qtdConjuntosFixosPorCiclo ?? CICLO_DEFAULTS.qtdConjuntosFixosPorCiclo,
          cardsPorConjuntoFixo: row.cardsPorConjuntoFixo ?? CICLO_DEFAULTS.cardsPorConjuntoFixo,
          conjuntosFixosSelecionados: row.conjuntosFixosSelecionados ? JSON.parse(row.conjuntosFixosSelecionados) : CICLO_DEFAULTS.conjuntosFixosSelecionados,
        }),
    }),
    {
      name: 'ciclo-config-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
