// src/screens/__tests__/DeckListScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DeckListScreenWrapper from '../DeckListScreen';
import { AppContext } from '../../context/AppContext';
import { NavigationContainer } from '@react-navigation/native';

// Mock the DB and processing function
jest.mock('../../../db', () => ({
  default: {
    select: jest.fn(() => ({ from: jest.fn(), orderBy: jest.fn(), all: jest.fn() })),
  },
}));

jest.mock('../../../db/schema', () => ({
  sets: {},
  cards: {},
}));

jest.mock('../../../db/index', () => ({
  // Expose a mocked db with insert/select/delete that resolves immediately
  insert: jest.fn(() => ({ values: jest.fn(() => ({ returning: jest.fn() })) })),
  select: jest.fn(() => ({ from: jest.fn(), where: jest.fn(), all: jest.fn() })),
  update: jest.fn(() => ({ set: jest.fn(() => ({ where: jest.fn(() => ({ returning: jest.fn() })) })) })),
  delete: jest.fn(() => ({ where: jest.fn(() => ({ returning: jest.fn() })) })),
}));

// Mock the heavy processing function to avoid real DB writes
jest.mock('../DeckListScreen', () => {
  const original = jest.requireActual('../DeckListScreen');
  return {
    ...original,
    processarDeckDeFlashcards: jest.fn(async (text) => {
      // Simulate successful processing
      return Promise.resolve();
    }),
  };
});

const mockTheme = {
  white: '#fff',
  card: '#222',
  gray: '#aaa',
  purple: '#673AB7',
  sep: '#444',
};

const mockStyles = {} as any; // Style object is not relevant for the test

const wrapper = ({ children }: any) => (
  <NavigationContainer>
    <AppContext.Provider value={{ theme: mockTheme, styles: mockStyles, cardsReviewedToday: 0, dailyGoal: 10, targetReviewDecks: [], isDark: false, setIsDark: jest.fn() }}>
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
});
