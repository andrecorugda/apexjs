import { build } from '/home/andre/apexjs/mobile-poc/node_modules/esbuild/lib/main.js'
import { readFileSync } from 'node:fs'
const NB=['assert','buffer','child_process','crypto','events','fs','http','https','net','os','path','stream','string_decoder','tls','tty','url','util','v8','vm','worker_threads','zlib','module','perf_hooks']
await build({ entryPoints:['render-entry.mjs'], bundle:true, format:'iife', globalName:'APEX', platform:'neutral', mainFields:['module','browser','main'], conditions:['import','module','browser','default'], external:['node:*',...NB], banner:{js:readFileSync('polyfills.js','utf8')}, outfile:'render.bundle.js', logLevel:'error' })
console.log('rebundled with polyfill banner')
