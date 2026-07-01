# Lógica de Prioridade: Conjuntos de Revisão Obrigatória

## 1. Visão Geral
A "Revisão Obrigatória" no seu aplicativo foca no estudo dos cartões, respeitando uma prioridade fixa e configurável pelo usuário.

A prioridade de um conjunto é determinada por um único fator:
1. **Índice de Prioridade Manual:** O aplicativo utiliza o valor numérico de `priority` definido pelo usuário no conjunto. **Menores valores aparecem primeiro** (ex: 1 vem antes de 2). Caso um conjunto não tenha prioridade (ou seja nulo), ele assumirá um valor alto (9999) para ser posicionado ao final.

## 2. Código Comentado (`dbServices.drizzle.js`)

A lógica principal que decide quais conjuntos entram na Revisão Obrigatória fica no arquivo `dbServices.drizzle.js`. Abaixo está o trecho exato comentado em português:

```javascript
// 1. Coleta estatísticas de todos os cartões e agrupa por conjunto (set)
const statsAll = await db.select({
  setId: cards.set_id, // ID do conjunto
  total: sql`count(${cards.id})`.mapWith(Number), // Total de cartões neste conjunto
  // Soma 1 para cada cartão que tem status 'good' (bom) ou 'easy' (fácil), ou seja, memorizado
  memorized: sql`sum(CASE WHEN ${cards.difficultyStatus} IN ('good', 'easy') THEN 1 ELSE 0 END)`.mapWith(Number),
  priority: sets.priority, // Pega o valor da prioridade manual definida no conjunto
}).from(cards)
  .leftJoin(sets, eq(cards.set_id, sets.id))
  .groupBy(cards.set_id, sets.priority);

// 2. Ordena os conjuntos baseando-se unicamente na prioridade manual
const setsOrdenados = statsAll
  .map(s => ({ 
    ...s, 
    pct: s.total > 0 ? (s.memorized || 0) / s.total : 0, 
    // Garante que se não tiver prioridade definida, o valor padrão seja bem alto para ir para o fim
    priority: s.priority ?? 9999 
  }))
  .sort((a, b) => {
    // Ordena pela prioridade. Menor valor = MAIOR PRIORIDADE na lista.
    return a.priority - b.priority;
  });

// 3. Distribuição de cartas
let obrigatoriosRestantes = config.cardsPorConjuntoObrigatorio;
for (const s of setsOrdenados) {
  if (obrigatoriosRestantes <= 0) break; // Para quando atinge o limite configurado
  
  // Pega os cartões do conjunto atual, ordenando pelos que estão mais atrasados
  const cardsDoSet = await db.select()
    .from(cards)
    .where(eq(cards.set_id, s.setId))
    .orderBy(sql`${cards.next_review_date} ASC`)
    .limit(obrigatoriosRestantes);
  
  // (Segue a lógica para adicionar os cartões ao ciclo...)
}
```

## 3. Como Modificar a Lógica com Segurança

Caso você queira alterar como o sistema prioriza, aqui estão os cenários mais comuns e o que alterar na função `sort` (linha ~211 do `dbServices.drizzle.js`):

### Cenário A: Fazer a prioridade manual ser mais importante que a memorização
Se você quiser que o conjunto com "Prioridade 1" venha **sempre** primeiro, não importando a porcentagem de memorização:
```javascript
.sort((a, b) => {
  // 1º Criterio: Prioridade Manual
  if (a.priority !== b.priority) {
      return (a.priority || 0) - (b.priority || 0);
  }
  // 2º Criterio (Desempate): Porcentagem
  return a.pct - b.pct;
});
```

### Cenário B: Fazer "Maior Valor numérico = Maior prioridade"
Se você preferir que o número 10 tenha mais prioridade que o número 1:
```javascript
.sort((a, b) => {
  if (a.pct === b.pct) {
      // Inverte b e a: b - a faz com que valores maiores venham primeiro
      return (b.priority || 0) - (a.priority || 0);
  }
  return a.pct - b.pct;
});
```
*(Se fizer isso, precisará alterar a mesma lógica no `DeckListScreen.js` para manter a consistência na ordenação das telas).*

## 4. Sugestões e Alertas

### ⚠️ Inconsistência de Texto na UI Encontrada
No arquivo `src/screens/DeckDetailsScreen.js` (linha 176), o texto explicativo da UI informa ao usuário:
`"Maior valor = mais prioridade"`

No entanto, como vimos no código (`a.priority - b.priority`), a lógica real obedece o **menor valor** como maior prioridade (Prioridade 1 tem precedência sobre Prioridade 2), o que inclusive bate com a descrição na tela de configurações (`ConfiguracaoCicloScreen.tsx`): `"Prioridade: Menor Índice (Ex: Conjunto 1 > Conjunto 2)"`.

**Sugestão de Correção no `DeckDetailsScreen.js`**:
Mude o texto na linha 176 de `"Maior valor = mais prioridade"` para `"Menor valor = mais prioridade"`.

### 💡 Sugestão Adicional: Tratamento de Prioridade Indefinida
Atualmente, se um `deck` não tem prioridade salva (é `null` ou `undefined`), o código no banco de dados converte para `0` (`s.priority || 0`). Como 0 é o menor valor numérico aceitável, **um deck sem prioridade ganha precedência máxima no desempate**.
Recomenda-se tratar os decks sem prioridade como tendo a *menor importância* no desempate.
Para corrigir, você pode definir um valor artificial muito alto (ex: 9999) para decks sem prioridade durante o `sort` no `dbServices.drizzle.js`:
```javascript
const priorityA = a.priority ?? 9999;
const priorityB = b.priority ?? 9999;
return priorityA - priorityB;
```
*(A tela `DeckListScreen.js` já faz exatamente isso na ordenação por prioridade, então aplicar isso no ciclo garante que ele siga a mesma inteligência visual da lista).*
