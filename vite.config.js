import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.js']
  }
})
