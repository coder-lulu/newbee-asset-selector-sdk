import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AssetSelectorSDK',
      fileName: (format) => `asset-selector-sdk.${format}.js`
    },
    rollupOptions: {
      external: ['vue', 'ant-design-vue', 'axios', 'lodash-es'],
      output: {
        globals: {
          vue: 'Vue',
          'ant-design-vue': 'antd',
          axios: 'axios',
          'lodash-es': '_'
        }
      }
    }
  },
  
  server: {
    port: 3000,
    open: true
  },
  
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  }
})