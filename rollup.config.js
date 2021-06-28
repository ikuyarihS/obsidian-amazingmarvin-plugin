import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import svelte from 'rollup-plugin-svelte';
import autoPreprocess from 'svelte-preprocess';

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
  plugins: [typescript(), svelte({ preprocess: autoPreprocess() }), nodeResolve({ browser: true }), commonjs()],
  external: ['obsidian'],
};
