import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  base: '/lang-version-vocab/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@data': resolve(__dirname, '../data')
    }
  }
})
