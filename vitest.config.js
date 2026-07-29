import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'node',
    // .claude/worktrees/** são checkouts git isolados usados por agentes em background — sem
    // essa exclusão, o glob padrão do Vitest pega os arquivos *.test.js de dentro deles também
    // (duplicando testes e misturando o estado ainda-em-progresso de outro worktree no resultado
    // deste).
    exclude: ['**/node_modules/**', '**/.claude/**'],
  },
})
