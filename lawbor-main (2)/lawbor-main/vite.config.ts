import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react(), tailwindcss()],
    // 移除之前的 define 暴力注入逻辑
    // Vite 默认会自动处理以 VITE_ 开头的环境变量
    // 如果你在代码中使用了 import.meta.env.VITE_DEEPSEEK_API_KEY，它会自动生效
    define: {
      // 如果你之前代码里大量使用了 VITE_SILICONFLOW_API_KEY 这个变量名，
      // 又不想改代码，可以暂时把官方 Key 映射过去：
      // 'import.meta.env.VITE_SILICONFLOW_API_KEY': JSON.stringify(env.VITE_DEEPSEEK_API_KEY)
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