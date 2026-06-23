import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq, lte, or, asc, inArray } from 'drizzle-orm';
import { ProgressBar } from '../components/Shared';
import LottieView from 'lottie-react-native';
import { AppContext } from '../context/AppContext';
import db from '../../db';
import { sets, cards } from '../../db/schema';
import { updateCardDifficulty, toggleCardImportant } from '../../dbServices.drizzle';

const formatTextForDisplay = (text) => {
  if (!text) return '';
  return text.replace(/<\/?en>/ig, '').replace(/<\/?mudo>/ig, '');
};

const playMixedTTS = (text, baseLang, preferredVoices, overrideVoice = null) => {
  if (!text) return;
  const parts = text.split(/(<en>.*?<\/en>|<mudo>.*?<\/mudo>)/ig);
  for (const p of parts) {
    if (!p) continue;
    // Tag <mudo>: conteúdo é completamente ignorado pelo TTS
    if (p.toLowerCase().startsWith('<mudo>') && p.toLowerCase().endsWith('</mudo>')) {
      continue;
    }
    if (p.toLowerCase().startsWith('<en>') && p.toLowerCase().endsWith('</en>')) {
      const enText = p.replace(/<\/?en>/ig, '').trim();
      if (enText) {
        const enOpts = { language: 'en-US' };
        if (preferredVoices?.['en-US']) enOpts.voice = preferredVoices['en-US'];
        Speech.speak(enText, enOpts);
      }
    } else {
      const ptText = p.trim();
      if (ptText) {
        const baseOpts = { language: baseLang };
        if (overrideVoice) baseOpts.voice = overrideVoice;
        else if (preferredVoices?.[baseLang]) baseOpts.voice = preferredVoices[baseLang];
        Speech.speak(ptText, baseOpts);
      }
    }
  }
};

// Componente de revisão de flashcards
export function ReviewScreenComponent({ deck, cards = [], isAllMode = false }) {
  const { 
    theme, styles: globalStyles, 
    cardsReviewedToday, dailyGoal, 
    autoPlayAudio, cardFontSize, 
    preferredVoices, handleSetPreferredVoice,
    incrementDailyReview,
    showStopwatch
  } = useContext(AppContext);
  
  // ── Lendo o Estado Global (Zustand) ──
  const cicloConfig = require('../store/useCicloConfigStore').useCicloConfigStore();
  
  // Se o limite estiver ativo, usamos o do Ciclo. Se não, mantemos o fallback do AppContext ou infinito
  const effectiveDailyGoal = cicloConfig.limiteAtivo 
    ? cicloConfig.limiteDiarioTotal 
    : dailyGoal;

  const C = theme;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState({ hard: 0, good: 0, easy: 0 });
  const [favorited, setFavorited] = useState(cards[0]?.isImportant === 1);
  const [lottieAnim, setLottieAnim] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval = null;
    if (cards.length > 0 && index < cards.length) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else if (index >= cards.length) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [index, cards.length]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    const h = Math.floor(totalSeconds / 3600);
    if (h > 0) {
      return `${h}:${m}:${s}`;
    }
    return `${m}:${s}`;
  };

  const onClose = () => navigation.goBack();
  const onRateCard = async (cardId, difficulty) => {
    try { await updateCardDifficulty(cardId, difficulty); } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (cards.length > 0 && index >= cards.length && !lottieAnim) {
      // Changed to a valid public Lottie JSON URL since the previous one returned HTML
      fetch('https://assets2.lottiefiles.com/packages/lf20_touohxv0.json')
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
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
      const currentCard = cards[index];
      const currentLang = flipped
        ? (currentCard?.backLanguage || deck?.backLanguage || 'en-US')
        : (currentCard?.frontLanguage || deck?.frontLanguage || 'pt-BR');
      const textToSpeak = flipped ? currentCard.back : currentCard.front;
      playMixedTTS(textToSpeak, currentLang, preferredVoices);
    }
  }, [index, flipped, autoPlayAudio, cards, deck, preferredVoices]);

  const changeVoice = () => {
    const currentCard = cards[index];
    const currentLang = flipped
      ? (currentCard?.backLanguage || deck?.backLanguage || 'en-US')
      : (currentCard?.frontLanguage || deck?.frontLanguage || 'pt-BR');
    const textToSpeak = flipped ? currentCard.back : currentCard.front;
    
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
    playMixedTTS(textToSpeak, currentLang, preferredVoices, nextVoice.identifier);
  };

  // Sincroniza o estado do coração ao trocar de card
  useEffect(() => {
    if (cards[index]) {
      setFavorited(cards[index].isImportant === 1);
    }
  }, [index, cards]);

  const handleToggleFavorite = async () => {
    const currentCard = cards[index];
    if (!currentCard) return;
    const newVal = await toggleCardImportant(currentCard.id);
    setFavorited(newVal === 1);
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
        <Text style={{ color: C.gray, marginBottom: 24, fontSize: 16 }}>Meta diária: {cardsReviewedToday} / {effectiveDailyGoal}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <TouchableOpacity style={[styles.doneActionBtn, { backgroundColor: C.gray }]} onPress={onClose}>
            <Text style={[styles.backBtnText, { color: C.white }]}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.doneActionBtn, { backgroundColor: '#FF9800' }]} onPress={() => {
            setIndex(0); setRatings({ hard: 0, good: 0, easy: 0 }); setFlipped(false); setElapsedSeconds(0);
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
        {showStopwatch && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, backgroundColor: C.cardBtnBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ fontSize: 12, marginRight: 4 }}>⏱️</Text>
            <Text style={{ color: C.white, fontSize: 14, fontWeight: 'bold' }}>{formatTime(elapsedSeconds)}</Text>
          </View>
        )}
      </View>

      <View style={{ alignItems: 'center', paddingBottom: 8 }}>
        <Text style={{ color: C.gray, fontSize: 12 }}>Treinados hoje: {cardsReviewedToday} / {effectiveDailyGoal}</Text>
        {isAllMode && <Text style={{ color: C.purple, fontSize: 12, fontWeight: 'bold' }}>{deck?.title}</Text>}
      </View>

      <TouchableOpacity style={[styles.reviewCard, { backgroundColor: C.reviewCard }]} onPress={() => setFlipped(f => !f)} activeOpacity={0.9}>
        <TouchableOpacity style={styles.favBtn} onPress={handleToggleFavorite}>
          <Text style={{ fontSize: 22, color: favorited ? '#FF6B6B' : C.favIcon }}>{favorited ? '♥' : '♡'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.audioBtn} onPress={() => {
          Speech.stop();
          const currentLang = flipped
            ? (card?.backLanguage || deck?.backLanguage || 'en-US')
            : (card?.frontLanguage || deck?.frontLanguage || 'pt-BR');
          const textToSpeak = flipped ? card.back : card.front;
          playMixedTTS(textToSpeak, currentLang, preferredVoices);
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
            {flipped ? formatTextForDisplay(card.back) : formatTextForDisplay(card.front)}
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

export default function ReviewScreen() {
  const route = useRoute();
  const { deckId, reviewAll, practiceAll, cycleCardIds } = route.params || {};

  const { data: deckData } = useLiveQuery(db.select().from(sets).where(eq(sets.id, deckId || '')));
  const { data: deckCardsData } = useLiveQuery(db.select().from(cards).where(eq(cards.set_id, deckId || '')));
  
  const deck = deckData?.[0];
  const deckCards = deckCardsData || [];

  const [multiCards, setMultiCards] = useState(null);

  useEffect(() => {
    if (cycleCardIds && cycleCardIds.length > 0) {
      const fetchCycleCards = async () => {
        try {
          const cycleCards = await db.select({
            id: cards.id,
            set_id: cards.set_id,
            front: cards.front,
            back: cards.back,
            next_review_date: cards.next_review_date,
            ease_factor: cards.ease_factor,
            difficultyStatus: cards.difficultyStatus,
            isImportant: cards.isImportant,
            tag: cards.tag,
            frontLanguage: sets.frontLanguage,
            backLanguage: sets.backLanguage,
          }).from(cards)
            .innerJoin(sets, eq(cards.set_id, sets.id))
            .where(inArray(cards.id, cycleCardIds))
            .all();
          // Mantém a ordem original dos IDs
          const orderMap = new Map(cycleCardIds.map((id, idx) => [id, idx]));
          cycleCards.sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0));
          setMultiCards(cycleCards);
        } catch (e) {
          console.error('Erro ao carregar cards do ciclo:', e);
          setMultiCards([]);
        }
      };
      fetchCycleCards();
    } else if (!deckId && (reviewAll || practiceAll)) {
      const fetchMulti = async () => {
        try {
          const now = Date.now();
          let query = db.select().from(cards);

          if (reviewAll) {
            query = query.where(or(eq(cards.difficultyStatus, 'hard'), lte(cards.next_review_date, now)));
          } else if (practiceAll) {
            query = query.where(lte(cards.next_review_date, now)).orderBy(asc(cards.next_review_date)).limit(50);
          }

          const allCards = await query.all();
          setMultiCards(allCards);
        } catch (e) {
          console.error(e);
          setMultiCards([]);
        }
      };
      fetchMulti();
    }
  }, [deckId, reviewAll, practiceAll, cycleCardIds]);

  if (cycleCardIds) {
    if (!multiCards) return <View style={{ flex: 1, backgroundColor: '#000' }} />;
    return <ReviewScreenComponent deck={{ title: 'Ciclo de Estudo' }} cards={multiCards} isAllMode={true} />;
  }

  if (reviewAll || practiceAll) {
    if (!multiCards) return <View style={{ flex: 1, backgroundColor: '#000' }} />;
    return <ReviewScreenComponent deck={{ title: reviewAll ? 'Revisar Tudo' : 'Praticar Tudo' }} cards={multiCards} isAllMode={true} />;
  }

  if (!deck) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  return <ReviewScreenComponent deck={deck} cards={deckCards} />;
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
