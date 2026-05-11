import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // 确保在正确的目录下加载环境变量
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      tailwindcss(), // Tailwind v4 插件建议放在 Vue 插件之前
      vue()
    ],
    resolve: {
      alias: {
        // 使用 process.cwd() 获取当前根目录，避免 ESM 下 __dirname 报错
        '@': resolve(process.cwd(), 'src'),
      },
    },
    optimizeDeps: {
      include: ['leaflet'],
    },
    server: {
      hot: true,
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      allowedHosts: 'all',
      cors: true,
      proxy: {
        '/devproxy': {
          target: 'https://run-lb.tanmasports.com/v1',
          secure: false,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/devproxy/, ''),
        },
        '/autorunserver': {
          target: env.VITE_AUTORUN_SERVER_BASE,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/autorunserver/, ''),
        },
      },
    },
  };
});