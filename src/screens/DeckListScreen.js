import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, ScrollView, TextInput, Share, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useNavigation } from '@react-navigation/native';
import { eq, like, asc } from 'drizzle-orm';
import db from '../../db';
import { sets, cards } from '../../db/schema';
import { ProgressBar } from '../components/Shared';
import MenuScreen from '../components/MenuScreen';
import { AppContext } from '../context/AppContext';

const SUPPORTED_LANGUAGES = [
  { code: 'pt-BR', name: 'Português', icon: '🇧🇷' },
  { code: 'en-US', name: 'Inglês (EUA)', icon: '🇺🇸' },
  { code: 'en-GB', name: 'Inglês (Reino Unido)', icon: '🇬🇧' },
  { code: 'es-ES', name: 'Espanhol', icon: '🇪🇸' },
  { code: 'fr-FR', name: 'Francês', icon: '🇫🇷' },
  { code: 'de-DE', name: 'Alemão', icon: '🇩🇪' },
  { code: 'it-IT', name: 'Italiano', icon: '🇮🇹' },
  { code: 'ja-JP', name: 'Japonês', icon: '🇯🇵' },
  { code: 'zh-CN', name: 'Chinês', icon: '🇨🇳' },
  { code: 'ru-RU', name: 'Russo', icon: '🇷🇺' },
  { code: 'ko-KR', name: 'Coreano', icon: '🇰🇷' },
];

const genId = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const DeckItem = ({ deck, cards = [], isTarget, setMenuAtivo }) => {
  const { theme, styles } = useContext(AppContext);
  const navigation = useNavigation();
  
  const totalCards = cards.length;
  const memorized = cards.filter(c => c.difficultyStatus === 'good' || c.difficultyStatus === 'easy').length;
  const progress = totalCards > 0 ? (memorized / totalCards) * 100 : 0;

  return (
    <TouchableOpacity style={[styles.deckItem, isTarget && { borderColor: '#F44336', borderWidth: 2 }]} onPress={() => navigation.navigate('DeckDetails', { deckId: deck.id })} activeOpacity={0.8}>
      <View style={styles.deckItemHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.deckName}>{deck.title}</Text>
          <Text style={styles.deckSub}>{memorized} / {totalCards} Cartões memorizados • {deck.totalReviews || 0} Treinos</Text>
        </View>
        <TouchableOpacity style={styles.deckMenuBtn} onPress={() => setMenuAtivo(deck.id)}>
          <Text style={styles.deckMenuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>
      <ProgressBar value={progress} theme={theme} color={theme.purple} />
      <View style={styles.deckActions}>
        <TouchableOpacity onPress={() => navigation.navigate('Review', { deckId: deck.id, studyMode: 'review' })}>
          <Text style={styles.deckActionBtn}>REVISÃO</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Practice', { deckId: deck.id })}>
          <Text style={styles.deckActionBtn}>PRÁTICA</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

function DeckListScreen({ decks = [], totalCardsCount = 0, cardsAll = [] }) {
  const { theme, styles, cardsReviewedToday, dailyGoal, targetReviewDecks, isDark, setIsDark } = useContext(AppContext);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  const [menuAtivo, setMenuAtivo] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cardSearchQuery, setCardSearchQuery] = useState('');

  const [actionDeckId, setActionDeckId] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editFrontLang, setEditFrontLang] = useState('');
  const [editBackLang, setEditBackLang] = useState('');
  
  const [cardModal, setCardModal] = useState(false);
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  
  const [deckModal, setDeckModal] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [newDeckFrontLang, setNewDeckFrontLang] = useState('pt-BR');
  const [newDeckBackLang, setNewDeckBackLang] = useState('en-US');
  
  const [dailyGoalMenuVisible, setDailyGoalMenuVisible] = useState(false);
  const [langPickerVisible, setLangPickerVisible] = useState(false);
  const [langPickerTarget, setLangPickerTarget] = useState('');

  const openLangPicker = (target) => {
    setLangPickerTarget(target);
    setLangPickerVisible(true);
  };

  const selectLanguage = (code) => {
    if (langPickerTarget === 'editFront') setEditFrontLang(code);
    else if (langPickerTarget === 'editBack') setEditBackLang(code);
    else if (langPickerTarget === 'newFront') setNewDeckFrontLang(code);
    else if (langPickerTarget === 'newBack') setNewDeckBackLang(code);
    setLangPickerVisible(false);
  };

  const renderLangDisplay = (code) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    if (lang) return `${lang.icon}  ${lang.name} (${code})`;
    return code || 'Selecionar Idioma';
  };

  const [cardSearchResults, setCardSearchResults] = useState([]);

  useEffect(() => {
    const fetchCards = async () => {
      const queryText = cardSearchQuery.trim();
      if (queryText.length <= 2) {
        setCardSearchResults([]);
        return;
      }
      try {
        const results = await db.select().from(cards).where(like(cards.front, `%${queryText}%`)).all();
        setCardSearchResults(results);
      } catch (error) {
        console.error('Erro na busca de cartões:', error);
        setCardSearchResults([]);
      }
    };
    fetchCards();
  }, [cardSearchQuery]);

  const handleMenuClick = async (action) => {
    const deckId = menuAtivo;
    const deck = decks.find(d => d.id === deckId);
    setMenuAtivo(null);
    if (!deck) return;

    if (action === 'edit') {
      setActionDeckId(deckId);
      setEditTitle(deck.title);
      setEditDesc(deck.description || '');
      setEditFrontLang(deck.frontLanguage || 'pt-BR');
      setEditBackLang(deck.backLanguage || 'en-US');
      setEditModal(true);
    } else if (action === 'add') {
      setActionDeckId(deckId);
      setCardFront('');
      setCardBack('');
      setCardModal(true);
    } else if (action === 'share' || action === 'export') {
      const deckCards = await db.select().from(cards).where(eq(cards.set_id, deckId)).all();
      if (deckCards.length === 0) {
        Alert.alert('Baralho Vazio', 'Não há cartões neste conjunto para compartilhar.');
        return;
      }
      if (action === 'export') {
        let textToExport = `#CONJUNTO: ${deck.title}\n`;
        if (deck.description) textToExport += `#DESCRIÇÃO: ${deck.description}\n`;
        textToExport += '\n';
        deckCards.forEach(c => { textToExport += `#CARTÃO\nFRENTE: ${c.front}\nVERSO: ${c.back}\n\n`; });
        await Share.share({ message: textToExport.trim() });
      } else {
        const textToShare = deckCards.map(c => `P: ${c.front}\nR: ${c.back}`).join('\n\n');
        await Share.share({ message: `Confira meu conjunto de estudos "${deck.title}":\n\n${textToShare}` });
      }
    } else if (action === 'archive') {
      Alert.alert('Arquivar', 'A funcionalidade de arquivamento será disponibilizada na próxima atualização!');
    }
  };

  const handleExportAllMD = async () => {
    try {
      setDailyGoalMenuVisible(false);
      let mdContent = '';
      for (const deck of decks) {
        const deckCards = await db.select().from(cards).where(eq(cards.set_id, deck.id)).all();
        mdContent += `#CONJUNTO: ${deck.title}\n`;
        if (deck.description) mdContent += `#DESCRIÇÃO: ${deck.description}\n`;
        mdContent += '\n';
        deckCards.forEach(c => { mdContent += `#CARTÃO\nFRENTE: ${c.front}\nVERSO: ${c.back}\n\n`; });
      }
      await Share.share({ message: mdContent.trim() });
    } catch (error) { 
      Alert.alert("Erro", "Não foi possível exportar os conjuntos.");
    }
  };

  const onUpdateDeck = async (id, t, d, fL, bL) => { 
    try { 
      await db.update(sets).set({ title: t, description: d, frontLanguage: fL, backLanguage: bL }).where(eq(sets.id, id)).run(); 
    } catch(e) { console.error(e); } 
  };
  const onDeleteDeck = async (id) => { 
    try { 
      await db.delete(cards).where(eq(cards.set_id, id)).run();
      await db.delete(sets).where(eq(sets.id, id)).run(); 
    } catch(e) { console.error(e); } 
  };
  const onAddCard = async (id, f, b) => { 
    try { 
      const newCardId = genId();
      await db.insert(cards).values({
        id: newCardId,
        set_id: id,
        front: f,
        back: b,
        next_review_date: Date.now(),
        ease_factor: 250,
        difficultyStatus: 'new'
      }).run();
    } catch(e) { console.error(e); } 
  };
  const onAddDeck = async (t, d, fL, bL) => { 
    try { 
      const id = genId();
      await db.insert(sets).values({
        id,
        title: t,
        description: d,
        frontLanguage: fL,
        backLanguage: bL,
        next_review_date: 0,
        totalReviews: 0
      }).run();
    } catch(e) { console.error(e); } 
  };

  const handleReviewAll = () => navigation.navigate('Review', { reviewAll: true, studyMode: 'review' });
  const handlePracticeAll = () => navigation.navigate('Review', { practiceAll: true, studyMode: 'practice' });

  const filteredDecks = decks.filter(deck => (deck.title || '').toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.hBtn}>
          <Text style={styles.hIcon}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <TextInput
            style={{ color: theme.white, backgroundColor: theme.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginHorizontal: 8 }}
            placeholder="Pesquisar cartões..."
            placeholderTextColor={theme.gray}
            value={cardSearchQuery}
            onChangeText={setCardSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.hBtn} onPress={() => setIsSearching(!isSearching)}>
          <Text style={styles.hIcon}>🔍</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.hBtn}>
          <Text style={styles.hIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {cardSearchResults.length > 0 && (
        <View style={{ backgroundColor: theme.card, marginHorizontal: 16, borderRadius: 8, padding: 8, marginBottom: 12, maxHeight: 150 }}>
          <Text style={{ color: theme.gray, fontSize: 12, marginBottom: 8 }}>Resultados encontrados ({cardSearchResults.length}):</Text>
          <FlatList
            data={cardSearchResults}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <View style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.sep }}>
                <Text style={{ color: theme.white, fontWeight: 'bold' }}>{item.front}</Text>
                <Text style={{ color: theme.gray }}>{item.back}</Text>
              </View>
            )}
          />
        </View>
      )}

      <TouchableOpacity style={styles.pill} onPress={() => {/* onOpenWorkspace */}} activeOpacity={0.7}>
        <Text style={styles.pillText}>{'Todos os conjuntos'}</Text>
        <View style={styles.pillIconWrapper}><Text style={styles.pillUpload}>▼</Text></View>
      </TouchableOpacity>

      <View style={styles.actionRow}>
        <TouchableOpacity onPress={handleReviewAll}>
          <Text style={styles.actionBtn}>REVISAR TUDO</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePracticeAll}>
          <Text style={styles.actionBtn}>PRATIQUE TUDO</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dailyGoal}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={[styles.dailyGoalText, { marginBottom: 0 }]}>meta diária: {cardsReviewedToday}/{dailyGoal}  •  {totalCardsCount} {totalCardsCount === 1 ? 'cartão no total' : 'cartões no total'}</Text>
          <TouchableOpacity onPress={() => setDailyGoalMenuVisible(true)}>
            <Text style={{ color: theme.white, fontSize: 18, fontWeight: 'bold' }}>⋮</Text>
          </TouchableOpacity>
        </View>
        <ProgressBar value={dailyGoal > 0 ? (cardsReviewedToday / dailyGoal) * 100 : 0} color={theme.purple} theme={theme} />
      </View>

      <FlatList
        data={filteredDecks}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <DeckItem
            deck={item}
            cards={cardsAll.filter(c => c.set_id === item.id)}
            isTarget={targetReviewDecks?.includes(item.id)}
            setMenuAtivo={setMenuAtivo}
          />
        )}
        contentContainerStyle={{ paddingBottom: 148 }}
        style={{ flex: 1 }}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerOut}>
          <Text style={styles.footerOutText}>CONJUNTOS EXTERNOS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerFill} onPress={() => setDeckModal(true)}>
          <Text style={styles.footerFillText}>+ CRIAR CONJUNTO</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={menuAtivo !== null} transparent={true} animationType="fade" onRequestClose={() => setMenuAtivo(null)}>
        <TouchableOpacity style={styles.contextOverlay} activeOpacity={1} onPress={() => setMenuAtivo(null)}>
          <View style={styles.contextMenu}>
            <TouchableOpacity style={styles.contextMenuItem} onPress={() => handleMenuClick('edit')}><Text style={styles.contextMenuText}>Editar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.contextMenuItem} onPress={() => handleMenuClick('add')}><Text style={styles.contextMenuText}>Adicionar Cartões</Text></TouchableOpacity>
            <TouchableOpacity style={styles.contextMenuItem} onPress={() => handleMenuClick('share')}><Text style={styles.contextMenuText}>Compartilhar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.contextMenuItem} onPress={() => handleMenuClick('archive')}><Text style={styles.contextMenuText}>Arquivar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.contextMenuItem} onPress={() => handleMenuClick('export')}><Text style={styles.contextMenuText}>Exportar Cartões</Text></TouchableOpacity>
            <TouchableOpacity style={styles.contextMenuItem} onPress={() => { Alert.alert('Em breve!'); setMenuAtivo(null); }}><Text style={styles.contextMenuText}>Mesclar conjuntos</Text></TouchableOpacity>
            <TouchableOpacity style={styles.contextMenuItem} onPress={() => { Alert.alert('Em breve!'); setMenuAtivo(null); }}><Text style={styles.contextMenuText}>Mover os cartões</Text></TouchableOpacity>
            <TouchableOpacity style={styles.contextMenuItem} onPress={() => { onDeleteDeck(menuAtivo); setMenuAtivo(null); }}>
              <Text style={[styles.contextMenuText, { color: '#F44336' }]}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={dailyGoalMenuVisible} transparent={true} animationType="fade" onRequestClose={() => setDailyGoalMenuVisible(false)}>
        <TouchableOpacity style={styles.contextOverlay} activeOpacity={1} onPress={() => setDailyGoalMenuVisible(false)}>
          <View style={styles.contextMenu}>
            <TouchableOpacity style={styles.contextMenuItem} onPress={handleExportAllMD}>
              <Text style={styles.contextMenuText}>Exportar (MD / TXT)</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={editModal} transparent animationType="fade" onRequestClose={() => setEditModal(false)}>
        <View style={styles.wsModalOverlay}>
          <View style={styles.wsModalBox}>
            <Text style={styles.wsModalTitle}>Editar Conjunto</Text>
            <TextInput style={styles.wsInput} placeholder="Nome" placeholderTextColor="#666" value={editTitle} onChangeText={setEditTitle} />
            <TextInput style={[styles.wsInput, { marginTop: 10 }]} placeholder="Descrição" placeholderTextColor="#666" value={editDesc} onChangeText={setEditDesc} />
            <Text style={{ color: theme.gray, fontSize: 12, marginTop: 10, marginBottom: 4 }}>Idioma da Frente:</Text>
            <TouchableOpacity style={styles.wsInput} onPress={() => openLangPicker('editFront')}>
              <Text style={{ color: editFrontLang ? theme.white : '#666' }}>{renderLangDisplay(editFrontLang)}</Text>
            </TouchableOpacity>
            <Text style={{ color: theme.gray, fontSize: 12, marginTop: 10, marginBottom: 4 }}>Idioma do Verso:</Text>
            <TouchableOpacity style={styles.wsInput} onPress={() => openLangPicker('editBack')}>
              <Text style={{ color: editBackLang ? theme.white : '#666' }}>{renderLangDisplay(editBackLang)}</Text>
            </TouchableOpacity>
            <View style={styles.wsModalActions}>
              <TouchableOpacity onPress={() => setEditModal(false)}><Text style={styles.wsModalCancel}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { onUpdateDeck(actionDeckId, editTitle, editDesc, editFrontLang, editBackLang); setEditModal(false); }}>
                <View style={styles.wsModalConfirm}><Text style={styles.wsModalConfirmText}>Salvar</Text></View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={cardModal} transparent animationType="fade" onRequestClose={() => setCardModal(false)}>
        <View style={styles.wsModalOverlay}>
          <View style={styles.wsModalBox}>
            <Text style={styles.wsModalTitle}>Adicionar Cartão</Text>
            <TextInput style={styles.wsInput} placeholder="Frente (Pergunta)" placeholderTextColor="#666" value={cardFront} onChangeText={setCardFront} />
            <TextInput style={[styles.wsInput, { marginTop: 10 }]} placeholder="Verso (Resposta)" placeholderTextColor="#666" value={cardBack} onChangeText={setCardBack} />
            <View style={styles.wsModalActions}>
              <TouchableOpacity onPress={() => setCardModal(false)}><Text style={styles.wsModalCancel}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { if (cardFront.trim() && cardBack.trim()) { onAddCard(actionDeckId, cardFront, cardBack); setCardFront(''); setCardBack(''); }}}>
                <View style={styles.wsModalConfirm}><Text style={styles.wsModalConfirmText}>Adicionar +</Text></View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { if (cardFront.trim() && cardBack.trim()) { onAddCard(actionDeckId, cardFront, cardBack); } setCardModal(false); }}>
                <View style={[styles.wsModalConfirm, { backgroundColor: '#4CAF50' }]}><Text style={styles.wsModalConfirmText}>Concluir</Text></View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={deckModal} transparent animationType="fade" onRequestClose={() => setDeckModal(false)}>
        <View style={styles.wsModalOverlay}>
          <View style={styles.wsModalBox}>
            <Text style={styles.wsModalTitle}>Novo Conjunto</Text>
            <TextInput style={styles.wsInput} placeholder="Nome" placeholderTextColor="#666" value={newDeckTitle} onChangeText={setNewDeckTitle} />
            <TextInput style={[styles.wsInput, { marginTop: 10 }]} placeholder="Descrição" placeholderTextColor="#666" value={newDeckDesc} onChangeText={setNewDeckDesc} />
            <Text style={{ color: theme.gray, fontSize: 12, marginTop: 10, marginBottom: 4 }}>Idioma da Frente:</Text>
            <TouchableOpacity style={styles.wsInput} onPress={() => openLangPicker('newFront')}>
              <Text style={{ color: newDeckFrontLang ? theme.white : '#666' }}>{renderLangDisplay(newDeckFrontLang)}</Text>
            </TouchableOpacity>
            <Text style={{ color: theme.gray, fontSize: 12, marginTop: 10, marginBottom: 4 }}>Idioma do Verso:</Text>
            <TouchableOpacity style={styles.wsInput} onPress={() => openLangPicker('newBack')}>
              <Text style={{ color: newDeckBackLang ? theme.white : '#666' }}>{renderLangDisplay(newDeckBackLang)}</Text>
            </TouchableOpacity>
            <View style={styles.wsModalActions}>
              <TouchableOpacity onPress={() => setDeckModal(false)}><Text style={styles.wsModalCancel}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { if(newDeckTitle.trim()) { onAddDeck(newDeckTitle, newDeckDesc, newDeckFrontLang, newDeckBackLang); setDeckModal(false); setNewDeckTitle(''); setNewDeckDesc(''); setNewDeckFrontLang('pt-BR'); setNewDeckBackLang('en-US'); } }}>
                <View style={styles.wsModalConfirm}><Text style={styles.wsModalConfirmText}>Criar</Text></View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={langPickerVisible} transparent animationType="fade" onRequestClose={() => setLangPickerVisible(false)}>
        <TouchableOpacity style={styles.contextOverlay} activeOpacity={1} onPress={() => setLangPickerVisible(false)}>
          <View style={[styles.contextMenu, { width: 300, maxHeight: 400 }]}>
            <Text style={{ color: theme.white, fontSize: 16, fontWeight: 'bold', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.sep }}>Selecionar Idioma</Text>
            <ScrollView>
              {SUPPORTED_LANGUAGES.map(lang => (
                <TouchableOpacity key={lang.code} style={styles.contextMenuItem} onPress={() => selectLanguage(lang.code)}>
                  <Text style={styles.contextMenuText}>{lang.icon}  {lang.name} ({lang.code})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
      <MenuScreen
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onMenuItemPress={(id) => {
          setMenuVisible(false);
          if (id === 'statistics') navigation.navigate('Statistics');
          if (id === 'settings') navigation.navigate('Configuracoes');
        }}
        isDark={isDark}
        toggleTheme={() => setIsDark(!isDark)}
        theme={theme}
      />
    </View>
  );
}

const DeckListScreenWrapper = (props) => {
  const { data: decks } = useLiveQuery(db.select().from(sets).orderBy(asc(sets.title)));
  const { data: cardsAll } = useLiveQuery(db.select().from(cards));
  
  const totalCardsCount = (cardsAll || []).length;
  
  return <DeckListScreen decks={decks || []} totalCardsCount={totalCardsCount} cardsAll={cardsAll || []} {...props} />;
};

export default DeckListScreenWrapper;