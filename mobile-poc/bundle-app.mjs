import { build } from '/home/andre/apexjs/mobile-poc/node_modules/esbuild/lib/main.js'
import { readFileSync } from 'node:fs'
const NB=['assert','buffer','child_process','crypto','events','http','https','net','os','path','stream','string_decoder','tls','tty','url','util','v8','vm','worker_threads','zlib','module','perf_hooks']
await build({ entryPoints:['entry.app.mjs'], bundle:true, format:'iife', globalName:'APEX', platform:'neutral',
  nodePaths:['/home/andre/apexjs/examples/showcase/node_modules','/home/andre/apexjs/node_modules'],
  mainFields:['module','browser','main'], conditions:['import','module','browser','default'],
  alias:{ 'node:fs':'./vfs-fs.mjs', 'fs':'./vfs-fs.mjs' },
  external:['node:*',...NB], banner:{js:readFileSync('polyfills.js','utf8')}, outfile:'app.bundle.js', logLevel:'error' })
const src=readFileSync('app.bundle.js','utf8')
console.log('app bundle:', (src.length/1024).toFixed(0)+' KB')
console.log('residual __require:', [...new Set([...src.matchAll(/__require\("([^"]+)"\)/g)].map(m=>m[1]))].join(', ')||'(none)')
