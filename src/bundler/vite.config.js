import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: path.resolve(__dirname, '../'), 
  publicDir: path.resolve(__dirname, '../public'),
  server: {
    port: 5173,
    open: 'http://localhost:5173/src/index.html',
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, '../index.html'),
      }
    }
  }
})