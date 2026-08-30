import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type UserConfig } from 'vite'
import type { InlineConfig } from 'vitest/node'

// Vitest empaqueta su propia copia de Vite, asi que `defineConfig` de
// 'vitest/config' choca con los tipos de Vite 8. Declarar la config como
// variable evita el chequeo de propiedades sobrantes sin perder el tipado.
const config: UserConfig & { test: InlineConfig } = {
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    // Sin polling, el hot reload no ve los cambios a traves del volumen de Docker.
    watch: { usePolling: true },
    // El puerto solo se publica en 127.0.0.1, asi que no abre nada al exterior.
    // Permite abrir la app desde otro contenedor (pruebas con navegador real)
    // o por IP de la red local para verla en el movil.
    allowedHosts: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
}

export default defineConfig(config)
