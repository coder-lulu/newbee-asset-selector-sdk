import { defineConfig } from 'rollup'
import typescript from 'rollup-plugin-typescript2'
import vue from 'rollup-plugin-vue'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import postcss from 'rollup-plugin-postcss'
import alias from '@rollup/plugin-alias'
import replace from '@rollup/plugin-replace'
import json from '@rollup/plugin-json'
import filesize from 'rollup-plugin-filesize'

const production = process.env.NODE_ENV === 'production'

const plugins = [
  alias({
    entries: [
      { find: '@', replacement: new URL('src', import.meta.url).pathname }
    ]
  }),
  
  replace({
    preventAssignment: true,
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  }),
  
  nodeResolve({
    browser: true,
    preferBuiltins: false
  }),
  
  commonjs(),
  
  json(),
  
  vue({
    target: 'browser',
    css: false,
    compileTemplate: true
  }),
  
  typescript({
    useTsconfigDeclarationDir: true,
    tsconfigOverride: {
      compilerOptions: {
        declaration: true,
        declarationDir: 'dist',
        declarationMap: true
      },
      exclude: ['node_modules', 'dist', 'example', '**/*.test.ts']
    }
  }),
  
  postcss({
    extract: true,
    minimize: production,
    sourceMap: !production
  }),
  
  filesize()
]

if (production) {
  plugins.push(
    terser({
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    })
  )
}

export default defineConfig([
  // UMD build for browsers
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'AssetSelectorSDK',
      globals: {
        vue: 'Vue',
        'ant-design-vue': 'antd',
        axios: 'axios',
        'lodash-es': '_'
      },
      sourcemap: !production
    },
    external: ['vue', 'ant-design-vue', 'axios', 'lodash-es'],
    plugins
  },
  
  // ES modules build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: !production
    },
    external: ['vue', 'ant-design-vue', 'axios', 'lodash-es'],
    plugins
  },
  
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'auto',
      sourcemap: !production
    },
    external: ['vue', 'ant-design-vue', 'axios', 'lodash-es'],
    plugins
  },
  
  // Factory functions separate build
  {
    input: 'src/factory.ts',
    output: {
      file: 'dist/factory.js',
      format: 'es',
      sourcemap: !production
    },
    external: ['vue', 'ant-design-vue', 'axios', 'lodash-es'],
    plugins
  },
  
  // Config utilities separate build
  {
    input: 'src/config/index.ts',
    output: {
      file: 'dist/config.js',
      format: 'es',
      sourcemap: !production
    },
    external: ['vue', 'ant-design-vue'],
    plugins
  }
])