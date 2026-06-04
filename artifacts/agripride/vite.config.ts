import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ command }) => {
  const port = command === 'serve' ? Number(process.env.PORT || 5173) : undefined
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: { port },
    build: { outDir: 'dist' }
  }
})