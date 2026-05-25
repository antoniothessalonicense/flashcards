import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq } from 'drizzle-orm';
import db from '../../db';
import { sets, cards } from '../../db/schema';
import { createCard, deleteCard, updateCard } from '../../dbServices.drizzle';
import { AppContext } from '../context/AppContext';

const DeckCardItem = ({ item, deck, onMenuPress, theme, styles, preferredVoices }) => {
  const [favorited, setFavorited] = useState(false);

  return (
    <View style={styles.ddCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.ddCardFront} numberOfLines={3}>{item.front}</Text>
        <Text style={styles.ddCardBack} numberOfLines={3}>{item.back}</Text>
      </View>
      <View style={styles.ddCardFooter}>
        <TouchableOpacity onPress={() => {
          Speech.stop();
          const frontLang = deck.frontLanguage || 'pt-BR';
          const backLang = deck.backLanguage || 'en-US';
          const frontOpts = { language: frontLang };
          const backOpts = { language: backLang };
          if (preferredVoices?.[frontLang]) frontOpts.voice = preferredVoices[frontLang];
          if (preferredVoices?.[backLang]) backOpts.voice = preferredVoices[backLang];
          
          Speech.speak(item.front, frontOpts);
          Speech.speak(item.back, backOpts);
        }}><Text style={styles.ddCardIcon}>🔊</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setFavorited(!favorited)}>
          <Text style={[styles.ddCardIcon, favorited && { color: '#FF6B6B' }]}>{favorited ? '♥' : '♡'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onMenuPress(item)}><Text style={styles.ddCardIcon}>⋮</Text></TouchableOpacity>
      </View>
    </View>
  );
};

function DeckDetailsScreenContent({ deck, cards = [] }) {
  const { theme, styles, preferredVoices } = useContext(AppContext);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [cardModal, setCardModal] = useState(false);
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  
  const [cardMenuAtivo, setCardMenuAtivo] = useState(null);
  const [editCardModal, setEditCardModal] = useState(false);
  const [editCardFront, setEditCardFront] = useState('');
  const [editCardBack, setEditCardBack] = useState('');
  const [editingCardId, setEditingCardId] = useState(null);

  const onBack = () => navigation.goBack();
  const onPractice = () => navigation.navigate('Practice', { deckId: deck.id });

  const onAddCard = async (deckId, front, back) => {
    try { await createCard(deckId, front, back); } catch (e) { console.error(e); }
  };
  const onDeleteCard = async (cardId) => {
    try { await deleteCard(cardId); } catch (e) { console.error(e); }
  };
  const onUpdateCard = async (cardId, front, back) => {
    try { await updateCard(cardId, front, back); } catch (e) { console.error(e); }
  };

  const handleCloseModal = () => { setCardModal(false); setCardFront(''); setCardBack(''); };
  const handleAdd = () => { if (cardFront.trim() && cardBack.trim()) { onAddCard(deck.id, cardFront, cardBack); setCardFront(''); setCardBack(''); } };
  const handleFinish = () => { if (cardFront.trim() && cardBack.trim()) { onAddCard(deck.id, cardFront, cardBack); } handleCloseModal(); };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.ddHeader}>
        <View style={styles.ddHeaderTop}>
          <TouchableOpacity onPress={onBack} style={styles.hBtn}><Text style={styles.hIcon}>←</Text></TouchableOpacity>
          <View style={styles.ddHeaderIcons}>
            <TouchableOpacity style={styles.hBtn}><Text style={styles.hIcon}>🔍</Text></TouchableOpacity>
            <TouchableOpacity style={styles.hBtn}><Text style={styles.hIcon}>☰</Text></TouchableOpacity>
            <TouchableOpacity style={styles.hBtn}><Text style={styles.hIcon}>⋮</Text></TouchableOpacity>
          </View>
        </View>
        <View style={styles.ddTabs}>
          <View style={styles.ddTabActive}><Text style={styles.ddTabText}>Todos: {cards.length}</Text></View>
        </View>
      </View>

      <FlatList
        data={cards}
        keyExtractor={item => String(item.id)}
        numColumns={2}
        contentContainerStyle={styles.ddListContent}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <DeckCardItem item={item} deck={deck} onMenuPress={setCardMenuAtivo} theme={theme} styles={styles} preferredVoices={preferredVoices} />
        )}
      />

      <View style={styles.ddFooter}>
        <TouchableOpacity style={styles.ddFooterBtn} onPress={() => setCardModal(true)}>
          <Text style={styles.ddFooterBtnText}>ADICIONAR CARTÕES</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ddFooterBtn} onPress={onPractice}>
          <Text style={styles.ddFooterBtnText}>PRÁTICA</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.ddFab}><Text style={styles.ddFabText}>✨</Text></TouchableOpacity>

      <Modal visible={cardModal} transparent animationType="fade" onRequestClose={handleCloseModal}>
        <View style={styles.wsModalOverlay}>
          <View style={styles.wsModalBox}>
            <Text style={styles.wsModalTitle}>Adicionar Cartão</Text>
            <TextInput style={styles.wsInput} placeholder="Frente (Pergunta)" placeholderTextColor="#666" value={cardFront} onChangeText={setCardFront} />
            <TextInput style={[styles.wsInput, { marginTop: 10 }]} placeholder="Verso (Resposta)" placeholderTextColor="#666" value={cardBack} onChangeText={setCardBack} />
            <View style={styles.wsModalActions}>
              <TouchableOpacity onPress={handleCloseModal}><Text style={styles.wsModalCancel}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleAdd}><View style={styles.wsModalConfirm}><Text style={styles.wsModalConfirmText}>Adicionar +</Text></View></TouchableOpacity>
              <TouchableOpacity onPress={handleFinish}><View style={[styles.wsModalConfirm, { backgroundColor: '#4CAF50' }]}><Text style={styles.wsModalConfirmText}>Concluir</Text></View></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={cardMenuAtivo !== null} transparent={true} animationType="fade" onRequestClose={() => setCardMenuAtivo(null)}>
        <TouchableOpacity style={styles.contextOverlay} activeOpacity={1} onPress={() => setCardMenuAtivo(null)}>
          <View style={styles.contextMenu}>
            <TouchableOpacity style={styles.contextMenuItem} onPress={() => { setEditingCardId(cardMenuAtivo.id); setEditCardFront(cardMenuAtivo.front); setEditCardBack(cardMenuAtivo.back); setCardMenuAtivo(null); setEditCardModal(true); }}>
              <Text style={styles.contextMenuText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contextMenuItem} onPress={() => { Alert.alert('Excluir', 'Tem certeza que deseja excluir este cartão?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => onDeleteCard(cardMenuAtivo.id) }]); setCardMenuAtivo(null); }}>
              <Text style={[styles.contextMenuText, { color: '#F44336' }]}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={editCardModal} transparent animationType="fade" onRequestClose={() => setEditCardModal(false)}>
        <View style={styles.wsModalOverlay}>
          <View style={styles.wsModalBox}>
            <Text style={styles.wsModalTitle}>Editar Cartão</Text>
            <TextInput style={styles.wsInput} placeholder="Frente (Pergunta)" placeholderTextColor="#666" value={editCardFront} onChangeText={setEditCardFront} />
            <TextInput style={[styles.wsInput, { marginTop: 10 }]} placeholder="Verso (Resposta)" placeholderTextColor="#666" value={editCardBack} onChangeText={setEditCardBack} />
            <View style={styles.wsModalActions}>
              <TouchableOpacity onPress={() => setEditCardModal(false)}><Text style={styles.wsModalCancel}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { if (editCardFront.trim() && editCardBack.trim()) { onUpdateCard(editingCardId, editCardFront, editCardBack); setEditCardModal(false); } }}>
                <View style={styles.wsModalConfirm}><Text style={styles.wsModalConfirmText}>Salvar</Text></View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function DeckDetailsScreen() {
  const route = useRoute();
  const { deckId } = route.params || {};

  const deck = useLiveQuery(
    () => (deckId ? db.select().from(sets).where(eq(sets.id, deckId)).get() : null),
    [deckId],
  );

  const deckCards = useLiveQuery(
    () => (deckId ? db.select().from(cards).where(eq(cards.set_id, deckId)).all() : []),
    [deckId],
  ) || [];

  if (!deck) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  return <DeckDetailsScreenContent deck={deck} cards={deckCards} />;
}
