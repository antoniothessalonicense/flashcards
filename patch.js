const fs = require('fs');
const file = 'src/screens/DeckListScreen.js';
let content = fs.readFileSync(file, 'utf8');

const oldFuncStart = 'const processarDeckDeFlashcards = (texto) => {';
const startIndex = content.indexOf(oldFuncStart);
if (startIndex > -1) {
  const nextFuncIndex = content.indexOf('const handleImport =', startIndex);
  if (nextFuncIndex > -1) {
    const oldCode = content.substring(startIndex, nextFuncIndex);
    const newCode = `const processarDeckDeFlashcards = async (texto) => {
    try {
      const lines = texto.split('\n');
      let title = 'Conjunto Importado';
      let description = '';
      const parsedCards = [];
      let currentCard = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#CONJUNTO:')) {
          title = line.replace('#CONJUNTO:', '').trim();
        } else if (line.startsWith('#DESCRIÇÃO:') || line.startsWith('#DESCRICAO:')) {
          description = line.replace(/#DESCRIÇÃO:|#DESCRICAO:/, '').trim();
        } else if (line === '#CARTÃO' || line === '#CARTAO') {
          if (currentCard && currentCard.front && currentCard.back) {
            parsedCards.push(currentCard);
          }
          currentCard = { front: '', back: '' };
        } else if (line.startsWith('FRENTE:') && currentCard) {
          currentCard.front = line.replace('FRENTE:', '').trim();
        } else if (line.startsWith('VERSO:') && currentCard) {
          currentCard.back = line.replace('VERSO:', '').trim();
        }
      }
      if (currentCard && currentCard.front && currentCard.back) {
        parsedCards.push(currentCard);
      }

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
          front: c.front,
          back: c.back,
          next_review_date: Date.now(),
          ease_factor: 250,
          difficultyStatus: 'new'
        }).returning();
      }

      Alert.alert('Sucesso', 'Conjunto ' + title + ' criado com ' + parsedCards.length + ' cartões!');
    } catch (error) {
      console.error('Erro ao processar flashcards:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao processar o texto.');
    }
  };

  `;
    content = content.replace(oldCode, newCode);
    require('fs').writeFileSync(file, content);
    console.log('Replacement successful');
  }
} else {
  console.log('Function not found.');
}