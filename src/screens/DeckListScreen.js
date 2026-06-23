import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, ScrollView, TextInput, Share, Alert, Switch, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { z } from 'zod';
import * as Speech from 'expo-speech';

import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useNavigation } from '@react-navigation/native';
import { eq, like, asc, sql } from 'drizzle-orm';
import db from '../../db';
import { sets, cards } from '../../db/schema';
import { ProgressBar } from '../components/Shared';
import CreateDeckModal from '../components/CreateDeckModal';
import MenuScreen from '../components/MenuScreen';
import { AppContext } from '../context/AppContext';
import { tempImportText } from '../temp_import';
import { buildCycleCards } from '../../dbServices.drizzle';
import { useCicloConfigStore } from '../store/useCicloConfigStore';

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

const flashcardSchema = z.array(
  z.object({
    front: z.string({
      required_error: "O campo 'front' (frente) é obrigatório.",
      invalid_type_error: "O campo 'front' deve ser uma string de texto."
    }).min(1, "A frente do cartão ('front') não pode ser vazia."),
    back: z.string({
      required_error: "O campo 'back' (verso) é obrigatório.",
      invalid_type_error: "O campo 'back' deve ser uma string de texto."
    }).min(1, "O verso do cartão ('back') não pode ser vazio.")
  })
);

const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];
const getDeckColor = (id) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
};

const DeckItem = ({ deck, stats, isTarget, setMenuAtivo }) => {
  const { theme } = useContext(AppContext);
  const navigation = useNavigation();

  const totalCards = stats?.total || 0;
  const progress = totalCards > 0 ? (stats.memorized / totalCards) * 100 : 0;
  const color = getDeckColor(deck.id);

  return (
    <Pressable
      style={[localStyles.card, { backgroundColor: theme.card, borderLeftColor: color }, isTarget && { borderColor: '#F44336', borderWidth: 2 }]}
      onPress={() => navigation.navigate('DeckDetails', { deckId: deck.id })}
    >
      <View style={localStyles.cardContent}>
        <View style={localStyles.cardHeader}>
          <Text style={[localStyles.cardTitle, { color: theme.white }]}>{deck.title}</Text>
          <Text style={localStyles.cardSubtitle}>{totalCards} cartões</Text>
        </View>

        <View style={localStyles.progressContainer}>
          <View style={localStyles.progressBarBackground}>
            <View
              style={[
                localStyles.progressBarFill,
                { width: `${progress}%`, backgroundColor: color }
              ]}
            />
          </View>
        </View>
      </View>

      <View style={localStyles.cardRight}>
        <View style={[localStyles.progressCircle, { borderColor: color }]}>
          <Text style={[localStyles.progressCircleText, { color: theme.white }]}>{Math.round(progress)}%</Text>
        </View>
        <TouchableOpacity onPress={() => setMenuAtivo(deck.id)} style={{ padding: 8 }}>
          <Ionicons name="ellipsis-vertical" size={24} color={theme.gray || '#ccc'} />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
};

function DeckListScreen({ decks = [], totalCardsCount = 0, deckStats = [] }) {
  const { theme, styles, cardsReviewedToday, dailyGoal, targetReviewDecks, isDark, setIsDark, preferredVoices, handleSetPreferredVoice, autoPlayAudio, handleSetAutoPlayAudio, cardFontSize, updateSettings, showStopwatch, setShowStopwatch } = useContext(AppContext);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [menuAtivo, setMenuAtivo] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [textSizeModalVisible, setTextSizeModalVisible] = useState(false);
  const [tempTextSize, setTempTextSize] = useState(24);
  const [isSearching, setIsSearching] = useState(false);
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [stopwatchModalVisible, setStopwatchModalVisible] = useState(false);

  const [actionDeckId, setActionDeckId] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editFrontLang, setEditFrontLang] = useState('');
  const [editBackLang, setEditBackLang] = useState('');

  const [cardModal, setCardModal] = useState(false);
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardTag, setCardTag] = useState('');

  const [deckModal, setDeckModal] = useState(false);

  const [dailyGoalMenuVisible, setDailyGoalMenuVisible] = useState(false);
  const [langPickerVisible, setLangPickerVisible] = useState(false);
  const [langPickerTarget, setLangPickerTarget] = useState('');
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importText, setImportText] = useState('');
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportFileName, setExportFileName] = useState('');
  const [exportActionDeckId, setExportActionDeckId] = useState(null);

  const [voicesConfigModalVisible, setVoicesConfigModalVisible] = useState(false);
  const [voiceSelectionModalVisible, setVoiceSelectionModalVisible] = useState(false);
  const [selectedLang, setSelectedLang] = useState('pt-BR');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState([]);

  const handleDeleteDuplicate = async (cardId) => {
    Alert.alert(
      'Excluir Duplicata',
      'Tem certeza que deseja excluir este cartão duplicado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await db.delete(cards).where(eq(cards.id, cardId));
              setDuplicateGroups(prevGroups => {
                const newGroups = prevGroups.map(group => ({
                  ...group,
                  cards: group.cards.filter(c => c.id !== cardId)
                })).filter(group => group.cards.length > 1);
                
                if (newGroups.length === 0) {
                  setDuplicateModalVisible(false);
                }
                return newGroups;
              });
            } catch (err) {
              console.error('Erro ao excluir duplicata:', err);
              Alert.alert('Erro', 'Não foi possível excluir o cartão.');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    Speech.getAvailableVoicesAsync().then(setAvailableVoices);
  }, []);

  const getVoiceEmoji = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('female') || n.includes('woman') || n.includes('girl') || n.includes('zira') || n.includes('maria') || n.includes('luciana') || n.includes('helena') || n.includes('vitoria') || n.includes('siri female') || n.includes('femenino') || n.includes('femenina')) return '👩';
    if (n.includes('male') || n.includes('man') || n.includes('boy') || n.includes('david') || n.includes('daniel') || n.includes('thiago') || n.includes('siri male') || n.includes('masculino')) return '👨';
    return '🗣️';
  };

  const openLangPicker = (target) => {
    setLangPickerTarget(target);
    setLangPickerVisible(true);
  };

  const selectLanguage = (code) => {
    if (langPickerTarget === 'editFront') setEditFrontLang(code);
    else if (langPickerTarget === 'editBack') setEditBackLang(code);
    else if (langPickerTarget === 'voiceConfig') setSelectedLang(code);
    setLangPickerVisible(false);
  };

  const normalizeText = (text = '') => {
    return String(text)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  };

  const handleFindDuplicateCards = async () => {
    try {
      const allCards = await db.select({ id: cards.id, set_id: cards.set_id, front: cards.front, back: cards.back }).from(cards).all();
      const deckTitleMap = new Map(decks.map((deck) => [deck.id, deck.title]));
      const groupsMap = new Map();

      allCards.forEach((card) => {
        const key = normalizeText(card.front);
        if (!key) return;
        const entry = { ...card, deckTitle: deckTitleMap.get(card.set_id) || 'Sem conjunto' };
        const existing = groupsMap.get(key) || [];
        existing.push(entry);
        groupsMap.set(key, existing);
      });

      const groups = [];
      for (const [front, cardsList] of groupsMap.entries()) {
        if (cardsList.length > 1) {
          groups.push({ front, cards: cardsList });
        }
      }

      setDuplicateGroups(groups);
      setDuplicateModalVisible(true);
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
      Alert.alert('Erro', 'Não foi possível verificar duplicatas.');
    }
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

  const processarDeckDeFlashcards = async (texto) => {
    try {
      console.log('=== PROCESSANDO FLASHCARDS ===');
      console.log('Tamanho do texto:', texto.length);

      const normalized = texto
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\\r\\n/g, '\n')
        .replace(/\\r/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/\u00A0/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .normalize('NFC');

      const lines = normalized.split('\n');
      let title = 'Conjunto Importado';
      let description = '';
      const parsedCards = [];
      let currentCard = null;
      let currentField = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length === 0) continue;

        const upperLine = line.toUpperCase();
        // Corrige a regex para remover os acentos corretamente (sem escape duplo)
        const safeMatchLine = upperLine.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        if (safeMatchLine.startsWith('#CONJUNTO:')) {
          title = line.substring(10).trim();
        } else if (safeMatchLine.startsWith('#DESCRICAO:') || safeMatchLine.startsWith('#DESCRIÇÃO:')) {
          description = line.substring(11).trim();
        } else if (safeMatchLine === '#CARTAO') {
          // Quando encontrar #CARTÃO, finaliza o cartão atual se for válido
          if (currentCard && currentCard.frente && currentCard.verso) {
            parsedCards.push(currentCard);
          }
          currentCard = { frente: '', verso: '', tag: '' };
          currentField = null;
        } else if (safeMatchLine.startsWith('FRENTE:')) {
          if (!currentCard || currentCard.frente) {
            if (currentCard && currentCard.frente && currentCard.verso) {
              parsedCards.push(currentCard);
            }
            currentCard = { frente: '', verso: '', tag: '' };
          }
          const contentMatch = line.match(/^FRENTE:\s*(.*)$/i);
          currentCard.frente = contentMatch ? contentMatch[1].trim() : line.substring(7).trim();
          currentField = 'frente';
        } else if (safeMatchLine.startsWith('VERSO:')) {
          if (!currentCard) currentCard = { frente: '', verso: '', tag: '' };
          const contentMatch = line.match(/^VERSO:\s*(.*)$/i);
          currentCard.verso = contentMatch ? contentMatch[1].trim() : line.substring(6).trim();
          currentField = 'verso';
        } else if (safeMatchLine.startsWith('TAG:')) {
          if (!currentCard) currentCard = { frente: '', verso: '', tag: '' };
          const contentMatch = line.match(/^TAG:\s*(.*)$/i);
          currentCard.tag = contentMatch ? contentMatch[1].trim() : line.substring(4).trim();
          currentField = 'tag';
        } else if (currentCard && currentField) {
          // Concatena quebra de linha literal
          currentCard[currentField] += '\n' + line;
        }
      }

      if (currentCard && currentCard.frente && currentCard.verso) {
        parsedCards.push(currentCard);
      }

      console.log('Cartões válidos encontrados:', parsedCards.length);
      console.log('Título:', title);

      if (parsedCards.length === 0) {
        Alert.alert(
          'Erro de Formatação',
          'Nenhum cartão válido foi encontrado.\n\nCausa: O texto não segue o padrão exigido.\n\nExemplo esperado:\n#CARTÃO\nFRENTE: sua pergunta\nVERSO: sua resposta'
        );
        return;
      }

      const newDeckId = genId();
      await db.insert(sets).values({
        id: newDeckId,
        title: title,
        description: description,
        frontLanguage: 'pt-BR',
        backLanguage: 'en-US',
      }).returning();

      for (const c of parsedCards) {
        await db.insert(cards).values({
          id: genId(),
          set_id: newDeckId,
          front: c.frente.trim(),
          back: c.verso.trim(),
          next_review_date: Date.now(),
          ease_factor: 250,
          difficultyStatus: 'new',
          tag: c.tag ? c.tag.trim() : null
        }).returning();
      }

      Alert.alert('Sucesso', `Conjunto '${title}' criado com ${parsedCards.length} cartões!`);
    } catch (error) {
      console.error('Erro ao processar flashcards:', error);
      Alert.alert(
        'Erro na Importação',
        `Não foi possível concluir a importação.\n\nTipo: ${error.name || 'Erro Desconhecido'}\nCausa: ${error.message || 'Falha no processamento do texto ou banco de dados.'}`
      );
    }
  };

  const handleJSONClipboardImport = async () => {
    try {
      console.log('=== INICIANDO IMPORTAÇÃO DE JSON DA ÁREA DE TRANSFERÊNCIA ===');
      const clipboardContent = await Clipboard.getStringAsync();

      if (!clipboardContent || !clipboardContent.trim()) {
        Alert.alert('Área de Transferência Vazia', 'Não há nenhum conteúdo copiado na sua área de transferência para importar.');
        return;
      }

      // Limpeza preventiva de caracteres invisíveis
      const sanitizedContent = clipboardContent
        .replace(/\u00A0/g, ' ') // Substitui Non-breaking spaces por espaço normal
        .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove Zero-width spaces e BOM

      let parsedData;
      try {
        parsedData = JSON.parse(sanitizedContent);
      } catch (jsonError) {
        Alert.alert('JSON Inválido', 'JSON Inválido ou mal formatado.');
        return;
      }

      let cardsArray = parsedData;

      // Verifica se a propriedade cartoes existe e é um array antes de iterar
      if (parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData)) {
        if (parsedData.cartoes && Array.isArray(parsedData.cartoes)) {
          cardsArray = parsedData.cartoes;
        } else {
          Alert.alert('Formato Inválido', 'O objeto JSON deve conter uma propriedade "cartoes" que seja um array.');
          return;
        }
      } else if (!Array.isArray(cardsArray)) {
        Alert.alert('Formato Inválido', 'O JSON fornecido não é um array válido e não possui a propriedade "cartoes".');
        return;
      }

      // Normaliza os nomes das propriedades para se adequar ao esquema (front/back)
      const normalizedCards = cardsArray.map(item => {
        if (!item || typeof item !== 'object') return item;
        return {
          front: item.front || item.frente || '',
          back: item.back || item.verso || ''
        };
      });

      let validatedCards;
      try {
        validatedCards = flashcardSchema.parse(normalizedCards);
      } catch (zodError) {
        if (zodError instanceof z.ZodError) {
          const errorsFormatted = zodError.errors.map((err) => {
            const index = typeof err.path[0] === 'number' ? `no cartão #${err.path[0] + 1}` : '';
            const field = err.path[1] ? `campo '${err.path[1]}'` : '';
            const location = [index, field].filter(Boolean).join(', ');
            return `- ${location ? `${location}: ` : ''}${err.message}`;
          }).join('\n');

          Alert.alert('Erro de Validação JSON', `O JSON possui os seguintes problemas:\n\n${errorsFormatted}`);
        } else {
          Alert.alert('Erro de Validação', 'Ocorreu um erro ao validar os dados do JSON.');
        }
        return;
      }

      if (validatedCards.length === 0) {
        Alert.alert('Importação Vazia', 'Nenhum cartão foi encontrado no JSON fornecido.');
        return;
      }

      const newDeckId = genId();
      const title = `Importado via JSON (${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`;

      await db.insert(sets).values({
        id: newDeckId,
        title: title,
        description: 'Conjunto criado por importação de JSON da área de transferência.',
        frontLanguage: 'pt-BR',
        backLanguage: 'en-US',
      }).returning();

      for (const cardData of validatedCards) {
        await db.insert(cards).values({
          id: genId(),
          set_id: newDeckId,
          front: cardData.front.trim(),
          back: cardData.back.trim(),
          next_review_date: Date.now(),
          ease_factor: 250,
          difficultyStatus: 'new',
        }).returning();
      }

      setImportModalVisible(false);
      Alert.alert('Sucesso', `Conjunto '${title}' criado com sucesso com ${validatedCards.length} cartões!`);

    } catch (error) {
      console.error('Erro na importação JSON da área de transferência:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar o JSON no banco de dados local.');
    }
  };

  const handleImport = () => {
    setImportText('');
    setImportModalVisible(true);
  };

  const handleFileImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const fileName = file.name.toLowerCase();

      if (!fileName.endsWith('.txt') && !fileName.endsWith('.md') && !fileName.endsWith('.json')) {
        Alert.alert('Formato Inválido', 'Por favor, selecione um arquivo .txt, .md ou .json');
        return;
      }

      let fileContent = '';
      try {
        fileContent = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } catch (readError) {
        console.warn('Fallback: readAsStringAsync falhou, tentando fetch.', readError);
        const response = await fetch(file.uri);
        fileContent = await response.text();
      }

      console.log('=== IMPORTAÇÃO DE ARQUIVO ===');
      console.log('Arquivo:', fileName);
      console.log('Tamanho (caracteres):', fileContent.length);

      // Tenta decodificar como JSON primeiro aplicando a higienização rigorosa
      const sanitizedContent = fileContent
        .replace(/[\r\n]+/g, ' ') // Remove quebras de linha literais
        .replace(/\t/g, ' ') // Remove tabulações literais
        .replace(/[“”]/g, '"') // Converte aspas duplas inteligentes para aspas padrão
        .replace(/[‘’]/g, "'") // Converte aspas simples inteligentes para aspas padrão
        .replace(/\u00A0/g, ' ') // Remove espaços inquebráveis
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove caracteres invisíveis/BOM
        .trim();

      let isJson = false;
      let parsedData = null;

      if (sanitizedContent.startsWith('{') || sanitizedContent.startsWith('[')) {
        try {
          parsedData = JSON.parse(sanitizedContent);
          isJson = true;
        } catch (e) {
          console.warn('Arquivo não é JSON válido ou tem erros de sintaxe, fallback para modo TXT.');
        }
      }

      setImportModalVisible(false);

      if (isJson && parsedData && typeof parsedData === 'object' && Array.isArray(parsedData.cartoes)) {
        // == FLUXO JSON ==
        const cartoesMapeados = parsedData.cartoes.map(item => ({
          frente: item.frente || item.front || '',
          verso: item.verso || item.back || ''
        })).filter(c => c.frente.trim() !== '' && c.verso.trim() !== '');

        if (cartoesMapeados.length === 0) {
          Alert.alert('Arquivo Vazio', 'A propriedade "cartoes" não contém itens válidos no JSON.');
          return;
        }

        const newDeckId = genId();
        const title = parsedData.conjunto || `Importado via JSON (${new Date().toLocaleDateString('pt-BR')})`;
        const desc = parsedData.descricao || 'Conjunto criado por importação de arquivo JSON.';

        await db.insert(sets).values({
          id: newDeckId,
          title: title,
          description: desc,
          frontLanguage: 'pt-BR',
          backLanguage: 'en-US',
        }).returning();

        for (const cardData of cartoesMapeados) {
          await db.insert(cards).values({
            id: genId(),
            set_id: newDeckId,
            front: cardData.frente.trim(),
            back: cardData.verso.trim(),
            tag: cardData.tag ? cardData.tag.trim() : null,
            next_review_date: Date.now(),
            ease_factor: 250,
            difficultyStatus: 'new',
          }).returning();
        }

        Alert.alert('Sucesso', `Conjunto '${title}' importado via JSON com ${cartoesMapeados.length} cartões!`);
      } else {
        // == FLUXO TXT PROPRIETÁRIO (#CONJUNTO) ==
        await processarDeckDeFlashcards(fileContent);
      }

    } catch (error) {
      console.error('Erro ao importar arquivo:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar ler o arquivo selecionado.');
    }
  };

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
      setCardTag('');
      setCardModal(true);
    } else if (action === 'share' || action === 'export') {
      const deckCards = await db.select().from(cards).where(eq(cards.set_id, deckId)).all();
      if (deckCards.length === 0) {
        Alert.alert('Baralho Vazio', 'Não há cartões neste conjunto para compartilhar.');
        return;
      }
      if (action === 'export') {
        setExportActionDeckId(deckId);
        setExportFileName(deck.title.replace(/[^a-zA-Z0-9_-]/g, '_'));
        setExportModalVisible(true);
      } else {
        const textToShare = deckCards.map(c => `P: ${c.front}\nR: ${c.back}`).join('\n\n');
        await Share.share({ message: `Confira meu conjunto de estudos "${deck.title}":\n\n${textToShare}` });
      }
    } else if (action === 'archive') {
      Alert.alert('Arquivar', 'A funcionalidade de arquivamento será disponibilizada na próxima atualização!');
    }
  };

  const handleExportAllMD = async () => {
    setDailyGoalMenuVisible(false);
    setExportActionDeckId(null);
    setExportFileName('todos_conjuntos');
    setExportModalVisible(true);
  };

  const executeFileExport = async () => {
    if (!exportFileName.trim()) {
      Alert.alert('Nome inválido', 'Por favor, insira um nome para o arquivo.');
      return;
    }
    
    try {
      const isAll = exportActionDeckId === null;
      const decksToExport = isAll ? decks : decks.filter(d => d.id === exportActionDeckId);
      
      let textToExport = '';
      for (const deck of decksToExport) {
        const deckCards = await db.select().from(cards).where(eq(cards.set_id, deck.id)).all();
        textToExport += `#CONJUNTO: ${deck.title}\n`;
        if (deck.description) textToExport += `#DESCRIÇÃO: ${deck.description}\n`;
        textToExport += '\n';
        deckCards.forEach(c => { 
          textToExport += `#CARTÃO\nFRENTE: ${c.front}\nVERSO: ${c.back}\n`; 
          if (c.tag) textToExport += `TAG: ${c.tag}\n`;
          textToExport += '\n';
        });
      }
      
      const safeName = exportFileName.trim().endsWith('.txt') ? exportFileName.trim() : `${exportFileName.trim()}.txt`;
      const fileUri = `${FileSystem.cacheDirectory}${safeName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, textToExport.trim(), { encoding: FileSystem.EncodingType.UTF8 });
      
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Salvar Arquivo de Flashcards',
          UTI: 'public.plain-text'
        });
      } else {
        Alert.alert('Erro', 'O compartilhamento não está disponível neste dispositivo.');
      }
      
      setExportModalVisible(false);
    } catch (error) {
      console.error('Erro ao exportar arquivo:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao gerar o arquivo de exportação.');
    }
  };

  const onUpdateDeck = async (id, t, d, fL, bL) => {
    try {
      await db.update(sets).set({ title: t, description: d, frontLanguage: fL, backLanguage: bL }).where(eq(sets.id, id)).returning();
    } catch (e) { console.error(e); }
  };
  const onDeleteDeck = async (id) => {
    try {
      await db.delete(cards).where(eq(cards.set_id, id)).returning();
      await db.delete(sets).where(eq(sets.id, id)).returning();
    } catch (e) { console.error(e); }
  };
  const onAddCard = async (id, f, b, t) => {
    try {
      const newCardId = genId();
      await db.insert(cards).values({
        id: newCardId,
        set_id: id,
        front: f,
        back: b,
        tag: t ? t.trim() : null,
        next_review_date: Date.now(),
        ease_factor: 250,
        difficultyStatus: 'new'
      }).returning();
    } catch (e) { console.error(e); }
  };

  const handleReviewAll = () => navigation.navigate('Review', { reviewAll: true, studyMode: 'review' });
  const handlePracticeAll = () => navigation.navigate('Review', { practiceAll: true, studyMode: 'practice' });

  const cicloConfig = useCicloConfigStore();
  const handleCycleStudy = async () => {
    try {
      const ciclo = await buildCycleCards({
        qtdConjuntosAtrasados: cicloConfig.qtdConjuntosAtrasados,
        cardsPorConjuntoAtrasado: cicloConfig.cardsPorConjuntoAtrasado,
        cardsPorConjuntoObrigatorio: cicloConfig.cardsPorConjuntoObrigatorio,
        cardsErrosAnteriores: cicloConfig.cardsErrosAnteriores,
        cardsImportantes: cicloConfig.cardsImportantes,
        qtdConjuntosFixosPorCiclo: cicloConfig.qtdConjuntosFixosPorCiclo,
        cardsPorConjuntoFixo: cicloConfig.cardsPorConjuntoFixo,
        limiteAtivo: cicloConfig.limiteAtivo,
        limiteDiarioTotal: cicloConfig.limiteDiarioTotal,
      });
      if (ciclo.cards.length === 0) {
        Alert.alert('Ciclo Vazio', 'Nenhum card disponível para o ciclo de estudo com as configurações atuais.');
        return;
      }
      navigation.navigate('Review', { cycleCardIds: ciclo.cards.map(c => c.id) });
    } catch (e) {
      console.error('Erro ao montar ciclo:', e);
      Alert.alert('Erro', 'Não foi possível montar o ciclo de estudo.');
    }
  };

  const filteredDecks = decks.filter(deck => {
    const query = cardSearchQuery.trim().toLowerCase();
    if (query.length === 0) return true;
    return (deck.title || '').toLowerCase().includes(query);
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.hBtn}>
          <Text style={styles.hIcon}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <TextInput
            style={{ color: theme.white, backgroundColor: theme.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginHorizontal: 8 }}
            placeholder="Pesquisar conjuntos e cartões..."
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
            renderItem={({ item }) => {
              const parentDeck = decks.find(d => d.id === item.set_id);
              return (
                <TouchableOpacity
                  style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.sep }}
                  onPress={() => {
                    setCardSearchQuery('');
                    navigation.navigate('DeckDetails', { deckId: item.set_id });
                  }}
                >
                  <Text style={{ color: theme.white, fontWeight: 'bold' }}>{item.front}</Text>
                  <Text style={{ color: theme.gray }}>{item.back}</Text>
                  {parentDeck && <Text style={{ color: theme.purple || '#BB86FC', fontSize: 11, marginTop: 2 }}>📁 {parentDeck.title}</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      <TouchableOpacity style={styles.pill} onPress={() => {/* onOpenWorkspace */ }} activeOpacity={0.7}>
        <Text style={styles.pillText}>{'Todos os conjuntos'}</Text>
        <View style={styles.pillIconWrapper}><Text style={styles.pillUpload}>▼</Text></View>
      </TouchableOpacity>

      <View style={styles.actionRow}>
        <TouchableOpacity onPress={handleReviewAll}>
          <Text style={styles.actionBtn}>REVISÃO</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePracticeAll}>
          <Text style={styles.actionBtn}>PRATICA</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCycleStudy}>
          <Text style={[styles.actionBtn, { color: '#4DA8DA' }]}>📚 CICLO</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleFindDuplicateCards}>
          <Text style={[styles.actionBtn, { color: '#FF9800' }]}>DUPLICATAS</Text>
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
        renderItem={({ item }) => {
          const stats = deckStats.find(s => s.setId === item.id) || { total: 0, memorized: 0 };
          return (
            <DeckItem
              deck={item}
              stats={stats}
              isTarget={targetReviewDecks?.includes(item.id)}
              setMenuAtivo={setMenuAtivo}
            />
          );
        }}
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
            <TextInput style={[styles.wsInput, { marginTop: 10 }]} placeholder="Tag (Opcional)" placeholderTextColor="#666" value={cardTag} onChangeText={setCardTag} />
            <View style={styles.wsModalActions}>
              <TouchableOpacity onPress={() => setCardModal(false)}><Text style={styles.wsModalCancel}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { if (cardFront.trim() && cardBack.trim()) { onAddCard(actionDeckId, cardFront, cardBack, cardTag); setCardFront(''); setCardBack(''); setCardTag(''); } }}>
                <View style={styles.wsModalConfirm}><Text style={styles.wsModalConfirmText}>Adicionar +</Text></View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { if (cardFront.trim() && cardBack.trim()) { onAddCard(actionDeckId, cardFront, cardBack, cardTag); } setCardModal(false); }}>
                <View style={[styles.wsModalConfirm, { backgroundColor: '#4CAF50' }]}><Text style={styles.wsModalConfirmText}>Concluir</Text></View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CreateDeckModal
        visible={deckModal}
        onClose={() => setDeckModal(false)}
        onCreated={() => {
          // Callback opcional para atualizar a lista principal; o useLiveQuery do DeckListScreen
          // já reagirá à inserção no SQLite automaticamente, mas este callback permite
          // disparar ações adicionais se necessário.
          console.log('Novo conjunto criado com sucesso');
        }}
      />

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
      <Modal visible={duplicateModalVisible} transparent animationType="fade" onRequestClose={() => setDuplicateModalVisible(false)}>
        <TouchableOpacity style={styles.contextOverlay} activeOpacity={1} onPress={() => setDuplicateModalVisible(false)}>
          <View style={[styles.contextMenu, { width: '90%', maxHeight: '80%', padding: 16 }]}>
            <Text style={[styles.contextMenuText, { fontSize: 18, fontWeight: 'bold', marginBottom: 12 }]}>Duplicatas de Cartões</Text>
            {duplicateGroups.length === 0 ? (
              <Text style={{ color: theme.white, marginBottom: 16 }}>Nenhuma duplicata encontrada.</Text>
            ) : (
              <ScrollView style={{ marginBottom: 16 }}>
                {duplicateGroups.map((group, index) => (
                  <View key={`${group.front}-${index}`} style={{ marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.sep }}>
                    <Text style={{ color: theme.white, fontWeight: 'bold', marginBottom: 6 }}>{group.front}</Text>
                    {group.cards.map((card) => (
                      <View key={card.id} style={{ marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1, paddingRight: 12 }}>
                          <Text style={{ color: theme.white }}>{card.deckTitle}</Text>
                          <Text style={{ color: theme.gray, fontSize: 13 }}>{card.back}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteDuplicate(card.id)} style={{ padding: 8 }}>
                          <Text style={{ color: '#FF6B6B', fontSize: 18 }}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity onPress={() => setDuplicateModalVisible(false)}>
              <View style={[styles.wsModalConfirm, { backgroundColor: theme.purple, marginTop: 8 }]}>
                <Text style={styles.wsModalConfirmText}>Fechar</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={importModalVisible} transparent animationType="fade" onRequestClose={() => setImportModalVisible(false)}>
        <View style={styles.wsModalOverlay}>
          <View style={styles.wsModalBox}>
            <Text style={styles.wsModalTitle}>Importar Flashcards</Text>
            <Text style={{ color: theme.gray, fontSize: 12, marginBottom: 16 }}>
              ⚠️ O campo de texto tem limite de ~3600 caracteres. Para importar 175+ cartões, use um arquivo.
            </Text>

            <View style={{ backgroundColor: theme.card, padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ color: theme.white, fontSize: 13, fontWeight: 'bold', marginBottom: 4 }}>Formatação Aceita:</Text>
              <Text style={{ color: theme.gray, fontSize: 12, fontFamily: 'monospace' }}>
                #CONJUNTO: Nome do Conjunto{'\n'}
                #DESCRIÇÃO: (Opcional){'\n\n'}
                #CARTÃO{'\n'}
                FRENTE: Pergunta 1{'\n'}
                VERSO: Resposta 1{'\n'}
                TAG: (Opcional){'\n\n'}
                #CARTÃO{'\n'}
                FRENTE: Pergunta 2{'\n'}
                VERSO: Resposta 2
              </Text>
            </View>

            <Text style={{ color: theme.white, fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>Opção 1: Arquivo (.txt / .md)</Text>
            <TouchableOpacity onPress={handleFileImport} style={{ marginBottom: 16 }}>
              <View style={[styles.wsModalConfirm, { width: '100%', backgroundColor: theme.purple || '#673AB7' }]}>
                <Text style={styles.wsModalConfirmText}>📂 Selecionar Arquivo</Text>
              </View>
            </TouchableOpacity>

            <Text style={{ color: theme.white, fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>Opção 2: Área de Transferência (JSON)</Text>
            <TouchableOpacity onPress={handleJSONClipboardImport} style={{ marginBottom: 16 }}>
              <View style={[styles.wsModalConfirm, { width: '100%', backgroundColor: '#2196F3' }]}>
                <Text style={styles.wsModalConfirmText}>📋 Importar JSON Copiado</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (tempImportText) {
                  setImportText(tempImportText);
                } else {
                  Alert.alert('Aviso', 'O texto de teste está vazio.');
                }
              }}
              style={{ marginBottom: 12 }}
            >
              <View style={[styles.wsModalConfirm, { width: '100%', backgroundColor: '#4CAF50' }]}>
                <Text style={styles.wsModalConfirmText}>🧪 Preencher Texto de Teste (TXT)</Text>
              </View>
            </TouchableOpacity>

            <Text style={{ color: theme.white, fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>Opção 3: Colar Texto (limitado)</Text>
            <TextInput
              style={[styles.wsInput, { height: 120, textAlignVertical: 'top' }]}
              placeholder="Cole pequenos conjuntos aqui..."
              placeholderTextColor="#666"
              multiline
              scrollEnabled
              maxLength={3500}
              value={importText}
              onChangeText={setImportText}
            />
            <View style={[styles.wsModalActions, { marginTop: 16 }]}>
              <TouchableOpacity onPress={() => setImportModalVisible(false)}>
                <Text style={styles.wsModalCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { if (importText.trim()) { processarDeckDeFlashcards(importText); setImportModalVisible(false); } else { Alert.alert('Erro', 'O texto está vazio.'); } }} >
                <View style={styles.wsModalConfirm}><Text style={styles.wsModalConfirmText}>Importar Texto</Text></View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Exportação de Arquivo */}
      <Modal visible={exportModalVisible} transparent animationType="fade" onRequestClose={() => setExportModalVisible(false)}>
        <View style={styles.wsModalOverlay}>
          <View style={styles.wsModalBox}>
            <Text style={styles.wsModalTitle}>Exportar Cartões</Text>
            <Text style={{ color: theme.gray, fontSize: 13, marginBottom: 12 }}>
              Escolha um nome para o arquivo que será salvo no dispositivo:
            </Text>
            <TextInput 
              style={styles.wsInput} 
              placeholder="Ex: meus_flashcards" 
              placeholderTextColor="#666" 
              value={exportFileName} 
              onChangeText={setExportFileName} 
            />
            <View style={styles.wsModalActions}>
              <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                <Text style={styles.wsModalCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={executeFileExport}>
                <View style={styles.wsModalConfirm}>
                  <Text style={styles.wsModalConfirmText}>Exportar Arquivo</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Configuração de Vozes */}
      <Modal visible={voicesConfigModalVisible} transparent animationType="fade" onRequestClose={() => setVoicesConfigModalVisible(false)}>
        <View style={styles.wsModalOverlay}>
          <View style={[styles.wsModalBox, { maxHeight: '80%', width: '90%' }]}>
            <Text style={styles.wsModalTitle}>Configurar Vozes</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, backgroundColor: theme.card, padding: 12, borderRadius: 8 }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ color: theme.white, fontSize: 14, fontWeight: 'bold' }}>Leitura Automática</Text>
                <Text style={{ color: theme.gray, fontSize: 12, marginTop: 4 }}>Ler automaticamente ao abrir ou virar os cards.</Text>
              </View>
              <Switch
                value={autoPlayAudio}
                onValueChange={handleSetAutoPlayAudio}
                trackColor={{ false: theme.sep, true: theme.purple || '#673AB7' }}
                thumbColor={'#FFF'}
              />
            </View>

            <Text style={{ color: theme.gray, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
              Selecione o idioma abaixo para escolher a voz que será utilizada durante a leitura dos cards.
            </Text>

            <ScrollView style={{ marginTop: 8, marginBottom: 16 }}>
              {SUPPORTED_LANGUAGES.map(lang => (
                <View key={lang.code} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.sep }}>
                  <Text style={{ color: theme.white, fontSize: 15 }}>{lang.icon} {lang.name}</Text>
                  <TouchableOpacity
                    style={{ backgroundColor: theme.card, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, maxWidth: 150 }}
                    onPress={() => {
                      setSelectedLang(lang.code);
                      setVoiceSelectionModalVisible(true);
                    }}
                  >
                    <Text style={{ color: theme.purple || '#673AB7', fontSize: 13, textAlign: 'center', fontWeight: 'bold' }} numberOfLines={1}>
                      {preferredVoices?.[lang.code] ? (availableVoices.find(v => v.identifier === preferredVoices[lang.code])?.name || 'Personalizada') : 'Padrão'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.wsModalActions}>
              <TouchableOpacity onPress={() => setVoicesConfigModalVisible(false)}>
                <View style={[styles.wsModalConfirm, { width: '100%', backgroundColor: theme.purple || '#673AB7', minWidth: 100, alignItems: 'center' }]}>
                  <Text style={styles.wsModalConfirmText}>Concluir</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Seleção de Voz */}
      <Modal visible={voiceSelectionModalVisible} transparent animationType="fade" onRequestClose={() => setVoiceSelectionModalVisible(false)}>
        <View style={styles.wsModalOverlay}>
          <View style={styles.wsModalBox}>
            <Text style={styles.wsModalTitle}>Selecionar Voz</Text>
            <FlatList
              style={{ maxHeight: 300 }}
              data={availableVoices.filter(v => v.language.startsWith(selectedLang.split('-')[0]))}
              keyExtractor={(item) => item.identifier}
              renderItem={({ item }) => (
                <TouchableOpacity style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.sep, flexDirection: 'row', alignItems: 'center' }} onPress={() => {
                  handleSetPreferredVoice(selectedLang, item.identifier);
                  setVoiceSelectionModalVisible(false);
                }}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>{getVoiceEmoji(item.name)}</Text>
                  <Text style={{ color: theme.white, fontWeight: preferredVoices?.[selectedLang] === item.identifier ? 'bold' : 'normal', flex: 1 }}>
                    {item.name} ({item.quality})
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={{ color: theme.gray, textAlign: 'center', padding: 16 }}>Nenhuma voz encontrada.</Text>}
            />
            <TouchableOpacity style={{ padding: 12, marginTop: 8 }} onPress={() => {
              handleSetPreferredVoice(selectedLang, null);
              setVoiceSelectionModalVisible(false);
            }}>
              <Text style={{ color: '#F44336', textAlign: 'center' }}>Restaurar Padrão do Sistema</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 12, backgroundColor: theme.card, borderRadius: 8, marginTop: 8 }} onPress={() => setVoiceSelectionModalVisible(false)}>
              <Text style={{ color: theme.white, textAlign: 'center' }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <MenuScreen
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onMenuItemPress={(id) => {
          setMenuVisible(false);
          if (id === 'import') handleImport();
          if (id === 'statistics') navigation.navigate('Statistics');
          if (id === 'settings') navigation.navigate('Configuracoes');
          if (id === 'text_size') {
            setTempTextSize(cardFontSize || 24);
            setTextSizeModalVisible(true);
          }
          if (id === 'voices') setVoicesConfigModalVisible(true);
          if (id === 'help') setHelpModalVisible(true);
          if (id === 'stopwatch_config') setStopwatchModalVisible(true);
        }}
        isDark={isDark}
        toggleTheme={() => setIsDark(!isDark)}
        theme={theme}
      />

      {/* Modal de Tamanho do Texto */}
      <Modal visible={textSizeModalVisible} transparent animationType="fade" onRequestClose={() => setTextSizeModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.card, width: '100%', borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.white, marginBottom: 16 }}>Tamanho do Texto nos Cards</Text>
            
            {/* Card de Preview */}
            <View style={{ backgroundColor: theme.reviewCard || '#E3F2FD', borderRadius: 12, padding: 20, minHeight: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: tempTextSize, color: theme.white, fontWeight: 'bold', textAlign: 'center' }}>
                Preview do Texto
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <TouchableOpacity style={{ backgroundColor: '#8DE8C7', width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }} onPress={() => setTempTextSize(Math.max(12, tempTextSize - 2))}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#000' }}>-</Text>
              </TouchableOpacity>
              
              <Text style={{ fontSize: 20, color: theme.white, marginHorizontal: 20, fontWeight: 'bold' }}>{tempTextSize}pt</Text>
              
              <TouchableOpacity style={{ backgroundColor: '#8DE8C7', width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }} onPress={() => setTempTextSize(Math.min(60, tempTextSize + 2))}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#000' }}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity style={{ padding: 12 }} onPress={() => setTextSizeModalVisible(false)}>
                <Text style={{ color: theme.gray, fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ backgroundColor: theme.blue, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 }} onPress={() => {
                updateSettings(0, tempTextSize, autoPlayAudio);
                setTextSizeModalVisible(false);
              }}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Ajuda / Tutorial */}
      <Modal visible={helpModalVisible} transparent animationType="slide" onRequestClose={() => setHelpModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View style={{ flex: 1, marginTop: 48, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: theme.bg, overflow: 'hidden' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.sep }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.white }}>📖 Como usar o App</Text>
              <TouchableOpacity onPress={() => setHelpModalVisible(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: theme.white, fontSize: 18, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
              {/* Intro */}
              <View style={{ backgroundColor: theme.purple || '#7B5CF5', borderRadius: 16, padding: 20, marginBottom: 24 }}>
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600', lineHeight: 24 }}>Bem-vindo ao seu app de Flashcards! Aqui você cria conjuntos de cartões para estudar usando repetição espaçada. Veja abaixo todas as funcionalidades:</Text>
              </View>

              {/* Seção 1 - Conjuntos */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#4CAF5022', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 20 }}>📚</Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: theme.white }}>Conjuntos (Decks)</Text>
                </View>
                <Text style={{ color: theme.gray, fontSize: 14, lineHeight: 22, marginLeft: 52 }}>São as pastas que organizam seus cartões por tema. Toque em <Text style={{ color: theme.blue, fontWeight: '600' }}>"+ CRIAR CONJUNTO"</Text> na parte inferior da tela para criar um novo. Toque em um conjunto para ver seus cartões.</Text>
              </View>

              {/* Seção 2 - Cartões */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#2196F322', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 20 }}>🃏</Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: theme.white }}>Cartões (Flashcards)</Text>
                </View>
                <Text style={{ color: theme.gray, fontSize: 14, lineHeight: 22, marginLeft: 52 }}>Cada cartão tem uma <Text style={{ color: theme.white, fontWeight: '600' }}>frente</Text> (pergunta) e um <Text style={{ color: theme.white, fontWeight: '600' }}>verso</Text> (resposta). Dentro de um conjunto, use o menu <Text style={{ color: theme.blue }}>⋮</Text> para adicionar, editar ou excluir cartões.</Text>
              </View>

              {/* Seção 3 - Pesquisa */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FF980022', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 20 }}>🔍</Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: theme.white }}>Barra de Pesquisa</Text>
                </View>
                <Text style={{ color: theme.gray, fontSize: 14, lineHeight: 22, marginLeft: 52 }}>Use a barra no topo para pesquisar <Text style={{ color: theme.white, fontWeight: '600' }}>conjuntos pelo nome</Text> ou <Text style={{ color: theme.white, fontWeight: '600' }}>cartões pelo conteúdo</Text>. Ao encontrar um cartão, toque nele para ir direto ao conjunto.</Text>
              </View>

              {/* Seção 4 - Revisão */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#E91E6322', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 20 }}>🔄</Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: theme.white }}>Revisão</Text>
                </View>
                <Text style={{ color: theme.gray, fontSize: 14, lineHeight: 22, marginLeft: 52 }}>Toque em <Text style={{ color: theme.blue, fontWeight: '600' }}>REVISÃO</Text> para revisar cartões pendentes. Durante a revisão, classifique cada cartão como Fácil, Bom, Difícil ou Errei para ajustar a repetição espaçada.</Text>
              </View>

              {/* Seção 5 - Prática */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#9C27B022', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 20 }}>🏋️</Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: theme.white }}>Prática</Text>
                </View>
                <Text style={{ color: theme.gray, fontSize: 14, lineHeight: 22, marginLeft: 52 }}>O modo <Text style={{ color: theme.blue, fontWeight: '600' }}>PRÁTICA</Text> permite estudar cartões livremente sem afetar o agendamento de repetição espaçada. Ideal para revisar antes de provas.</Text>
              </View>

              {/* Seção 6 - Ciclo de Estudo */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#4DA8DA22', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 20 }}>📚</Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: theme.white }}>Ciclo de Estudo</Text>
                </View>
                <Text style={{ color: theme.gray, fontSize: 14, lineHeight: 22, marginLeft: 52 }}>O botão <Text style={{ color: '#4DA8DA', fontWeight: '600' }}>CICLO</Text> monta automaticamente uma sessão otimizada misturando cartões atrasados, obrigatórios, erros anteriores e importantes. Configure as quantidades em <Text style={{ color: theme.blue }}>Configurações</Text>.</Text>
              </View>

              {/* Seção 7 - Meta Diária */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#7B5CF522', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 20 }}>🎯</Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: theme.white }}>Meta Diária</Text>
                </View>
                <Text style={{ color: theme.gray, fontSize: 14, lineHeight: 22, marginLeft: 52 }}>A barra de progresso mostra quantos cartões você revisou hoje vs. sua meta. Toque no ícone <Text style={{ color: theme.white }}>⋮</Text> ao lado para ajustar sua meta diária.</Text>
              </View>

              {/* Seção 8 - Importar */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#00BCD422', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 20 }}>📥</Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: theme.white }}>Importar Conjuntos</Text>
                </View>
                <Text style={{ color: theme.gray, fontSize: 14, lineHeight: 22, marginLeft: 52 }}>Abra o menu lateral <Text style={{ color: theme.white }}>☰</Text> e toque em <Text style={{ color: theme.blue, fontWeight: '600' }}>Importar</Text> para adicionar conjuntos a partir de arquivos de texto formatados.</Text>
              </View>

              {/* Seção 9 - Duplicatas */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FF980022', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 20 }}>🔁</Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: theme.white }}>Detectar Duplicatas</Text>
                </View>
                <Text style={{ color: theme.gray, fontSize: 14, lineHeight: 22, marginLeft: 52 }}>Toque em <Text style={{ color: '#FF9800', fontWeight: '600' }}>DUPLICATAS</Text> para encontrar e remover cartões repetidos nos seus conjuntos.</Text>
              </View>

              {/* Seção 10 - Estatísticas */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#3B9EFF22', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 20 }}>📊</Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: theme.white }}>Estatísticas</Text>
                </View>
                <Text style={{ color: theme.gray, fontSize: 14, lineHeight: 22, marginLeft: 52 }}>Acesse pelo menu lateral para ver gráficos de desempenho, total de cartões estudados e sua evolução ao longo do tempo.</Text>
              </View>

              {/* Seção 11 - Vozes */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FF572222', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 20 }}>🗣️</Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: theme.white }}>Vozes e Áudio</Text>
                </View>
                <Text style={{ color: theme.gray, fontSize: 14, lineHeight: 22, marginLeft: 52 }}>Configure vozes diferentes para cada idioma em <Text style={{ color: theme.blue, fontWeight: '600' }}>Configurar Vozes</Text> no menu lateral. O app lê os cartões em voz alta automaticamente durante a revisão.</Text>
              </View>

              {/* Seção 12 - Tema */}
              <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#ffffff11', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 20 }}>🌙</Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: theme.white }}>Tema Claro / Escuro</Text>
                </View>
                <Text style={{ color: theme.gray, fontSize: 14, lineHeight: 22, marginLeft: 52 }}>Alterne entre tema claro e escuro no menu lateral para maior conforto visual.</Text>
              </View>
            </ScrollView>

            {/* Footer */}
            <TouchableOpacity
              style={{ backgroundColor: theme.blue, margin: 20, paddingVertical: 16, borderRadius: 12, alignItems: 'center' }}
              onPress={() => setHelpModalVisible(false)}
            >
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>Entendi! 👍</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Configuração do Cronômetro */}
      <Modal visible={stopwatchModalVisible} transparent animationType="fade" onRequestClose={() => setStopwatchModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.card, width: '100%', borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.white, marginBottom: 16 }}>Configuração do Cronômetro</Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 16, color: theme.white }}>Exibir Cronômetro na Revisão/Ciclo</Text>
              <Switch
                value={showStopwatch}
                onValueChange={setShowStopwatch}
                trackColor={{ false: '#767577', true: theme.blue }}
                thumbColor={showStopwatch ? '#FFF' : '#f4f3f4'}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity style={{ backgroundColor: theme.blue, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 }} onPress={() => setStopwatchModalVisible(false)}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const localStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 2,
  },
  greetingSection: {
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  greetingText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 40,
  },
  searchInput: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionRowWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  chipBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    marginBottom: 2,
  },
  listContent: {
    paddingBottom: 100,
    paddingHorizontal: 20,
    gap: 15,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#777',
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#EEEEEE',
    borderRadius: 4,
    overflow: 'hidden',
    width: '90%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
  },
  createButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const DeckListScreenWrapper = (props) => {
  const { data: decks } = useLiveQuery(db.select().from(sets).orderBy(asc(sets.title)));

  // Agregação Otimizada: Em vez de carregar todos os potenciais cartões (full scan), 
  // agrupamos no lado do banco valendo-se do índice idx_cards_set_id
  const { data: deckStats } = useLiveQuery(
    db.select({
      setId: cards.set_id,
      total: sql`count(${cards.id})`.mapWith(Number),
      memorized: sql`sum(CASE WHEN ${cards.difficultyStatus} IN ('good', 'easy') THEN 1 ELSE 0 END)`.mapWith(Number)
    }).from(cards).groupBy(cards.set_id)
  );

  // Soma total baseada nas agregações
  const totalCardsCount = (deckStats || []).reduce((acc, curr) => acc + (curr.total || 0), 0);

  return <DeckListScreen decks={decks || []} totalCardsCount={totalCardsCount} deckStats={deckStats || []} {...props} />;
};

export default DeckListScreenWrapper;
