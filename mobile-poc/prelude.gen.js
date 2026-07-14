globalThis.console = globalThis.console || { log(){}, error(){}, warn(){}, info(){}, debug(){} };
globalThis.require = function(n){
  if (n==='path') return { join(){return Array.prototype.join.call(arguments,'/').replace(/\/+/g,'/')}, resolve(){return '/'+Array.prototype.join.call(arguments,'/').replace(/^\/+/,'')}, dirname(p){return String(p).replace(/\/[^/]*$/,'')||'/'}, basename(p){return String(p).replace(/.*\//,'')}, extname(p){var m=/\.[^.]*$/.exec(p);return m?m[0]:''}, sep:'/' };
  if (n==='url') return { pathToFileURL(p){return {href:'file://'+p}}, fileURLToPath(u){return String(u).replace(/^file:\/\//,'')}, URL: globalThis.URL };
  if (n==='http') return { createServer(){throw new Error('no http server on device')}, STATUS_CODES:{200:'OK',404:'Not Found',500:'Server Error'}, METHODS:['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'] };
  if (n==='canvas') throw new Error('canvas: not needed');
  throw new Error('require('+n+') not shimmed');
};
class Headers { constructor(i){this._m={}; if(i){ if(typeof i.forEach==='function') i.forEach((v,k)=>this.set(k,v)); else for(var k in i) this.set(k,i[k]); } } get(k){return this._m[String(k).toLowerCase()] ?? null} set(k,v){this._m[String(k).toLowerCase()]=String(v)} has(k){return String(k).toLowerCase() in this._m} append(k,v){this.set(k,v)} delete(k){delete this._m[String(k).toLowerCase()]} forEach(f){for(var k in this._m)f(this._m[k],k)} entries(){return Object.entries(this._m)} [Symbol.iterator](){return Object.entries(this._m)[Symbol.iterator]()} }
class Request { constructor(u,o){o=o||{}; this.url=String(u); this.method=(o.method||'GET').toUpperCase(); this.headers=new Headers(o.headers); this._b=o.body} async text(){return this._b==null?'':String(this._b)} async json(){return JSON.parse(await this.text())} async arrayBuffer(){return new TextEncoder().encode(await this.text()).buffer} clone(){return this} }
class Response { constructor(b,o){o=o||{}; this._b=b==null?'':b; this.status=o.status||200; this.statusText=o.statusText||''; this.headers=new Headers(o.headers); this.ok=this.status>=200&&this.status<400} async text(){return typeof this._b==='string'?this._b:new TextDecoder().decode(this._b)} async json(){return JSON.parse(await this.text())} }
globalThis.Headers=Headers; globalThis.Request=Request; globalThis.Response=Response;
globalThis.fetch = globalThis.fetch || function(){ return Promise.reject(new Error('no network in PoC')) };
