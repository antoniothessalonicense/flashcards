import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Q } from '@nozbe/watermelondb';
import withObservables from '@nozbe/with-observables';
import { database } from './database';
import WorkspaceSelectorModal from './WorkspaceSelectorModal';
import { deleteDeck as deleteDeckDb, seedInitialData, updateDeck, createCard, createDeck, updateCardDifficulty } from './dbServices';
import { ProgressBar, Badge } from './Shared';
import { EnhancedReviewScreen, ReviewScreenComponent } from './ReviewScreen';
import StatisticsScreen from './StatisticsScreen';
import MenuScreen from './MenuScreen';

const getTheme = (isDark) => ({
  bg: isDark ? '#1A1A1A' : '#F5F5F5',
  card: isDark ? '#2A2A2A' : '#FFFFFF',
  blue: '#3B9EFF',
  purple: '#7B5CF5',
  white: isDark ? '#FFFFFF' : '#000000',
  gray: '#888888',
  sep: isDark ? '#444444' : '#DDDDDD',
  reviewCard: isDark ? '#3A4A5C' : '#E3F2FD',
  cardBtnBg: isDark ? '#ffffff22' : '#00000011',
  favIcon: isDark ? '#ffffff55' : '#00000055',
});

// ─── Data ─────────────────────────────────────────────────────────────────────

// Nota: Mocks removidos! Agora os dados virão do WatermelonDB via Observables.
// import DeckListScreen from './src/screens/DeckListScreen';
// import { database } from './src/database';

const MODOS = [
  { icon: '🔤', label: 'Revisão Básica', desc: 'Revisão básica de flashcards.', pro: false },
  { icon: '🚀', label: 'Selecione a Definição', desc: 'Selecione a definição correta', pro: false },
  { icon: '📋', label: 'Combine Cartões', desc: 'Faça combinações entre duas listas', pro: false },
  { icon: '✏️', label: 'Escrevendo a Revisão', desc: 'Revise escrevendo', pro: false },
  { icon: '🎙️', label: 'Revisão de áudio', desc: 'Revise através do áudio', pro: false },
  { icon: '🎨', label: 'Revisão de desenho', desc: 'Pratique desenhando a resposta', pro: true },
  { icon: '🧠', label: 'Jogo da memória', desc: 'Revelar e combinar cartões', pro: true },
];

// ─── DeckListScreen ───────────────────────────────────────────────────────────

const DeckItem = ({ deck, cards = [], onDeckPress, onReview, onPractice, setMenuAtivo, theme }) => {
  const C = theme;
  const s = getStyles(C);
  
  const totalCards = cards.length;
  const memorized = cards.filter(c => c.difficultyStatus === 'good' || c.difficultyStatus === 'easy').length;
  const progress = totalCards > 0 ? (memorized / totalCards) * 100 : 0;

  return (
    <TouchableOpacity style={s.deckItem} onPress={() => onDeckPress(deck)} activeOpacity={0.8}>
      <View style={s.deckItemHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.deckName}>{deck.title}</Text>
          <Text style={s.deckSub}>{memorized} / {totalCards} Cartões memorizados • {deck.totalReviews || 0} Treinos</Text>
        </View>
        <TouchableOpacity style={s.deckMenuBtn} onPress={() => setMenuAtivo(deck.id)}>
          <Text style={s.deckMenuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>
      <ProgressBar value={progress} theme={theme} />
      <View style={s.deckActions}>
        <TouchableOpacity onPress={() => onReview(deck)}>
          <Text style={s.deckActionBtn}>REVISÃO</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onPractice(deck)}>
          <Text style={s.deckActionBtn}>PRÁTICA</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const EnhancedDeckItem = withObservables(['deck'], ({ deck }) => ({
  deck: deck.observe(),
  cards: deck.cards.observe(),
}))(DeckItem);

function DeckListScreen({ decks = [], totalCardsCount = 0, onDeckPress, onReview, onPractice, onReviewAll, onPracticeAll, onDeleteDeck, onUpdateDeck, onAddCard, onAddDeck, onMenuOpen, activeWorkspace, onOpenWorkspace, cardsReviewedToday, theme }) {
  const C = theme;
  const s = getStyles(C);
  const insets = useSafeAreaInsets();
  const [menuAtivo, setMenuAtivo] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [cardSearchResults, setCardSearchResults] = useState([]);

  // Estados para os novos modais
  const [actionDeckId, setActionDeckId] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [cardModal, setCardModal] = useState(false);
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [deckModal, setDeckModal] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [dailyGoalMenuVisible, setDailyGoalMenuVisible] = useState(false);

  useEffect(() => {
    if (cardSearchQuery.trim().length > 2) {
      database.get('cards').query(
        Q.where('front', Q.like(`%${cardSearchQuery}%`))
      ).fetch().then(setCardSearchResults);
    } else {
      setCardSearchResults([]);
    }
  }, [cardSearchQuery]);

  // Lida com os cliques do menu de três pontinhos
  const handleMenuClick = async (action) => {
    const deckId = menuAtivo;
    const deck = decks.find(d => d.id === deckId);
    setMenuAtivo(null); // Fecha o menu
    if (!deck) return;

    if (action === 'edit') {
      setActionDeckId(deckId);
      setEditTitle(deck.title);
      setEditDesc(deck.description || '');
      setEditModal(true);
    } else if (action === 'add') {
      setActionDeckId(deckId);
      setCardFront('');
      setCardBack('');
      setCardModal(true);
    } else if (action === 'share' || action === 'export') {
      const cards = await deck.cards.fetch();
      if (cards.length === 0) {
        Alert.alert('Baralho Vazio', 'Não há cartões neste conjunto para compartilhar.');
        return;
      }
      const textToShare = cards.map(c => `P: ${c.front}\nR: ${c.back}`).join('\n\n');
      await Share.share({ message: `Confira meu conjunto de estudos "${deck.title}":\n\n${textToShare}` });
    } else if (action === 'archive') {
      Alert.alert('Arquivar', 'A funcionalidade de arquivamento será disponibilizada na próxima atualização!');
    }
  };

  const handleExportAllMD = async () => {
    try {
      setDailyGoalMenuVisible(false);
      let mdContent = '# Todos os Conjuntos\n\n';
      
      for (const deck of decks) {
        const cards = await deck.cards.fetch();
        mdContent += `## ${deck.title}\n`;
        if (deck.description) mdContent += `${deck.description}\n`;
        mdContent += '\n';
        cards.forEach(c => {
          mdContent += `- **Q:** ${c.front}\n  **R:** ${c.back}\n`;
        });
        mdContent += '\n';
      }
      
      await Share.share({ message: mdContent });
    } catch (error) { 
      console.error("Erro ao exportar:", error);
      Alert.alert("Erro", "Não foi possível exportar os conjuntos.");
    }
  };

  const filteredDecks = decks.filter(deck =>
    (deck.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onMenuOpen} style={s.hBtn}>
          <Text style={s.hIcon}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <TextInput
            style={{ color: C.white, backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginHorizontal: 8 }}
            placeholder="Pesquisar cartões..."
            placeholderTextColor={C.gray}
            value={cardSearchQuery}
            onChangeText={setCardSearchQuery}
          />
        </View>
        <TouchableOpacity style={s.hBtn} onPress={() => setIsSearching(!isSearching)}>
          <Text style={s.hIcon}>🔍</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.hBtn}>
          <Text style={s.hIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Resultados de Pesquisa de Cartões */}
      {cardSearchResults.length > 0 && (
        <View style={{ backgroundColor: C.card, marginHorizontal: 16, borderRadius: 8, padding: 8, marginBottom: 12, maxHeight: 150 }}>
          <Text style={{ color: C.gray, fontSize: 12, marginBottom: 8 }}>Resultados encontrados ({cardSearchResults.length}):</Text>
          <FlatList
            data={cardSearchResults}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <View style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.sep }}>
                <Text style={{ color: C.white, fontWeight: 'bold' }}>{item.front}</Text>
                <Text style={{ color: C.gray }}>{item.back}</Text>
              </View>
            )}
          />
        </View>
      )}

      {/* Workspace pill */}
      <TouchableOpacity style={s.pill} onPress={onOpenWorkspace} activeOpacity={0.7}>
        <Text style={s.pillText}>{activeWorkspace ? activeWorkspace.name : 'Todos os conjuntos'}</Text>
        <View style={s.pillIconWrapper}>
          <Text style={s.pillUpload}>▼</Text>
        </View>
      </TouchableOpacity>

      {/* Action buttons */}
      <View style={s.actionRow}>
        <TouchableOpacity onPress={onReviewAll}>
          <Text style={s.actionBtn}>REVISAR TUDO</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPracticeAll}>
          <Text style={s.actionBtn}>PRATIQUE TUDO</Text>
        </TouchableOpacity>
      </View>

      {/* Daily goal */}
      <View style={s.dailyGoal}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={[s.dailyGoalText, { marginBottom: 0 }]}>meta diária: {cardsReviewedToday}/50  •  {totalCardsCount} {totalCardsCount === 1 ? 'cartão no total' : 'cartões no total'}</Text>
          <TouchableOpacity onPress={() => setDailyGoalMenuVisible(true)}>
            <Text style={{ color: C.white, fontSize: 18, fontWeight: 'bold' }}>⋮</Text>
          </TouchableOpacity>
        </View>
        <ProgressBar value={(cardsReviewedToday / 50) * 100} color={C.purple} theme={theme} />
      </View>

      {/* Deck list */}
      <FlatList
        data={filteredDecks}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <EnhancedDeckItem 
            deck={item} 
            onDeckPress={onDeckPress}
            onReview={onReview}
            onPractice={onPractice}
            setMenuAtivo={setMenuAtivo}
            theme={theme}
          />
        )}
        contentContainerStyle={{ paddingBottom: 148 }}
        style={{ flex: 1 }}
      />

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity style={s.footerOut}>
          <Text style={s.footerOutText}>CONJUNTOS PRÉ-FABRICADOS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.footerFill} onPress={() => setDeckModal(true)}>
          <Text style={s.footerFillText}>+ CRIAR CONJUNTO</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Menu de Contexto do Deck */}
      <Modal visible={menuAtivo !== null} transparent={true} animationType="fade" onRequestClose={() => setMenuAtivo(null)}>
        <TouchableOpacity style={s.contextOverlay} activeOpacity={1} onPress={() => setMenuAtivo(null)}>
          <View style={s.contextMenu}>
            <TouchableOpacity style={s.contextMenuItem} onPress={() => handleMenuClick('edit')}><Text style={s.contextMenuText}>Editar</Text></TouchableOpacity>
            <TouchableOpacity style={s.contextMenuItem} onPress={() => handleMenuClick('add')}><Text style={s.contextMenuText}>Adicionar Cartões</Text></TouchableOpacity>
            <TouchableOpacity style={s.contextMenuItem} onPress={() => handleMenuClick('share')}><Text style={s.contextMenuText}>Compartilhar</Text></TouchableOpacity>
            <TouchableOpacity style={s.contextMenuItem} onPress={() => handleMenuClick('archive')}><Text style={s.contextMenuText}>Arquivar</Text></TouchableOpacity>
            <TouchableOpacity style={s.contextMenuItem} onPress={() => handleMenuClick('export')}><Text style={s.contextMenuText}>Exportar Cartões</Text></TouchableOpacity>
            <TouchableOpacity style={s.contextMenuItem} onPress={() => { Alert.alert('Em breve!'); setMenuAtivo(null); }}><Text style={s.contextMenuText}>Mesclar conjuntos</Text></TouchableOpacity>
            <TouchableOpacity style={s.contextMenuItem} onPress={() => { Alert.alert('Em breve!'); setMenuAtivo(null); }}><Text style={s.contextMenuText}>Mover os cartões</Text></TouchableOpacity>
            <TouchableOpacity style={s.contextMenuItem} onPress={() => { onDeleteDeck(menuAtivo); setMenuAtivo(null); }}>
              <Text style={[s.contextMenuText, { color: '#F44336' }]}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Meta Diária (Exportar Tudo) */}
      <Modal visible={dailyGoalMenuVisible} transparent={true} animationType="fade" onRequestClose={() => setDailyGoalMenuVisible(false)}>
        <TouchableOpacity style={s.contextOverlay} activeOpacity={1} onPress={() => setDailyGoalMenuVisible(false)}>
          <View style={s.contextMenu}>
            <TouchableOpacity style={s.contextMenuItem} onPress={handleExportAllMD}>
              <Text style={s.contextMenuText}>Exportar (MD / TXT)</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Edição do Baralho */}
      <Modal visible={editModal} transparent animationType="fade" onRequestClose={() => setEditModal(false)}>
        <View style={s.wsModalOverlay}>
          <View style={s.wsModalBox}>
            <Text style={s.wsModalTitle}>Editar Conjunto</Text>
            <TextInput style={s.wsInput} placeholder="Nome" placeholderTextColor="#666" value={editTitle} onChangeText={setEditTitle} />
            <TextInput style={[s.wsInput, { marginTop: 10 }]} placeholder="Descrição" placeholderTextColor="#666" value={editDesc} onChangeText={setEditDesc} />
            <View style={s.wsModalActions}>
              <TouchableOpacity onPress={() => setEditModal(false)}><Text style={s.wsModalCancel}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { onUpdateDeck(actionDeckId, editTitle, editDesc); setEditModal(false); }}>
                <View style={s.wsModalConfirm}><Text style={s.wsModalConfirmText}>Salvar</Text></View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Adição Rápida de Cartões */}
      <Modal visible={cardModal} transparent animationType="fade" onRequestClose={() => setCardModal(false)}>
        <View style={s.wsModalOverlay}>
          <View style={s.wsModalBox}>
            <Text style={s.wsModalTitle}>Adicionar Cartão</Text>
            <TextInput style={s.wsInput} placeholder="Frente (Pergunta)" placeholderTextColor="#666" value={cardFront} onChangeText={setCardFront} />
            <TextInput style={[s.wsInput, { marginTop: 10 }]} placeholder="Verso (Resposta)" placeholderTextColor="#666" value={cardBack} onChangeText={setCardBack} />
            <View style={s.wsModalActions}>
              <TouchableOpacity onPress={() => setCardModal(false)}><Text style={s.wsModalCancel}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => {
                if (cardFront.trim() && cardBack.trim()) { onAddCard(actionDeckId, cardFront, cardBack); setCardFront(''); setCardBack(''); }
              }}>
                <View style={s.wsModalConfirm}><Text style={s.wsModalConfirmText}>Adicionar +</Text></View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                if (cardFront.trim() && cardBack.trim()) { onAddCard(actionDeckId, cardFront, cardBack); }
                setCardModal(false);
              }}>
                <View style={[s.wsModalConfirm, { backgroundColor: '#4CAF50' }]}><Text style={s.wsModalConfirmText}>Concluir</Text></View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Criação de Conjunto */}
      <Modal visible={deckModal} transparent animationType="fade" onRequestClose={() => setDeckModal(false)}>
        <View style={s.wsModalOverlay}>
          <View style={s.wsModalBox}>
            <Text style={s.wsModalTitle}>Novo Conjunto</Text>
            <TextInput style={s.wsInput} placeholder="Nome" placeholderTextColor="#666" value={newDeckTitle} onChangeText={setNewDeckTitle} />
            <TextInput style={[s.wsInput, { marginTop: 10 }]} placeholder="Descrição" placeholderTextColor="#666" value={newDeckDesc} onChangeText={setNewDeckDesc} />
            <View style={s.wsModalActions}>
              <TouchableOpacity onPress={() => setDeckModal(false)}><Text style={s.wsModalCancel}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { 
                if(newDeckTitle.trim()) { onAddDeck(newDeckTitle, newDeckDesc); setDeckModal(false); setNewDeckTitle(''); setNewDeckDesc(''); }
              }}>
                <View style={s.wsModalConfirm}><Text style={s.wsModalConfirmText}>Criar</Text></View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Conecta a Lista de Decks ao WatermelonDB para torná-la reativa
const EnhancedDeckListScreen = withObservables([], () => ({
  decks: database.collections.get('decks').query().observe(),
  totalCardsCount: database.collections.get('cards').query().observeCount(),
}))(DeckListScreen);

// ─── DeckDetailsScreen ────────────────────────────────────────────────────────

function DeckDetailsScreen({ deck, cards = [], onBack, onAddCards, onPractice, theme }) {
  const C = theme;
  const s = getStyles(C);
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* Cabeçalho */}
      <View style={s.ddHeader}>
        <View style={s.ddHeaderTop}>
          <TouchableOpacity onPress={onBack} style={s.hBtn}>
            <Text style={s.hIcon}>←</Text>
          </TouchableOpacity>
          <View style={s.ddHeaderIcons}>
            <TouchableOpacity style={s.hBtn}><Text style={s.hIcon}>🔍</Text></TouchableOpacity>
            <TouchableOpacity style={s.hBtn}><Text style={s.hIcon}>☰</Text></TouchableOpacity>
            <TouchableOpacity style={s.hBtn}><Text style={s.hIcon}>⋮</Text></TouchableOpacity>
          </View>
        </View>
        <View style={s.ddTabs}>
          <View style={s.ddTabActive}>
            <Text style={s.ddTabText}>Todos: {cards.length}</Text>
          </View>
        </View>
      </View>

      {/* Grade de Cartões */}
      <FlatList
        data={cards}
        keyExtractor={item => String(item.id)}
        numColumns={2}
        contentContainerStyle={s.ddListContent}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <View style={s.ddCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.ddCardFront} numberOfLines={3}>{item.front}</Text>
              <Text style={s.ddCardBack} numberOfLines={3}>{item.back}</Text>
            </View>
            <View style={s.ddCardFooter}>
              <TouchableOpacity><Text style={s.ddCardIcon}>🔊</Text></TouchableOpacity>
              <TouchableOpacity><Text style={s.ddCardIcon}>♡</Text></TouchableOpacity>
              <TouchableOpacity><Text style={s.ddCardIcon}>⋮</Text></TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Rodapé Fixo */}
      <View style={s.ddFooter}>
        <TouchableOpacity style={s.ddFooterBtn} onPress={onAddCards}>
          <Text style={s.ddFooterBtnText}>ADICIONAR CARTÕES</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ddFooterBtn} onPress={onPractice}>
          <Text style={s.ddFooterBtnText}>PRÁTICA</Text>
        </TouchableOpacity>
      </View>

      {/* FAB (Botão Flutuante) */}
      <TouchableOpacity style={s.ddFab}>
        <Text style={s.ddFabText}>✨</Text>
      </TouchableOpacity>
    </View>
  );
}

// Conecta a Tela de Detalhes ao WatermelonDB para carregar os cartões daquele deck específico
const EnhancedDeckDetailsScreen = withObservables(['deck'], ({ deck }) => ({
  deck: deck.observe(),
  cards: deck.cards.observe(), // Relacionamento com os cartões
}))(DeckDetailsScreen);

// ─── PracticePicker ───────────────────────────────────────────────────────────

function PracticePicker({ onClose, onSelect, theme }) {
  const C = theme;
  const s = getStyles(C);
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.hBtn}>
            <Text style={s.hIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={[s.hTitle, { flex: 1 }]}>Prática</Text>
          <TouchableOpacity style={s.hBtn}>
            <Text style={s.hIcon}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.hBtn}>
            <Text style={s.hIcon}>⋮</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {MODOS.map((modo, i) => (
            <TouchableOpacity
              key={i}
              style={[s.modoItem, modo.pro && { opacity: 0.7 }]}
              disabled={modo.pro}
              onPress={() => !modo.pro && onSelect(modo)}
            >
              <View style={s.modoIconWrap}>
                <Text style={{ fontSize: 22 }}>{modo.icon}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={s.modoLabel}>{modo.label}</Text>
                  {modo.pro && (
                    <View style={{ marginLeft: 8 }}>
                      <Badge color="#FF9800" theme={theme}>PRO</Badge>
                    </View>
                  )}
                </View>
                <Text style={s.modoDesc}>{modo.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
    </View>
  );
}

// ─── WorkspaceScreen ─────────────────────────────────────────────────────────

function WorkspaceScreen({ workspaces, activeWorkspace, onClose, onSelect, onSelectAll, onAddWorkspace, theme }) {
  const C = theme;
  const s = getStyles(C);
  const insets = useSafeAreaInsets();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inputText, setInputText] = useState('');

  const handleCreate = () => {
    if (!inputText.trim()) return;
    onAddWorkspace({ id: Date.now(), name: inputText.trim(), color: C.purple });
    setInputText('');
    setShowCreateModal(false);
  };

  const handleCancel = () => {
    setInputText('');
    setShowCreateModal(false);
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.wsHeader}>
        <TouchableOpacity onPress={onClose} style={s.hBtn}>
          <Text style={s.wsClose}>✕</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={s.hBtn}>
          <Text style={s.hIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* "Todos os conjuntos" — item fixo */}
      <TouchableOpacity
        style={[s.wsItem, activeWorkspace === null && s.wsItemActive]}
        onPress={onSelectAll}
        activeOpacity={0.8}
      >
        <View style={s.wsItemRow}>
          <View style={[s.wsBar, { backgroundColor: C.gray }]} />
          <Text style={s.wsItemText}>Todos os conjuntos</Text>
        </View>
      </TouchableOpacity>

      {/* Lista de workspaces */}
      <FlatList
        data={workspaces}
        keyExtractor={item => String(item.id)}
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.wsItem, activeWorkspace?.id === item.id && s.wsItemActive]}
            onPress={() => onSelect(item)}
            activeOpacity={0.8}
          >
            <View style={s.wsItemRow}>
              <View style={[s.wsBar, { backgroundColor: item.color }]} />
              <Text style={[s.wsItemText, { flex: 1 }]}>{item.name}</Text>
              <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ color: C.gray, fontSize: 20 }}>⋮</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={s.wsEmpty}>
            <Text style={s.wsEmptyTitle}>Nenhum conjunto criado</Text>
            <Text style={s.wsEmptyHint}>Toque em + para criar</Text>
          </View>
        }
      />

      {/* FAB + */}
      <TouchableOpacity style={s.wsFab} onPress={() => setShowCreateModal(true)}>
        <Text style={s.wsFabText}>+</Text>
      </TouchableOpacity>

      {/* Modal de criação */}
      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={handleCancel}>
        <View style={s.wsModalOverlay}>
          <View style={s.wsModalBox}>
            <Text style={s.wsModalTitle}>Novo conjunto</Text>
            <TextInput
              style={s.wsInput}
              placeholder="Nome do conjunto"
              placeholderTextColor="#666"
              value={inputText}
              onChangeText={setInputText}
              autoFocus
              onSubmitEditing={handleCreate}
            />
            <View style={s.wsModalActions}>
              <TouchableOpacity onPress={handleCancel}>
                <Text style={s.wsModalCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate}>
                <View style={s.wsModalConfirm}>
                  <Text style={s.wsModalConfirmText}>Criar</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const theme = getTheme(isDark);
  const C = theme;

  const [screen, setScreen] = useState('list');
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [workspaceModalVisible, setWorkspaceModalVisible] = useState(false);
  const [cardsReviewedToday, setCardsReviewedToday] = useState(0);
  const [practiceCardsToReview, setPracticeCardsToReview] = useState([]);

  // Executa apenas 1 vez quando o aplicativo abre
  useEffect(() => {
    seedInitialData().catch(console.error);
  }, []);

  const goReview = (deck) => { setSelectedDeck(deck); setScreen('review'); };
  const goPractice = (deck) => { setSelectedDeck(deck); setScreen('practice'); };
  const goList = () => setScreen('list');
  const goDeckDetails = (deck) => { setSelectedDeck(deck); setScreen('deckDetails'); };

  const handleReviewAll = () => {
    console.log("Refatorar para buscar cards do BD");
  };

  const handlePracticeAll = async () => {
    try {
      const allDecks = await database.get('decks').query().fetch();
      const now = Date.now();

      // 1. Seleciona os 4 conjuntos vistos há mais tempo (menor updatedAt)
      // O dbServices atualiza o Deck a cada review, logo o updatedAt reflete a última revisão
      const sortedDecks = allDecks.sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));
      const top4Decks = sortedDecks.slice(0, 4);

      let cardsToPractice = [];

      // 2. Pega os 20 cartões mais atrasados de cada um desses 4 conjuntos
      for (const deck of top4Decks) {
        const deckCards = await deck.cards.fetch();
        const delayedCards = deckCards
          .filter(c => (c.nextReviewAt || 0) <= now)
          .sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0)); // Do mais atrasado pro menos
        
        cardsToPractice.push(...delayedCards.slice(0, 20));
      }

      // 3. Pega 20 cartões "erros" (difficultyStatus === 'hard') globais, do mais atrasado para o menos
      const allCards = await database.get('cards').query().fetch();
      const hardCards = allCards
        .filter(c => c.difficultyStatus === 'hard' && (c.nextReviewAt || 0) <= now)
        .sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0))
        .slice(0, 20);

      // 4. Junta tudo em um Map para remover eventuais duplicatas (caso um "hard" já estivesse no top 4 decks)
      const uniqueCardsMap = new Map();
      [...cardsToPractice, ...hardCards].forEach(card => {
        uniqueCardsMap.set(card.id, card);
      });
      
      const finalCardsToPractice = Array.from(uniqueCardsMap.values());

      if (finalCardsToPractice.length === 0) { 
        Alert.alert("Tudo em dia!", "Você não tem cartões atrasados para praticar hoje."); 
        return; 
      }

      setPracticeCardsToReview(finalCardsToPractice);
      setScreen('review_all');
    } catch (err) { console.error("Erro ao buscar cartões para prática:", err); }
  };

  const handleDeleteDeck = async (deckId) => {
    try {
      await deleteDeckDb(deckId);
    } catch (error) {
      console.error("Erro ao deletar deck:", error);
    }
  };

  const handleUpdateDeck = async (deckId, title, desc) => {
    try {
      await updateDeck(deckId, title, desc);
    } catch (error) {
      console.error("Erro ao atualizar deck:", error);
    }
  };

  const handleAddCard = async (deckId, front, back) => {
    try {
      const deck = await database.get('decks').find(deckId);
      await createCard(deck, front, back);
    } catch (error) {
      console.error("Erro ao adicionar cartão:", error);
    }
  };

  const handleAddDeck = async (title, desc) => {
    try {
      await createDeck(title, desc);
    } catch (error) {
      console.error("Erro ao adicionar conjunto:", error);
    }
  };

  const handleRateCard = async (cardId, difficulty) => {
    try {
      await updateCardDifficulty(cardId, difficulty);
    } catch (error) {
      console.error("Erro ao avaliar cartão:", error);
    }
  };

  const handleMenuItemPress = (id) => {
    setMenuVisible(false);
    if (id === 'statistics') {
      setScreen('statistics');
    } else if (id === 'list') {
      setScreen('list');
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.bg} translucent={false} />

      {screen === 'list' && (
        <>
          {/* 
            No futuro, substitua a renderização abaixo pela importação do DeckListScreen modular.
            Ele mesmo buscará os decks, então não passaremos a prop 'decks' aqui.
          */}
      <EnhancedDeckListScreen
            onDeckPress={goDeckDetails}
            onReview={goReview}
            onPractice={goPractice}
            onReviewAll={handleReviewAll}
            onPracticeAll={handlePracticeAll}
            onDeleteDeck={handleDeleteDeck}
            onUpdateDeck={handleUpdateDeck}
            onAddCard={handleAddCard}
            onAddDeck={handleAddDeck}
            onMenuOpen={() => setMenuVisible(true)}
            activeWorkspace={activeWorkspace}
            onOpenWorkspace={() => setWorkspaceModalVisible(true)}
            cardsReviewedToday={cardsReviewedToday}
            theme={theme}
          />
          <MenuScreen
            visible={menuVisible}
            onClose={() => setMenuVisible(false)}
            onMenuItemPress={handleMenuItemPress}
            isDark={isDark}
            toggleTheme={() => { setIsDark(!isDark); setMenuVisible(false); }}
            theme={theme}
          />
        </>
      )}

      {screen === 'review_all' && (
        <ReviewScreenComponent
          deck={{ title: 'Praticar Tudo' }}
          cards={practiceCardsToReview}
          onClose={goList}
          onRate={() => setCardsReviewedToday(c => c + 1)}
          onRateCard={handleRateCard}
          theme={theme}
        />
      )}

      {screen === 'statistics' && (
        <StatisticsScreen
          onClose={goList}
          cardsReviewedToday={cardsReviewedToday}
          theme={theme}
        />
      )}

      {screen === 'practice' && (
        <PracticePicker
          deck={selectedDeck}
          onClose={goList}
          onSelect={() => setScreen('review')}
          theme={theme}
        />
      )}

      {screen === 'review' && (
        <EnhancedReviewScreen
          deck={selectedDeck}
          onClose={goList}
          onRate={() => setCardsReviewedToday(c => c + 1)}
          onRateCard={handleRateCard}
          theme={theme}
        />
      )}

      {screen === 'deckDetails' && (
        <EnhancedDeckDetailsScreen
          deck={selectedDeck}
          onBack={goList}
          onPractice={() => goPractice(selectedDeck)}
          onAddCards={() => { /* Lógica para abrir o modal de adicionar a partir desta tela no futuro */ }}
          theme={theme}
        />
      )}

      <WorkspaceSelectorModal
        visible={workspaceModalVisible}
        onClose={() => setWorkspaceModalVisible(false)}
        activeWorkspaceId={activeWorkspace?.id || null}
        onSelectWorkspace={(ws) => setActiveWorkspace(ws)}
      />
    </SafeAreaProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (C) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8 },
  hBtn: { padding: 8 },
  hIcon: { color: C.white, fontSize: 20 },
  hTitle: { color: C.white, fontSize: 18, fontWeight: 'bold', paddingLeft: 8 },

  // Workspace pill
  pill: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 30, borderWidth: 1, borderColor: '#444',
    paddingHorizontal: 16, paddingVertical: 8,
    marginHorizontal: 16, marginBottom: 12,
  },
  pillText: { color: C.blue, flex: 1, fontWeight: '500' },
  pillIconWrapper: { 
    backgroundColor: C.cardBtnBg, 
    borderRadius: 12, 
    width: 24, 
    height: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 8 
  },
  pillUpload: { color: C.blue, fontSize: 10 },

  // Action row
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 16 },
  actionBtn: { color: C.blue, fontWeight: 'bold', fontSize: 14 },

  // Daily goal
  dailyGoal: { backgroundColor: C.card, borderRadius: 8, padding: 12, marginHorizontal: 16, marginBottom: 16 },
  dailyGoalText: { color: C.white, marginBottom: 8, fontSize: 13 },

  // Progress bar
  pbBg: { height: 4, backgroundColor: C.sep, borderRadius: 2, overflow: 'hidden' },
  pbFill: { height: 4, borderRadius: 2 },

  // Deck item
  deckItem: {
    backgroundColor: C.card, borderRadius: 12,
    padding: 14, marginHorizontal: 16, marginBottom: 12,
  },
  deckName: { color: C.white, fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  deckSub: { color: C.gray, fontSize: 12, marginBottom: 8 },
  deckItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  deckMenuBtn: { paddingHorizontal: 8, paddingBottom: 8, marginRight: -8 },
  deckMenuIcon: { color: C.gray, fontSize: 20, fontWeight: 'bold' },
  deckActions: { flexDirection: 'row', marginTop: 10, gap: 16 },
  deckActionBtn: { color: C.blue, fontWeight: 'bold', fontSize: 13 },

  // Context Menu Modal
  contextOverlay: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', alignItems: 'center' },
  contextMenu: { backgroundColor: C.card, borderRadius: 12, paddingVertical: 8, width: 250, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  contextMenuItem: { paddingVertical: 12, paddingHorizontal: 20 },
  contextMenuText: { color: C.white, fontSize: 16 },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: C.bg, gap: 10 },
  footerOut: { borderRadius: 30, borderWidth: 1.5, borderColor: C.blue, paddingVertical: 14, alignItems: 'center' },
  footerOutText: { color: C.blue, fontWeight: 'bold', fontSize: 14 },
  footerFill: { borderRadius: 30, backgroundColor: C.blue, paddingVertical: 14, alignItems: 'center' },
  footerFillText: { color: C.white, fontWeight: 'bold', fontSize: 14 },

  // Badge
  badge: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' },
  badgeText: { color: C.white, fontSize: 10, fontWeight: 'bold' },

  // Modal / Menu
  modalOverlay: { flex: 1, flexDirection: 'row' },
  menuContainer: { width: '78%', height: '100%', backgroundColor: C.card },
  menuOverRight: { flex: 1, backgroundColor: '#00000066' },
  menuHeader: { padding: 20, paddingTop: 44 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#FF9800',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  avatarText: { color: C.white, fontSize: 22, fontWeight: 'bold' },
  menuName: { color: C.white, fontWeight: 'bold', fontSize: 16, marginTop: 6 },
  menuEmail: { color: '#ffffffaa', fontSize: 12, marginTop: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  menuItemIcon: { width: 22, fontSize: 16 },
  menuItemText: { color: C.white, fontSize: 14, marginLeft: 12 },
  menuSep: { height: 1, backgroundColor: C.sep, marginVertical: 4 },
  menuVersion: { color: C.gray, fontSize: 12, textAlign: 'center', padding: 16 },

  // PracticePicker
  modoItem: {
    backgroundColor: C.card, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center',
    padding: 14, marginBottom: 10,
  },
  modoIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#3B9EFF22',
    justifyContent: 'center', alignItems: 'center',
  },
  modoLabel: { color: C.white, fontWeight: 'bold', fontSize: 15 },
  modoDesc: { color: C.gray, fontSize: 12, marginTop: 2 },

  // ReviewScreen — card
  reviewCard: { flex: 1, backgroundColor: C.reviewCard, borderRadius: 16, margin: 16 },
  cardContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  cardFront: { color: C.white, fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  cardBack: { color: C.white, fontSize: 18, textAlign: 'center' },
  cardHint: { color: '#ffffff44', textAlign: 'center', paddingBottom: 60, fontSize: 12 },
  favBtn: { position: 'absolute', top: 14, left: 14, zIndex: 1 },
  replayBtn: {
    position: 'absolute', bottom: 14, right: 56,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.blue,
    justifyContent: 'center', alignItems: 'center',
  },
  nextCardBtn: {
    position: 'absolute', bottom: 14, right: 14,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.cardBtnBg,
    justifyContent: 'center', alignItems: 'center',
  },
  progressText: { color: C.gray, fontSize: 12, paddingHorizontal: 8 },
  ratingRow: { flexDirection: 'row', padding: 16, gap: 8 },
  ratingBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  ratingBtnText: { color: C.white, fontWeight: 'bold', fontSize: 14 },

  // Done screen
  doneScreen: { justifyContent: 'center', alignItems: 'center' },
  doneTitle: { color: C.white, fontSize: 28, fontWeight: 'bold', marginTop: 16, marginBottom: 24 },
  ratingsRow: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  ratingChip: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  ratingChipText: { color: C.white, fontWeight: 'bold' },
  backBtn: { backgroundColor: C.blue, borderRadius: 30, paddingHorizontal: 40, paddingVertical: 14 },
  backBtnText: { color: C.white, fontWeight: 'bold', fontSize: 16 },

  // WorkspaceScreen
  wsHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: C.card },
  wsClose: { color: C.white, fontSize: 22 },
  wsItem: { backgroundColor: C.card, borderRadius: 12, marginHorizontal: 16, marginBottom: 8 },
  wsItemRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  wsItemActive: { backgroundColor: '#00897B' },
  wsBar: { width: 4, height: 28, borderRadius: 2, marginRight: 14 },
  wsItemText: { color: C.white, fontWeight: '600', fontSize: 15 },
  wsEmpty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  wsEmptyTitle: { color: C.gray, fontSize: 14 },
  wsEmptyHint: { color: '#666', fontSize: 12, marginTop: 4 },
  wsFab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.blue,
    justifyContent: 'center', alignItems: 'center',
  },
  wsFabText: { color: C.white, fontSize: 28, lineHeight: 56, textAlign: 'center' },
  wsModalOverlay: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', alignItems: 'center' },
  wsModalBox: { backgroundColor: C.card, borderRadius: 16, padding: 24, marginHorizontal: 32, width: '85%' },
  wsModalTitle: { color: C.white, fontWeight: 'bold', fontSize: 16, marginBottom: 16 },
  wsInput: { color: C.white, backgroundColor: C.bg, borderRadius: 8, padding: 12, fontSize: 15 },
  wsModalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16, alignItems: 'center' },
  wsModalCancel: { color: C.gray, fontSize: 14 },
  wsModalConfirm: { backgroundColor: C.blue, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  wsModalConfirmText: { color: C.white, fontWeight: 'bold', fontSize: 14 },

  // DeckDetailsScreen
  ddHeader: { backgroundColor: C.bg, paddingTop: 8 },
  ddHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8 },
  ddHeaderIcons: { flexDirection: 'row' },
  ddTabs: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  ddTabActive: { borderBottomWidth: 3, borderBottomColor: C.blue, paddingHorizontal: 16, paddingVertical: 8 },
  ddTabText: { color: C.blue, fontWeight: 'bold', fontSize: 15 },
  ddListContent: { padding: 16, paddingBottom: 120 },
  ddCard: { flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 16, minHeight: 140, justifyContent: 'space-between', marginBottom: 12 },
  ddCardFront: { color: C.white, fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  ddCardBack: { color: C.gray, fontSize: 14 },
  ddCardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, borderTopWidth: 1, borderTopColor: C.sep, paddingTop: 12 },
  ddCardIcon: { color: C.gray, fontSize: 18 },
  ddFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 16, backgroundColor: C.bg, gap: 12, borderTopWidth: 1, borderTopColor: C.sep },
  ddFooterBtn: { flex: 1, backgroundColor: C.blue, borderRadius: 30, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  ddFooterBtnText: { color: C.white, fontWeight: 'bold', fontSize: 13 },
  ddFab: {
    position: 'absolute', bottom: 90, right: 16,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#FF9800',
    justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4
  },
  ddFabText: { fontSize: 24 },
});
