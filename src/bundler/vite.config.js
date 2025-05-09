import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: path.resolve(__dirname, '../'), // Aponte para a pasta src
  publicDir: path.resolve(__dirname, '../public'),
  server: {
    port: 5173,
    open: '/screans/cadastro/cadastro.html' // Abre automaticamente
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, '../screans/cadastro/cadastro.html')
      }
    }
  }
})