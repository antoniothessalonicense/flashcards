import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import withObservables from '@nozbe/with-observables';
import { database } from '../../database';
import { AppContext } from '../context/AppContext';

function StatisticsScreen({ totalCardsCount }) {
  const { theme, cardsReviewedToday, dailyGoal } = useContext(AppContext);
  const C = theme;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const onClose = () => navigation.goBack();
  
  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: C.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.hBtn}>
          <Text style={[styles.hIcon, { color: C.white }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.hTitle, { color: C.white }]}>Estatísticas</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: C.card }]}>
          <Text style={[styles.cardTitle, { color: C.white }]}>Revisões Hoje</Text>
          <Text style={[styles.cardValue, { color: C.blue }]}>{cardsReviewedToday}</Text>
          <Text style={[styles.cardSub, { color: C.gray }]}>Meta Diária: {dailyGoal} cartões</Text>
        </View>

        <View style={[styles.card, { backgroundColor: C.card }]}>
          <Text style={[styles.cardTitle, { color: C.white }]}>Total de Cartões</Text>
          <Text style={[styles.cardValue, { color: C.purple }]}>{totalCardsCount}</Text>
          <Text style={[styles.cardSub, { color: C.gray }]}>No seu banco de dados</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, 
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 12 }, 
  hBtn: { padding: 8, width: 40 }, 
  hIcon: { fontSize: 24 }, 
  hTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' }, 
  content: { padding: 16, gap: 16 }, 
  card: { padding: 20, borderRadius: 12, alignItems: 'center' }, 
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 }, 
  cardValue: { fontSize: 48, fontWeight: 'bold', marginBottom: 4 }, 
  cardSub: { fontSize: 14 },
});

import { withDatabase } from '@hypertill/db/react';

const EnhancedStatisticsScreen = withObservables(['database'], ({ database }) => ({
  totalCardsCount: database.get('cards').query().observeCount(),
}))(StatisticsScreen);

export default withDatabase(EnhancedStatisticsScreen);
