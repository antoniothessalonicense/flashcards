import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import withObservables from '@nozbe/with-observables';
import { ProgressBar } from './Shared';

export function ReviewScreenComponent({ deck, cards = [], onClose, onRate, onRateCard, theme }) {
  const C = theme;
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState({ hard: 0, good: 0, easy: 0 });
  const [favorited, setFavorited] = useState(false);

  const handleRate = (type) => {
    const currentCard = cards[index];
    if (currentCard && onRateCard) onRateCard(currentCard.id, type);
    setRatings(prev => ({ ...prev, [type]: prev[type] + 1 }));
    if (onRate) onRate();
    setIndex(i => i + 1);
    setFlipped(false);
  };

  if (cards.length === 0) {
    return (
      <View style={[styles.screen, styles.doneScreen, { paddingTop: insets.top, backgroundColor: C.bg }]}>
        <Text style={[styles.doneTitle, { color: C.white }]}>Baralho Vazio!</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: C.blue }]} onPress={onClose}>
          <Text style={[styles.backBtnText, { color: C.white }]}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (index >= cards.length) {
    return (
      <View style={[styles.screen, styles.doneScreen, { paddingTop: insets.top, backgroundColor: C.bg }]}>
        <Text style={{ fontSize: 64 }}>🎉</Text>
        <Text style={[styles.doneTitle, { color: C.white }]}>Concluído!</Text>
        <View style={styles.ratingsRow}>
          <View style={[styles.ratingChip, { backgroundColor: '#F44336' }]}><Text style={[styles.ratingChipText, { color: C.white }]}>Difícil: {ratings.hard}</Text></View>
          <View style={[styles.ratingChip, { backgroundColor: '#4CAF50' }]}><Text style={[styles.ratingChipText, { color: C.white }]}>Bom: {ratings.good}</Text></View>
          <View style={[styles.ratingChip, { backgroundColor: C.blue }]}><Text style={[styles.ratingChipText, { color: C.white }]}>Fácil: {ratings.easy}</Text></View>
        </View>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: C.blue }]} onPress={onClose}>
          <Text style={[styles.backBtnText, { color: C.white }]}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const card = cards[index];
  const progress = (index / cards.length) * 100;

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: C.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.hBtn}><Text style={[styles.hIcon, { color: C.white }]}>✕</Text></TouchableOpacity>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 8 }}><ProgressBar value={progress} color={C.blue} theme={theme} /></View>
        <Text style={[styles.progressText, { color: C.gray }]}>{index} / {cards.length}</Text>
      </View>

      <TouchableOpacity style={[styles.reviewCard, { backgroundColor: C.reviewCard }]} onPress={() => setFlipped(f => !f)} activeOpacity={0.9}>
        <TouchableOpacity style={styles.favBtn} onPress={() => setFavorited(f => !f)}>
          <Text style={{ fontSize: 22, color: favorited ? '#FF6B6B' : C.favIcon }}>♡</Text>
        </TouchableOpacity>
        <View style={styles.cardContent}>
          <Text style={[flipped ? styles.cardBack : styles.cardFront, { color: C.white }]}>
            {flipped ? card.back : card.front}
          </Text>
        </View>
        <Text style={styles.cardHint}>{flipped ? 'toque para ver o verso' : 'toque para revelar'}</Text>
        <TouchableOpacity style={[styles.replayBtn, { backgroundColor: C.blue }]} onPress={() => setFlipped(false)}><Text style={{ color: C.white, fontSize: 16 }}>↺</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.nextCardBtn, { backgroundColor: C.cardBtnBg }]}><Text style={{ color: C.white, fontSize: 16 }}>▶</Text></TouchableOpacity>
      </TouchableOpacity>

      <View style={styles.ratingRow}>
        <TouchableOpacity style={[styles.ratingBtn, { backgroundColor: '#F44336' }]} onPress={() => handleRate('hard')}><Text style={[styles.ratingBtnText, { color: C.white }]}>Difícil</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.ratingBtn, { backgroundColor: '#4CAF50' }]} onPress={() => handleRate('good')}><Text style={[styles.ratingBtnText, { color: C.white }]}>Bom</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.ratingBtn, { backgroundColor: C.blue }]} onPress={() => handleRate('easy')}><Text style={[styles.ratingBtnText, { color: C.white }]}>Fácil</Text></TouchableOpacity>
      </View>
    </View>
  );
}

export const EnhancedReviewScreen = withObservables(['deck'], ({ deck }) => ({
  deck: deck.observe(),
  cards: deck.cards.observe(),
}))(ReviewScreenComponent);

const styles = StyleSheet.create({
  screen: { flex: 1 }, doneScreen: { justifyContent: 'center', alignItems: 'center' }, doneTitle: { fontSize: 28, fontWeight: 'bold', marginTop: 16, marginBottom: 24 }, ratingsRow: { flexDirection: 'row', gap: 8, marginBottom: 32 }, ratingChip: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 }, ratingChipText: { fontWeight: 'bold' }, backBtn: { borderRadius: 30, paddingHorizontal: 40, paddingVertical: 14 }, backBtnText: { fontWeight: 'bold', fontSize: 16 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8 }, hBtn: { padding: 8 }, hIcon: { fontSize: 20 }, progressText: { fontSize: 12, paddingHorizontal: 8 }, reviewCard: { flex: 1, borderRadius: 16, margin: 16 }, cardContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }, cardFront: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' }, cardBack: { fontSize: 18, textAlign: 'center' }, cardHint: { color: '#ffffff44', textAlign: 'center', paddingBottom: 60, fontSize: 12 }, favBtn: { position: 'absolute', top: 14, left: 14, zIndex: 1 }, replayBtn: { position: 'absolute', bottom: 14, right: 56, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' }, nextCardBtn: { position: 'absolute', bottom: 14, right: 14, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' }, ratingRow: { flexDirection: 'row', padding: 16, gap: 8 }, ratingBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }, ratingBtnText: { fontWeight: 'bold', fontSize: 14 },
});