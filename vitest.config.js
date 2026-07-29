import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
    // .claude/worktrees/** são checkouts git isolados usados por agentes em background — sem
    // essa exclusão, o glob padrão do Vitest pega os arquivos *.test.js de dentro deles também
    // (duplicando testes e misturando o estado ainda-em-progresso de outro worktree no resultado
    // deste).
    exclude: ['**/node_modules/**', '**/.claude/**'],
  },
})
