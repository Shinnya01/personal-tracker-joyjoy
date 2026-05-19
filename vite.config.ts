import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8')) as { version?: string };
const appVersion = packageJson.version ?? '0.0.0';
const buildStamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const buildVersion = `${appVersion}+${buildStamp}`;

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion),
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
  },
  plugins: [
    vue(),
    tailwindcss(),
  ],
});
