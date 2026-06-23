import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import db from '../../db';
import { sql, eq } from 'drizzle-orm';
import { cards, sets } from '../../db/schema';
import { AppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

function StatisticsScreen({ totalCardsCount, memorizedCardsCount, totalDecksCount, bestDecks }) {
  const { theme, cardsReviewedToday } = useContext(AppContext);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const onClose = () => navigation.goBack();

  const memorizedPercent = totalCardsCount > 0 ? Math.round((memorizedCardsCount / totalCardsCount) * 100) : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={{ paddingRight: 10 }}>
            <Ionicons name="arrow-back" size={28} color="#333" />
          </TouchableOpacity>
          <Ionicons name="person-circle" size={40} color="#333" />
          <Text style={styles.headerTitle}>Estatísticas - Maria L.</Text>
        </View>

        {/* Card 1: Resumo Geral */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>RESUMO GERAL</Text>
          <View style={styles.gridContainer}>
            <View style={styles.gridItem}>
              <Text style={styles.bigNumber}>{totalDecksCount}</Text>
              <Text style={styles.label}>Decks Criados</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.bigNumber}>{totalCardsCount}</Text>
              <Text style={styles.label}>Cartões Totais</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.bigNumber}>{memorizedCardsCount}</Text>
              <Text style={styles.label}>Cartões Dominados{'\n'}({memorizedPercent}%)</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.bigNumber}>{cardsReviewedToday}</Text>
              <Text style={styles.label}>Revisões{'\n'}(Hoje)</Text>
            </View>
          </View>
        </View>

        {/* Card 2: Progresso Mensal (Gráfico Flexbox Nativo) */}
        <View style={styles.card}>
          <Text style={styles.cardTitleLeft}>Progresso Mensal</Text>
          <View style={styles.chartContainer}>
            {/* Como não há histórico mensal no DB atualmente, os dados anteriores são simulados e o último mês usa as revisões de hoje normalizadas */}
            {[10, 25, 40, 30, 50, 45, 60, cardsReviewedToday].map((val, index) => {
              const maxVal = Math.max(80, cardsReviewedToday); // Escala dinâmica simples
              const heightPercent = `${Math.min((val / maxVal) * 100, 100)}%`;
              return (
                <View key={index} style={styles.barWrapper}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: heightPercent }]} />
                  </View>
                  <Text style={styles.barLabel}>{['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'][index]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Card 3: Melhores Decks */}
        <View style={styles.sectionHeader}>
          <Text style={styles.cardTitleLeft}>Melhores Decks:</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
          {bestDecks.length === 0 ? (
            <Text style={{ color: '#666', marginLeft: 4 }}>Nenhum deck encontrado.</Text>
          ) : (
            bestDecks.map((deck) => (
              <View key={deck.id} style={styles.miniCard}>
                <Text style={styles.miniCardTitle}>{deck.title.toUpperCase()}</Text>
                <View style={styles.progressRow}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${deck.percentage}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{deck.percentage}%</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F6', // Cinza claro do fundo
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginLeft: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    // Sombras
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  cardTitleLeft: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%', // Garante 2 itens por linha
    alignItems: 'center',
    marginBottom: 24,
  },
  bigNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  unit: {
    fontSize: 20,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Gráfico Flexbox
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 10,
  },
  barWrapper: {
    alignItems: 'center',
    width: 30,
    height: '100%',
  },
  barTrack: {
    flex: 1,
    width: 20,
    justifyContent: 'flex-end', // A barra cresce de baixo para cima
  },
  barFill: {
    width: '100%',
    backgroundColor: '#34C759', // Verde iOS padrão
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 8,
  },
  // Lista Horizontal
  sectionHeader: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  horizontalList: {
    paddingRight: 16,
  },
  miniCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  miniCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginRight: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  }
});

const StatisticsScreenWrapper = () => {
  const { data: generalStats } = useLiveQuery(
    db.select({
      totalCards: sql`count(${cards.id})`.mapWith(Number),
      memorizedCards: sql`sum(CASE WHEN ${cards.difficultyStatus} IN ('good', 'easy') THEN 1 ELSE 0 END)`.mapWith(Number)
    }).from(cards)
  );

  const { data: totalDecksData } = useLiveQuery(
    db.select({ count: sql`count(${sets.id})`.mapWith(Number) }).from(sets)
  );

  const { data: deckStats } = useLiveQuery(
    db.select({
      id: sets.id,
      title: sets.title,
      total: sql`count(${cards.id})`.mapWith(Number),
      memorized: sql`sum(CASE WHEN ${cards.difficultyStatus} IN ('good', 'easy') THEN 1 ELSE 0 END)`.mapWith(Number)
    }).from(sets)
    .leftJoin(cards, eq(sets.id, cards.set_id))
    .groupBy(sets.id)
  );

  const totalCardsCount = generalStats?.[0]?.totalCards || 0;
  const memorizedCardsCount = generalStats?.[0]?.memorizedCards || 0;
  const totalDecksCount = totalDecksData?.[0]?.count || 0;
  
  // Calcula porcentagem e pega os 4 melhores decks (com pelo menos 1 card)
  const bestDecks = (deckStats || [])
    .filter(d => d.total > 0)
    .map(d => ({ ...d, percentage: Math.round((d.memorized / d.total) * 100) }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 4);

  return (
    <StatisticsScreen 
      totalCardsCount={totalCardsCount} 
      memorizedCardsCount={memorizedCardsCount}
      totalDecksCount={totalDecksCount}
      bestDecks={bestDecks}
    />
  );
};

export default StatisticsScreenWrapper;
