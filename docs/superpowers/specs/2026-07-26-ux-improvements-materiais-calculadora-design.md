# Nass3D — Melhorias de UX: Calculadora, Materiais, PDF e mobile

## Contexto

O Nass3D (SPA React + Vite + Tailwind + shadcn/ui, Supabase como backend) está em produção em
`https://nass3-d.vercel.app` desde o redesign de 2026-07-25. Usando o sistema no dia a dia, o dono
levantou cinco problemas concretos:

1. A Calculadora sempre abre com um cálculo de exemplo pré-preenchido (130g, 9h, R$140/kg → um
   preço "fantasma" de R$68,27), em vez de partir zerada.
2. O valor sugerido de venda só mostra o número exato, sem uma versão arredondada pra facilitar a
   cobrança.
3. Em Materiais, editar um campo hoje é "passar o mouse e clicar" (edição inline por hover), sem
   controle explícito, sem categoria de tipo de filamento (PLA/PETG/ABS/...), e sem um jeito rápido
   de somar estoque quando chega uma nova compra do mesmo filamento.
4. A Calculadora não tem como salvar o item calculado direto em Produtos, e o PDF de orçamento
   gerado é visualmente simples — sem a identidade da marca.
5. No celular, não é possível excluir um material selecionado.

Investigação confirmou a causa do item 5: a tabela de `DataTable` (componente compartilhado por
Materiais/Produtos/Pedidos/Vendas) renderiza mais larga que a viewport em telas pequenas, e a
coluna de ações (excluir) fica fora da área alcançável — não é um handler quebrado (um clique
disparado diretamente no botão via script funciona normalmente), é um problema de layout
responsivo. Também foi encontrado, à parte, um bug de infraestrutura: recarregar a página numa
sub-rota (ex.: `/materiais`) retorna 404 na Vercel por falta de rewrite de SPA — será corrigido
junto.

## Objetivo

Resolver os cinco pontos acima mantendo a identidade visual e os padrões já estabelecidos
(glass panels, paleta preto/vermelho, Framer Motion sutil, shadcn/ui), sem introduzir novas
dependências além do que já está no projeto.

## Fora de escopo

- Qualquer redesign visual amplo (já foi feito) — aqui é ajuste pontual de comportamento/UX
- Multi-idioma, temas alternativos, notificações
- Mudança do fluxo de autenticação
- Editar/expandir os tipos de dado de Produtos, Pedidos ou Vendas além do necessário para os itens
  acima (a correção do `DataTable` mobile beneficia essas páginas de graça, mas não adiciona campos
  novos nelas)

## 1. Calculadora — sem cálculo fantasma + preço arredondado

**Reset de estado**: os campos específicos da peça (número de cores, peso por cor, preço do
filamento por cor, horas de impressão) passam a nascer vazios/zero a cada carregamento da página —
sem soltar um `.gcode` ou digitar algo, o painel "Quanto vou cobrar" mostra R$ 0,00.

**Persistência dos campos de equipamento**: valor da impressora, vida útil da impressora, valor do
bico, vida útil do bico, energia por hora e mão de obra (valor da hora + horas de
acabamento/montagem) deixam de ser `useState` com valor fixo de exemplo e passam a viver na tabela
`settings` (mesmo padrão já usado para `empresaNome`/`logoDataUrl`/`metaMensal`/`orcamentoNumero`),
carregados via `useSettings()` e salvos em `blur` (mesmo padrão de commit-on-blur já usado no nome
da empresa). Na primeira vez que uma conta usa a Calculadora (nenhum valor salvo ainda), esses
campos mostram os mesmos defaults de hoje (4800/8000/200/1500/1/1/1.5) só como sugestão inicial —
mas assim que o usuário mudar algum, o valor persiste de verdade entre sessões.

Isso exige duas colunas novas em `settings`: `printer_cost`, `printer_life`, `nozzle_cost`,
`nozzle_life`, `energy_rate`, `labor_rate`, `labor_hours` (nomes exatos definidos na fase de
implementação, seguindo o padrão snake_case já usado). Migração aditiva, sem quebrar contas
existentes (colunas novas com default).

**Preço arredondado**: ao lado do valor exato em "Quanto vou cobrar" (ex.: R$ 68,27), mostrar um
segundo valor menor, "Arredondado: R$ 70,00" — arredondado pra cima em múltiplos de R$5
(`Math.ceil(price / 5) * 5`). Esse arredondado é o valor usado como sugestão pra digitar
manualmente (o campo de preço manual continua existindo como hoje) e é o valor levado para "Salvar
como produto" (seção 3).

## 2. Materiais — edição via modal, tipo de filamento, reposição de estoque

**Ações por linha**: a coluna de ações da tabela de Materiais passa a ter dois ícones — **Editar**
(abre modal) e **Excluir** (remove direto, como hoje). A edição inline por hover em nome/estoque é
removida desta página (as outras páginas que usam `DataTable` continuam com a edição inline atual,
que não foi reportada como problema).

**Modal de edição** (shadcn `Dialog`): campos nome, tipo, cor, preço/kg e estoque (editáveis
diretamente, sobrescrevendo o valor atual) + um campo separado **"Adicionar ao estoque (g)"**, que
ao confirmar soma ao estoque existente em vez de substituí-lo — pensado para quando chega uma nova
compra do mesmo filamento. Confirmar salva tudo (campos editados + soma de estoque, se preenchida)
numa única chamada de `update`.

**Tipo de filamento**: o formulário de adicionar (topo da página) ganha um `Select` com PLA, PETG,
ABS, TPU, ASA, Nylon, Outro — escolher "Outro" libera um campo de texto livre. O tipo aparece como
nova coluna na tabela e é editável no modal. Exige uma coluna nova `tipo` em `materials` (migração
aditiva, default `'PLA'` para linhas existentes, editável depois).

## 3. Calculadora → Produtos

Novo campo "Nome do produto" na Calculadora (seção de resultado) + botão "Salvar como produto".
Ao clicar, cria uma linha em `products` com `nome` = valor digitado, `preco` = valor arredondado
calculado (seção 1), `custo` = `result.totalCost` da calculadora — reaproveitando o hook
`useCollection('products')` já existente, sem UI nova além do campo e botão. Mensagem de
sucesso/erro no mesmo padrão dos outros formulários da página (`orcStatus`-like).

## 4. PDF de orçamento com identidade de marca

`generateOrcamentoPdf` (em `src/lib/pdf.js`) ganha uma segunda versão de layout, mesma
interface/parâmetros de entrada (sem mudar a chamada em `Calculadora.jsx`):

- Cabeçalho com faixa de fundo preta e uma barra de destaque vermelha, logo maior à esquerda
- Bloco de itens do orçamento como uma tabela real (linhas zebradas leves), não pares label/valor
  soltos
- Total final destacado em vermelho, maior
- Formas de pagamento como mini-tabela comparativa lado a lado (em vez de linhas sequenciais)
- Rodapé com validade/observações formatado, mantendo todo o conteúdo que já existe hoje

Sem novas bibliotecas — jsPDF já suporta retângulos preenchidos, cores e tabelas manuais (como o
código atual já faz para linhas/textos).

## 5. `DataTable` responsivo no mobile

Abaixo de um breakpoint (mesmo `md` — 768px — já usado pelo resto do layout), `DataTable` deixa de
renderizar `<table>` e passa a renderizar uma lista de cartões empilhados: um cartão por linha,
cada campo como par label/valor (usando as mesmas células editáveis — `textCell`/`numberCell`/etc.
continuam funcionando, só mudam de layout de célula de tabela para linha de cartão), com os botões
de ação (editar/excluir) sempre visíveis no cartão, sem depender de scroll horizontal. Acima de
`md`, comportamento atual (tabela) é mantido sem mudanças. Como é o componente compartilhado, essa
correção resolve o bug relatado em Materiais e também melhora Produtos/Pedidos/Vendas no celular,
sem exigir mudança nas páginas que o consomem (mesma prop `columns`).

## 6. Correção: 404 em sub-rotas na Vercel

Adicionar `vercel.json` na raiz do projeto com um rewrite de catch-all para `index.html`, padrão
para SPAs com `react-router-dom` em hospedagem estática:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Isso corrige o 404 ao recarregar ou acessar diretamente qualquer rota interna (`/materiais`,
`/calculadora` etc.), sem afetar o comportamento atual de build/deploy.

## Critério de pronto

- Calculadora abre com resultado R$ 0,00 até haver dados de peça; campos de equipamento persistem
  entre sessões via `settings`
- "Quanto vou cobrar" mostra valor exato + arredondado (múltiplo de R$5 pra cima)
- Materiais: Editar abre modal com todos os campos + soma de estoque; Excluir remove direto; tipo
  de filamento cadastrável e editável
- Calculadora tem campo de nome + botão que cria produto correspondente em Produtos
- PDF de orçamento gerado com o novo layout (marca, tabela de itens, total em destaque)
- No celular (viewport ≤ 767px), dá pra editar e excluir qualquer linha em Materiais (e nas demais
  páginas que usam `DataTable`) sem scroll horizontal
- Acessar uma URL interna diretamente (ou recarregar nela) não retorna mais 404 em produção
- `npm test` e `npm run build` passam sem erros novos
