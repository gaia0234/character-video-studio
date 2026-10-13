import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
await mkdir('.editor', {recursive: true});
await Promise.all([
  build({entryPoints: ['src/editor/index.tsx'], outfile: '.editor/app.js', bundle: true,
    platform: 'browser', format: 'esm', jsx: 'automatic', external: ['/assets/*'], define: {'process.env.NODE_ENV': '"production"'}}),
  build({entryPoints: ['src/data/editorProject.ts'], outfile: '.editor/shared.mjs', bundle: true,
    platform: 'node', format: 'esm'}),
]);
await import('./editor-server.mjs');
