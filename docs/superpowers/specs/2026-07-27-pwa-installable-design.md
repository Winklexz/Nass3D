# Nass3D — PWA instalável

## Contexto

O dono do Nass3D usa o site principalmente pelo celular. Ele pediu pra transformar o site num PWA
(Progressive Web App): um ícone na tela inicial que abre o site em tela cheia, sem a barra de
endereço do navegador, como um app de verdade.

## Objetivo

Tornar o Nass3D instalável como PWA em Android/iOS/desktop, sem mudar nenhuma tela, rota ou
funcionalidade existente — é uma capacidade adicionada por cima do que já existe.

## Fora de escopo

- Suporte offline para dados (materiais, pedidos, vendas continuam exigindo internet — o app é
  100% dependente do Supabase, isso não muda)
- Notificações push
- Sincronização em background
- Qualquer mudança de UI/UX das páginas existentes

## Abordagem técnica

**`vite-plugin-pwa`** (dependência nova, dev + um runtime pequeno) em vez de escrever
`manifest.json` e service worker à mão. É o plugin padrão do ecossistema Vite pra isso, usa Workbox
(Google) por baixo, e gera manifest + service worker automaticamente a partir de uma configuração
declarativa no `vite.config.js` — evita os jeitos sutis de um PWA "quase funcionar" mas não passar
nos critérios de instalabilidade do navegador.

Estratégia do service worker: `generateSW` com `registerType: 'autoUpdate'` (o app atualiza sozinho
na próxima abertura depois de um novo deploy, sem exigir reinstalar) e cache do "app shell"
(HTML/CSS/JS/fontes) via `workbox` — só os arquivos estáticos da interface, nunca respostas do
Supabase (dados sempre vêm da rede, garantindo que nunca fiquem desatualizados).

## Ícones

Gerados a partir de `public/logo-nass3d.png` (1254×1254px, resolução suficiente) usando
`@vite-pwa/assets-generator` (dev dependency, roda uma vez via script, os PNGs gerados ficam
commitados em `public/`) nos tamanhos padrão: 192×192, 512×512, e uma versão "maskable" (com
margem de segurança pra Android recortar em formatos variados — círculo, squircle etc.), mais um
`apple-touch-icon` 180×180 pra iOS.

## Manifest

- `name`: "Nass3D — Gestão de Impressão 3D"
- `short_name`: "Nass3D"
- `theme_color`: `#08080a` (fundo da marca)
- `background_color`: `#08080a`
- `display`: `standalone` (tela cheia, sem barra de navegador)
- `start_url`: `/`
- `orientation`: não forçada (o app já é responsivo mobile/desktop)

## Critério de pronto

- Chrome/Edge (desktop e Android) mostram o app como instalável (ícone na barra de endereço ou
  banner "Adicionar à tela inicial")
- Safari iOS: `apple-touch-icon` correto pra quando o usuário usa "Adicionar à Tela de Início"
  manualmente (iOS não tem banner automático, mas o ícone/nome/tela cheia funcionam)
- App instalado abre em tela cheia com o ícone e cores corretos
- Nenhuma tela/funcionalidade existente muda de comportamento
- `npm run build` continua funcionando sem erros novos
- Um novo deploy atualiza o app instalado automaticamente na próxima abertura
