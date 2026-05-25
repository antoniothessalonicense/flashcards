# Changelog de Arquitetura e Dependências

Este arquivo mantém um registro limpo e centralizado das decisões arquiteturais definitivas e do histórico de pacotes instalados/removidos. Este documento **não** é um diário de mensagens ou desenvolvimento contínuo, mas um registro de mudanças de alto nível, estado do ecossistema e definições estruturais do projeto.

---

## [23/05/2026] - Definição de Base Arquitetural e IA

### Arquitetura e IA
- Definição formal das diretrizes arquiteturais do projeto baseadas no React Native e **Expo SDK 56**.
- Estabelecimento do isolamento de contexto para o assistente de inteligência artificial através do arquivo de regras inegociáveis (`AI_CONTEXT.md`).

### Domínio do Projeto
- Configuração de escopo para manipulação massiva de dados (aprox. 40.000 flashcards).
- Estabelecida a diretriz central do projeto focada no emprego de um método algorítmico personalizado de revisão e atraso de matérias, em substituição a lógicas convencionais.
