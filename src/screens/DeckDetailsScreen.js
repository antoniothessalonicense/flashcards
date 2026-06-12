import React, { useState, useContext } from 'react';
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

const formatTextForDisplay = (text) => {
  if (!text) return '';
  return text.replace(/<\/?en>/ig, '');
};

const playMixedTTS = (text, baseLang, preferredVoices, overrideVoice = null) => {
  if (!text) return;
  const parts = text.split(/(<en>.*?<\/en>)/ig);
  for (const p of parts) {
    if (!p) continue;
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

const DeckCardItem = ({ item, deck, onMenuPress, theme, styles, preferredVoices }) => {
  const [favorited, setFavorited] = useState(item.isImportant === 1);

  return (
    <View style={styles.ddCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.ddCardFront} numberOfLines={3}>{formatTextForDisplay(item.front)}</Text>
        <Text style={styles.ddCardBack} numberOfLines={3}>{formatTextForDisplay(item.back)}</Text>
      </View>
      <View style={styles.ddCardFooter}>
        <TouchableOpacity onPress={() => {
          Speech.stop();
          const frontLang = deck.frontLanguage || 'pt-BR';
          const backLang = deck.backLanguage || 'en-US';
          playMixedTTS(item.front, frontLang, preferredVoices);
          playMixedTTS(item.back, backLang, preferredVoices);
        }}><Text style={styles.ddCardIcon}>🔊</Text></TouchableOpacity>
        <TouchableOpacity onPress={async () => {
          const newVal = await toggleCardImportant(item.id);
          setFavorited(newVal === 1);
        }}>
          <Text style={[styles.ddCardIcon, favorited && { color: '#FF6B6B' }]}>{favorited ? '♥' : '♡'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onMenuPress(item)}><Text style={styles.ddCardIcon}>⋮</Text></TouchableOpacity>
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
  
  const [cardMenuAtivo, setCardMenuAtivo] = useState(null);
  const [editCardModal, setEditCardModal] = useState(false);
  const [editCardFront, setEditCardFront] = useState('');
  const [editCardBack, setEditCardBack] = useState('');
  const [editingCardId, setEditingCardId] = useState(null);

  const onBack = () => navigation.goBack();
  const onPractice = () => navigation.navigate('Practice', { deckId: deck.id });

  const onAddCard = async (deckId, front, back) => {
    try { 
      const newCardId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      await db.insert(cards).values({
        id: newCardId,
        set_id: deckId,
        front: front.trim(),
        back: back.trim(),
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
  const onUpdateCard = async (cardId, front, back) => {
    try { 
      await db.update(cards).set({ 
        front: front.trim(), 
        back: back.trim() 
      }).where(eq(cards.id, cardId)).returning(); 
    } catch (e) { 
      console.error('Erro ao atualizar cartão:', e); 
    }
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
          <View style={styles.ddTabActive}><Text style={styles.ddTabText}>Todos: {deckCards.length}</Text></View>
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

  const { data: deckData } = useLiveQuery(db.select().from(sets).where(eq(sets.id, deckId || '')));
  const { data: deckCardsData } = useLiveQuery(db.select().from(cards).where(eq(cards.set_id, deckId || '')));

  const deck = deckData?.[0];
  const deckCards = deckCardsData || [];

  if (!deck) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  return <DeckDetailsScreenContent deck={deck} deckCards={deckCards} />;
}
