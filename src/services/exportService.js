import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export const exportToMarkdown = async (cards) => {
  if (!cards || cards.length === 0) {
    Alert.alert('Aviso', 'Não há flashcards para exportar.');
    return;
  }

  try {
    let markdownContent = '# Exportação de Flashcards\n\n';

    cards.forEach((card) => {
      const deckName = card.deckName || 'Sem Baralho';
      const question = card.front || card.question || '';
      const answer = card.back || card.answer || '';

      markdownContent += `### Baralho: ${deckName}\n`;
      markdownContent += `**Pergunta:** ${question}\n\n`;
      markdownContent += `**Resposta:** ${answer}\n\n`;
      markdownContent += `---\n\n`;
    });

    const fileName = `flashcards_export_${Date.now()}.md`;
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, markdownContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isSharingAvailable = await Sharing.isAvailableAsync();
    
    if (isSharingAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/markdown',
        dialogTitle: 'Exportar Flashcards',
        UTI: 'net.daringfireball.markdown'
      });
    } else {
      Alert.alert('Erro', 'O compartilhamento não está disponível neste dispositivo.');
    }
  } catch (error) {
    console.error('Erro na exportação para Markdown:', error);
    Alert.alert('Erro', 'Ocorreu um problema ao preparar o arquivo de exportação.');
    throw error;
  }
};