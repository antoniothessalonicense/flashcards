const fs = require('fs');
const file = 'src/screens/DeckListScreen.js';
let content = fs.readFileSync(file, 'utf8');

const old3 = "  const handleMenuClick = async (action) => {";
const new3 = `  const processarDeckDeFlashcards = async (texto) => {
    try {
      console.log('=== PROCESSANDO FLASHCARDS ===');
      console.log('Tamanho do texto:', texto.length);

      const normalized = texto
        .replace(/\\r\\n/g, '\\n')
        .replace(/\\r/g, '\\n')
        .normalize('NFC')
        .replace(/[\\u200B-\\u200D\\uFEFF]/g, '');

      const lines = normalized.split('\\n');
      let title = 'Conjunto Importado';
      let description = '';
      const parsedCards = [];
      let currentCard = null;
      let currentField = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const upperLine = line.toUpperCase();
        
        const safeMatchLine = upperLine.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');

        if (safeMatchLine.startsWith('#CONJUNTO:')) {
          title = line.substring(10).trim();
        } else if (sadeMatchLine.startsWith('#DESCRICAO:')) {
          description = line.substring(11).trim();
        } else if (safeMatchLine === '#CARTAO') {
          if (currentCard && currentCard.frente && currentCard.verso) {
            parsedCards.push(currentCard);
          }
          currentCard = { frente: '', verso: '' };
          currentField = null;
        } else if (sadeMatchLine.startsWith('FRENTE:')) {
          if (!currentCard || currentCard.frente) {
             if (currentCard && currentCard.frente && currentCard.verso) {
               parsedCards.push(currentCard);
             }
             currentCard = { frente: '', verso: '' };
          }
          const contentMatch = line.match(/^FRENTE:\\s*(.*)$/i);
          currentCard.frente = contentMatch ? contentMatch[1].trim() : line.substring(7).trim();
          currentField = 'frente';
        } else if (safeMatchLine.startsWith('VERSO:')) {
          if (!currentCard) currentCard = { frente: '', verso: '' };
          const contentMatch = line.match(/^VERSO:\q*(.*)$/i);
          currentCard.verso = contentMatch ? contentMatch[1].trim() : line.substring(6).trim();
          currentField = 'verso';
        } else if (currentCard && currentField && line.length > 0) {
          currentCard[currentField] += '\\n' + line;
        }
      }
      
      if (currentCard && currentCard.frente && currentCard.verso) {
        parsedCards.push(currentCard);
      }

      console.log('Cartões válidos encontrados:', parsedCards.length);
      console.log('Título:', title);

      if (parsedCards.length === 0) {
        Alert.alert('Erro', 'Nenhum cartão válido encontrado no texto.');
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
          difficultyStatus: 'new'
        }).returning();
      }

      Alert.alert('Sucesso', \`Conjunto '${title}' criado com ${parsedCards.length} cartões!\`);
    } catch (error) {
      console.error('Erro ao processar flashcards:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao processar o texto.');
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

      if (!fileName.endsWith('.txt') && !fileName.endsWith('.md')) {
        Alert.alert('Formato Inválido', 'Por favor, selecione um arquivo .txt ou .md');
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
      console.log('Tamanho:', fileContent.length);

      setImportModalVisible(false);
      await processarDeckDeFlashcards(fileContent);
    } catch (error) {
      console.error('Erro ao importar arquivo:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar ler o arquivo selecionado.');
    }
  };

  const handleMenuClick = async (action) => {
?`;
content = content.replace(old3, new3);

const old5 = "      <MenuScreen";
const new5 = `      <Modal visible={importModalVisible} transparent animationType="fade" onRequestClose={() => setImportModalVisible(false)}>
        <View style={styles.wsModalOverlay}>
          <View style={styles.wsModalBox}>
            <Text style={styles.wsModalTitle}>Importar Flashcards</Text>
            <Text style={{ color: theme.gray, fontSize: 12, marginBottom: 16 }}>
              ⚠️ O campo de texto tem limite de ~3600 caracteres. Para importar 175+ cartões, use um arquivo.
            </Text>

            <Text style={{ color: theme.white, fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>Opção 1: Arquivo (.txt / .md)</Text>
            <TouchableOpacity onPress={handleFileImport} style={{ marginBottom: 16 }}>
              <View style={[styles.wsModalConfirm, { width: '100%', backgroundColor: theme.purple || '#673AB7' }]}>
                <Text style={styles.wsModalConfirmText}>�B Selecionar Arquivo</Text>
              </View>
            </TouchableOpacity>

            <Text style={{ color: theme.white, fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>Opção 2: Colar Texto (limitado)</Text>
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
            <View style={[ styles.wsModalActions, { marginTop: 16 } ]}>
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

      <MenuScreen`;
content = content.replace(old5, new5);

fs.writeFileSync(file, content, 'utf8');
console.log('Restored DeckListScreen.js - Part 3');