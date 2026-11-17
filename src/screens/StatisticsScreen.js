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
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const onClose = () => navigation.goBack();

  const memorizedPercent = totalCardsCount > 0 ? Math.round((memorizedCardsCount / totalCardsCount) * 100) : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={24} color={theme.appBarText} />
          </TouchableOpacity>
          <Ionicons name="person-circle" size={36} color={theme.appBarText} />
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
            <Text style={{ color: theme.textSecondary, marginLeft: 4 }}>Nenhum deck encontrado.</Text>
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

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    marginBottom: 16,
    marginHorizontal: -16,
    marginTop: -16,
    paddingHorizontal: 8,
    backgroundColor: theme.appBar,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.appBarText,
    marginLeft: 10,
  },
  card: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    // Sombras
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  cardTitleLeft: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textPrimary,
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
    fontSize: 24,
    fontWeight: '800',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  unit: {
    fontSize: 20,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    color: theme.textSecondary,
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
    backgroundColor: theme.accent,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: theme.textSecondary,
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
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 180,
  },
  miniCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: theme.border,
    borderRadius: 3,
    marginRight: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.accent,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
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
