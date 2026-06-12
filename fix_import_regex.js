const fs = require('fs');
const file = 'src/screens/DeckListScreen.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /const fileContent = await FileSystem\.readAsStringAsync\(file\.uri, \{\s*encoding: FileSystem\.EncodingType\.UTF8,\s*\}\);\s*console\.log\('=== IMPORTAÇÃO DE ARQUIVO ==='\);\s*console\.log\('Arquivo:', fileName\);\s*console\.log\('Tamanho:', fileContent\.length\);\s*setImportModalVisible\(false\);\s*processarDeckDeFlashcards\(fileContent\);/m;

const newStr = `let fileContent = '';
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

if (regex.test(content)) {
  content = content.replace(regex, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Replacement successful');
} else {
  console.log('Regex did not match.');
}
