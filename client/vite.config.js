import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),
  ],
  server: {
    headers: {
      'content-security-policy': "frame-ancestors 'none'",
      'x-frame-options': 'DENY'
    },
    proxy: {
      '/api/chat': {
        target: 'http://127.0.0.1:8080'
      }
    }
  }
})
