# AI Context & Engineering Guidelines

Este arquivo estabelece o contexto principal e as diretrizes arquiteturais inegociáveis para todas as interações de inteligência artificial no desenvolvimento deste projeto. O aplicativo gerencia um alto volume de dados (aproximadamente 40.000 flashcards) utilizando um método algorítmico personalizado de revisão e atraso de matérias.

## Regras Inegociáveis de Desenvolvimento

1. **Objetividade Técnica**: As soluções propostas devem ser extremamente objetivas e diretamente aplicáveis à tecnologia vigente no projeto. Comandos vagos ou subjetivos devem ser ativamente rejeitados, exigindo-se sempre o detalhamento técnico necessário para a implementação exata.

2. **Prototipagem Rápida**: O código gerado deve focar estritamente na velocidade de implementação e na facilitação do trabalho do desenvolvedor guiado por inteligência artificial, criando bases consistentes e limpas para iterações ágeis.

3. **Zero Gambiarras e Minimalismo**: Devem ser escolhidas estritamente bibliotecas e tecnologias com o menor número de dependências possível, garantindo compatibilidade nativa. Deve-se evitar qualquer configuração complexa que fuja do padrão oficial estabelecido pelo framework.

4. **Reatividade**: Implementar buscas no banco de dados e atualizações de estado em tempo real sempre que for arquiteturalmente possível, mantendo a camada de apresentação perfeitamente sincronizada com a camada de persistência.

5. **Alta Performance**: A arquitetura deve ser robusta e durável para suportar grandes volumes de dados de forma altamente eficiente. Prioriza-se a integração de Drizzle ORM juntamente com as soluções de SQLite nativo mais eficientes para o ecossistema atual.

6. **Ecossistema Atual**: O código entregue deve ser 100% compatível com as versões e tendências tecnológicas contemporâneas do ecossistema, especificamente desenhado para **React Native com Expo SDK 56**, garantindo suporte perfeito, sem fricções, tanto para o Expo Go quanto para Development Builds.

7. **Fontes Oficiais**: Toda recomendação, arquitetura, design pattern e sintaxe gerada deve estar estritamente alinhada e baseada na documentação oficial mais atualizada das bibliotecas e frameworks aplicados no projeto.

## Stack Tecnológica Oficial do Projeto
- **Framework Core:** React Native com Expo SDK 56 (suporte nativo e otimizado para Expo Go, Development Builds e compatível com a Nova Arquitetura/Bridgeless Mode).
- **Banco de Dados Local:** `expo-sqlite` (utilizando estritamente a nova API nativa e síncrona via JSI, garantindo altíssima performance e sem depender de *bridges* assíncronas legadas).
- **ORM (Camada de Dados):** `drizzle-orm` (TypeScript-first, *zero-dependencies*, sem uso de *decorators* que exigem Babel plugins complexos. Focado em gerar SQL limpo e direto).
- **Reatividade em Tempo Real:** Uso exclusivo do hook `useLiveQuery` (integração oficial Drizzle + Expo) para atualizar a interface instantaneamente quando os dados mudarem, eliminando o uso de bibliotecas reativas de terceiros (como RxJS).
- **Tipagem:** TypeScript em modo estrito para garantir previsibilidade e evitar falhas silenciosas.

## Domínio de Negócio e Restrições de Lógica
- **Escala de Dados (Alta Performance):** A modelagem de dados e as *queries* geradas devem ser otimizadas (usando *Indexes* no SQLite) para suportar consultas instantâneas em um banco local contendo aproximadamente 40.000 flashcards distribuídos em cerca de 200 conjuntos.
- **Motor de Busca e Revisão:** O sistema de triagem de matérias atrasadas obedece a um **método algorítmico estritamente personalizado**. Sob nenhuma hipótese a IA deve sugerir, implementar ou utilizar o termo ou a lógica padrão de "repetição espaçada" (*spaced repetition*).
- **Formatação Estrutural de Conteúdo:** Sempre que a IA precisar gerar, simular ou estruturar dados de *flashcards* (para *mock* ou exportação), um padrão estrito de formatação deve ser seguido: os dois pontos (`:`) devem seguir imediatamente a numeração, e o ponto e vírgula (`;`) deve ser usado como separador terminal para as explicações.
