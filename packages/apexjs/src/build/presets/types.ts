/**
 * Deploy-preset contract. `apex build --preset <name>` looks a preset up by name and
 * calls `build(ctx)` to emit that host's deploy config next to the server build.
 *
 * A preset is a pure output-transform: it never re-runs the app, only re-shapes the
 * `apex build --server` output into the layout a platform expects (functions, worker
 * entry, host config). Third parties can register their own by conforming to this
 * interface (dovetails with the plugin system).
 */
export interface DeployPresetContext {
  /** Absolute project root — where host config files (vercel.json, _worker.js, …) are written. */
  root: string
  /** The output-dir *label* (relative, e.g. `dist`) — used verbatim in generated file paths. */
  outDir: string
  /** Absolute path to the built output dir — for presets that read the build (e.g. an asset manifest). */
  outDirAbs: string
}

export interface DeployPreset {
  /** CLI name: the value passed to `--preset`. */
  name: string
  /**
   * Whether this preset consumes a server build. When true the CLI runs the normal
   * `--server` build first, then calls {@link build}. Docker is false — it scaffolds a
   * Dockerfile and the build happens *inside* the container.
   */
  serverBuild: boolean
  /** Emit the platform's deploy files. Idempotent — safe to re-run over an existing build. */
  build(ctx: DeployPresetContext): Promise<void> | void
}
