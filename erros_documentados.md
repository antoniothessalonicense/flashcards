# Erros Documentados

## 1. Conjuntos Atrasados não Sendo Selecionados
* **Categoria:** Lógica de negócio / Seleção de Ciclo
* **Data:** 09/07/2026
* **Causa:** O campo `next_review_date` da tabela `sets` nunca era atualizado após a criação do conjunto. Com o tempo, os conjuntos continuavam com a data inicial (geralmente 0 ou a data de criação). O algoritmo de seleção de conjuntos atrasados usava `ORDER BY next_review_date ASC`, mas como todos ficavam com o mesmo valor (ou valor desatualizado), o SQLite resolvia o empate retornando os mesmos conjuntos sempre (provavelmente pelo `rowid`), ignorando os conjuntos que realmente estavam com cards mais atrasados.
* **Solução (Round-Robin):** O `next_review_date` do conjunto continua representando se ele tem cards atrasados (`MIN(next_review_date) <= now`). Mas para garantir a rotação equitativa dos conjuntos no ciclo, foi introduzido o campo `last_review_date` na tabela `sets`.
  1. A função `updateCardDifficulty` foi atualizada para alterar o `last_review_date` do `set` respectivo para `Date.now()` sempre que um card for revisado. O `next_review_date` também é mantido como o `MIN()` dos seus cards.
  2. Foi adicionada uma migração em `App.js` para criar a coluna `last_review_date` de forma segura.
  3. Em `dbServices.drizzle.js` (`buildCycleCards`), a consulta dos conjuntos atrasados (`setsAtrasados`) passou a ordenar por `last_review_date ASC`. Isso empurra automaticamente os conjuntos recém-revisados para o fim da fila de atrasados, priorizando conjuntos que estão parados há mais tempo.
* **Palavras Chaves:** ciclo de revisão, conjuntos atrasados, next_review_date, last_review_date, round-robin, não seleciona, prioridade, empate, dbServices.drizzle, SQLite.

## 2. Revisão Obrigatória Selecionando Cards de Conjuntos 100% Aprendidos
* **Categoria:** Lógica de negócio / Seleção de Ciclo (Método Progressivo)
* **Data:** 13/07/2026
* **Causa:** O bloco de seleção "REVISÃO OBRIGATÓRIA (Progressão Kumon)" em `buildCycleCards` iterava pelos conjuntos baseados estritamente na `priority` para extrair a cota de cards (`cardsPorConjuntoObrigatorio`). No entanto, a lógica não excluía conjuntos que já atingiram 100% de aprendizado (`pct == 1`) nem aplicava filtros para excluir os próprios cards que possuíam o status `good` ou `easy` da consulta individual de cards do conjunto. Como a ordenação era apenas por `next_review_date ASC`, conjuntos 100% aprendidos acabavam devolvendo seus cards (que tinham datas futuras) apenas para preencher o limite solicitado, quebrando o sentido do método progressivo de focar no que ainda não foi aprendido.
* **Solução:**
  1. Foi adicionado o filtro `.filter(s => s.pct < 1)` na lista de conjuntos mapeados (`setsOrdenados`), ignorando completamente qualquer conjunto cujo percentual de cards com `difficultyStatus` IN ('good', 'easy') seja 100%.
  2. Foi adicionada uma restrição extra na query dos cards do conjunto (`cardsDoSet`), garantindo que apenas cards com status **diferente** de `good` e `easy` sejam extraídos: `AND cards.difficultyStatus NOT IN ('good', 'easy')`. Isso garante que mesmo um conjunto 99% aprendido forneça apenas a porção de 1% não aprendida para o método progressivo, abrindo espaço na cota para que a função extraia cards da próxima prioridade na fila.
* **Palavras Chaves:** revisão obrigatória, método progressivo, kumon, priority, 100% aprendido, dbServices.drizzle.

## 3. Conjuntos Fixos mostram contagem incorreta e não respeitam atraso
* **Categoria:** Interface / Lógica de negócio (Seleção de Ciclo)
* **Data:** 20/07/2026
* **Causa:** Havia dois problemas relacionados aos conjuntos fixos. (1) A interface `ConfiguracaoCicloScreen.tsx` exibia a quantidade total de IDs salvos na store (`config.conjuntosFixosSelecionados.length`), sem verificar se esses conjuntos haviam sido deletados do banco de dados, causando uma contagem inflada (ex: "3 selecionados" quando apenas 1 existia). (2) A query SQL em `dbServices.drizzle.js` para os conjuntos fixos selecionados manualmente usava apenas o operador `inArray` sem nenhuma cláusula de `ORDER BY`, resultando em uma escolha arbitrária pelo SQLite (geralmente por `rowid`) ignorando a regra de priorizar os "mais atrasados".
* **Solução:**
  1. A interface foi atualizada para filtrar a lista `conjuntosFixosSelecionados`, comparando com `allSets`, e só renderizando na contagem da tela principal os IDs que ainda existem fisicamente no banco de dados.
  2. Foi adicionada a cláusula `ORDER BY sets.last_review_date ASC` em ambas as queries (seleção manual e seleção automática do banco) da fase "5. CONJUNTOS FIXOS" no arquivo `dbServices.drizzle.js`. Dessa forma, o motor respeitará estritamente a nova regra de priorizar conjuntos abandonados a mais tempo.
* **Palavras Chaves:** conjuntos fixos, contagem errada, deletado, inArray, order by, last_review_date, mais atrasados priorizados.
