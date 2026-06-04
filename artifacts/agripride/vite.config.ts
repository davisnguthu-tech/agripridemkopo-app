import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  const port = command === 'serve' ? Number(process.env.PORT || 5173) : undefined
  return {
    plugins: [react()],
    server: { port },
    build: { outDir: 'dist' }
  }
})