# Erros Documentados

### Nome do Erro: "ocorreu um erro ao tentar ler o arquivo selecionado" ao importar TXT
- **Causa:** O mÃ©todo `FileSystem.readAsStringAsync` do `expo-file-system` falha frequentemente ao tentar ler diretamente alguns URIs do sistema de arquivos local (como os URIs `content://` no Android) que sÃ£o retornados pelo pacote `expo-document-picker`, disparando a exceÃ§Ã£o que resulta na mensagem de erro.
- **SoluÃ§Ã£o:** Adicionar um mecanismo de "fallback". Dentro de um `try/catch`, deve-se tentar primeiro a leitura com o `FileSystem.readAsStringAsync`. Se isso gerar um erro, captura-se a falha e utiliza-se a API nativa do React Native: `const response = await fetch(file.uri); const fileContent = await response.text();`, que Ã© muito mais estÃ¡vel para lidar com esse tipo de URI sem problemas de permissÃ£o.
- **Data:** 06/06/2026

### Nome do Erro: Propriedade "url" nÃ£o Ã© permitida no schema do mcp_config.json
- **Causa:** O schema de validaÃ§Ã£o JSON do Antigravity para o arquivo `mcp_config.json` espera estritamente a propriedade `"serverUrl"` para definir o endereÃ§o do servidor MCP, marcando a chave padrÃ£o `"url"` como invÃ¡lida e gerando o diagnÃ³stico do editor (`Property url is not allowed`).
- **SoluÃ§Ã£o:** Remover a propriedade `"url"` de dentro de `expo-mcp` no arquivo [mcp_config.json](file:///c:/react-native/flashcards/.gemini/config/mcp_config.json) e manter exclusivamente `"serverUrl"`.
- **Data:** 08/06/2026

### Nome do Erro: Falha ou NullPointerException ao executar "adb shell input text" com caracteres especiais ou acentuados
- **Causa:** O comando `adb shell input text` do Android nativo nÃ£o suporta caracteres nÃ£o-ASCII (como letras acentuadas `Ã¡, Ã©, Ã­, Ã³, Ãº, Ã£, Ãµ, Ã§`). Tentar enviÃ¡-los causa um crash (`NullPointerException`) no executÃ¡vel `input` do Android. AlÃ©m disso, o caractere `#` e outros metacaracteres shell (como `?`, `&`) causam erros de sintaxe ou sÃ£o interpretados como comentÃ¡rios pelo interpretador de comandos (shell) do dispositivo.
- **SoluÃ§Ã£o:** Normalizar o texto removendo acentos (convertendo para ASCII puro) e escapar os metacaracteres do shell com uma barra invertida (ex: `\#` e `\?`) antes de enviÃ¡-los via `adb shell input text`.
- **Data:** 08/06/2026

### Nome do Erro: [ReferenceError: Property 'DocumentPicker' doesn't exist]
- **Causa:** O arquivo `src/screens/DeckListScreen.js` utiliza `DocumentPicker.getDocumentAsync` e `FileSystem.readAsStringAsync` para a funcionalidade de importar arquivos, mas esses mÃ³dulos nÃ£o foram importados no inÃ­cio do arquivo e nem instalados no projeto.
- **SoluÃ§Ã£o:** Instalar os pacotes `expo-document-picker` e `expo-file-system` e adicionÃ¡-los nos imports no topo do arquivo `DeckListScreen.js`.
- **Data:** 08/06/2026

### Nome do Erro: Expected ',' or '}' after property value in JSON at position 545
- **Causa:** Metro Bundler encontrou um arquivo de cache JSON corrompido ou mal-formatado nas dependÃªncias ou nos caches internos do Expo durante a transpilaÃ§Ã£o.
- **SoluÃ§Ã£o:** Limpar o cache do Metro Bundler iniciando o app com `npx expo start --clear` (ou `npm run start -- --clear`).
- **Data:** 08/06/2026

### Nome do Erro: Project is incompatible with this version of Expo Go
- **Causa:** O projeto utiliza Expo SDK 56 e dependÃªncias nativas customizadas (como `@react-native-google-signin/google-signin`), que nÃ£o sÃ£o suportadas pelo aplicativo Expo Go padrÃ£o da Play Store, ou a versÃ£o instalada do Expo Go no telefone estÃ¡ desatualizada em relaÃ§Ã£o ao SDK do projeto.
- **SoluÃ§Ã£o:** Executar o projeto como um Development Build nativo executando `npm run android` para criar o APK de desenvolvimento no celular fÃ­sico conectado, ou atualizar o app Expo Go no celular a partir da Play Store se for compatÃ­vel.
- **Data:** 08/06/2026

### Nome do Erro: Cannot find type definition file for 'jest' (no tsconfig.json)
- **Causa:** O TypeScript tenta implicitamente resolver os tipos do Jest (que sÃ£o referenciados pelos arquivos de teste do projeto), mas o pacote contendo as tipagens (`@types/jest`) nÃ£o estava instalado em `node_modules` nem declarado no `package.json`.
- **SoluÃ§Ã£o:** Instalar a biblioteca de tipos do Jest como dependÃªncia de desenvolvimento executando o comando `npm install --save-dev @types/jest jest`.
- **Data:** 08/06/2026

### Nome do Erro: Cannot find native module 'ExpoClipboard'
- **Causa:** Ocorre ao tentar usar o pacote `expo-clipboard` em um cliente de desenvolvimento (Development Build) jÃ¡ instalado no dispositivo sem que o binÃ¡rio nativo do aplicativo tenha sido reconstruÃ­do. O APK em execuÃ§Ã£o nÃ£o contÃ©m os arquivos compilados nativos da nova dependÃªncia.
- **SoluÃ§Ã£o:** Como a criaÃ§Ã£o da pasta `/android` local Ã© proibida, Ã© necessÃ¡rio gerar um novo build de desenvolvimento na nuvem executando `eas build --profile development --platform android`, baixar e instalar o novo APK atualizado no dispositivo fÃ­sico.
- **Data:** 08/06/2026

### Nome do Erro: Cannot find module '../../DeckListScreen' em DeckListScreen.test.tsx
- **Causa:** O arquivo de teste `src/screens/__tests__/DeckListScreen.test.tsx` importava o componente `DeckListScreen` usando o caminho relativo `../../DeckListScreen`, que tenta referenciar a pasta raiz `src/`. No entanto, o componente estÃ¡ localizado na mesma pasta pai do teste, ou seja, em `src/screens/DeckListScreen.js`.
- **SoluÃ§Ã£o:** Alterar a importaÃ§Ã£o para usar o caminho relativo correto `../DeckListScreen`.
- **Data:** 08/06/2026

### Nome do Erro: Property mcpServers is not allowed no mcp.json
- **Causa:** O validador de schema JSON do editor de cÃ³digo para o arquivo `.vscode/mcp.json` espera que a configuraÃ§Ã£o dos servidores MCP seja colocada diretamente na raiz do objeto JSON, e nÃ£o encapsulada em uma chave `"mcpServers"`. 
- **SoluÃ§Ã£o:** Remover a propriedade envelopadora `"mcpServers"` do arquivo `.vscode/mcp.json` e colocar a chave `"expo-mcp"` e as demais configuraÃ§Ãµes diretamente na raiz do arquivo.
- **Data:** 08/06/2026

### Nome do Erro: Property expo-mcp is not allowed. no mcp.json
- **Causa:** O arquivo `.vscode/mcp.json` estÃ¡ sendo validado por algum esquema padrÃ£o do VS Code que desconhece chaves customizadas ou nÃ£o espera a configuraÃ§Ã£o do MCP nesse formato/localizaÃ§Ã£o. Na verdade, para o ambiente Antigravity/Gemini, as configuraÃ§Ãµes do MCP ficam internas e nÃ£o dependem do arquivo `.vscode/mcp.json` (o `expo-mcp` jÃ¡ se encontra conectado nativamente de forma independente).
- **SoluÃ§Ã£o:** Como o arquivo nÃ£o Ã© necessÃ¡rio para o Gemini IDE utilizar o `expo-mcp`, a forma mais fÃ¡cil de "corrigir" o alerta de schema do editor Ã© simplesmente deletar o arquivo `.vscode/mcp.json` ou limpar seu conteÃºdo.
- **Data:** 08/06/2026

### Nome do Erro: TypeError: Cannot read property 'map' of undefined na importaÃ§Ã£o de JSON
- **Causa:** O cÃ³digo tentava passar um objeto JSON diretamente para a validaÃ§Ã£o do Zod, que esperava um array. Ao falhar, caso houvesse tentativas de iterar sobre o resultado ou se o JSON raiz importado nÃ£o fosse um array contendo os dados, o mÃ©todo `.map()` era chamado de forma insegura num valor `undefined` ou objeto.
- **SoluÃ§Ã£o:** Adicionar validaÃ§Ã£o preventiva antes do `.map()` verificando `typeof parsedData === 'object'` e `Array.isArray()`, extraindo ativamente a propriedade `"cartoes"` e normalizando suas chaves antes de enviar para validaÃ§Ã£o.
- **Data:** 08/06/2026

### Nome do Erro: Falha de parse (JSON.parse) em JSONs com caracteres invisÃ­veis (Non-breaking spaces)
- **Causa:** O texto copiado de algumas fontes para a Ã¡rea de transferÃªncia traz consigo "Non-breaking spaces" (`\u00A0`), "Zero-width spaces" (`\u200B`) ou "BOM" (`\uFEFF`). Como a especificaÃ§Ã£o JSON estrita exige espaÃ§os padrÃ£o (`\u0020`), o `JSON.parse()` lanÃ§a uma exceÃ§Ã£o de formataÃ§Ã£o imediatamente ao esbarrar nesses caracteres.
- **SoluÃ§Ã£o:** Antes de executar `JSON.parse()`, realizar uma sanitizaÃ§Ã£o preventiva na string usando expressÃµes regulares (regex): substituir `/\u00A0/g` por espaÃ§os regulares e remover inteiramente `/[\u200B-\u200D\uFEFF]/g`.
- **Data:** 08/06/2026

### Nome do Erro: Erro de sintaxe no JSON.parse() causado por quebras de linha literais
- **Causa:** Arquivos `.txt` ou dados importados que contÃªm quebras de linha explÃ­citas (Enters, representados por `\n` ou `\r`) espalhados pelo meio da string JSON quebram o parsing. O formato JSON estrito nÃ£o permite quebra de linhas "soltas" fora do formato escapado (`\n` em string).
- **SoluÃ§Ã£o:** Como etapa primÃ¡ria na higienizaÃ§Ã£o antes do `JSON.parse()`, aplicar um `replace(/[\r\n]+/g, ' ')` no conteÃºdo lido para achatar todo o texto em uma linha Ãºnica e substituir a quebra por um espaÃ§o seguro, garantindo um JSON compacto e ininterrupto.
- **Data:** 08/06/2026

### Nome do Erro: Erro de parse JSON.parse() devido a aspas inteligentes (smart quotes) e tabulaÃ§Ãµes de editores mobile
- **Causa:** Editores de texto padrÃ£o em dispositivos mÃ³veis (como Notas do iOS) frequentemente substituem aspas retas padrÃ£o (`"`, `'`) por aspas curvas tipogrÃ¡ficas (`â`, `â`, `â`, `â`) e inserem marcaÃ§Ãµes de tabulaÃ§Ã£o cruas que quebram o parsing rigoroso do `JSON.parse()`.
- **SoluÃ§Ã£o:** Incluir na rotina de purificaÃ§Ã£o de strings as substituiÃ§Ãµes: `.replace(/\t/g, ' ')` para remover tabulaÃ§Ãµes, `.replace(/[ââ]/g, '"')` para reverter as aspas duplas, e `.replace(/[ââ]/g, "'")` para as aspas simples, padronizando a estrutura antes da conversÃ£o em objeto.
- **Data:** 08/06/2026

### Nome do Erro: `no such table: ciclo_configs` — Tabela definida no Drizzle Schema mas inexistente no SQLite do dispositivo

- **Causa:** O projeto possui **dois sistemas paralelos de criação de tabelas** que não estavam sincronizados:
  1. O `db/schema.ts` (Drizzle ORM) define a tabela `ciclo_configs` para uso em queries com `drizzle-orm`.
  2. O `App.js` possui a função `initializeDatabase()` dentro do `SQLiteProvider.onInit`, que é o **verdadeiro responsável** por executar os `CREATE TABLE IF NOT EXISTS` no banco SQLite do dispositivo físico.
  
  Ao adicionar `ciclo_configs` apenas no `schema.ts` sem adicionar o `CREATE TABLE` correspondente no `initializeDatabase()` do `App.js`, a tabela nunca foi criada no banco real do celular. O Drizzle ORM tentava fazer queries em uma tabela que não existia fisicamente.

- **Solução:**
  1. Adicionar `CREATE TABLE IF NOT EXISTS ciclo_configs (...)` na função `initializeDatabase()` do arquivo `App.js`, seguindo o mesmo padrão das tabelas `sets` e `cards`.
  2. Recarregar o app no dispositivo (pressionar `r` no terminal do Expo) para que o `SQLiteProvider.onInit` execute e crie a tabela.

- **Como evitar por meio de prompt (instrução para a IA):**
  > "Sempre que eu pedir para criar uma nova tabela ou adicionar colunas ao schema Drizzle (`db/schema.ts`), você DEVE também atualizar a função `initializeDatabase()` no arquivo `App.js` com o `CREATE TABLE IF NOT EXISTS` correspondente (e `ALTER TABLE ADD COLUMN` para colunas novas em tabelas existentes). O `App.js` → `SQLiteProvider.onInit` é o sistema real de migração do app — o Drizzle schema sozinho NÃO cria tabelas no dispositivo."

- **Data:** 11/06/2026

### [12/06/2026] - Erro de sintaxe (Expected corresponding JSX closing tag) no React Native
* **Causa:** Durante a inserção de um componente `<Modal>` e alteração da estrutura da tela (`ConfiguracaoCicloScreen.tsx`), uma tag `</View>` de fechamento extra foi deixada no JSX por descuido durante a substituição em lote. O parser do React Native (Metro Bundler) acusa erro imediato de fechamento de tag não correspondente.
* **Solução:** Remover a tag `</View>` duplicada que não possuía uma `<View>` de abertura correspondente. Identifiquei visualmente a linha do erro no terminal (ex: `391:8`) e removi a tag extra.
