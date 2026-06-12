/**
 * Real-World Example: Flashcards API Service
 * 
 * Este é um exemplo prático de como integrar o api.config.js com seus
 * serviços de API reais. Adapte conforme sua API.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api.service';

/**
 * Deck Service - CRUD operations para decks
 */
export const deckService = {
  /**
   * Buscar todos os decks do usuário
   */
  getAllDecks: async () => {
    try {
      return await apiGet('/decks');
    } catch (error) {
      console.error('Failed to fetch decks:', error);
      throw error;
    }
  },

  /**
   * Buscar um deck específico com seus cards
   */
  getDeckWithCards: async (deckId) => {
    try {
      return await apiGet(`/decks/${deckId}`);
    } catch (error) {
      console.error(`Failed to fetch deck ${deckId}:`, error);
      throw error;
    }
  },

  /**
   * Criar um novo deck
   */
  createDeck: async (deckData) => {
    try {
      return await apiPost('/decks', {
        title: deckData.title,
        description: deckData.description,
        frontLanguage: deckData.frontLanguage || 'pt-BR',
        backLanguage: deckData.backLanguage || 'en-US',
      });
    } catch (error) {
      console.error('Failed to create deck:', error);
      throw error;
    }
  },

  /**
   * Atualizar um deck
   */
  updateDeck: async (deckId, updates) => {
    try {
      return await apiPut(`/decks/${deckId}`, updates);
    } catch (error) {
      console.error(`Failed to update deck ${deckId}:`, error);
      throw error;
    }
  },

  /**
   * Deletar um deck
   */
  deleteDeck: async (deckId) => {
    try {
      return await apiDelete(`/decks/${deckId}`);
    } catch (error) {
      console.error(`Failed to delete deck ${deckId}:`, error);
      throw error;
    }
  },
};

/**
 * Card Service - CRUD operations para cards
 */
export const cardService = {
  /**
   * Buscar todos os cards de um deck
   */
  getCardsByDeck: async (deckId) => {
    try {
      return await apiGet(`/decks/${deckId}/cards`);
    } catch (error) {
      console.error(`Failed to fetch cards for deck ${deckId}:`, error);
      throw error;
    }
  },

  /**
   * Buscar cards para revisar (algoritmo SRS)
   */
  getCardsForReview: async (deckId) => {
    try {
      return await apiGet(`/decks/${deckId}/cards/review`);
    } catch (error) {
      console.error(`Failed to fetch cards for review:`, error);
      throw error;
    }
  },

  /**
   * Criar um novo card
   */
  createCard: async (deckId, cardData) => {
    try {
      return await apiPost(`/decks/${deckId}/cards`, {
        front: cardData.front,
        back: cardData.back,
        example: cardData.example,
      });
    } catch (error) {
      console.error(`Failed to create card:`, error);
      throw error;
    }
  },

  /**
   * Atualizar um card
   */
  updateCard: async (cardId, updates) => {
    try {
      return await apiPut(`/cards/${cardId}`, updates);
    } catch (error) {
      console.error(`Failed to update card ${cardId}:`, error);
      throw error;
    }
  },

  /**
   * Registrar revisão de um card
   */
  recordCardReview: async (cardId, reviewData) => {
    try {
      return await apiPost(`/cards/${cardId}/review`, {
        difficulty: reviewData.difficulty, // 'easy', 'medium', 'hard'
        timeSpent: reviewData.timeSpent, // em segundos
        correct: reviewData.correct,
      });
    } catch (error) {
      console.error(`Failed to record review for card ${cardId}:`, error);
      throw error;
    }
  },

  /**
   * Deletar um card
   */
  deleteCard: async (cardId) => {
    try {
      return await apiDelete(`/cards/${cardId}`);
    } catch (error) {
      console.error(`Failed to delete card ${cardId}:`, error);
      throw error;
    }
  },
};

/**
 * User Service - Operações de usuário
 */
export const userService = {
  /**
   * Buscar perfil do usuário
   */
  getProfile: async () => {
    try {
      return await apiGet('/me');
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  },

  /**
   * Atualizar perfil
   */
  updateProfile: async (updates) => {
    try {
      return await apiPut('/me', updates);
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  /**
   * Buscar estatísticas do usuário
   */
  getStatistics: async () => {
    try {
      return await apiGet('/me/statistics');
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      throw error;
    }
  },

  /**
   * Logout
   */
  logout: async () => {
    try {
      return await apiPost('/logout', {});
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  },
};

/**
 * Sync Service - Sincronização com servidor
 */
export const syncService = {
  /**
   * Sincronizar mudanças locais com servidor
   */
  syncChanges: async (changes) => {
    try {
      return await apiPost('/sync', {
        created: changes.created || [],
        updated: changes.updated || [],
        deleted: changes.deleted || [],
      });
    } catch (error) {
      console.error('Failed to sync changes:', error);
      throw error;
    }
  },

  /**
   * Buscar todas as mudanças do servidor
   */
  getRemoteChanges: async (lastSyncTime) => {
    try {
      return await apiGet(`/sync?since=${lastSyncTime}`);
    } catch (error) {
      console.error('Failed to get remote changes:', error);
      throw error;
    }
  },
};

// ============================================================================
// COMO USAR NOS COMPONENTES
// ============================================================================

/**
 * EXEMPLO 1: Em um componente de lista de decks
 * 
 * import { deckService } from '../config/api.example';
 * import { useState, useEffect } from 'react';
 * 
 * const DeckListScreen = () => {
 *   const [decks, setDecks] = useState([]);
 *   const [loading, setLoading] = useState(true);
 * 
 *   useEffect(() => {
 *     loadDecks();
 *   }, []);
 * 
 *   const loadDecks = async () => {
 *     try {
 *       setLoading(true);
 *       const data = await deckService.getAllDecks();
 *       setDecks(data);
 *     } catch (error) {
 *       Alert.alert('Error', 'Failed to load decks');
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 * 
 *   return (
 *     <FlatList
 *       data={decks}
 *       renderItem={({ item }) => <DeckCard deck={item} />}
 *     />
 *   );
 * };
 */

/**
 * EXEMPLO 2: Criar um novo deck
 * 
 * const CreateDeckButton = () => {
 *   const handleCreate = async () => {
 *     try {
 *       const newDeck = await deckService.createDeck({
 *         title: 'My New Deck',
 *         description: 'Learning English',
 *         frontLanguage: 'pt-BR',
 *         backLanguage: 'en-US',
 *       });
 * 
 *       Alert.alert('Success', `Deck created: ${newDeck.id}`);
 *       navigation.goBack();
 *     } catch (error) {
 *       Alert.alert('Error', error.message);
 *     }
 *   };
 * 
 *   return <Button title="Create Deck" onPress={handleCreate} />;
 * };
 */

/**
 * EXEMPLO 3: Sincronizar dados
 * 
 * const syncWithServer = async () => {
 *   try {
 *     const localChanges = {
 *       created: newCards,
 *       updated: editedCards,
 *       deleted: deletedCardIds,
 *     };
 * 
 *     const result = await syncService.syncChanges(localChanges);
 * 
 *     if (result.success) {
 *       console.log('✅ Sync completed');
 *       // Clear local changes after successful sync
 *     }
 *   } catch (error) {
 *     console.error('❌ Sync failed:', error);
 *   }
 * };
 */

/**
 * EXEMPLO 4: Com retry logic
 * 
 * const fetchWithRetry = async (fn, maxRetries = 3) => {
 *   for (let i = 0; i < maxRetries; i++) {
 *     try {
 *       return await fn();
 *     } catch (error) {
 *       if (i === maxRetries - 1) throw error;
 *       console.warn(`Retry ${i + 1}/${maxRetries}...`);
 *       await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
 *     }
 *   }
 * };
 * 
 * // Usar:
 * const decks = await fetchWithRetry(() => deckService.getAllDecks());
 */

export default {
  deckService,
  cardService,
  userService,
  syncService,
};
