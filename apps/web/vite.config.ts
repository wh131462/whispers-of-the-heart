import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { config } from 'dotenv';

// 加载configs目录下的环境配置
function loadConfigEnv(mode: string) {
  const configsPath = path.resolve(__dirname, '../../configs');
  const envFile = mode === 'production' ? 'env.production' : 'env.development';
  const envFilePath = path.join(configsPath, envFile);

  // 加载指定的环境文件
  config({ path: envFilePath });

  // 也加载vite默认的环境变量
  return loadEnv(mode, process.cwd(), '');
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadConfigEnv(mode);

  return {
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_WEB_PORT || '8888'),
      host: true, // 允许外部访问
      proxy: {
        // 代理 API 请求到后端
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:7777',
          changeOrigin: true,
        },
        // 代理上传文件请求到后端
        '/uploads': {
          target: env.VITE_API_URL || 'http://localhost:7777',
          changeOrigin: true,
        },
        // 代理 WebSocket 信令服务
        '/signaling': {
          target: env.VITE_API_URL || 'http://localhost:7777',
          changeOrigin: true,
          ws: true,
        },
      },
    },
    optimizeDeps: {},
    preview: {
      port: parseInt(env.VITE_WEB_PORT || '8888'),
      host: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@whispers/utils': path.resolve(__dirname, '../../packages/utils/src'),
        '@whispers/ui': path.resolve(__dirname, '../../packages/ui/src'),
        '@whispers/ui/dist': path.resolve(__dirname, '../../packages/ui/dist'),
        '@whispers/hooks': path.resolve(__dirname, '../../packages/hooks/src'),
      },
    },
    define: {
      // 将环境变量注入到应用中
      'import.meta.env.VITE_API_URL': JSON.stringify(
        env.VITE_API_URL || 'http://localhost:7777'
      ),
      'import.meta.env.VITE_WEB_URL': JSON.stringify(
        env.VITE_WEB_URL || 'http://localhost:8888'
      ),
      'import.meta.env.NODE_ENV': JSON.stringify(mode),
    },
    envDir: path.resolve(__dirname, '../../configs'), // 指定环境变量目录
  };
});
