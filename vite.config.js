import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        login: 'login.html',
        registro: 'registro.html',
        dashboard: 'dashboard.html',
        perfil: 'perfil.html',
        postar_frete: 'postar_frete.html',
        configuracoes: 'configuracoes.html'
      }
    }
  }
})