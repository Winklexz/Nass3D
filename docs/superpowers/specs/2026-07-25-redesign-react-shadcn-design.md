# Nass3D — Redesign React + shadcn/ui

## Contexto

O Nass3D hoje é um site estático (HTML/CSS/JS puro) publicado na Vercel, com autenticação e
banco de dados no Supabase (5 tabelas: `materials`, `products`, `orders`, `sales`, `settings`,
todas com RLS por `user_id`). Funcionalmente completo: Painel, Calculadora (com leitura de
`.gcode`), Materiais, Produtos, Pedidos, Vendas, Relatório, geração de orçamento em PDF, e
login/cadastro por e-mail+senha.

O pedido deste redesign: refazer a interface inteira de forma mais profissional e bonita,
preto/vermelho, com animações, usando React + shadcn/ui e a logo real da empresa — **sem mudar
nenhuma funcionalidade existente**.

## Objetivo

Reconstruir o front-end como uma SPA React (Vite), com um sistema visual coeso derivado da logo
Nass3D, navegação em sidebar, e animações sutis — mantendo o Supabase (schema, RLS, autenticação)
exatamente como está hoje. Fim: mesmo produto, experiência visivelmente mais profissional.

## Fora de escopo

- Qualquer mudança de funcionalidade, regra de negócio, ou schema do banco
- Mudança de fluxo de autenticação (continua e-mail+senha com confirmação de e-mail)
- Multi-idioma, temas claro/escuro alternativos (fica só o tema escuro atual)
- Exportar/importar dados, notificações push, ou qualquer feature nova não pedida

## Stack

- **Build**: Vite + React 18, JavaScript puro (sem TypeScript, consistente com o projeto atual)
- **UI**: Tailwind CSS + shadcn/ui (`Button`, `Card`, `Input`, `Table`, `Dialog`, `Select`,
  `Sheet` para o menu gaveta mobile, etc.) + `lucide-react` para ícones (padrão do shadcn)
- **Animação**: Framer Motion
- **Backend**: Supabase (inalterado) — `@supabase/supabase-js`, mesmas 5 tabelas e políticas RLS
- **PDF**: jsPDF (inalterado, mesma lógica de geração)
- **Deploy**: Vercel, projeto reconfigurado de "estático" para build Vite (auto-detectado)

## Sistema visual

**Paleta**: fundo preto quase puro (`#08080a`) com brilho vermelho radial sutil atrás de áreas de
destaque. Painéis em estilo "glass": fundo translúcido com blur, borda fina, **cantos
arredondados** (decidido depois de comparar com corte angular — o arredondado ficou mais limpo e
deixa o glow vermelho ser o protagonista). Vermelho da marca (`#ff2438`) com glow em botões
primários, itens de navegação ativos, e destaques. Cores semânticas mantidas iguais às de hoje:
verde (`#35d488`) sucesso/receita, azul (`#35c4d4`) info, salmão (`#ffb734`) atenção, roxo
(`#b06bff`) métricas secundárias.

**Tipografia**: mantém a combinação atual — Orbitron (títulos grandes/hero), Rajdhani (textos de
interface/navegação), Inter (corpo), JetBrains Mono (números/dados tabulares).

**Logo**: arquivo real `logo nass3d.png` (fundo preto, "N" hexagonal vermelho/preto/prata,
"NASS3D" + tagline "Imprimimos ideias. Criamos soluções."). Usado por extenso na tela de login;
recortado como ícone (só o hexágono) no cabeçalho da sidebar e como favicon.

## Layout e navegação

Sidebar fixa à esquerda (~240px) com: logo no topo, os 7 itens de navegação (ícone + texto) —
Painel, Calculadora, Materiais, Produtos, Pedidos, Vendas, Relatório — e e-mail do usuário +
botão "Sair" no rodapé. Item ativo com destaque vermelho (glow + fundo translúcido). Em telas
< 768px, a sidebar vira um menu gaveta (`Sheet` do shadcn) acionado por um botão hambúrguer numa
barra superior fina. Área de conteúdo principal sem cabeçalho grande — mais espaço pra tabelas e
formulários.

Tela de login/cadastro é uma página separada (fora da sidebar), centralizada, com a logo por
extenso, campos de e-mail/senha em componentes shadcn, e as mesmas mensagens de erro/sucesso de
hoje (incluindo a exigência de confirmação de e-mail).

## Arquitetura de dados

- `AuthContext`: sessão Supabase atual, usuário logado, funções `login`/`signup`/`logout`. Envolve
  toda a árvore de componentes; rotas protegidas redirecionam pra tela de login se não houver
  sessão (mesma regra de hoje: ninguém vê o app sem logar).
- Um hook por coleção — `useMaterials`, `useProducts`, `useOrders`, `useSales`, `useSettings` —
  carrega os dados do Supabase uma vez ao logar (mesma chamada `select * where user_id = ...` de
  hoje) e expõe `{ data, add(item), update(id, patch), remove(id) }`. Cada mutação já dispara a
  gravação no Supabase (mesmo padrão diff/upsert que existe hoje em `saveAll`), sem biblioteca de
  cache adicional (TanStack Query seria overkill pro tamanho do sistema).
- `TABLES`/conversão camelCase ↔ snake_case migra para dentro de cada hook, mesma lógica de hoje.

## Páginas (mapeamento funcional 1:1)

| Página | Conteúdo | Muda de hoje |
|---|---|---|
| Login/Cadastro | E-mail+senha, confirmação de e-mail | Só visual (componentes shadcn) |
| Painel | Alertas, saldo a receber, cards de estatística, meta do mês | Cards com contador animado (Framer Motion) |
| Calculadora | Formulário de custo, dropzone `.gcode`, resultado, geração de orçamento PDF | Só visual + transições |
| Materiais | CRUD de filamentos | Tabela shadcn (`DataTable`) em vez de divs |
| Produtos | CRUD de catálogo | Tabela shadcn |
| Pedidos | CRUD de pedidos, flag atraso/urgência, link WhatsApp | Tabela shadcn |
| Vendas | CRUD de vendas, vínculo a pedido | Tabela shadcn |
| Relatório | Resumo mensal, export PDF/impressão | Só visual |

Toda a lógica de negócio (cálculo de custo/margem, parsing de `.gcode`, geração de PDF, regras de
pedido/venda) é portada como está — só a camada de apresentação muda.

## Animações (Framer Motion)

- Transição de página: fade + slide leve ao trocar de rota
- Listas (materiais, produtos, pedidos, vendas): itens entram em cascata (stagger) ao carregar,
  saem com fade ao deletar
- Painel: números dos cards contam do zero ao valor final
- Botões/cards: hover e tap states sutis (scale/glow)
- Mobile: menu gaveta desliza da esquerda

Tudo classificado como "sutil e profissional" — sem efeitos que atrapalhem o uso no dia a dia.

## Deploy e migração

1. Projeto Vite criado dentro do mesmo repositório (`Winklexz/Nass3D`), substituindo os arquivos
   estáticos atuais (`index.html`/`style.css`/`script.js`/`auth.js`/`config.js` são removidos ao
   final, depois que o novo app estiver funcionando).
2. Credenciais do Supabase saem do `config.js` versionado e viram variáveis de ambiente
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) configuradas no painel da Vercel — o valor da
   chave não muda (mesmo projeto Supabase, mesma chave `anon public`), só o mecanismo de
   configuração.
3. Vercel é reconfigurada de "static" pra build Vite (`npm run build`, saída `dist/`) —
   auto-detectado ao existir `package.json` com Vite.
4. `git push` continua disparando deploy automático, sem mudança de fluxo pro usuário.

## Critério de pronto

- Todas as 7 páginas + login funcionam com paridade total de funcionalidade em relação à versão
  atual (mesmos dados, mesmas validações, mesmo PDF gerado)
- Visual novo aplicado consistentemente (paleta, tipografia, glass+glow, sidebar)
- Testado em desktop e mobile (sidebar vira gaveta)
- Deploy funcionando na URL atual (`nass3-d.vercel.app`) com as mesmas credenciais Supabase
- CLAUDE.md atualizado pra refletir a nova stack
