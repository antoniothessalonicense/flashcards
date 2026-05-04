# Contexto do Projeto: Flashcards App

## 📱 Visão Geral
Aplicativo mobile focado no estudo e memorização através de flashcards (foco inicial em idiomas, ex: Inglês/Português). O app possui uma interface com "Dark Mode" nativo e permite que o usuário gerencie baralhos de estudo, acompanhe seu progresso e utilize diferentes métodos de prática.

## 🛠 Stack Tecnológica
- **Framework:** React Native com Expo (SDK ~54 / React Native 0.81.5)
- **Linguagem:** JavaScript / ES6+
- **UI/UX:** `react-native-safe-area-context` para lidar com entalhes de tela, `expo-linear-gradient` para gradientes.

## ⚙️ Funcionalidades Implementadas
- **Dashboard de Baralhos (Decks):** Listagem de conjuntos de estudo, acompanhamento da meta diária e progresso de memorização.
- **Áreas de Trabalho (Workspaces):** Capacidade de filtrar e criar novos workspaces para organizar os decks (ex: "Todos os conjuntos").
- **Modos de Prática:** Mapeamento de modos de estudo (Básico, Seleção, Combinar, Áudio, etc.), indicando quais recursos são gratuitos e quais são "PRO".
- **Sistema de Revisão (Review):** Interface de estudo de flashcards em si (frente e verso), com botões para autoavaliar a dificuldade (Difícil, Bom, Fácil) baseando-se em princípios de repetição espaçada.
- **Menu de Navegação:** Drawer/Modal com os dados do usuário e ações globais do app.

## 🏗 Estrutura e Arquitetura (Estado Atual)
O projeto no momento se encontra em um estágio de MVP/Protótipo inicial, adotando uma estrutura monolítica onde tudo está concentrado no `App.js`:
- **Roteamento Customizado:** Não há biblioteca de navegação. A troca de telas é feita através de uma variável de estado simples (`screen`).
- **Dados Mockados:** Arrays como `DECKS`, `MODOS` e `MENU_ITEMS` estão "hardcoded" estaticamente.
- **Componentização Interna:** As telas (`DeckListScreen`, `MenuScreen`, `ReviewScreen`, etc.) e componentes compartilhados (`ProgressBar`, `Badge`) estão todos no mesmo arquivo, o que facilita o protótipo rápido, mas dificulta a manutenção em larga escala.

## 🚀 Próximos Passos (Backlog de Melhorias)
Quando formos evoluir o projeto, os seguintes passos arquiteturais são recomendados:
1. **Refatoração de Arquivos:** Criar uma estrutura de pastas modular, por exemplo:
   - `/src/components` (para `ProgressBar`, `Badge`)
   - `/src/screens` (para `DeckListScreen`, `ReviewScreen`, etc.)
   - `/src/theme` (para as constantes de cores `C` e estilos globais)
2. **Navegação Real:** Introduzir o `expo-router` ou `@react-navigation/native` para lidar com pilhas de telas (Stacks) e modais adequadamente.
3. **Gerenciamento de Estado:** Implementar Context API, Zustand ou Redux para compartilhar as informações do Usuário, Workspaces e Decks entre as telas sem *prop drilling*.
4. **Lógica de Repetição Espaçada:** Transformar os cliques de "Difícil/Bom/Fácil" em um algoritmo real (como o SM-2) ajustando a data da próxima revisão do cartão.
5. **Armazenamento de Dados:** Trocar os mocks por persistência local (ex: `AsyncStorage` ou `WatermelonDB`) e, no futuro, consumir de uma API.

---

> **Nota para a IA Assistente:** 
> Ao ler este arquivo, entenda que o projeto é um App de Flashcards em React Native/Expo. Considere a estrutura monolítica atual do `App.js` antes de propor grandes lógicas, mas incentive a refatoração para múltiplos arquivos quando for adicionar novas funcionalidades complexas.