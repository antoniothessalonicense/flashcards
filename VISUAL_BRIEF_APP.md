# Brief Visual do App de Flashcards

## 1. Objetivo deste documento

Este arquivo foi criado para servir como base de contexto para uma IA especialista em UX/UI, permitindo que ela entenda a estrutura atual da interface, os elementos visuais, a lógica de navegação e as intenções de produto antes de propor melhorias estéticas e funcionais.

Ele foi escrito para que você possa enviar este material diretamente para uma IA e pedir:

- redesign visual da tela principal
- migração para um visual mais premium ou minimalista
- melhoria de hierarquia visual
- sugestão de microinterações
- reorganização de componentes para clareza e economia de espaço
- proposta de nova paleta, tipografia e espaçamento

---

## 2. Visão geral do app

O app é um aplicativo mobile de estudo por flashcards com foco em revisões diárias, ciclos de memorização, organização por conjuntos e priorização de revisões.

Ele combina:

- gerenciamento de conjuntos (decks)
- revisão de cartões
- praticas/estudos por ciclo
- rastreio de progresso por conjunto
- filtros de ordenação
- indicadores de prioridade e atraso
- evolução por meta diária

A tela principal funciona como centro de comando do app, onde o usuário consegue ver os conjuntos, a sua situação de estudo, ações rápidas e opções de ordenação.

---

## 3. Arquitetura da interface atual

### 3.1 Arquivos principais relevantes

- Tela principal: [src/screens/DeckListScreen.js](src/screens/DeckListScreen.js)
- Tema e estilos globais: [src/theme/theme.js](src/theme/theme.js)
- Detalhes do conjunto: [src/screens/DeckDetailsScreen.js](src/screens/DeckDetailsScreen.js)
- Navegação: [src/navigation/AppNavigator.js](src/navigation/AppNavigator.js)
- Lógica de ciclo/revisão: [dbServices.drizzle.js](dbServices.drizzle.js)

### 3.2 Padrão visual dominante

A interface usa uma estética moderna em modo escuro, com visual de dashboard focado em produtividade e estudo. A base visual é:

- fundo principal escuro
- cards sobre fundos de superfície mais claros
- bordas discretas
- textos claros em contraste forte
- destaque azul/roxo para ações e elementos de atenção
- badges e chips coloridos para status e progresso

A estrutura visual é orientada para uma navegação rápida e eficiente, com baixa densidade visual, mas com muita informação funcional na tela.

---

## 4. Estrutura da tela principal

A tela principal é a tela de listagem de conjuntos e é a área central do app.

### 4.1 Ordem visual da tela

1. Header superior
   - botão de menu lateral
   - campo de busca
   - botão de pesquisa
   - botão de ações extras

2. Busca / pesquisa de cartões
   - busca por título do conjunto e/ou cartão
   - resultados aparecem em painel flutuante ou lista expandida

3. Seleção de workspace
   - botão tipo chip/pill com nome do contexto atual
   - exemplo: “Todos os conjuntos”

4. Ações rápidas de estudo
   - REVISÃO
   - PRATICA
   - CICLO
   - DUPLICATAS

5. Ordenação compacta
   - botão “Ordenar por: ...”
   - ao clicar abre modal/menu com opções
   - objetivo: economizar espaço visual na tela principal

6. Meta diária / progresso geral
   - mostra número revisado X/meta
   - mostra total de cartões
   - barra de progresso
   - botão de mais opções ao lado

7. Lista de conjuntos
   - cada conjunto aparece em um card
   - título, descrição, quantidade de cartões, status, percentual de progresso
   - emoji/ícone de conjunto
   - botão de menu para ações do conjunto

8. Footer fixo
   - botão para conjuntos externos
   - botão principal para criar conjunto

---

## 5. Hierarquia visual e comportamento

### 5.1 Informações mais importantes

Na tela principal, a hierarquia funcional é:

- ações de estudo primeiro
- ordenação segundo
- progresso diário em destaque
- lista de conjuntos em sequência
- ações contextuais via menu de cada conjunto

A intenção é que o usuário entenda rapidamente:

- o que ele pode fazer agora
- qual conjunto está em foco
- como os conjuntos estão organizados
- quanto progresso ele acumulou

### 5.2 Componentes principais do card de conjunto

Cada card de conjunto contém:

- ícone de conjunto à esquerda
- nome do conjunto em destaque
- descrição curta opcional
- botão de menu no canto superior direito
- contagem de cartões
- badge de prioridade, quando relevante
- status textual: Novo, Iniciante, Em progresso, Avançado, Dominado
- percentual de progresso: 0% a 100%
- barra de progresso linear
- destaque visual para “HOJE” quando o conjunto está na rota de revisão do dia

### 5.3 Indicadores de estado

Os estados do conjunto são visualizados por:

- texto de status
- cor do percentual / progresso
- badge de prioridade
- marca “HOJE” em casos específicos de revisão ativa

Exemplo de lógica implementada:

- 0 a 29%: início / iniciante
- 30 a 69%: progresso
- 70 a 99%: avançado
- 100%: dominado

---

## 6. Sistema de cor

### 6.1 Paleta principal

O tema é baseado em cores de dashboard em modo escuro, com variações de azul, roxo e cinza.

Paleta dominante:

- fundo principal: dark navy / azul escuro profundo
- superfície: azul cinza escuro
- texto principal: branco / cinza claro
- texto secundário: cinza médio
- bordas: cinza médio-escuro
- destaque principal: azul / roxo
- sucesso: verde
- alerta: amarelo
- perigo: vermelho

### 6.2 Observações de design

A identidade visual está mais próxima de:

- ferramenta de produtividade
- dashboard de estudos
- interface de performance / analytics

Em vez de um visual mais lúdico ou “escolar”, a aparência é funcional e focada em ação.

### 6.3 Ponto de atenção

A cor de destaque principal é forte e funcional, mas a interface pode se beneficiar de:

- maior diferenciação entre ações primárias e secundárias
- cards mais expressivos e com melhor descanso visual
- maior uso de cor para hierarquia de prioridade, sem poluir a tela

---

## 7. Tipografia e espaçamento

### 7.1 Tipografia

A tela usa:

- títulos em peso forte
- textos curtos e densidade moderada
- rótulos curtos em uppercase em alguns botões de ação
- métricas e percentuais com destaque visual em negrito

### 7.2 Espaçamento

A interface usa:

- padding médio em cards e blocos
- bordas suaves com radius moderados
- visual de “caixas” e “painéis” bem definidos
- suficiente respiro para manter organização em telas pequenas

### 7.3 O que a tela parece transmitir

A aparência atual comunica:

- produtividade
- clareza funcional
- controle do estudo
- foco em progresso e revisão

Mas também pode parecer:

- densa em telas menores
- sem muita “caracterização emocional” da marca
- mais utilitária do que inspiradora

---

## 8. Interações e padrões de usabilidade

### 8.1 Ações do usuário

Principais padrões de interação incluídos:

- clicar no conjunto para editar/ver detalhes
- clicar no botão de menu para ações do conjunto
- tocar em ação de revisão rápida
- abrir modal de ordenação
- utilizar busca por cartões
- usar botão de meta diária
- criar conjunto do zero via botão inferior

### 8.2 Menus e modais

A interface usa modais transparentes sobrepostos com foco em ações rápidas. Esses modais são importantes para:

- economizar espaço
- manter o fluxo de navegação curto
- fornecer ações contextuais sem sair da tela principal

### 8.3 Ordenação atual

A tela suporta ordenação por:

- alfabética
- atrasados
- prioridade
- mais erros

A opção de ordenação é exibida em um botão compacto e abre um menu com as opções. Esse formato foi pensado para economizar espaço na lista principal.

Importante: a lógica de prioridade é numérica e a convenção da app é:

- número menor = prioridade maior
- maior urgência = menor valor

Exemplo:

- prioridade 1 = mais alta prioridade
- prioridade 9 = menos prioritária

---

## 9. Dados de comportamento do app que ajudam a IA a propor melhorias

Abaixo estão as informações que ajudam a IA a entender a intenção da app e a manter a lógica funcional ao sugerir redesigns:

### 9.1 Função principal

Entender rapidamente quais conjuntos precisam revisão e qual ordem priorizar.

### 9.2 Usuário final

Pessoa que quer estudar de modo consistente, com acompanhamento de progresso e organização por assunto.

### 9.3 Regras de experiência importantes

- a tela principal deve continuar sendo prática e rápida
- o usuário deve enxergar o progresso sem esforço
- a ordenação deve ser simples de usar
- cartões e conjuntos precisam ser organizados visualmente
- a navegação deve evitar excesso de cliques

### 9.4 Objetivos de melhoria possíveis

- dar mais destaque à prioridade e ao atraso
- reduzir informação “de utilidade” visual que deixa tela pesada
- melhorar legibilidade em telas menores
- criar mais diferenciação visual entre status de estudo e ação principal
- melhorar a sensação de “planejamento” e “controle” da rotina de estudo

---

## 10. Sugestões de prompts para mandar para a IA especialista

### Prompt base

> Olá! Eu tenho um app mobile de estudo com flashcards. A tela principal é uma listagem de conjuntos com ações rápidas, progresso diário, busca, ordenação compacta e cards de cada conjunto. A interface usa visual escuro, cards em superfície clara, destaque em azul/roxo, métricas fortes e foco em produtividade. O app prioriza revisão eficiente e organização por progresso/atraso/prioridade. Gostaria de sugestões de redesign visual para tornar a tela mais elegante, mais clara em mobile e mais atrativa, sem perder a funcionalidade. Quais melhorias de UX/UI você propõe? Analise a estrutura atual, a hierarquia visual e a lógica de estudo, e me dê: 1) uma proposta de redesign completo, 2) uma paleta melhor ajustada, 3) melhor organização de cards, 4) melhoria para economia de espaço, 5) ideias de microinterações, 6) variações de estilo (premium, minimalista, more playful, etc.).

### Prompt mais específico para análise visual

> Analise esta interface de app de flashcards e me proponha um redesign para a tela principal. Considere: lista de conjuntos, busca, ações rápidas em linha, botão de ordenação compacta, progresso diário, status por conjunto, badge de prioridade, footer de ações. A interface atual tem visual dark mode com cards discretos e foco em funcionalidade. Quero uma solução visual mais refinada, com melhor hierarquia e maior percepção de urgência de estudo. Sugira uma proposta de layout, cores, espaçamento, tipo gráfico, bordas, componentes e fluxos de interação em mobile.

### Prompt para melhorar a legibilidade em mobile

> Refaça a tela principal do meu app para mobile, priorizando legibilidade, velocidade de leitura e clareza nas ações. A tela tem muitos dados em uma única área. Reduza ruído visual e destaque de forma clara os conjuntos em atraso, com prioridade alta e com maior impacto de estudo. Mantenha a funcionalidade, mas simplifique a estrutura visual e reduza a densidade informational.

### Prompt para estilo premium

> Quero uma versão premium da tela principal do meu app. Mantém a funcionalidade, mas transforma o visual em algo mais sofisticado, moderno e envolvente. Crie direcionamentos para paleta premium, bordas refinadas, tipografia elegante, cards com sensação de qualidade, menor excesso de contraste e melhor sensação de “status” para cada conjunto.

### Prompt para versão minimalista

> Crie uma versão minimalista da tela principal do app, com visual mais limpo e menos preenchido. Mantenha as ações essenciais, mas reduza o número de elementos visuais ao redor da lista. Foque em clareza, calma visual, espaço em branco e melhor leitura em telas pequenas.

### Prompt para proposta de nova arquitetura visual

> Reorganize a tela principal do app pensando em um dashboard de estudo. Crie uma hierarquia clara com: header, busca, status de progresso, seção de revisão e listas de conjuntos. Sugira uma estrutura visual mais eficiente, com agrupamento por contexto, melhor visibilidade dos conjuntos prioritários e componentes mais cohérents para mobile.

---

## 11. Checklist rápido para a IA ou para você validar a melhoria

Ao receber uma proposta, confirme se ela atende a estes critérios:

- mantém a lógica funcional intacta
- melhora a leitura do conjunto prioritário
- reduz ruído visual
- cria diferenciação clara entre ações primárias e secundárias
- melhora o entendimento do progresso
- reduz o esforço do usuário em decidir o que revisar
- mantém o app funcional em tela pequena
- expande visualmente sem perder clareza
- torna os conjuntos atrasados e prioritários mais perceptíveis

---

## 12. Resumo executivo da interface atual

A tela principal do app já possui boa base funcional: organiza estudos, tem controles de revisão, indicação de progresso e ações rápidas. O principal problema visual não é a lógica, e sim a densidade e a hierarquia. O design atual funciona, mas pode ser melhorado em termos de:

- destaque de prioridade
- diferenciação entre estados de estudo
- legibilidade da lista
- compacidade da organização visual
- refinamento estético da interface

Este documento fornece tudo o que uma IA especialista precisa para analisar a interface e propor melhorias de maneira precisa e acionável.

---

## 13. Como usar este arquivo

Você pode:

1. colar o conteúdo inteiro em um chat de IA
2. resumir trechos importantes
3. pedir uma proposta visual inicial em 3 estilos diferentes
4. pedir uma análise crítica do design atual
5. pedir uma nova estrutura de componentes pronta para implementar em React Native

Se quiser, posso também transformar este briefing em um prompt mais curto e otimizado para IA, ou criar uma segunda versão focada em um visual específico, como premium, minimalista ou mais gamificado.
