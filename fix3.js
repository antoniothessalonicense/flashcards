const fs = require('fs');
const file = 'src/screens/DeckListScreen.js';
let content = fs.readFileSync(file, 'utf8');

const old1 = "import { useSafeAreaInsets } from 'react-native-safe-area-context';\n\nimport { useLiveQuery } from 'drizzle-orm/expo-sqlite';";
const new1 = "import { useSafeAreaInsets } from 'react-native-safe-area-context';\n\nimport * as DocumentPicker from 'expo-document-picker';\nimport * as FileSystem from 'expo-file-system';\nimport { useLiveQuery } from 'drizzle-orm/expo-sqlite';";
content = content.replace(old1, new1);

const old2 = "  const [langPickerTarget, setLangPickerTarget] = useState('');";
const new2 = "  const [langPickerTarget, setLangPickerTarget] = useState('');\n  const [importModalVisible, setImportModalVisible] = useState(false);\n  const [importText, setImportText] = useState('');";
content = content.replace(old2, new2);

const old4 = "          if (id === 'statistics') navigation.navigate('Statistics');";
const new4 = "          if (id === 'import') handleImport();\n          if (id === 'statistics') navigation.navigate('Statistics');";
content = content.replace(old4, new4);

fs.writeFileSync(file, content, 'utf8');
console.log('Done 1-2-4');