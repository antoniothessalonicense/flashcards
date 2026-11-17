import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq } from 'drizzle-orm';
import db from '../../db';
import { sets, cards } from '../../db/schema';
import { AppContext } from '../context/AppContext';
import { toggleCardImportant } from '../../dbServices.drizzle';
import { FormattedText } from '../components/Shared';
import { AppBar } from '../components/ui';
const { playMixedTTS } = require('../utils/tts');

const DeckCardItem = ({ item, deck, onMenuPress, theme, styles, preferredVoices }) => {
  const [favorited, setFavorited] = useState(item.isImportant === 1);

  return (
    <View style={styles.ddCard}>
      <View style={{ flex: 1 }}>
        <FormattedText style={styles.ddCardFront} numberOfLines={3} text={item.front} />
        <FormattedText style={styles.ddCardBack} numberOfLines={3} text={item.back} />
        {item.tag ? <Text style={styles.ddCardTag}>⭐ {item.tag}</Text> : null}
      </View>
      <View style={styles.ddCardFooter}>
        <TouchableOpacity onPress={() => {
          Speech.stop();
          const frontLang = deck.frontLanguage || 'pt-BR';
          const backLang = deck.backLanguage || 'en-US';
          playMixedTTS(item.front, frontLang, preferredVoices);
          playMixedTTS(item.back, backLang, preferredVoices);
        }} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={styles.ddCardIcon}>🔊</Text></TouchableOpacity>
        <TouchableOpacity onPress={async () => {
          const newVal = await toggleCardImportant(item.id);
          setFavorited(newVal === 1);
        }} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[styles.ddCardIcon, favorited && { color: theme.danger }]}>{favorited ? '♥' : '♡'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onMenuPress(item)} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={styles.ddCardIcon}>⋮</Text></TouchableOpacity>
      </View>
    </View>
  );
};

function DeckDetailsScreenContent({ deck, deckCards = [] }) {
  const { theme, styles, preferredVoices } = useContext(AppContext);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [cardModal, setCardModal] = useState(false);
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardTag, setCardTag] = useState('');
  const [priority, setPriority] = useState(deck.priority || 0);
  const [priorityModalVisible, setPriorityModalVisible] = useState(false);

  const [cardMenuAtivo, setCardMenuAtivo] = useState(null);
  const [editCardModal, setEditCardModal] = useState(false);
  const [editCardFront, setEditCardFront] = useState('');
  const [editCardBack, setEditCardBack] = useState('');
  const [editCardTag, setEditCardTag] = useState('');
  const [editingCardId, setEditingCardId] = useState(null);

  const onBack = () => navigation.goBack();
  const onPractice = () => navigation.navigate('Practice', { deckId: deck.id });

  useEffect(() => {
    setPriority(deck.priority || 0);
  }, [deck.priority]);

  const onUpdateDeckPriority = async (deckId, newPriority) => {
    try {
      await db.update(sets).set({ priority: newPriority }).where(eq(sets.id, deckId)).returning();
    } catch (e) {
      console.error('Erro ao atualizar prioridade do conjunto:', e);
    }
  };

  const onAddCard = async (deckId, front, back, tag) => {
    try {
      const newCardId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      await db.insert(cards).values({
        id: newCardId,
        set_id: deckId,
        front: front.trim(),
        back: back.trim(),
        tag: tag ? tag.trim() : null,
        next_review_date: Date.now(),
        ease_factor: 250,
        difficultyStatus: 'new'
      }).returning();
    } catch (e) {
      console.error('Erro ao adicionar cartão:', e);
    }
  };
  const onDeleteCard = async (cardId) => {
    try {
      await db.delete(cards).where(eq(cards.id, cardId)).returning();
    } catch (e) {
      console.error('Erro ao deletar cartão:', e);
    }
  };
  const onUpdateCard = async (cardId, front, back, tag) => {
    try {
      await db.update(cards).set({
        front: front.trim(),
        back: back.trim(),
        tag: tag ? tag.trim() : null
      }).where(eq(cards.id, cardId)).returning();
    } catch (e) {
      console.error('Erro ao atualizar cartão:', e);
    }
  };

  const handleCloseModal = () => { setCardModal(false); setCardFront(''); setCardBack(''); setCardTag(''); };
  const handleAdd = () => { if (cardFront.trim() && cardBack.trim()) { onAddCard(deck.id, cardFront, cardBack, cardTag); setCardFront(''); setCardBack(''); setCardTag(''); } };
  const handleFinish = () => { if (cardFront.trim() && cardBack.trim()) { onAddCard(deck.id, cardFront, cardBack, cardTag); } handleCloseModal(); };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppBar
        title={deck.title}
        theme={theme}
        leftIcon="arrow-back"
        onLeftPress={onBack}
        actions={[
          { id: 'settings', icon: 'settings-outline', onPress: () => setPriorityModalVisible(true) },
          { id: 'search', icon: 'search-outline' },
          { id: 'more', icon: 'ellipsis-vertical' },
        ]}
      />
      <View style={styles.ddHeader}>
        <View style={styles.ddTabs}>
          <View style={styles.ddTabActive}><Text style={styles.ddTabText}>Todos: {deckCards.length}</Text></View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 8 }}>Prioridade atual: {priority}</Text>
          <TouchableOpacity onPress={() => setPriorityModalVisible(true)} style={{ minHeight: 44, alignSelf: 'flex-start', backgroundColor: theme.accentSoft, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, justifyContent: 'center' }}>
            <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 13 }}>Editar prioridade</Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Tipo de priorização</Text>
          <Text style={{ color: theme.textPrimary, fontSize: 12 }}>Menor valor = mais prioridade</Text>
        </View>
      </View>

      <FlatList
        data={deckCards}
        keyExtractor={item => String(item.id)}
        numColumns={2}
        contentContainerStyle={styles.ddListContent}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <DeckCardItem item={item} deck={deck} onMenuPress={setCardMenuAtivo} theme={theme} styles={styles} preferredVoices={preferredVoices} />
        )}
      />

      <View style={[styles.ddFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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
            <TextInput style={styles.wsInput} placeholder="Frente (Pergunta)" placeholderTextColor={theme.textSecondary} value={cardFront} onChangeText={setCardFront} />
            <TextInput style={[styles.wsInput, { marginTop: 10 }]} placeholder="Verso (Resposta)" placeholderTextColor={theme.textSecondary} value={cardBack} onChangeText={setCardBack} />
            <TextInput style={[styles.wsInput, { marginTop: 10 }]} placeholder="Tag (Opcional)" placeholderTextColor={theme.textSecondary} value={cardTag} onChangeText={setCardTag} />
            <View style={styles.wsModalActions}>
              <TouchableOpacity onPress={handleCloseModal}><Text style={styles.wsModalCancel}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleAdd}><View style={styles.wsModalConfirm}><Text style={styles.wsModalConfirmText}>Adicionar +</Text></View></TouchableOpacity>
              <TouchableOpacity onPress={handleFinish}><View style={[styles.wsModalConfirm, { backgroundColor: theme.success }]}><Text style={styles.wsModalConfirmText}>Concluir</Text></View></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={priorityModalVisible} transparent animationType="fade" onRequestClose={() => setPriorityModalVisible(false)}>
        <View style={styles.wsModalOverlay}>
          <View style={styles.wsModalBox}>
            <Text style={styles.wsModalTitle}>Prioridade do Conjunto</Text>
            <TextInput
              style={styles.wsInput}
              placeholder="Valor da prioridade"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={priority.toString()}
              onChangeText={(text) => setPriority(Number(text) || 0)}
            />
            <View style={styles.wsModalActions}>
              <TouchableOpacity onPress={() => setPriorityModalVisible(false)}>
                <Text style={styles.wsModalCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                  await onUpdateDeckPriority(deck.id, priority);
                  setPriorityModalVisible(false);
                }}>
                <View style={styles.wsModalConfirm}><Text style={styles.wsModalConfirmText}>Salvar</Text></View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={cardMenuAtivo !== null} transparent={true} animationType="fade" onRequestClose={() => setCardMenuAtivo(null)}>
        <TouchableOpacity style={styles.contextOverlay} activeOpacity={1} onPress={() => setCardMenuAtivo(null)}>
          <View style={styles.contextMenu}>
            <TouchableOpacity style={styles.contextMenuItem} onPress={() => { setEditingCardId(cardMenuAtivo.id); setEditCardFront(cardMenuAtivo.front); setEditCardBack(cardMenuAtivo.back); setEditCardTag(cardMenuAtivo.tag || ''); setCardMenuAtivo(null); setEditCardModal(true); }}>
              <Text style={styles.contextMenuText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contextMenuItem} onPress={() => { Alert.alert('Excluir', 'Tem certeza que deseja excluir este cartão?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => onDeleteCard(cardMenuAtivo.id) }]); setCardMenuAtivo(null); }}>
              <Text style={[styles.contextMenuText, { color: theme.danger }]}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={editCardModal} transparent animationType="fade" onRequestClose={() => setEditCardModal(false)}>
        <View style={styles.wsModalOverlay}>
          <View style={styles.wsModalBox}>
            <Text style={styles.wsModalTitle}>Editar Cartão</Text>
            <TextInput style={styles.wsInput} placeholder="Frente (Pergunta)" placeholderTextColor={theme.textSecondary} value={editCardFront} onChangeText={setEditCardFront} />
            <TextInput style={[styles.wsInput, { marginTop: 10 }]} placeholder="Verso (Resposta)" placeholderTextColor={theme.textSecondary} value={editCardBack} onChangeText={setEditCardBack} />
            <TextInput style={[styles.wsInput, { marginTop: 10 }]} placeholder="Tag (Opcional)" placeholderTextColor={theme.textSecondary} value={editCardTag} onChangeText={setEditCardTag} />
            <View style={styles.wsModalActions}>
              <TouchableOpacity onPress={() => setEditCardModal(false)}><Text style={styles.wsModalCancel}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { if (editCardFront.trim() && editCardBack.trim()) { onUpdateCard(editingCardId, editCardFront, editCardBack, editCardTag); setEditCardModal(false); } }}>
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
  const { theme } = useContext(AppContext);
  const route = useRoute();
  const { deckId } = route.params || {};

  const { data: deckData } = useLiveQuery(db.select().from(sets).where(eq(sets.id, deckId || '')));
  const { data: deckCardsData } = useLiveQuery(db.select().from(cards).where(eq(cards.set_id, deckId || '')));

  const deck = deckData?.[0];
  const deckCards = deckCardsData || [];

  if (!deck) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  return <DeckDetailsScreenContent deck={deck} deckCards={deckCards} />;
}
