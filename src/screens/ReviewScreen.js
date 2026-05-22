import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import withObservables from '@nozbe/with-observables';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { ProgressBar } from '../components/Shared';
import LottieView from 'lottie-react-native';
import { AppContext } from '../context/AppContext';
import { database } from '../../database';
import { updateCardDifficulty } from '../../dbServices';

// Componente de revisão de flashcards
export function ReviewScreenComponent({ deck, cards = [], isAllMode = false }) {
  const { 
    theme, styles: globalStyles, 
    cardsReviewedToday, dailyGoal, 
    autoPlayAudio, cardFontSize, 
    preferredVoices, handleSetPreferredVoice,
    incrementDailyReview
  } = useContext(AppContext);
  
  const C = theme;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState({ hard: 0, good: 0, easy: 0 });
  const [favorited, setFavorited] = useState(false);
  const [lottieAnim, setLottieAnim] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);

  const onClose = () => navigation.goBack();
  const onRateCard = async (cardId, difficulty) => {
    try { await updateCardDifficulty(cardId, difficulty); } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (cards.length > 0 && index >= cards.length && !lottieAnim) {
      fetch('https://lottie.host/81ca1d49-411a-464a-951b-5e6e3c0429f7/B2E1gV00Ue.json')
        .then(res => res.json())
        .then(data => setLottieAnim(data))
        .catch(err => console.log("Erro ao baixar animação Lottie", err));
    }
  }, [index, cards.length, lottieAnim]);

  useEffect(() => {
    Speech.getAvailableVoicesAsync().then(setAvailableVoices);
  }, []);

  useEffect(() => {
    if (autoPlayAudio && cards[index]) {
      Speech.stop();
      const currentLang = flipped ? (deck?.backLanguage || 'en-US') : (deck?.frontLanguage || 'pt-BR');
      const textToSpeak = flipped ? cards[index].back : cards[index].front;
      const voiceOptions = { language: currentLang };
      
      if (preferredVoices && preferredVoices[currentLang]) {
        voiceOptions.voice = preferredVoices[currentLang];
      }
      
      Speech.speak(textToSpeak, voiceOptions);
    }
  }, [index, flipped, autoPlayAudio, cards, deck, preferredVoices]);

  const changeVoice = () => {
    const currentLang = flipped ? (deck?.backLanguage || 'en-US') : (deck?.frontLanguage || 'pt-BR');
    const textToSpeak = flipped ? cards[index].back : cards[index].front;
    
    let voicesForLang = availableVoices.filter(v => v.language === currentLang);
    if (voicesForLang.length === 0) {
      voicesForLang = availableVoices.filter(v => v.language.startsWith(currentLang.split('-')[0]));
    }
    
    if (voicesForLang.length <= 1) {
      Alert.alert('Aviso', 'Nenhuma voz alternativa encontrada para este idioma no seu dispositivo.');
      return;
    }
    
    const currentVoiceId = preferredVoices[currentLang];
    const currentIndex = voicesForLang.findIndex(v => v.identifier === currentVoiceId);
    const nextVoice = voicesForLang[(currentIndex + 1) % voicesForLang.length];
    
    if (handleSetPreferredVoice) {
      handleSetPreferredVoice(currentLang, nextVoice.identifier);
    }
    
    Speech.stop();
    Speech.speak(textToSpeak, { language: currentLang, voice: nextVoice.identifier });
  };

  const handleRate = (type) => {
    const currentCard = cards[index];
    if (currentCard) onRateCard(currentCard.id, type);
    setRatings(prev => ({ ...prev, [type]: prev[type] + 1 }));
    incrementDailyReview();
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
        {lottieAnim ? (
          <LottieView autoPlay loop={true} style={{ width: 220, height: 220 }} source={lottieAnim} />
        ) : (
          <View style={{ width: 220, height: 220, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 80 }}>🎉</Text></View>
        )}
        <Text style={[styles.doneTitle, { color: C.white }]}>Concluído!</Text>
        <View style={styles.ratingsRow}>
          <View style={[styles.ratingChip, { backgroundColor: '#F44336' }]}> 
            <Text style={[styles.ratingChipText, { color: C.white }]}>Difícil: {ratings.hard}</Text>
          </View>
          <View style={[styles.ratingChip, { backgroundColor: '#4CAF50' }]}> 
            <Text style={[styles.ratingChipText, { color: C.white }]}>Bom: {ratings.good}</Text>
          </View>
          <View style={[styles.ratingChip, { backgroundColor: C.blue }]}> 
            <Text style={[styles.ratingChipText, { color: C.white }]}>Fácil: {ratings.easy}</Text>
          </View>
        </View>
        <Text style={{ color: C.gray, marginBottom: 24, fontSize: 16 }}>Meta diária: {cardsReviewedToday} / {dailyGoal}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <TouchableOpacity style={[styles.doneActionBtn, { backgroundColor: C.gray }]} onPress={onClose}>
            <Text style={[styles.backBtnText, { color: C.white }]}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.doneActionBtn, { backgroundColor: '#FF9800' }]} onPress={() => {
            setIndex(0); setRatings({ hard: 0, good: 0, easy: 0 }); setFlipped(false);
          }}>
            <Text style={[styles.backBtnText, { color: C.white }]}>Repetir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const card = cards[index];
  const progress = (index / cards.length) * 100;

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: C.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.hBtn}>
          <Text style={[styles.hIcon, { color: C.white }]}>✕</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 8 }}>
          <ProgressBar value={progress} color={C.blue} theme={theme} />
        </View>
        <Text style={[styles.progressText, { color: C.gray }]}>{index} / {cards.length}</Text>
      </View>

      <View style={{ alignItems: 'center', paddingBottom: 8 }}>
        <Text style={{ color: C.gray, fontSize: 12 }}>Treinados hoje: {cardsReviewedToday} / {dailyGoal}</Text>
        {isAllMode && <Text style={{ color: C.purple, fontSize: 12, fontWeight: 'bold' }}>{deck?.title}</Text>}
      </View>

      <TouchableOpacity style={[styles.reviewCard, { backgroundColor: C.reviewCard }]} onPress={() => setFlipped(f => !f)} activeOpacity={0.9}>
        <TouchableOpacity style={styles.favBtn} onPress={() => setFavorited(f => !f)}>
          <Text style={{ fontSize: 22, color: favorited ? '#FF6B6B' : C.favIcon }}>♡</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.audioBtn} onPress={() => {
          Speech.stop();
          const currentLang = flipped ? (deck?.backLanguage || 'en-US') : (deck?.frontLanguage || 'pt-BR');
          const textToSpeak = flipped ? card.back : card.front;
          const voiceOptions = { language: currentLang };
          if (preferredVoices && preferredVoices[currentLang]) voiceOptions.voice = preferredVoices[currentLang];
          Speech.speak(textToSpeak, voiceOptions);
        }}>
          <Text style={{ fontSize: 22 }}>🔊</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.changeVoiceBtn} onPress={changeVoice}>
          <Text style={{ fontSize: 20 }}>🗣️</Text>
        </TouchableOpacity>

        <View style={styles.cardContent}>
          <Text style={[
            flipped ? styles.cardBack : styles.cardFront, 
            { color: C.white },
            cardFontSize ? { fontSize: flipped ? Math.max(14, cardFontSize * 0.75) : cardFontSize } : {}
          ]}> 
            {flipped ? card.back : card.front}
          </Text>
        </View>

        <Text style={styles.cardHint}>{flipped ? 'toque para ver o verso' : 'toque para revelar'}</Text>
        <TouchableOpacity style={[styles.replayBtn, { backgroundColor: C.blue }]} onPress={() => setFlipped(false)}>
          <Text style={{ color: C.white, fontSize: 16 }}>↺</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.nextCardBtn, { backgroundColor: C.cardBtnBg }]}> 
          <Text style={{ color: C.white, fontSize: 16 }}>▶</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={styles.ratingRow}>
        <TouchableOpacity style={[styles.ratingBtn, { backgroundColor: '#F44336' }]} onPress={() => handleRate('hard')}>
          <Text style={[styles.ratingBtnText, { color: C.white }]}>Difícil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ratingBtn, { backgroundColor: '#4CAF50' }]} onPress={() => handleRate('good')}>
          <Text style={[styles.ratingBtnText, { color: C.white }]}>Bom</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ratingBtn, { backgroundColor: C.blue }]} onPress={() => handleRate('easy')}>
          <Text style={[styles.ratingBtnText, { color: C.white }]}>Fácil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const EnhancedReviewScreen = withObservables(['deck'], ({ deck }) => ({
  deck: deck.observe(),
  cards: deck.cards.observe(),
}))(ReviewScreenComponent);

export default function ReviewScreen() {
  const route = useRoute();
  const { deckId, reviewAll, practiceAll, studyMode } = route.params || {};
  const [deck, setDeck] = useState(null);
  const [multiCards, setMultiCards] = useState(null);

  useEffect(() => {
    if (deckId) {
      const subscription = database.get('decks').findAndObserve(deckId).subscribe(setDeck);
      return () => subscription.unsubscribe();
    } else if (reviewAll || practiceAll) {
      // Lógica simplificada de fetch manual
      const fetchMulti = async () => {
        try {
          const allDecks = await database.get('decks').query().fetch();
          let cardsToReview = [];
          const now = Date.now();

          if (reviewAll) {
             // Exemplo simplificado para pegar os 'hard'
             const allCards = await database.get('cards').query().fetch();
             cardsToReview = allCards.filter(c => c.difficultyStatus === 'hard' || (c.nextReviewAt || 0) <= now).slice(0, 100);
          } else if (practiceAll) {
             const allCards = await database.get('cards').query().fetch();
             cardsToReview = allCards.filter(c => (c.nextReviewAt || 0) <= now).sort((a,b) => (a.nextReviewAt||0) - (b.nextReviewAt||0)).slice(0, 50);
          }
          setMultiCards(cardsToReview);
        } catch (e) {
          console.error(e);
          setMultiCards([]);
        }
      };
      fetchMulti();
    }
  }, [deckId, reviewAll, practiceAll]);

  if (reviewAll || practiceAll) {
    if (!multiCards) return <View style={{ flex: 1, backgroundColor: '#000' }} />;
    return <ReviewScreenComponent deck={{ title: reviewAll ? 'Revisar Tudo' : 'Praticar Tudo' }} cards={multiCards} isAllMode={true} />;
  }

  if (!deck) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  return <EnhancedReviewScreen deck={deck} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  doneScreen: { justifyContent: 'center', alignItems: 'center' },
  doneTitle: { fontSize: 28, fontWeight: 'bold', marginTop: 16, marginBottom: 24 },
  ratingsRow: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  ratingChip: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  ratingChipText: { fontWeight: 'bold' },
  backBtn: { borderRadius: 30, paddingHorizontal: 40, paddingVertical: 14 },
  backBtnText: { fontWeight: 'bold', fontSize: 16 },
  doneActionBtn: { borderRadius: 30, paddingHorizontal: 20, paddingVertical: 14, minWidth: 110, alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8 },
  hBtn: { padding: 8 },
  hIcon: { fontSize: 40 },
  progressText: { fontSize: 12, paddingHorizontal: 8 },
  reviewCard: { flex: 1, borderRadius: 16, margin: 16 },
  cardContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  cardFront: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  cardBack: { fontSize: 18, textAlign: 'center' },
  cardHint: { color: '#ffffff44', textAlign: 'center', paddingBottom: 60, fontSize: 12 },
  favBtn: { position: 'absolute', top: 14, left: 14, zIndex: 1 },
  audioBtn: { position: 'absolute', top: 14, right: 14, zIndex: 1 },
  changeVoiceBtn: { position: 'absolute', top: 56, right: 14, zIndex: 1 },
  replayBtn: { position: 'absolute', bottom: 14, right: 56, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  nextCardBtn: { position: 'absolute', bottom: 14, right: 14, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  ratingRow: { flexDirection: 'row', padding: 16, gap: 8 },
  ratingBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  ratingBtnText: { fontWeight: 'bold', fontSize: 14 },
});
