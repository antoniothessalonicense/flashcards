import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import db from '../../db';
import { getTheme, getStyles } from '../theme/theme';
import { seedInitialData } from '../../dbServices.drizzle';
import { sets, cards } from '../../db/schema';
import { eq, asc } from 'drizzle-orm';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [themeName, setThemeName] = useState('dark');
  const isDark = ['dark', 'neon_vibrant', 'earth_tones'].includes(themeName);

  const setAppTheme = async (name) => {
    setThemeName(name);
    await AsyncStorage.setItem('appTheme', name);
  };

  const setIsDark = (val) => {
    setAppTheme(val ? 'dark' : 'light');
  };

  const theme = getTheme(themeName);
  const styles = getStyles(theme);

  const [cardsReviewedToday, setCardsReviewedToday] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(50);
  const [targetReviewDecks, setTargetReviewDecks] = useState([]);
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const [cardFontSize, setCardFontSize] = useState(24);
  const [preferredVoices, setPreferredVoices] = useState({});
  const [showStopwatch, setShowStopwatchState] = useState(true);
  const [defaultIconSize, setDefaultIconSize] = useState(80);
  const [defaultIconOffset, setDefaultIconOffset] = useState(0);

  const calculateTargetDecks = async () => {
    try {
      const hardCards = await db.select().from(cards).where(eq(cards.difficultyStatus, 'hard')).all();
      const hardDeckIds = new Set((hardCards || []).map(row => row.set_id));

      const allDecks = await db.select().from(sets).all();
      const getDeckNum = (title) => {
        const match = (title || '').match(/\d+/);
        return match ? parseInt(match[0], 10) : 999999;
      };
      const sortedDecks = (allDecks || []).slice().sort((a, b) => getDeckNum(a.title) - getDeckNum(b.title));

      let primaryId = null;
      let secondaryId = null;
      const primaryIndex = sortedDecks.findIndex(deck => hardDeckIds.has(deck.id));

      if (primaryIndex !== -1) {
        primaryId = sortedDecks[primaryIndex]?.id;
        secondaryId = sortedDecks[primaryIndex + 1]?.id;
      } else {
        primaryId = sortedDecks[0]?.id || null;
        secondaryId = sortedDecks[1]?.id || null;
      }

      setTargetReviewDecks([primaryId, secondaryId].filter(Boolean));
    } catch (e) {
      console.error("Erro ao calcular decks alvo:", e);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      await seedInitialData();
      await calculateTargetDecks();
    };

    initializeApp().catch(console.error);

    const loadDailyProgress = async () => {
      try {
        const today = new Date().toDateString();
        const savedDate = await AsyncStorage.getItem('lastReviewDate');
        const savedGoal = await AsyncStorage.getItem('dailyGoal');
        const savedAutoPlay = await AsyncStorage.getItem('autoPlayAudio');
        const savedFontSize = await AsyncStorage.getItem('cardFontSize');
        const savedVoices = await AsyncStorage.getItem('preferredVoices');
        const savedStopwatch = await AsyncStorage.getItem('showStopwatch');
        const savedTheme = await AsyncStorage.getItem('appTheme');
        
        if (savedTheme) setThemeName(savedTheme);
        if (savedAutoPlay !== null) setAutoPlayAudio(savedAutoPlay === 'true');
        if (savedGoal) setDailyGoal(parseInt(savedGoal, 10));
        if (savedFontSize) setCardFontSize(parseInt(savedFontSize, 10));

        if (savedDate === today) {
          const savedCount = await AsyncStorage.getItem('cardsReviewedToday');
          if (savedCount) setCardsReviewedToday(parseInt(savedCount, 10));
        } else {
          await AsyncStorage.setItem('lastReviewDate', today);
          await AsyncStorage.setItem('cardsReviewedToday', '0');
          setCardsReviewedToday(0);
        }
        
        if (savedVoices) {
          setPreferredVoices(JSON.parse(savedVoices));
        }
        if (savedStopwatch !== null) {
          setShowStopwatchState(savedStopwatch === 'true');
        }
        const savedIconSize = await AsyncStorage.getItem('defaultIconSize');
        if (savedIconSize) setDefaultIconSize(parseInt(savedIconSize, 10));
        const savedIconOffset = await AsyncStorage.getItem('defaultIconOffset');
        if (savedIconOffset) setDefaultIconOffset(parseInt(savedIconOffset, 10));
      } catch (e) {
        console.log("Erro ao carregar progresso:", e);
      }
    };
    
    loadDailyProgress();
  }, []);

  const incrementDailyReview = async () => {
    const newCount = cardsReviewedToday + 1;
    setCardsReviewedToday(newCount);
    try {
      await AsyncStorage.setItem('cardsReviewedToday', newCount.toString());
    } catch (e) {}
  };

  const handleSetPreferredVoice = async (lang, voiceId) => {
    const newPrefs = { ...preferredVoices, [lang]: voiceId };
    setPreferredVoices(newPrefs);
    await AsyncStorage.setItem('preferredVoices', JSON.stringify(newPrefs));
  };

  const handleSetDefaultIconSize = async (size) => {
    setDefaultIconSize(size);
    await AsyncStorage.setItem('defaultIconSize', size.toString());
  };

  const handleSetDefaultIconOffset = async (offset) => {
    setDefaultIconOffset(offset);
    await AsyncStorage.setItem('defaultIconOffset', offset.toString());
  };

  const updateSettings = async (newGoal, newFontSize, newAutoPlay) => {
    if (newGoal > 0) {
      setDailyGoal(newGoal);
      await AsyncStorage.setItem('dailyGoal', newGoal.toString());
    }
    if (newFontSize > 10) {
      setCardFontSize(newFontSize);
      await AsyncStorage.setItem('cardFontSize', newFontSize.toString());
    }
    setAutoPlayAudio(newAutoPlay);
    await AsyncStorage.setItem('autoPlayAudio', newAutoPlay.toString());
  };

  const handleSetAutoPlayAudio = async (value) => {
    setAutoPlayAudio(value);
    await AsyncStorage.setItem('autoPlayAudio', value.toString());
  };

  const setShowStopwatch = async (value) => {
    setShowStopwatchState(value);
    await AsyncStorage.setItem('showStopwatch', value.toString());
  };

  return (
    <AppContext.Provider value={{
      user, setUser,
      isDark, setIsDark,
      themeName, setAppTheme,
      theme, styles,
      cardsReviewedToday, incrementDailyReview,
      dailyGoal, updateSettings,
      targetReviewDecks, calculateTargetDecks,
      autoPlayAudio, setAutoPlayAudio, handleSetAutoPlayAudio,
      cardFontSize, setCardFontSize,
      preferredVoices, handleSetPreferredVoice,
      showStopwatch, setShowStopwatch,
      defaultIconSize, handleSetDefaultIconSize,
      defaultIconOffset, handleSetDefaultIconOffset
    }}>
      {children}
    </AppContext.Provider>
  );
};
