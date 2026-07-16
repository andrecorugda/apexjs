import { VFS } from './vfs.gen.mjs'
const norm = p => String(p).replace(/\\/g,'/').replace(/^.*?(\/apex-manifest|\/locales)/, '$1')
export const readFileSync = (p) => { const k = norm(p); if (k in VFS) return VFS[k]; const e = new Error('ENOENT '+k); e.code='ENOENT'; throw e }
export const existsSync = (p) => norm(p) in VFS
export const statSync = (p) => ({ isFile: () => norm(p) in VFS, isDirectory: () => false })
export const readdirSync = () => []
export default { readFileSync, existsSync, statSync, readdirSync }
