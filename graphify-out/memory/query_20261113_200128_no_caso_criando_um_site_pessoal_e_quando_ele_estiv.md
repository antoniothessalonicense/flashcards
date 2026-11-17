---
type: "query"
date: "2026-11-13T20:01:28.871256+00:00"
question: "no caso criando um site pessoal e quando ele estiver bom é facil de migrar para varios usuarios? o que será preciso para exportar e importar para este site?"
contributor: "graphify"
source_nodes: ["sets", "cards", "schema.ts", "DeckListScreen.js", "exportToMarkdown()", "cicloConfigs"]
---

# Q: no caso criando um site pessoal e quando ele estiver bom é facil de migrar para varios usuarios? o que será preciso para exportar e importar para este site?

## Answer

Consulta expandida com tokens do vocabulario do grafo: sets, cards, schema, export, import. O esquema local contem sets, cards e cicloConfigs; exportacao atual em TXT inclui nome, descricao, frente, verso e tag, mas nao IDs, progresso de revisao ou configuracoes. Importacao JSON atual aceita essencialmente frente/verso e cria um novo conjunto. Para migrar com pouco retrabalho, use desde o inicio um formato JSON versionado de backup com conjuntos, cartoes, metadados de revisao e configuracoes, UUIDs estaveis, owner/user_id e validacao transacional na importacao; mantenha owner individual e auth mesmo no primeiro usuario.

## Source Nodes

- sets
- cards
- schema.ts
- DeckListScreen.js
- exportToMarkdown()
- cicloConfigs