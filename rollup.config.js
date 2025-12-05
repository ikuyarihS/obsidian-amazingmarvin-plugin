import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import svelte from 'rollup-plugin-svelte';
import autoPreprocess from 'svelte-preprocess';
import postcss from 'rollup-plugin-postcss';

const isProd = process.env.BUILD === 'production';

export default {
  input: 'src/main.ts',
  output: {
    dir: '.',
    sourcemap: 'inline',
    sourcemapExcludeSources: isProd,
    format: 'cjs',
    exports: 'default',
  },
  plugins: [
    typescript(),
    svelte({
      preprocess: autoPreprocess({ typescript: { tsconfigFile: './tsconfig.json' } }),
      emitCss: true,
      compilerOptions: { dev: !isProd },
    }),
    postcss({ extensions: ['.css'], extract: false, minimize: isProd }),
    nodeResolve({ browser: true }),
    commonjs(),
  ],
  external: ['obsidian'],
};
