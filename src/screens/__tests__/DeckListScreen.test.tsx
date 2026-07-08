// src/screens/__tests__/DeckListScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AppContext } from '../../context/AppContext';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('expo', () => ({
  // Mock the expo package to avoid winter runtime initialization in tests
  installGlobals: () => {},
  registerRootComponent: () => {},
}));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: () => null,
}));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({ readAsStringAsync: jest.fn(), writeAsStringAsync: jest.fn() }));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn() }));
jest.mock('expo-clipboard', () => ({ getStringAsync: jest.fn(), setStringAsync: jest.fn() }));
jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));
jest.mock('expo-font', () => ({ loadAsync: jest.fn() }));
jest.mock('expo-modules-core', () => ({
  EventEmitter: jest.fn(),
  addListener: jest.fn(),
  removeAllListeners: jest.fn(),
  requireNativeModule: jest.fn(),
}));
jest.mock('drizzle-orm/expo-sqlite', () => ({
  __esModule: true,
  useLiveQuery: jest.fn().mockReturnValue({ data: [] }),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

// Mock the DB and processing function
jest.mock('../../../db', () => {
  const queryBuilder = {
    from: jest.fn(() => queryBuilder),
    orderBy: jest.fn(() => queryBuilder),
    groupBy: jest.fn(() => queryBuilder),
    where: jest.fn(() => queryBuilder),
    limit: jest.fn(() => queryBuilder),
    all: jest.fn(async () => []),
    values: jest.fn(() => queryBuilder),
  };
  return {
    __esModule: true,
    default: {
      select: jest.fn(() => queryBuilder),
    },
  };
});

jest.mock('../../../db/schema', () => ({
  sets: {},
  cards: {},
}));

const DeckListScreenModule = require('../DeckListScreen');
DeckListScreenModule.processarDeckDeFlashcards = jest.fn(async () => Promise.resolve());
const DeckListScreenWrapper = DeckListScreenModule.default;

const mockTheme = {
  white: '#fff',
  card: '#222',
  gray: '#aaa',
  purple: '#673AB7',
  sep: '#444',
};

const mockStyles = {} as any; // Style object is not relevant for the test

const mockHandleSetDefaultIconSize = jest.fn();
const mockHandleSetDefaultIconOffset = jest.fn();
const mockHandleSetPreferredVoice = jest.fn();
const mockHandleSetAutoPlayAudio = jest.fn();
const mockUpdateSettings = jest.fn();
const mockSetShowStopwatch = jest.fn();
const mockSetIsDark = jest.fn();

const wrapper = ({ children }: any) => (
  <NavigationContainer>
    <AppContext.Provider value={{
      theme: mockTheme,
      styles: mockStyles,
      cardsReviewedToday: 0,
      dailyGoal: 10,
      targetReviewDecks: [],
      isDark: false,
      setIsDark: mockSetIsDark,
      preferredVoices: {},
      handleSetPreferredVoice: mockHandleSetPreferredVoice,
      autoPlayAudio: false,
      handleSetAutoPlayAudio: mockHandleSetAutoPlayAudio,
      cardFontSize: 24,
      updateSettings: mockUpdateSettings,
      showStopwatch: false,
      setShowStopwatch: mockSetShowStopwatch,
      defaultIconSize: 80,
      handleSetDefaultIconSize: mockHandleSetDefaultIconSize,
      defaultIconOffset: 0,
      handleSetDefaultIconOffset: mockHandleSetDefaultIconOffset,
    }}>
      {children}
    </AppContext.Provider>
  </NavigationContainer>
);

describe('DeckListScreen import flow', () => {
  it('opens import modal, pastes text and triggers import', async () => {
    const { getByText, getByPlaceholderText } = render(<DeckListScreenWrapper />, { wrapper });

    // Open side menu (hamburger) then press Importar
    fireEvent.press(getByText('☰'));
    fireEvent.press(getByText('Importar'));

    // Wait for import modal title
    await waitFor(() => expect(getByText('Importar Flashcards')).toBeTruthy());

    // Enter text
    const input = getByPlaceholderText('Cole pequenos conjuntos aqui...');
    fireEvent.changeText(input, '#CONJUNTO: Teste\n#CARTÃO\nFRENTE: Pergunta\nVERSO: Resposta');

    // Press Importar Texto button
    fireEvent.press(getByText('Importar Texto'));

    const { processarDeckDeFlashcards } = require('../DeckListScreen');
    await waitFor(() => expect(processarDeckDeFlashcards).toHaveBeenCalled());
  });

  it('opens icon size settings, adjusts icon offset, and saves it', async () => {
    const { getByText } = render(<DeckListScreenWrapper />, { wrapper });

    fireEvent.press(getByText('☰'));
    fireEvent.press(getByText('Tamanho padrão do ícone'));

    await waitFor(() => expect(getByText('Posição vertical: 0')).toBeTruthy());

    fireEvent.press(getByText('↑'));
    fireEvent.press(getByText('Salvar'));

    await waitFor(() => expect(mockHandleSetDefaultIconOffset).toHaveBeenCalledWith(-4));
    await waitFor(() => expect(mockHandleSetDefaultIconSize).toHaveBeenCalledWith(80));
  });
});
