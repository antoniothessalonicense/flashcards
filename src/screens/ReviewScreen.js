import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq, lte, or, asc, inArray } from 'drizzle-orm';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar, FormattedText } from '../components/Shared';
const { playMixedTTS } = require('../utils/tts');
import LottieView from 'lottie-react-native';
import { AppContext } from '../context/AppContext';
import db from '../../db';
import { sets, cards } from '../../db/schema';
import { updateCardDifficulty, toggleCardImportant, updateCard } from '../../dbServices.drizzle';

// playMixedTTS agora centralizado em src/utils/tts.js

// Componente de revisão de flashcards
export function ReviewScreenComponent({ deck, cards = [], isAllMode = false }) {
  const { 
    theme, isDark, styles: globalStyles,
    cardsReviewedToday, dailyGoal, 
    autoPlayAudio, cardFontSize, 
    preferredVoices, handleSetPreferredVoice,
    incrementDailyReview,
    showStopwatch,
    defaultIconSize,
    defaultIconOffset
  } = useContext(AppContext);
  
  // ── Lendo o Estado Global (Zustand) ──
  const cicloConfig = require('../store/useCicloConfigStore').useCicloConfigStore();
  
  // Se o limite estiver ativo, usamos o do Ciclo. Se não, mantemos o fallback do AppContext ou infinito
  const effectiveDailyGoal = cicloConfig.limiteAtivo 
    ? cicloConfig.limiteDiarioTotal 
    : dailyGoal;

  const C = theme;
  const ratingTextColor = isDark ? C.bg : C.appBarText;
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
  const [localCards, setLocalCards] = useState(cards);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [focusedField, setFocusedField] = useState('front');
  const [selectionFront, setSelectionFront] = useState({ start: 0, end: 0 });
  const [selectionBack, setSelectionBack] = useState({ start: 0, end: 0 });

  useEffect(() => {
    let interval = null;
    if (localCards.length > 0 && index < localCards.length) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else if (index >= localCards.length) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [index, localCards.length]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    const h = Math.floor(totalSeconds / 3600);
    if (h > 0) {
      return `${h}:${m}:${s}`;
    }
    return `${m}:${s}`;
  };

  // Mapa de aliases para nomes de ícone inválidos no Ionicons
  const ICON_ALIASES = {
    'house': 'home',
    'house-outline': 'home-outline',
    'gear': 'settings',
    'gear-outline': 'settings-outline',
    'check': 'checkmark',
    'clock': 'time',
    'clock-outline': 'time-outline',
  };

  const extractTopVisual = (text) => {
    if (!text) return { iconName: 'brain', emoji: null, size: defaultIconSize, offset: defaultIconOffset, trimmedText: text };
    const iconRegex = /<icone(?:\s+size=(\d+))?\s*>([\s\S]*?)<\/icone>/i;
    const match = iconRegex.exec(text);
    if (match) {
      const size = match[1]
        ? Math.min(Math.max(parseInt(match[1], 10), 24), 120)
        : defaultIconSize;
      const rawIcon = match[2].trim() || 'help-circle';
      const iconName = ICON_ALIASES[rawIcon] || rawIcon;
      const trimmedText = text.replace(match[0], '').trim();
      return { iconName, emoji: null, size, offset: defaultIconOffset, trimmedText };
    }

    try {
      // Extrair Emojis da string (incluindo bandeiras)
      const emojiRegex = /(\p{Extended_Pictographic}|\p{Regional_Indicator}{2})/gu;
      const emojis = text.match(emojiRegex);
      if (emojis && emojis.length > 0) {
        const emojiStr = emojis.join('');
        const trimmedText = text.replace(emojiRegex, '').trim();
        // Aumentamos levemente o tamanho do emoji no lugar do icone
        return { iconName: null, emoji: emojiStr, size: Math.max(defaultIconSize, 64), offset: defaultIconOffset, trimmedText };
      }
    } catch (e) {
      // Ignorar erros caso a regex não seja suportada
    }

    return { iconName: null, emoji: null, size: defaultIconSize, offset: defaultIconOffset, trimmedText: text };
  };

  const onClose = () => navigation.goBack();
  const onRateCard = async (cardId, difficulty) => {
    try { await updateCardDifficulty(cardId, difficulty); } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (localCards.length > 0 && index >= localCards.length && !lottieAnim) {
      // Changed to a valid public Lottie JSON URL since the previous one returned HTML
      fetch('https://assets2.lottiefiles.com/packages/lf20_touohxv0.json')
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then(data => setLottieAnim(data))
        .catch(err => console.log("Erro ao baixar animação Lottie", err));
    }
  }, [index, localCards.length, lottieAnim]);

  useEffect(() => {
    Speech.getAvailableVoicesAsync()
      .then(setAvailableVoices)
      .catch(() => console.log('TTS não disponível neste dispositivo'));
  }, []);

  useEffect(() => {
    if (autoPlayAudio && localCards[index]) {
      Speech.stop();
      const currentCard = localCards[index];
      const currentLang = flipped
        ? (currentCard?.backLanguage || deck?.backLanguage || 'en-US')
        : (currentCard?.frontLanguage || deck?.frontLanguage || 'pt-BR');
      const textToSpeak = flipped ? currentCard.back : currentCard.front;
      playMixedTTS(textToSpeak, { defaultLang: currentLang, preferredVoices });
    }
  }, [index, flipped, autoPlayAudio, localCards, deck, preferredVoices]);

  const changeVoice = () => {
    const currentCard = localCards[index];
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
    playMixedTTS(textToSpeak, { defaultLang: currentLang, voice: nextVoice.identifier, preferredVoices });
  };

  // Sincroniza o estado do coração ao trocar de card
  useEffect(() => {
    if (localCards[index]) {
      setFavorited(localCards[index].isImportant === 1);
    }
  }, [index, localCards]);

  const handleToggleFavorite = async () => {
    const currentCard = localCards[index];
    if (!currentCard) return;
    const newVal = await toggleCardImportant(currentCard.id);
    setFavorited(newVal === 1);
  };

  const handleRate = (type) => {
    const currentCard = localCards[index];
    if (currentCard) onRateCard(currentCard.id, type);
    setRatings(prev => ({ ...prev, [type]: prev[type] + 1 }));
    incrementDailyReview();
    setIndex(i => i + 1);
    setFlipped(false);
  };

  const openEditModal = () => {
    const currentCard = localCards[index];
    if (!currentCard) return;
    setEditFront(currentCard.front || '');
    setEditBack(currentCard.back || '');
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    const currentCard = localCards[index];
    if (!currentCard) return;
    try {
      await updateCard(currentCard.id, editFront, editBack);
      setLocalCards(prev => prev.map(c => c.id === currentCard.id ? { ...c, front: editFront, back: editBack } : c));
      setEditModalVisible(false);
    } catch (e) {
      console.error('Erro ao salvar card:', e);
      Alert.alert('Erro', 'Não foi possível salvar o cartão.');
    }
  };

  // Aux: calcula posições de cada palavra mantendo espaços/pontuação
  const getWordPositions = (txt) => {
    const words = [];
    if (!txt) return words;
    const re = /\S+/g; // sequências não-branco
    let m;
    while ((m = re.exec(txt)) !== null) {
      words.push({ word: m[0], start: m.index, end: m.index + m[0].length });
    }
    return words;
  };

  const wrapSelectionWithTag = (field, tagName) => {
    const isFront = field === 'front';
    const txt = isFront ? editFront : editBack;
    const sel = isFront ? selectionFront : selectionBack;
    if (!txt) return;
    if (sel.start === sel.end) {
      Alert.alert('Seleção vazia', 'Selecione uma palavra tocando no preview ou selecionando no campo.');
      return;
    }
    const before = txt.slice(0, sel.start);
    const middle = txt.slice(sel.start, sel.end);
    const after = txt.slice(sel.end);
    const wrapped = `${before}<${tagName}>${middle}</${tagName}>${after}`;
    if (isFront) setEditFront(wrapped); else setEditBack(wrapped);
    // limpar seleção
    if (isFront) setSelectionFront({ start: sel.start, end: sel.start + tagName.length * 2 + 5 + middle.length });
    else setSelectionBack({ start: sel.start, end: sel.start + tagName.length * 2 + 5 + middle.length });
  };

  const insertTagAtCursor = (field, tagName) => {
    const isFront = field === 'front';
    const txt = isFront ? editFront : editBack;
    const sel = isFront ? selectionFront : selectionBack;
    const start = sel.start ?? txt.length;
    const end = sel.end ?? txt.length;
    const before = txt.slice(0, start);
    const after = txt.slice(end);
    const wrapped = `${before}<${tagName}></${tagName}>${after}`;
    if (isFront) setEditFront(wrapped); else setEditBack(wrapped);
    // move cursor inside the new empty tag
    const newPos = start + tagName.length + 2;
    if (isFront) setSelectionFront({ start: newPos, end: newPos }); else setSelectionBack({ start: newPos, end: newPos });
  };

  if (localCards.length === 0) {
    return (
      <View style={[styles.screen, styles.doneScreen, { paddingTop: insets.top, backgroundColor: C.bg }]}> 
        <Text style={[styles.doneTitle, { color: C.white }]}>Baralho Vazio!</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: C.blue }]} onPress={onClose}>
          <Text style={[styles.backBtnText, { color: C.white }]}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (index >= localCards.length) {
    return (
      <View style={[styles.screen, styles.doneScreen, { paddingTop: insets.top, backgroundColor: C.bg }]}> 
        {lottieAnim ? (
          <LottieView autoPlay loop={true} style={{ width: 220, height: 220 }} source={lottieAnim} />
        ) : (
          <View style={{ width: 220, height: 220, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 80 }}>🎉</Text></View>
        )}
        <Text style={[styles.doneTitle, { color: C.white }]}>Concluído!</Text>
        <View style={styles.ratingsRow}>
          <View style={[styles.ratingChip, { backgroundColor: C.warning }]}>
            <Text style={[styles.ratingChipText, { color: ratingTextColor }]}>Difícil: {ratings.hard}</Text>
          </View>
          <View style={[styles.ratingChip, { backgroundColor: C.success }]}>
            <Text style={[styles.ratingChipText, { color: ratingTextColor }]}>Bom: {ratings.good}</Text>
          </View>
          <View style={[styles.ratingChip, { backgroundColor: C.blue }]}> 
            <Text style={[styles.ratingChipText, { color: ratingTextColor }]}>Fácil: {ratings.easy}</Text>
          </View>
        </View>
        <Text style={{ color: C.gray, marginBottom: 24, fontSize: 16 }}>Meta diária: {cardsReviewedToday} / {effectiveDailyGoal}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <TouchableOpacity style={[styles.doneActionBtn, { backgroundColor: C.border }]} onPress={onClose}>
            <Text style={[styles.backBtnText, { color: C.textPrimary }]}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.doneActionBtn, { backgroundColor: C.accent }]} onPress={() => {
            setIndex(0); setRatings({ hard: 0, good: 0, easy: 0 }); setFlipped(false); setElapsedSeconds(0);
          }}>
            <Text style={[styles.backBtnText, { color: ratingTextColor }]}>Repetir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const card = localCards[index];
  const progress = ((index + 1) / Math.max(1, localCards.length)) * 100;

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: C.bg }]}>
      <View style={[styles.header, { minHeight: 68, backgroundColor: C.appBar }]}>
        <TouchableOpacity onPress={onClose} style={styles.hBtn} accessibilityLabel="Fechar revisão">
          <Ionicons name="close" size={22} color={C.appBarText} />
        </TouchableOpacity>
        <View style={styles.progressBlock}>
          <View style={styles.progressLabels}>
            <Text numberOfLines={1} style={[styles.progressCaption, { color: C.appBarText }]}>{isAllMode ? deck?.title : 'Revisão'}</Text>
            <Text style={[styles.progressText, { color: C.appBarText }]}>{index + 1} / {localCards.length}</Text>
          </View>
          <ProgressBar value={progress} color={C.accent} theme={theme} />
        </View>
        {showStopwatch && (
          <View style={[styles.timerBadge, { backgroundColor: C.cardBtnBg }]}>
            <Ionicons name="time-outline" size={15} color={C.appBarText} />
            <Text style={{ color: C.appBarText, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{formatTime(elapsedSeconds)}</Text>
          </View>
        )}
      </View>

      <View style={[styles.dailyProgress, { borderBottomColor: C.border }]}>
        <Ionicons name="calendar-clear-outline" size={16} color={C.textSecondary} />
        <Text style={[styles.dailyProgressText, { color: C.textSecondary }]}>Meta diária</Text>
        <Text style={[styles.dailyProgressCount, { color: C.textPrimary }]}>{cardsReviewedToday} / {effectiveDailyGoal}</Text>
      </View>

      <TouchableOpacity style={[styles.reviewCard, { backgroundColor: C.surface, borderColor: C.border }]} onPress={() => setFlipped(f => !f)} activeOpacity={0.9}>
        <View style={styles.cardToolbar}>
          <TouchableOpacity style={[styles.cardToolButton, { backgroundColor: C.cardBtnBg }]} onPress={handleToggleFavorite} accessibilityLabel={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
            <Ionicons name={favorited ? 'heart' : 'heart-outline'} size={21} color={favorited ? C.danger : C.textSecondary} />
          </TouchableOpacity>
          <View style={styles.cardToolGroup}>
            <TouchableOpacity style={[styles.cardToolButton, { backgroundColor: C.cardBtnBg }]} onPress={() => {
          Speech.stop();
          const currentLang = flipped
            ? (card?.backLanguage || deck?.backLanguage || 'en-US')
            : (card?.frontLanguage || deck?.frontLanguage || 'pt-BR');
          const textToSpeak = flipped ? card.back : card.front;
          playMixedTTS(textToSpeak, { defaultLang: currentLang, preferredVoices });
            }} accessibilityLabel="Reproduzir áudio">
              <Ionicons name="volume-high-outline" size={20} color={C.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cardToolButton, { backgroundColor: C.cardBtnBg }]} onPress={changeVoice} accessibilityLabel="Alterar voz">
              <Ionicons name="mic-outline" size={19} color={C.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cardToolButton, { backgroundColor: C.cardBtnBg }]} onPress={openEditModal} accessibilityLabel="Editar cartão">
              <Ionicons name="create-outline" size={19} color={C.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardContent}>
          {(() => {
            const { iconName, emoji, size, offset, trimmedText } = extractTopVisual(flipped ? card.back : card.front);
            return (
              <>
                {iconName ? (
                  <View style={[styles.cardVisualBlock, { marginTop: offset }] }>
                    <Ionicons name={iconName} size={size} color={C.white} />
                  </View>
                ) : emoji ? (
                  <View style={[styles.cardVisualBlock, { marginTop: offset }] }>
                    <Text style={{ fontSize: size, textAlign: 'center' }}>{emoji}</Text>
                  </View>
                ) : null}
                <View style={styles.cardTextWrapper}>
                  <FormattedText 
                    style={[
                      flipped ? styles.cardBack : styles.cardFront, 
                      { color: C.white },
                      cardFontSize ? { fontSize: flipped ? Math.max(14, cardFontSize * 0.75) : cardFontSize } : {}
                    ]} 
                    text={trimmedText || (flipped ? card.back : card.front)}
                  />
                </View>
              </>
            );
          })()}
        </View>

        <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
          <View style={{ flex: 1, justifyContent: 'center', backgroundColor: C.overlay, padding: 20 }}>
            <View style={{ backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderRadius: 14, padding: 16 }}>
              <Text style={{ color: C.white, fontWeight: 'bold', marginBottom: 8 }}>Editar Cartão</Text>
              <Text style={{ color: C.gray, marginBottom: 4 }}>Frente</Text>
              {/* Preview touchable por palavra */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                {getWordPositions(editFront).map((w, i) => {
                  const selected = focusedField === 'front' && selectionFront.start === w.start && selectionFront.end === w.end;
                  return (
                    <TouchableOpacity key={`pf-${i}`} onPress={() => { setFocusedField('front'); setSelectionFront({ start: w.start, end: w.end }); }}>
                      <Text style={{ color: selected ? C.accent : C.textPrimary, backgroundColor: selected ? C.accentSoft : 'transparent', paddingHorizontal: 4 }}>{w.word}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                value={editFront}
                onChangeText={setEditFront}
                multiline
                onFocus={() => setFocusedField('front')}
                selection={selectionFront}
                onSelectionChange={(e) => setSelectionFront(e.nativeEvent.selection)}
                style={{ minHeight: 60, backgroundColor: C.bg, color: C.textPrimary, borderColor: C.border, borderWidth: 1, padding: 8, borderRadius: 8 }}
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity onPress={() => {
                    if (focusedField === 'front' && selectionFront.start !== selectionFront.end) wrapSelectionWithTag('front', 'en');
                    else insertTagAtCursor('front', 'en');
                  }} style={{ padding: 8, backgroundColor: C.cardBtnBg, borderRadius: 6 }}>
                  <Text style={{ color: C.white }}>+ &lt;en&gt;</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                    if (focusedField === 'front' && selectionFront.start !== selectionFront.end) wrapSelectionWithTag('front', 'mudo');
                    else insertTagAtCursor('front', 'mudo');
                  }} style={{ padding: 8, backgroundColor: C.cardBtnBg, borderRadius: 6 }}>
                  <Text style={{ color: C.white }}>+ &lt;mudo&gt;</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ color: C.gray, marginTop: 12, marginBottom: 4 }}>Verso</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                {getWordPositions(editBack).map((w, i) => {
                  const selected = focusedField === 'back' && selectionBack.start === w.start && selectionBack.end === w.end;
                  return (
                    <TouchableOpacity key={`pb-${i}`} onPress={() => { setFocusedField('back'); setSelectionBack({ start: w.start, end: w.end }); }}>
                      <Text style={{ color: selected ? C.accent : C.textPrimary, backgroundColor: selected ? C.accentSoft : 'transparent', paddingHorizontal: 4 }}>{w.word}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                value={editBack}
                onChangeText={setEditBack}
                multiline
                onFocus={() => setFocusedField('back')}
                selection={selectionBack}
                onSelectionChange={(e) => setSelectionBack(e.nativeEvent.selection)}
                style={{ minHeight: 60, backgroundColor: C.bg, color: C.textPrimary, borderColor: C.border, borderWidth: 1, padding: 8, borderRadius: 8 }}
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity onPress={() => {
                    if (focusedField === 'back' && selectionBack.start !== selectionBack.end) wrapSelectionWithTag('back', 'en');
                    else insertTagAtCursor('back', 'en');
                  }} style={{ padding: 8, backgroundColor: C.cardBtnBg, borderRadius: 6 }}>
                  <Text style={{ color: C.white }}>+ &lt;en&gt;</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                    if (focusedField === 'back' && selectionBack.start !== selectionBack.end) wrapSelectionWithTag('back', 'mudo');
                    else insertTagAtCursor('back', 'mudo');
                  }} style={{ padding: 8, backgroundColor: C.cardBtnBg, borderRadius: 6 }}>
                  <Text style={{ color: C.white }}>+ &lt;mudo&gt;</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <TouchableOpacity onPress={() => setEditModalVisible(false)} style={{ padding: 10 }}>
                  <Text style={{ color: C.gray }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveEdit} style={{ minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: C.accent, borderRadius: 8 }}>
                  <Text style={{ color: C.white }}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Text style={[styles.cardHint, { color: C.textSecondary }]}>{flipped ? 'Toque no cartão para voltar à pergunta' : 'Toque no cartão para revelar a resposta'}</Text>
        <TouchableOpacity style={[styles.replayBtn, { backgroundColor: C.cardBtnBg }]} onPress={() => setFlipped(false)} accessibilityLabel="Voltar à pergunta">
          <Ionicons name="refresh-outline" size={19} color={C.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.nextCardBtn, { backgroundColor: C.cardBtnBg }]}>
          <Ionicons name="play" size={17} color={C.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={[styles.ratingRow, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={[styles.ratingBtn, { backgroundColor: C.warning, minHeight: 48 }]} onPress={() => handleRate('hard')}>
          <Ionicons name="alert-circle-outline" size={17} color={ratingTextColor} />
          <Text style={[styles.ratingBtnText, { color: ratingTextColor }]}>Difícil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ratingBtn, { backgroundColor: C.success, minHeight: 48 }]} onPress={() => handleRate('good')}>
          <Ionicons name="checkmark-circle-outline" size={17} color={ratingTextColor} />
          <Text style={[styles.ratingBtnText, { color: ratingTextColor }]}>Bom</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ratingBtn, { backgroundColor: C.accent, minHeight: 48 }]} onPress={() => handleRate('easy')}>
          <Ionicons name="flash-outline" size={17} color={ratingTextColor} />
          <Text style={[styles.ratingBtnText, { color: ratingTextColor }]}>Fácil</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

export default function ReviewScreen() {
  const { theme } = useContext(AppContext);
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
          let query = db.select({
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
          }).from(cards).innerJoin(sets, eq(cards.set_id, sets.id));

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
    if (!multiCards) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
    return <ReviewScreenComponent deck={{ title: 'Ciclo de Estudo' }} cards={multiCards} isAllMode={true} />;
  }

  if (reviewAll || practiceAll) {
    if (!multiCards) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
    return <ReviewScreenComponent deck={{ title: reviewAll ? 'Revisar Tudo' : 'Praticar Tudo' }} cards={multiCards} isAllMode={true} />;
  }

  if (!deck) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  return <ReviewScreenComponent deck={deck} cards={deckCards} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  doneScreen: { justifyContent: 'center', alignItems: 'center' },
  doneTitle: { fontSize: 28, fontWeight: 'bold', marginTop: 16, marginBottom: 24 },
  ratingsRow: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  ratingChip: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  ratingChipText: { fontWeight: 'bold' },
  backBtn: { borderRadius: 12, paddingHorizontal: 40, paddingVertical: 14, minHeight: 44 },
  backBtnText: { fontWeight: 'bold', fontSize: 16 },
  doneActionBtn: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 14, minWidth: 110, minHeight: 44, alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  hBtn: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  progressBlock: { flex: 1, justifyContent: 'center', gap: 7 },
  progressLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  progressCaption: { flex: 1, fontSize: 12, fontWeight: '600' },
  progressText: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 10 },
  dailyProgress: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  dailyProgressText: { fontSize: 12, fontWeight: '500' },
  dailyProgressCount: { marginLeft: 'auto', fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  reviewCard: { flex: 1, borderWidth: 1, borderRadius: 20, marginHorizontal: 16, marginTop: 14, marginBottom: 8, overflow: 'hidden' },
  cardToolbar: { position: 'absolute', top: 12, left: 12, right: 12, zIndex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardToolGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardToolButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, paddingTop: 54, paddingBottom: 12 },
  cardVisualBlock: { marginBottom: 12, alignItems: 'center', justifyContent: 'center' },
  cardTextWrapper: { width: '100%', flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  cardSideLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  cardFront: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  cardBack: { fontSize: 18, textAlign: 'center' },
  cardHint: { textAlign: 'center', paddingBottom: 58, fontSize: 12 },
  replayBtn: { position: 'absolute', bottom: 12, right: 62, width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  nextCardBtn: { position: 'absolute', bottom: 12, right: 12, width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  ratingRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 10 },
  ratingBtn: { flex: 1, minHeight: 50, borderRadius: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  ratingBtnText: { fontWeight: '700', fontSize: 14 },
});
