const fs = require('fs');
const file = 'src/screens/DeckListScreen.js';
let content = fs.readFileSync(file, 'utf8');
const oldStr = `      const fileContent = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      console.log('=== IMPORTAÇÃO DE ARQUIVO ===');
      console.log('Arquivo:', fileName);
      console.log('Tamanho:', fileContent.length);

      setImportModalVisible(false);
      processarDeckDeFlashcards(fileContent);`;
const newStr = `      let fileContent = '';
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
      await processarDeckDeFlashcards(fileContent);`;

if (content.includes(oldStr)) {
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Replacement successful');
} else {
  console.log('String not found.');
}
