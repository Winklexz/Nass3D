import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// vitest.config.js não liga `test.globals`, então o auto-cleanup padrão da Testing Library
// (que depende de `afterEach` estar em `globalThis`) não dispara sozinho — registramos aqui.
afterEach(() => {
  cleanup()
})
