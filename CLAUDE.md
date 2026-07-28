# Nass3D — Gestão de Impressão 3D

Site de gestão para empresa de impressão 3D: calculadora de precificação, controle de materiais,
produtos, pedidos, vendas, relatório mensal e geração de orçamento em PDF.

SPA em React (Vite + Tailwind + shadcn/ui), com build step (`npm run build`, saída em `dist/`).
Multiusuário com login: cada conta só vê os próprios dados (Supabase Auth + Postgres com Row Level
Security).

> Histórico: até 2026-07-24 era um único arquivo (`nass3d.html`) com `window.storage` (API só do
> Claude.ai). Foi separado em HTML/CSS/JS e migrado pra `localStorage`, depois pra Supabase (auth +
> banco na nuvem). Em 2026-07-25 o front-end inteiro foi reescrito como SPA React + Vite +
> Tailwind + shadcn/ui (ver `docs/superpowers/specs/2026-07-25-redesign-react-shadcn-design.md`
> para o plano/rationale do redesign) — mesma funcionalidade, mesmo schema Supabase, visual novo.
> Os arquivos estáticos antigos (`index.html` raiz antigo, `style.css`, `script.js`, `auth.js`,
> `config.js`) foram removidos; `index.html` hoje é o entrypoint do Vite.

## Estrutura de arquivos

- [index.html](index.html) — entrypoint do Vite: `<div id="root">` + `<script type="module"
  src="/src/main.jsx">`
- [src/main.jsx](src/main.jsx) — `ReactDOM.createRoot` monta `<App />`
- [src/App.jsx](src/App.jsx) — `BrowserRouter` + rotas; `AppRoutes` lê `useAuth()` e redireciona
  pra `/login` sem sessão, ou pra `/` se logado tentar ver `/login`; rotas autenticadas ficam
  aninhadas sob `<AppLayout />` (sidebar)
- [src/context/AuthContext.jsx](src/context/AuthContext.jsx) — `AuthProvider`/`useAuth()`: estado
  `user`/`loading`, `login`/`signup`/`logout` (chamam `supabase.auth.*`), tradução de mensagens de
  erro do Supabase pro português (`traduzErro`), assina `onAuthStateChange` pra manter a sessão
  sincronizada
- [src/pages/](src/pages) — um arquivo por rota: `Login.jsx`, `Painel.jsx`, `Calculadora.jsx`,
  `Materiais.jsx`, `Produtos.jsx`, `Pedidos.jsx`, `Vendas.jsx`, `Relatorio.jsx`
- [src/components/layout/](src/components/layout) — casca visual comum: `AppLayout.jsx` (sidebar
  fixa no desktop, `Sheet` como gaveta mobile, `AnimatePresence`/`motion` envolvendo o `<Outlet />`
  pra transição de página) e `Sidebar.jsx` (logo, 7 itens de navegação, e-mail do usuário, botão
  Sair)
- [src/components/shared/](src/components/shared) — componentes reusados entre páginas:
  `StatCard.jsx` (card de estatística com contador animado), `AlertCard.jsx` (alerta com nível
  atrasado/urgente/ok), `DataTable.jsx` (tabela genérica com edição inline — exporta também
  `textCell`/`numberCell`/`dateCell`/`selectCell`, helpers que viram células editáveis, usados
  pelas páginas de CRUD; abaixo de 768px renderiza como uma lista de cartões empilhados em vez de
  `<table>`, pra manter os botões de ação sempre alcançáveis no celular sem scroll horizontal —
  adicionado em 2026-07-26 depois de um bug relatado onde o botão de excluir ficava fora da área
  visível/tocável em telas pequenas; também ganhou uma prop opcional `onEdit(row)` que adiciona um
  ícone de editar além do de excluir, usado hoje só por Materiais)
- [src/components/ui/](src/components/ui) — primitivos gerados pelo CLI do shadcn/ui (`button`,
  `card`, `input`, `label`, `select`, `sheet`, `table`, `textarea`, `dialog`). Não têm lógica de negócio —
  regenerar/adicionar via `npx shadcn add <componente>` em vez de escrever à mão
- [src/hooks/](src/hooks) — camada de acesso a dados (Supabase):
  - `useCollection.js` — hook genérico por coleção (`materials`/`products`/`orders`/`sales`):
    carrega tudo do usuário logado e expõe `{ data, loading, add, update, remove, reload }`
  - `useSettings.js` — mesma ideia, mas pra linha única de `settings` (`{ settings, loading,
    save }`)
  - `useCountUp.js` — anima um número de 0 até o valor alvo (usado pelo `StatCard`)
- [src/lib/](src/lib) — lógica de negócio pura, portada do antigo `script.js` quase sem mudanças
  (só a camada de apresentação mudou neste redesign):
  - `format.js` — formatação (`fmtBRL`, `fmtNum`), `newId()`, mapa de nomes de cor
    (`COLOR_NAMES`)/`resolveColorInput`, `buildFilamentName`, `waLink`, `pedidoRowFlag` (flag de
    atraso/urgência), utilitários de cor (`hexToRgb`, `colorDistance`, `findClosestMaterial`)
  - `tables.js` — `TABLES` (mapeamento coleção → nome da tabela + campos camelCase↔snake_case) e
    `rowToObj`/`objToRow`, usados por `useCollection`
  - `calc.js` — `calculatePricing()`, o motor de custo/margem da Calculadora
  - `gcode.js` — `parseGcode()` e helpers, leitura de metadados de arquivos `.gcode`
    (Bambu/Orca/Prusa/Cura)
  - `pdf.js` — `generateOrcamentoPdf()`/`generateRelatorioPdf()` via jsPDF
  - `csv.js` — `exportCsv(filename, rows, columns)` (adicionado em 2026-07-27), usado pelos botões
    "Exportar CSV" de Materiais/Pedidos/Vendas; `toCsv()` monta o texto (separador `;`, não `,` —
    convenção brasileira, já que `,` é separador decimal no Excel em pt-BR — com BOM UTF-8 na
    frente pra acentuação abrir certo) e `fmtCsvNumber()` formata número com vírgula decimal e
    arredonda pra 2 casas (evita expor ruído de ponto flutuante tipo `3.1672000000000002` num
    arquivo que vai pro contador)
  - `supabaseClient.js` — cria o client do Supabase a partir de `import.meta.env.VITE_SUPABASE_URL`
    / `VITE_SUPABASE_ANON_KEY` (lança erro se faltar alguma — ver seção Deploy)
  - `utils.js` — `cn()` (merge de classes Tailwind, padrão gerado pelo shadcn/ui)
  - Cada módulo de lógica tem um `*.test.js` ao lado (`format.test.js`, `tables.test.js`,
    `calc.test.js`, `gcode.test.js`, `csv.test.js`), rodados com `npm test` (Vitest)
- [supabase-schema.sql](supabase-schema.sql) — SQL das 5 tabelas + políticas de RLS, mesma base da
  versão estática, mais os `alter table` de `materials.tipo` e das 7 colunas novas de `settings`
  adicionados em 2026-07-26 (roda uma vez no SQL Editor do Supabase)
- [tailwind.config.js](tailwind.config.js) + [src/index.css](src/index.css) — tokens de tema
  (cores, fontes, raio de borda) — ver seção "Design" abaixo
- [components.json](components.json) — config do CLI do shadcn/ui (estilo `new-york`, aliases de
  import `@/components`, `@/lib`, `@/hooks`, etc.)
- [vite.config.js](vite.config.js) — plugin do React + alias `@` → `src/` + `VitePWA` (manifest e
  service worker, ver seção "PWA" abaixo)
- [pwa-assets.config.js](pwa-assets.config.js) — config do `@vite-pwa/assets-generator`, usado uma
  vez (`npx pwa-assets-generator`) pra gerar os ícones do PWA a partir de `public/logo-nass3d.png`
  — só roda de novo se a logo mudar, não faz parte do build normal
- `.env.local` (gitignored) / [.env.example](.env.example) — `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY` pro ambiente local (ver seção Deploy pra produção)
- [CLAUDE.md](CLAUDE.md) — este arquivo

### Dependências principais (`package.json`)
- **Build/dev**: Vite 5, `@vitejs/plugin-react`, Tailwind CSS 3 + `tailwindcss-animate` +
  `autoprefixer`/`postcss`, Vitest (testes)
- **UI**: React 18, `react-router-dom` 6, componentes Radix por trás do shadcn/ui
  (`@radix-ui/react-dialog`/`react-label`/`react-select`/`react-slot`), `lucide-react` (ícones),
  `class-variance-authority`/`clsx`/`tailwind-merge` (utilitários de classe do shadcn/ui)
- **Animação**: `framer-motion`
- **Backend/dados**: `@supabase/supabase-js`
- **PDF**: `jspdf`
- **PWA**: `vite-plugin-pwa` (dev), `@vite-pwa/assets-generator` (dev, só pra gerar ícones)

Sem JavaScript puro/TypeScript misto — é tudo `.jsx`/`.js` puro (`jsconfig.json` só dá
autocomplete de path alias, não faz checagem de tipos).

## Autenticação (Supabase Auth)

`src/context/AuthContext.jsx` concentra tudo (antes era `auth.js`):
- Ao montar, `getSession()` decide se já existe sessão (pula pro app sem pedir login de novo) e
  `onAuthStateChange` mantém `user` sincronizado
- `login(email, senha)` → `signInWithPassword`; `signup(email, senha)` → `signUp` (se o projeto
  exigir confirmação de e-mail, `needsConfirmation: true` é devolvido e o usuário só ganha sessão
  depois de clicar no link recebido); `logout()` → `signOut()`
- `src/pages/Login.jsx` é a UI (componentes shadcn) que chama essas funções; mensagens de
  erro/sucesso em português, mesmas regras de antes
- `App.jsx` faz o roteamento condicional: sem `user`, qualquer rota fora de `/login` redireciona
  pra lá; com `user`, `/login` redireciona pra `/`

## Persistência (Supabase Postgres + RLS)

Mesmas 5 tabelas de antes, **políticas de RLS inalteradas** (o schema em si ganhou as colunas
descritas abaixo em 2026-07-26, via `alter table` em `supabase-schema.sql`) — cada linha tem
`user_id uuid references auth.users(id)` e uma política `auth.uid() = user_id`:

- `materials(id, user_id, nome, cor, tipo, preco, estoque, created_at)` — `tipo` (PLA/PETG/ABS/TPU/ASA/Nylon/texto livre) adicionado em 2026-07-26
- `products(id, user_id, nome, preco, custo, created_at)`
- `orders(id, user_id, cliente, telefone, item, prazo, status, valor, criado_em)`
- `sales(id, user_id, data, produto, comprador, contato, valor, pedido_id, created_at)`
- `settings(user_id [PK], meta_mensal, orcamento_numero, empresa_nome, logo_data_url, printer_cost,
  printer_life, nozzle_cost, nozzle_life, energy_rate, labor_rate, labor_hours, updated_at)` — os 7
  campos de equipamento/mão de obra da Calculadora foram adicionados em 2026-07-26 (antes eram
  `useState` locais com valor de exemplo fixo, resetando a cada visita; agora persistem por conta,
  mesmo padrão de commit-on-blur que `empresa_nome` já usava)

`id` continua gerado no cliente (`newId()` em `src/lib/format.js`) e usado como chave primária.

**Estado inicial da Calculadora**: peso/preço/cor por cor e horas de impressão nascem
zerados/vazios a cada carregamento (não há mais um exemplo pré-preenchido gerando um preço
"fantasma") — ver `src/pages/Calculadora.jsx`. Os campos de equipamento (impressora, bico, energia,
mão de obra) vêm de `settings` e persistem entre sessões; a primeira vez que uma conta usa a
Calculadora eles mostram os mesmos valores de exemplo de antes só como sugestão inicial, editável e
salva a partir daí. O valor sugerido de venda mostra o preço exato e uma versão arredondada pra
cima em múltiplos de R$5 (`roundUpTo` em `src/lib/format.js`) lado a lado.

**O que mudou nesta reescrita é só a estratégia de mutação no cliente.** Antes, `saveAll(key, arr)`
recebia o array inteiro e fazia o diff sozinho (buscava ids existentes, deletava os que sumiram,
dava `upsert` no resto) toda vez que qualquer linha mudava. Agora, `useCollection(key)`
(`src/hooks/useCollection.js`) expõe mutações **direcionadas por linha**:
- `add(item)` → `insert` de uma linha só, e só atualiza o estado local se não der erro
- `update(id, patch)` → `update().eq('id', id)` de uma linha só
- `remove(id)` → `delete().eq('id', id)` de uma linha só

Cada página de CRUD (Materiais/Produtos/Pedidos/Vendas) chama essas três funções diretamente nos
handlers de UI, sem reconstruir nem regravar o array inteiro a cada edição. `useSettings.js`
continua fazendo `upsert` com `onConflict: 'user_id'` (não muda, porque `settings` sempre foi uma
linha única, nunca teve o problema de diff de array). A conversão camelCase (app) ↔ snake_case
(banco) que antes vivia num objeto `TABLES` dentro de `script.js` agora está em
[src/lib/tables.js](src/lib/tables.js), usada por `useCollection`.

**Importante**: como é tudo client-side com a chave `anon public`, a segurança real continua vindo
das políticas de RLS, não do sigilo da chave — mas agora a chave não é mais commitada num
`config.js`: vem de variável de ambiente do Vite em build time (ver "Deploy"). A chave
`service_role` (essa sim secreta) nunca deve aparecer no código.

## Design

Ver `docs/superpowers/specs/2026-07-25-redesign-react-shadcn-design.md` para o plano completo do
redesign; resumo do que foi decidido e por quê, pra quem for mexer na UI depois:

- **Paleta**: fundo quase preto (`--background: 240 14% 4%` em `src/index.css`) com um glow
  radial vermelho sutil atrás de áreas de destaque (`background-image: radial-gradient(...)` no
  `body`). Vermelho da marca é a cor `primary`/`accent`/`ring` (`353 100% 57%` ≈ `#ff2438`), usado
  em botões primários, item de navegação ativo (fundo translúcido + borda + `shadow-glow`) e
  focos de input. Cores semânticas fixas em `tailwind.config.js` (fora do sistema de tokens
  HSL): `success` `#35d488` (receita/sucesso), `info` `#35c4d4`, `warning` `#ffb734`
  (atraso/atenção), `accent2` `#b06bff` (métricas secundárias) — os mesmos valores da versão
  estática.
- **Painéis "glass"**: classe utilitária `.glass-panel` (`src/index.css`) = fundo translúcido
  (`bg-card/[0.03]`) + borda fina branca translúcida + `backdrop-blur-md` + **cantos arredondados**
  (`rounded-lg`, raio definido por `--radius: 0.75rem`). Isso foi uma decisão explícita: um motivo
  angular/com cantos cortados foi cogitado e descartado durante o design porque o arredondado ficou
  visualmente mais limpo e deixa o glow vermelho ser o protagonista, não a moldura. Se alguém
  reconsiderar um visual mais "anguloso" no futuro, isso já foi testado e rejeitado por esse
  motivo — não é um acidente de implementação.
- **Tipografia**: 4 famílias, mapeadas em `tailwind.config.js` → `font-display` (Orbitron, títulos
  grandes/hero — ex. logo/tela de login), `font-ui` (Rajdhani, texto de interface/navegação — ex.
  itens da sidebar), `font-sans`/padrão (Inter, corpo de texto) e `font-mono` (JetBrains Mono,
  números e dados tabulares — e-mail do usuário na sidebar, valores monetários). Carregadas via
  Google Fonts (ver `index.html`).
- **Logo**: `public/logo-nass3d.png`, arquivo PNG real da empresa. Tela de login mostra a logo
  inteira; a sidebar mostra só o hexágono, recortado via `transform: scale()` com
  `transform-origin` deslocado (não `object-position`, porque o container e a imagem têm a mesma
  proporção 1:1 — `object-fit: cover` sozinho não cortaria nada). Os valores de escala/origem foram
  calibrados a olho contra o arquivo real; ver o comentário longo em
  [src/components/layout/Sidebar.jsx](src/components/layout/Sidebar.jsx) antes de trocar o arquivo
  de logo, porque provavelmente vai precisar recalibrar.
- **Layout/navegação**: sidebar fixa à esquerda (~240px, `md:w-60`) com logo, os 7 itens de
  navegação (ícone `lucide-react` + label) e e-mail/botão Sair no rodapé
  (`src/components/layout/Sidebar.jsx`). Abaixo de 768px vira uma gaveta (`Sheet` do shadcn/ui)
  acionada por um botão hambúrguer numa barra superior fina
  (`src/components/layout/AppLayout.jsx`). Área de conteúdo principal sem cabeçalho grande, largura
  máxima `max-w-5xl` centralizada.
- **Animações (Framer Motion)**: transição de rota = fade + slide vertical leve via
  `AnimatePresence`/`motion.div` em `AppLayout.jsx` (chaveado por `location.pathname`); `StatCard`
  conta os números do zero ao valor final (`useCountUp`) e tem leve `whileHover={{ y: -2 }}`;
  linhas de `DataTable` entram/saem com fade via `AnimatePresence` (`layout` + `initial`/`exit`)
  quando uma linha é adicionada/removida; cards de alerta (`AlertCard`) entram deslizando da
  esquerda. Tudo pensado como "sutil e profissional" — sem exagero que atrapalhe o uso diário.
- **Fonte de verdade do sistema de design**: shadcn/ui estilo `new-york` (`components.json`),
  tokens de cor como variáveis CSS HSL em `:root` (`src/index.css`), estendidos em
  `tailwind.config.js` (que também define as famílias de fonte, o raio de borda e a sombra
  `shadow-glow`). Componentes `src/components/ui/*` não devem ser editados à mão além de ajustes
  de estilo pontuais — prefira regenerar via CLI do shadcn/ui se precisar de outro primitivo.

## PWA (instalável)

Adicionado em 2026-07-27. O Nass3D é instalável como PWA (ícone na tela inicial, abre em tela
cheia sem barra de navegador) via `vite-plugin-pwa` (configurado em `vite.config.js`), sem nenhuma
mudança de tela/funcionalidade existente.

- **Manifest**: gerado automaticamente pelo plugin a partir do bloco `manifest` em
  `vite.config.js` (nome, cores da marca `#08080a`, ícones). Não existe um `manifest.json` escrito
  à mão — `dist/manifest.webmanifest` é gerado no build.
- **Service worker**: estratégia `generateSW` (Workbox por baixo), `registerType: 'autoUpdate'` —
  o app atualiza sozinho na próxima abertura depois de um novo deploy, sem exigir reinstalar.
  `workbox.globPatterns` cobre só os arquivos estáticos da interface (`js`/`css`/`html`/ícones/
  fontes) — **nunca** chamadas ao Supabase, que sempre vêm da rede. Não há suporte offline pros
  dados (materiais, pedidos, vendas continuam exigindo internet); o que fica em cache é só o
  "esqueleto" visual, pra abrir mais rápido / não ficar em branco com sinal ruim.
- **Ícones**: gerados uma vez a partir de `public/logo-nass3d.png` via `npx pwa-assets-generator`
  (usa o `pwa-assets.config.js` na raiz) — produz `pwa-64x64.png`, `pwa-192x192.png`,
  `pwa-512x512.png`, `maskable-icon-512x512.png` (com margem de segurança pro Android recortar em
  formatos variados), `apple-touch-icon-180x180.png` e `favicon.ico`, todos commitados em
  `public/`. Se a logo mudar, rodar o comando de novo regenera todos.
- **iOS**: Safari não expõe banner automático de instalação nem lê o manifest — por isso
  `index.html` também tem, escritos à mão, o `<link rel="apple-touch-icon">`, as meta tags
  `apple-mobile-web-app-*` e `<meta name="theme-color">` (o plugin só injeta automaticamente o
  `<link rel="manifest">` e o script de registro do service worker — não o `theme-color`, então
  não remova essa tag manual achando que é redundante).
- **Testar localmente**: `npm run dev` **não** ativa o service worker (só roda em build de
  produção). Use `npm run build && npm run preview` pra testar o comportamento real de PWA.

## Deploy

- **Site (produção)**: https://nass3-d.vercel.app — publica a partir da branch `main`
- **Repositório**: https://github.com/Winklexz/Nass3D

Publicado na Vercel a partir do repositório no GitHub. A Vercel agora **auto-detecta o projeto
como Vite** (por causa do `package.json`/`vite.config.js`) em vez de servir estático puro: build
command `npm run build` (= `vite build`), saída em `dist/`.

Um `vercel.json` na raiz faz rewrite de qualquer rota pra `index.html` (`{"rewrites": [{"source":
"/(.*)", "destination": "/index.html"}]}`), necessário porque `react-router-dom` faz roteamento no
cliente — sem isso, recarregar a página numa sub-rota (ex: `/materiais`) retornava 404 (bug
encontrado e corrigido em 2026-07-26).

Credenciais do Supabase **não são mais commitadas**: não existe mais `config.js` no repo. Em vez
disso, `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` são configuradas como variáveis de ambiente
no painel da Vercel (Project Settings → Environment Variables, nos ambientes Production/Preview/
Development) e embutidas no bundle em build time pelo Vite (`import.meta.env.*`,
`src/lib/supabaseClient.js`). Localmente, as mesmas duas variáveis vão em `.env.local`
(gitignored — usar `.env.example` como modelo). O valor da chave em si não mudou (mesmo projeto
Supabase, mesma chave `anon public`), só o mecanismo de configuração.

`git push` pra `main` continua disparando deploy automático (~30s–1min), sem mudança de fluxo pro
usuário final. Este redesign (Tasks 1-24) foi feito na branch `worktree-redesign-react-shadcn`; o
push dessa branch pra `origin` dispara um **Preview deployment** da Vercel (não afeta a URL de
produção) — o merge pra `main` é o que efetivamente publica o novo visual em
`nass3-d.vercel.app`.

Nota de build: `npm run build` avisa sobre um chunk principal >1MB (jsPDF + app inteiro num só
bundle). Não é bloqueante, mas é uma oportunidade de otimização (code-splitting/`dynamic import`
do jsPDF, por exemplo) se a performance de carregamento num dia vier a importar.

## Git

Repositório no GitHub (`origin`) conectado à Vercel para deploy contínuo, branch principal `main`.
O redesign React (2026-07-25) foi desenvolvido numa branch separada
(`worktree-redesign-react-shadcn`), num git worktree local, isolada da `main`. Neste momento
(redação deste documento) ela ainda **não** foi mesclada em `main` — ver seção "Deploy" acima para
o estado do deploy de Preview. Confira `git log`/o estado atual do repositório antes de assumir
que o merge já aconteceu.

## Notas de troubleshooting

- **PostgREST "Could not find the table in the schema cache" (PGRST205)**: aconteceu com o
  primeiro projeto Supabase criado (`pjsxudunqkqjeltiftpi`) mesmo com tabelas/grants/RLS/exposição
  corretos, `NOTIFY pgrst, 'reload schema'`, restart do projeto e até uma alteração real de DDL —
  nada resolveu. Um projeto novo (`zzngtfwongumucdtqwgk`, o que está em uso hoje) funcionou de
  primeira com o mesmo SQL. Se isso se repetir, criar um projeto novo é mais rápido que depurar.
- **Preview de arquivo `file://` fora da pasta do projeto**: o navegador de preview trata esses
  arquivos como "snapshot estático" — chamadas de rede (`fetch`) para APIs externas não se
  comportam como numa página real (retornam erros que não refletem o estado real do backend).
  Para testar chamadas de rede de verdade, usar uma URL `http(s)://` real (ex: `npm run dev`, ou o
  deploy na Vercel).
- **Deployments Preview da Vercel exigem login da Vercel por padrão**: pra testar um Preview
  deployment (branch != `main`) sem pedir pro usuário logar na Vercel, use o link com token de
  compartilhamento ("share" / bypass token) que a própria Vercel gera pro deployment, em vez da URL
  crua do preview.
