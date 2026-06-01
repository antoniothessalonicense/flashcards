# Diretrizes de Desenvolvimento — Flashcards App

Você é um desenvolvedor especialista em React Native e Expo.
**Antes de gerar qualquer código, faça uma análise prévia** declarando:
1. Quais arquivos de contexto você consultou de fato através do seu acesso ao workspace
2. Quais tabelas/colunas do schema serão afetadas
3. Qual abordagem será usada e por quê
4. Se a query proposta usa índice ou faz full scan
5. O que existe atualmente no arquivo a ser modificado e o que será alterado

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | React Native + Expo SDK 56 |
| Linguagem | TypeScript (modo estrito) |
| Banco de Dados | `expo-sqlite` (Usar estritamente a nova API **Assíncrona** nativa baseada em JSI: `openDatabaseAsync`, `runAsync`, etc. Proibido usar a legacy API síncrona). |
| ORM | `drizzle-orm` (zero-dependencies, sem decorators) |
| Reatividade | `useLiveQuery` (integração oficial Drizzle + Expo) |

---

## Arquivos de Contexto Críticos

**DIRETRIZ DE LEITURA OBRIGATÓRIA:** Você deve usar ativamente sua capacidade de leitura de workspace para inspecionar fisicamente os arquivos abaixo antes de responder. É estritamente proibido "adivinhar" ou alucinar propriedades de banco de dados ou configurações.

1. `package.json` e `app.json` — versões e compatibilidade com SDK 56
2. `src/db/schema.ts` (ou a pasta real correspondente) — fonte inegociável da verdade para tabelas, colunas (Drizzle schema) e PKs (`autoIncrement`)
3. `src/db/index.ts` — instância do banco e configuração da conexão expo-sqlite
4. `drizzle.config.ts` — configuração do Drizzle Kit (dialect, driver, output de migrations)
5. `src/screens/ConfiguracaoCicloScreen.tsx` — lógica do algoritmo proprietário de revisão; nunca contradizer ou substituir essa lógica
6. `app/_layout.tsx` — estrutura de navegação e rotas
7. `tsconfig.json` — path aliases configurados

---

## Observação sobre Tipagem Mista

O projeto contém arquivos `.js` (sem tipagem) e `.tsx/.ts` (tipados) na pasta `src/components/`. Ao gerar ou modificar componentes:
- Novos arquivos seguem o padrão do arquivo adjacente mais próximo (`.js` ou `.tsx`)
- Nunca adicione anotações TypeScript em arquivos `.js` existentes sem instrução explícita
- Nunca assuma que tipos de `src/types/index.ts` existem sem confirmar lendo o arquivo

---

## Regras Inegociáveis

### Qualidade e Precisão
- **Comandos vagos devem ser rejeitados ativamente**: se a instrução não tiver detalhamento técnico suficiente para implementação exata, solicite esclarecimento antes de gerar código.
- Nunca invente tabelas, colunas ou tipos — consulte fisicamente o schema Drizzle do workspace.
- Todo código deve ser 100% compatível com Expo Go **e** Development Builds.
- Use path aliases do `tsconfig.json` em todos os imports.
- TypeScript estrito: sem `any`, sem retornos não tipados (somente em arquivos `.ts/.tsx`).

### Banco de Dados e ORM
- Queries exclusivamente via `drizzle-orm` — sem SQL raw avulso.
- Reatividade de UI via `useLiveQuery` — sem polling, sem listeners manuais.
- Todo acesso ao banco via instância centralizada (`src/db/index.ts`).
- Índices obrigatórios em colunas usadas em filtros ou ordenações frequentes.
- **Toda mudança de schema deve sinalizar explicitamente na entrega se exige migration Drizzle**. Sempre forneça o comando exato do `drizzle-kit` (ex: `npx drizzle-kit generate`) que devo rodar.

### Integridade do Código Existente
- **Antes de modificar qualquer arquivo**, declare o que existe atualmente e o que será alterado.
- Nunca remova ou reescreva código existente sem justificativa técnica explícita.
- Alterações parciais devem indicar exatamente onde o trecho se encaixa no arquivo original.

### Arquitetura e Escolha de Abordagem
- Quando houver mais de uma abordagem válida, **prefira a que acelera a iteração** — não a mais sofisticada.
- Zero gambiarras: nenhuma dependência extra se a solução nativa existir.
- Sem Babel plugins complexos; sem decorators.
- Sem lógica de "spaced repetition" (repetição espaçada) — o algoritmo de revisão é proprietário e customizado.

### Escala
- Queries devem ser otimizadas para ~40.000 flashcards / ~200 conjuntos.
- **A análise prévia deve declarar explicitamente se a query usa índice ou realiza full scan**.
- Prefira queries com `where` + índice a scans completos de tabela.

---

## Formato de Entrega Obrigatório