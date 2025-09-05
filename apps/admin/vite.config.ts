import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_ADMIN_PORT || '9999'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@whispers/utils': path.resolve(__dirname, '../../packages/utils/src'),
        '@whispers/ui': path.resolve(__dirname, '../../packages/ui/src'),
        '@whispers/ui/dist': path.resolve(__dirname, '../../packages/ui/dist'),
      },
    },
    define: {
      // 将环境变量注入到应用中
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:7777'),
      'import.meta.env.VITE_ADMIN_URL': JSON.stringify(env.VITE_ADMIN_URL || 'http://localhost:9999'),
      'import.meta.env.VITE_WEB_URL': JSON.stringify(env.VITE_WEB_URL || 'http://localhost:8888'),
    },
  }
})
