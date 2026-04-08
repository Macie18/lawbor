import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // 主动强制加载根目录的 .env 文件
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react(), tailwindcss()],
    define: {
      // 暴力注入：无视系统限制，直接将读取到的值写死到前端代码变量中
      'import.meta.env.VITE_SILICONFLOW_API_KEY': JSON.stringify(env.VITE_SILICONFLOW_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});