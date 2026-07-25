# Nass3D — Gestão de Impressão 3D

Site de gestão para empresa de impressão 3D: calculadora de precificação, controle de materiais,
produtos, pedidos, vendas, relatório mensal e geração de orçamento em PDF.

Sem build step/bundler — arquivos estáticos servidos como estão. Multiusuário com login: cada
conta só vê os próprios dados (Supabase Auth + Postgres com Row Level Security).

## Estrutura de arquivos

- [index.html](index.html) — markup: tela de login (`#authScreen`) + app (`.wrap`, hidden até
  logar) com topbar, abas e as 7 seções
- [style.css](style.css) — todo o CSS, variáveis de tema em `:root` no topo (cores, raio de borda)
- [config.js](config.js) — `SUPABASE_URL`/`SUPABASE_ANON_KEY` e criação do `supabaseClient`
  (carregado antes de `script.js`)
- [script.js](script.js) — lógica de negócio (calculadora, CRUDs, painel, relatório, PDF) +
  `loadAll`/`saveAll`/`loadSettings`/`saveSettings`, que agora leem/gravam no Supabase
- [auth.js](auth.js) — tela de login/cadastro, sessão, logout; chama `initCollections()`
  (definida em `script.js`) só depois de confirmar que há um usuário logado
- [supabase-schema.sql](supabase-schema.sql) — SQL das 5 tabelas + políticas de RLS, rodado uma
  vez no SQL Editor do Supabase
- [CLAUDE.md](CLAUDE.md) — este arquivo

Ordem de carregamento dos scripts em `index.html`: jsPDF → supabase-js (CDN) → `config.js` →
`script.js` → `auth.js`. `script.js` só define funções (não roda `initCollections()` sozinho);
quem dispara isso é `auth.js`, depois que confirma a sessão.

> Histórico: até 2026-07-24 era um único arquivo (`nass3d.html`) com `window.storage` (API só do
> Claude.ai). Foi separado em HTML/CSS/JS e migrado pra `localStorage` (dados presos ao navegador
> local, sem login). Em seguida migrado pra Supabase (auth + banco na nuvem, acessível de qualquer
> dispositivo) — ver seção "Persistência" abaixo.

### Dependências externas (via CDN, carregadas no `<head>` de `index.html`)
- Google Fonts: Orbitron, Rajdhani, Inter, JetBrains Mono
- [jsPDF](https://github.com/parallax/jsPDF) `2.5.1` — geração de PDF de orçamentos/relatórios
- [supabase-js](https://github.com/supabase/supabase-js) `2` (UMD, via jsDelivr) — cliente do
  Supabase (auth + banco)

### Seções de `index.html`
- **`#authScreen`** — tela de login/cadastro (e-mail + senha), única coisa visível até logar
- **`.wrap`** (`display:none` até logar) — topbar (logo, abas, badge do usuário + botão Sair) e as
  7 abas: Painel, Calculadora, Materiais, Produtos, Pedidos, Vendas, Relatório

## Autenticação (Supabase Auth)

`auth.js` controla tudo:
- `showAuthScreen()` / `showApp()` alternam entre a tela de login e `.wrap`
- `handleLogin()` → `supabaseClient.auth.signInWithPassword`
- `handleSignup()` → `supabaseClient.auth.signUp` (se o projeto exigir confirmação de e-mail, o
  usuário só ganha sessão depois de clicar no link recebido)
- `handleLogout()` → `supabaseClient.auth.signOut()`
- Ao carregar a página, `initAuth()` chama `supabaseClient.auth.getSession()` — se já houver sessão
  válida (cookie/token persistido pelo supabase-js), pula direto pro app sem pedir login de novo
- `currentUser` (variável global em `auth.js`) guarda o usuário logado; `script.js` usa
  `currentUser.id` em toda chamada ao banco

## Persistência (Supabase Postgres + RLS)

5 tabelas, todas com `user_id uuid references auth.users(id)` e RLS restringindo cada linha a
`auth.uid() = user_id` (política `"own rows" ... for all using (...) with check (...)`, ver
[supabase-schema.sql](supabase-schema.sql)):

- `materials(id, user_id, nome, cor, preco, estoque, created_at)`
- `products(id, user_id, nome, preco, custo, created_at)`
- `orders(id, user_id, cliente, telefone, item, prazo, status, valor, criado_em)`
- `sales(id, user_id, data, produto, comprador, contato, valor, pedido_id, created_at)`
- `settings(user_id [PK], meta_mensal, orcamento_numero, empresa_nome, logo_data_url, updated_at)`

`id` é gerado no cliente (`newId()`, alfanumérico) e usado como chave primária — não é serial do
banco. `settings` tem uma linha por usuário (`user_id` é a própria PK), diferente das outras 4 que
são listas.

Todo acesso passa por **4 funções em `script.js`** (mesmos nomes de antes, agora batendo no
Supabase em vez do `localStorage`):
- `loadAll(key)` / `saveAll(key, arr)` — coleções (`materials`/`products`/`orders`/`sales`).
  `saveAll` sempre recebe o array completo (é assim que o resto do código já funcionava antes da
  migração) e faz o diff sozinho: busca os ids existentes no banco, deleta os que sumiram do
  array, e faz `upsert` do resto.
- `loadSettings()` / `saveSettings()` — linha única em `settings` (`upsert` com `onConflict:
  'user_id'`)
- `TABLES` (objeto em `script.js`) faz a conversão camelCase (app) ↔ snake_case (banco) por
  coleção — é o único lugar que conhece o nome exato das colunas

**Importante**: como é tudo client-side com a chave `anon public`, a segurança real vem das
políticas de RLS, não do sigilo da chave — por isso `config.js` pode ser commitado normalmente. A
chave `service_role` (essa sim secreta) nunca deve aparecer no código.

## Deploy

- **Site**: https://nass3-d.vercel.app
- **Repositório**: https://github.com/Winklexz/Nass3D

Publicado na Vercel a partir do repositório no GitHub — todo `git push` pra `main` republica o
site automaticamente (~30s-1min). Sem variáveis de ambiente de build (é tudo estático); `config.js`
já contém a URL/chave do Supabase que vale tanto local quanto em produção.

## Git

Repositório iniciado em 2026-07-24, branch `main`. Remoto no GitHub (`origin`) conectado à Vercel
para deploy contínuo.

## Notas de troubleshooting

- **PostgREST "Could not find the table in the schema cache" (PGRST205)**: aconteceu com o
  primeiro projeto Supabase criado (`pjsxudunqkqjeltiftpi`) mesmo com tabelas/grants/RLS/exposição
  corretos, `NOTIFY pgrst, 'reload schema'`, restart do projeto e até uma alteração real de DDL —
  nada resolveu. Um projeto novo (`zzngtfwongumucdtqwgk`, o que está em uso hoje) funcionou de
  primeira com o mesmo SQL. Se isso se repetir, criar um projeto novo é mais rápido que depurar.
- **Preview de arquivo `file://` fora da pasta do projeto**: o navegador de preview trata esses
  arquivos como "snapshot estático" — chamadas de rede (`fetch`) para APIs externas não se
  comportam como numa página real (retornam erros que não refletem o estado real do backend).
  Para testar chamadas de rede de verdade, usar uma URL `http(s)://` real (ex: o deploy na Vercel).
