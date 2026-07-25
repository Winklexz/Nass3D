# Nass3D — Gestão de Impressão 3D

Site de gestão para empresa de impressão 3D: calculadora de precificação, controle de materiais,
produtos, pedidos, vendas, relatório mensal e geração de orçamento em PDF.

Arquivo estático, sem build step/bundler/dependências locais — abre direto no navegador
(`index.html`).

## Estrutura de arquivos

- [index.html](index.html) — markup (topbar, abas, as 7 seções) + `<link>`/`<script src>` para os
  arquivos abaixo
- [style.css](style.css) — todo o CSS (844 linhas), variáveis de tema em `:root` no topo (cores,
  raio de borda)
- [script.js](script.js) — toda a lógica (1306 linhas), dividida em blocos comentados
  (`/* ===... === */`)
- [CLAUDE.md](CLAUDE.md) — este arquivo

> Histórico: até 2026-07-24 o projeto era um único arquivo (`nass3d.html`, HTML+CSS+JS inline) e
> usava `window.storage`, uma API que só existe dentro do ambiente Claude.ai. Foi separado nos três
> arquivos acima e migrado para `localStorage` para funcionar como site local aberto direto no
> navegador (ver seção "Persistência").

### Dependências externas (via CDN, carregadas no `<head>` de `index.html`)
- Google Fonts: Orbitron, Rajdhani, Inter, JetBrains Mono
- [jsPDF](https://github.com/parallax/jsPDF) `2.5.1` (`cdnjs.cloudflare.com`) — geração de PDF de
  orçamentos e relatórios

### Seções de `index.html`
As 7 abas, cada uma um `<section class="tab-panel" id="tab-*">`:
- **Painel** — dashboard inicial (alertas, saldo a receber, meta do mês)
- **Calculadora** — formulário de precificação + painel de resultado + geração de orçamento em PDF
  (inclui dropzone de `.gcode`)
- **Materiais** — CRUD de filamentos (cor, preço/kg, estoque)
- **Produtos** — CRUD de catálogo (nome, preço, custo)
- **Pedidos** — CRUD de pedidos (cliente, telefone, item, prazo, status, valor)
- **Vendas** — CRUD de vendas (associável a um pedido)
- **Relatório** — resumo financeiro mensal + exportação PDF/impressão

### Blocos de `script.js` (linhas aproximadas)

| Bloco | Linhas | Responsabilidade |
|---|---|---|
| TABS | 1–10 | troca de aba ativa |
| HELPERS | 12–84 | formatação (BRL/número), animação de contador, cores nomeadas → hex, **`loadAll`/`saveAll`** (usam `localStorage`) |
| CALCULADORA | 86–520 | estado de cores/pesos, cálculo de custo/margem, parsing de `.gcode` (Bambu/Orca/Prusa/Cura), dropzone, matching automático de cor→material salvo |
| ORÇAMENTO EM PDF | 521–753 | upload de logo, preview de valores/descontos, geração do PDF via jsPDF, numeração sequencial de orçamento |
| MATERIAIS | 754–833 | CRUD + preview de nome do filamento |
| PRODUTOS | 834–893 | CRUD + datalist usado na aba Vendas |
| PEDIDOS | 894–982 | CRUD + flag de atraso/urgência + link de WhatsApp |
| VENDAS | 983–1077 | CRUD, vínculo opcional a um pedido (marca pedido como "Entregue") |
| PAINEL (home dashboard) | 1078–1184 | saudação, alertas, saldo a receber, meta do mês — **`loadSettings`/`saveSettings`** (usam `localStorage`, chave `settings`) |
| RELATÓRIO MENSAL | 1185–1288 | agregação por mês, exportação PDF, impressão |
| INIT | 1289–1305 | `initCollections()` — carrega todas as coleções e renderiza todas as abas na inicialização |

## Persistência

Usa `localStorage` do navegador (síncrono), com chaves prefixadas por `nass3d_` para não colidir
com outros sites abertos no mesmo perfil:
- `nass3d_materials`: `[{ id, cor, nome, preco, estoque }]`
- `nass3d_products`: `[{ id, nome, preco, custo }]`
- `nass3d_orders`: `[{ id, cliente, telefone, item, prazo, status, valor, criadoEm }]`
- `nass3d_sales`: `[{ id, data, produto, comprador, contato, valor, pedidoId? }]`
- `nass3d_settings`: `{ metaMensal, orcamentoNumero, orcamentoEmpresa, orcamentoLogo, ... }` (config
  de orçamento e meta mensal — inicializado em `initOrcamentoFromSettings()`)

Todo acesso a dados passa por **`loadAll(key)`/`saveAll(key, arr)`** (coleções) e
**`loadSettings()`/`saveSettings()`** (config) — únicos 4 pontos que tocam `localStorage`.

**Importante**: como é `localStorage` de arquivo local (`file://`), os dados ficam presos ao
navegador/perfil usado para abrir `index.html`. Trocar de navegador ou limpar dados do site apaga
o cadastro — não há backup automático. Se precisar migrar de máquina, exportar/reimportar os dados
seria um próximo passo natural (hoje não existe essa função).

## Git

Repositório git local iniciado em 2026-07-24 para versionar o histórico do projeto.
