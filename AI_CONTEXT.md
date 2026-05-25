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
