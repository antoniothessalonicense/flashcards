---
type: "query"
date: "2026-11-13T19:45:30.719423+00:00"
question: "queria criar um site que se conectar ao banco de dados do app, quais caminhos seria as melhores opções?"
contributor: "graphify"
source_nodes: ["web", "Database", "test:api", "init_db.js", "migrate_watermelon_to_drizzle.js"]
---

# Q: queria criar um site que se conectar ao banco de dados do app, quais caminhos seria as melhores opções?

## Answer

Consulta expandida com tokens do vocabulario do grafo: database, sqlite, drizzle, api, web. O grafo mostra a configuracao Expo web e test:api em package.json, mais scripts locais de inicializacao e migracao do banco; nao mostra um servidor HTTP de backend. Isso e coerente com o banco SQLite local identificado em db/index.ts. Para compartilhar dados entre app e site, sera necessario um banco central acessivel por ambos via servico seguro, ou exportacao/importacao se nao houver sincronizacao.

## Source Nodes

- web
- Database
- test:api
- init_db.js
- migrate_watermelon_to_drizzle.js