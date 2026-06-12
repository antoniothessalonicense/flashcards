const fs = require('fs');
const file = 'src/screens/DeckListScreen.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /const processarDeckDeFlashcards = async \(texto\) => \{[\s\S]+?(?=const handleImport =)/;

const newCode = `const processarDeckDeFlashcards = async (texto) => {
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
        
        if (line.toUpperCase().startsWith('#CONJUNTO:')) {
          title = line.substring(10).trim();
        } else if (line.toUpperCase().startsWith('#DESCRIÇÃO:') || line.toUpperCase().startsWith('#DESCRICAO:')) {
          description = line.substring(11).trim();
        } else if (line.toUpperCase() === '#CARTÃO' || line.toUpperCase() === '#CARTAO') {
          if (currentCard && currentCard.frente && currentCard.verso) {
            parsedCards.push(currentCard);
          }
          currentCard = { frente: '', verso: '' };
          currentField = null;
        } else if (line.toUpperCase().startsWith('FRENTE:')) {
          if (currentCard) {
            currentCard.frente = line.substring(7).trim();
            currentField = 'frente';
          }
        } else if (line.toUpperCase().startsWith('VERSO:')) {
          if (currentCard) {
            currentCard.verso = line.substring(6).trim();
            currentField = 'verso';
          }
        } else if (currentCard && currentField && line.length > 0) {
          // Permite que o texto da frente ou verso tenha múltiplas linhas
          currentCard[currentField] += '\\n' + line;
        }
      }
      
      // Adiciona o último cartão
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

      Alert.alert('Sucesso', \`Conjunto '\${title}' criado com \${parsedCards.length} cartões!\`);
    } catch (error) {
      console.error('Erro ao processar flashcards:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao processar o texto.');
    }
  };

  `;

if (regex.test(content)) {
  content = content.replace(regex, newCode);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Replacement successful');
} else {
  console.log('Regex did not match.');
}
