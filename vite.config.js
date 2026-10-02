import { defineConfig } from 'vite'

export default defineConfig({
  base: '/LeaMesi.github.io/',
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.js']
  }
})
