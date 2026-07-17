import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { DeployPreset, DeployPresetContext } from './types.js'

/**
 * Scaffold a Dockerfile that builds + runs the app — deployable on any container
 * host (Railway, Render, Fly.io, a VPS, Kubernetes). `apex start` honours $PORT,
 * so the host's injected port just works. Set DATABASE_URL / APEX_SESSION_PASSWORD
 * in the host's env.
 */
export function emitDockerPreset(root: string): void {
  writeFileSync(
    join(root, 'Dockerfile'),
    `# Apex JS — build + run on any container host (Railway / Render / Fly / VPS).
FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx apex build --server

# apex start listens on $PORT (host-injected) or 3000.
EXPOSE 3000
CMD ["npx", "apex", "start"]
`,
  )
  if (!existsSync(join(root, '.dockerignore'))) {
    writeFileSync(join(root, '.dockerignore'), 'node_modules\ndist\n.git\n.env\n.env.*\n')
  }
  console.log(
    `  ${'\x1b[36m'}Docker${'\x1b[0m'} preset → wrote Dockerfile (+ .dockerignore)\n` +
      '  Deploy on Railway/Render/Fly/any container host. Set DATABASE_URL + APEX_SESSION_PASSWORD in its env.\n',
  )
}

export const dockerPreset: DeployPreset = {
  name: 'docker',
  // Docker builds inside the container — no server build on the host first.
  serverBuild: false,
  build({ root }: DeployPresetContext) {
    emitDockerPreset(root)
  },
}
