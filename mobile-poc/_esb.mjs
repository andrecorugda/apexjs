import { build } from '/home/andre/apexjs/mobile-poc/node_modules/esbuild/lib/main.js'
import { readFileSync } from 'node:fs'
const NB=['assert','buffer','child_process','crypto','events','fs','http','https','net','os','path','stream','string_decoder','tls','tty','url','util','v8','vm','worker_threads','zlib','module','perf_hooks']
await build({ entryPoints:['render-entry.mjs'], bundle:true, format:'iife', globalName:'APEX', platform:'neutral', mainFields:['module','browser','main'], conditions:['import','module','browser','default'], external:['node:*',...NB], outfile:'render.bundle.js', logLevel:'error' })
const src=readFileSync('render.bundle.js','utf8')
console.log('bundle size:', (src.length/1024).toFixed(0)+' KB')
const specs=[...src.matchAll(/from\s*["']([^"']+)["']|require\(["']([^"']+)["']\)/g)].map(m=>m[1]||m[2])
const nodeUsed={}; for(const s of specs.filter(s=>s&&(s.startsWith('node:')||NB.includes(s.split('/')[0])))) nodeUsed[s]=(nodeUsed[s]||0)+1
console.log('Node builtins the RENDER path pulls in:'); console.log(Object.entries(nodeUsed).map(([k,v])=>`  ${v}x ${k}`).join('\n')||'  (NONE)')
