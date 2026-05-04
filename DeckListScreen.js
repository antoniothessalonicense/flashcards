import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import withObservables from '@nozbe/with-observables';
import { database } from './database';

/**
 * Componente de Item Reativo
 * Atualiza-se sozinho na UI se os dados deste Deck específico mudarem no DB.
 */
const DeckItem = ({ deck, onReview, onPractice }) => {
  return (
    <View style={styles.deckItem}>
      <View style={styles.deckItemHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.deckName}>{deck.title}</Text>
          <Text style={styles.deckSub}>Meta: {deck.targetReviewsPerDay} cards diários</Text>
        </View>
      </View>
      <View style={styles.deckActions}>
        <TouchableOpacity onPress={() => onReview(deck)}>
          <Text style={styles.deckActionBtn}>REVISÃO</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onPractice(deck)}>
          <Text style={styles.deckActionBtn}>PRÁTICA</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Conecta o Item ao Observable de si mesmo
const EnhancedDeckItem = withObservables(['deck'], ({ deck }) => ({
  deck: deck.observe(),
}))(DeckItem);

/**
 * Lista Principal de Decks
 * Recebe 'decks' assincronamente através do HOC withObservables.
 */
const DeckList = ({ decks, onReview, onPractice }) => {
  return (
    <FlatList
      data={decks}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <EnhancedDeckItem deck={item} onReview={onReview} onPractice={onPractice} />
      )}
      contentContainerStyle={{ paddingBottom: 148 }}
      style={{ flex: 1 }}
    />
  );
};

// Conecta a Lista de Decks a uma Query que escuta a tabela 'decks' em tempo real
const EnhancedDeckList = withObservables([], () => ({
  decks: database.collections.get('decks').query().observe(),
}))(DeckList);

/**
 * Tela de Listagem (Container)
 */
export default function DeckListScreen({ onMenuOpen, theme }) {
  const insets = useSafeAreaInsets();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onMenuOpen} style={styles.hBtn}>
          <Text style={styles.hIcon}>☰</Text>
        </TouchableOpacity>
        {isSearching ? (
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar conjuntos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <TouchableOpacity style={styles.hBtn} onPress={() => setIsSearching(!isSearching)}>
          <Text style={styles.hIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Aqui a lista reativa assume o controle do fluxo assíncrono */}
      <EnhancedDeckList 
        onReview={(deck) => console.log('Review:', deck.id)}
        onPractice={(deck) => console.log('Practice:', deck.id)}
      />
    </View>
  );
}

// Nota: Estilos condensados para o exemplo. No projeto real, utilize seu gerenciamento de theme.
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  hBtn: { padding: 8 },
  hIcon: { color: '#FFF', fontSize: 20 },
  searchInput: { flex: 1, backgroundColor: '#333', color: '#FFF', padding: 8, borderRadius: 8, marginHorizontal: 8 },
  deckItem: { backgroundColor: '#2A2A2A', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 12 },
  deckItemHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  deckName: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  deckSub: { color: '#888', fontSize: 12, marginTop: 4 },
  deckActions: { flexDirection: 'row', marginTop: 10, gap: 16 },
  deckActionBtn: { color: '#3B9EFF', fontWeight: 'bold', fontSize: 13 }
});