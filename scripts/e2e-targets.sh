#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Fresh-scaffold build-TARGETS regression harness.
#
# Packs every workspace package to a tarball, scaffolds a brand-new app that
# installs ONLY those tarballs (via pnpm.overrides — so we test the real
# published surface, not workspace symlinks), enables all four features
# (data/auth/i18n/pwa), then runs and ASSERTS every build target:
#
#   1. apex build            (normal: prerender + hydrate)
#   2. apex build --islands  (SSG islands)
#   3. PWA assets            (manifest.webmanifest + sw.js + generated icons)
#   4. apex build --mobile   (self-contained on-engine bundle)
#   5. apex mobile android   (native shell scaffold + asset sync)
#   6. apex mobile android --assemble  (no gradle → CLEAN error, not a spawn crash)
#   7. apex mobile ios       (native shell scaffold + asset sync)
#   8. apex mobile ios --generate      (no xcodegen → CLEAN error, not a spawn crash)
#
# Run: bash scripts/e2e-targets.sh
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail

WS="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="${APEX_E2E_WORK:-$(mktemp -d)}"
TAR="$WORK/tarballs"
APP="$WORK/freshapp"
CLI="$WS/packages/apexjs/dist/cli.js"
CREATE="$WS/packages/create-apexjs/dist/index.js"

pass=0; fail=0
ok()   { echo "  ✓ $1"; pass=$((pass+1)); }
bad()  { echo "  ✗ $1"; fail=$((fail+1)); }
step() { echo ""; echo "── $1"; }

echo "workdir: $WORK"
rm -rf "$TAR" "$APP"; mkdir -p "$TAR"

step "Build workspace packages"
( cd "$WS" && pnpm build >/dev/null 2>&1 ) && ok "packages built" || { bad "package build failed"; exit 1; }

step "Pack tarballs"
for p in kit vite data apexjs create-apexjs; do
  ( cd "$WS/packages/$p" && pnpm pack --pack-destination "$TAR" >/dev/null 2>&1 ) \
    && ok "packed $p" || bad "pack $p failed"
done

step "Scaffold a fresh app (base, no install)"
node "$CREATE" "$APP" --no-install --no-git >/dev/null 2>&1 && ok "scaffolded" || bad "scaffold failed"

step "Rewrite deps → local tarballs (pnpm.overrides) + enable pnpm"
node - "$APP" "$TAR" <<'NODE'
const fs = require('fs'), path = require('path')
const [app, tar] = process.argv.slice(2)
const tgz = (name) => 'file:' + path.join(tar,
  fs.readdirSync(tar).find(f => f.startsWith(name + '-') && f.endsWith('.tgz')))
const map = {
  '@apex-stack/core':  tgz('apex-stack-core'),
  '@apex-stack/kit':   tgz('apex-stack-kit'),
  '@apex-stack/vite':  tgz('apex-stack-vite'),
  '@apex-stack/data':  tgz('apex-stack-data'),
}
const pj = path.join(app, 'package.json')
const p = JSON.parse(fs.readFileSync(pj, 'utf8'))
p.pnpm = { ...(p.pnpm || {}), overrides: { ...(p.pnpm?.overrides || {}), ...map } }
// Ensure data is present up front so overrides pin it before `extend` runs.
p.dependencies = { ...p.dependencies, '@apex-stack/data': map['@apex-stack/data'] }
fs.writeFileSync(pj, JSON.stringify(p, null, 2))
console.log('overrides written')
NODE
[ $? -eq 0 ] && ok "overrides written" || bad "overrides rewrite failed"

step "Install from tarballs"
( cd "$APP" && pnpm install --config.confirmModulesPurge=false >/dev/null 2>&1 ) \
  && ok "installed" || bad "install failed"

step "Enable features via the LOCAL built CLI (tests our extend code)"
for f in data auth i18n pwa; do
  ( cd "$APP" && node "$CLI" extend "$f" >/dev/null 2>&1 ) && ok "extend $f" || bad "extend $f failed"
done
# Re-install after features add deps.
( cd "$APP" && pnpm install >/dev/null 2>&1 ) && ok "feature deps installed" || bad "feature install failed"
# The pwa config block must have been injected so the build emits PWA assets.
grep -q "pwa:" "$APP/apex.config.ts" && ok "pwa config present" || bad "pwa config missing from apex.config.ts"

# ── TARGET 1: normal build ───────────────────────────────────────────────────
step "TARGET 1 — apex build (normal)"
( cd "$APP" && node "$CLI" build >/dev/null 2>&1 ) && ok "build ran" || bad "build crashed"
[ -f "$APP/dist/index.html" ] && ok "dist/index.html" || bad "no dist/index.html"
ls "$APP"/dist/assets/*.js >/dev/null 2>&1 && ok "hashed JS assets" || bad "no dist/assets/*.js"

# ── TARGET 3: PWA assets (emitted by the normal build) ───────────────────────
step "TARGET 3 — PWA assets"
[ -f "$APP/dist/manifest.webmanifest" ] && ok "manifest.webmanifest" || bad "no manifest.webmanifest"
[ -f "$APP/dist/sw.js" ] && ok "sw.js" || bad "no sw.js"
for i in pwa-192 pwa-512 pwa-maskable-512; do
  [ -f "$APP/dist/icons/$i.png" ] && ok "icon $i.png" || bad "no icon $i.png"
done

# ── TARGET 2: islands build ──────────────────────────────────────────────────
step "TARGET 2 — apex build --islands"
( cd "$APP" && node "$CLI" build --islands >/dev/null 2>&1 ) && ok "islands build ran" || bad "islands build crashed"
[ -f "$APP/dist/index.html" ] && ok "islands dist/index.html" || bad "no islands index.html"

# ── TARGET 4: mobile bundle ──────────────────────────────────────────────────
step "TARGET 4 — apex build --mobile"
( cd "$APP" && node "$CLI" build --mobile >/dev/null 2>&1 ) && ok "mobile build ran" || bad "mobile build crashed"
[ -f "$APP/dist/mobile/server.mjs" ] && ok "dist/mobile/server.mjs" || bad "no dist/mobile/server.mjs"

# ── TARGET 5: android scaffold ───────────────────────────────────────────────
step "TARGET 5 — apex mobile android (scaffold + sync)"
( cd "$APP" && node "$CLI" mobile android --no-build >/dev/null 2>&1 ) && ok "android scaffold ran" || bad "android scaffold crashed"
[ -d "$APP/mobile/android" ] && ok "mobile/android/ scaffolded" || bad "no mobile/android/"
[ -f "$APP/mobile/android/app/src/main/assets/server.mjs" ] && ok "server.mjs synced into APK assets" || bad "server.mjs not synced"

# ── TARGET 6: android --assemble with NO gradle → clean error ────────────────
step "TARGET 6 — apex mobile android --assemble (no gradle installed)"
OUT="$( cd "$APP" && node "$CLI" mobile android --assemble --no-build 2>&1 )"; CODE=$?
if [ $CODE -ne 0 ]; then ok "exits non-zero (did not falsely succeed)"; else bad "exited 0 despite missing gradle"; fi
echo "$OUT" | grep -qi "gradle not found" && ok "prints clean 'Gradle not found' message" || bad "no clean gradle message"
echo "$OUT" | grep -q "spawnSync" && bad "LEAKED raw spawnSync stack trace" || ok "no raw spawnSync stack trace"

# ── TARGET 6b: android --assemble with a resolvable Gradle → wiring works ─────
step "TARGET 6b — apex mobile android --assemble --gradle <fake> --sdk <dir>"
FAKE="$WORK/fakegradle.sh"
cat > "$FAKE" <<'EOF'
#!/usr/bin/env bash
echo "FAKEGRADLE $*"
mkdir -p app/build/outputs/apk/debug && echo apk > app/build/outputs/apk/debug/app-debug.apk
EOF
chmod +x "$FAKE"
rm -f "$APP/mobile/android/local.properties"
OUT="$( cd "$APP" && node "$CLI" mobile android --assemble --no-build --gradle "$FAKE" --sdk "/fake/Sdk" 2>&1 )"; CODE=$?
[ $CODE -eq 0 ] && ok "assemble exits 0 with a resolvable gradle" || bad "assemble failed with a resolvable gradle"
echo "$OUT" | grep -q "FAKEGRADLE assembleDebug --no-daemon" && ok "invokes gradle assembleDebug --no-daemon" || bad "did not invoke assembleDebug --no-daemon"
grep -q "sdk.dir=/fake/Sdk" "$APP/mobile/android/local.properties" 2>/dev/null && ok "wrote local.properties (sdk.dir)" || bad "local.properties sdk.dir not written"

# ── TARGET 7: ios scaffold ───────────────────────────────────────────────────
step "TARGET 7 — apex mobile ios (scaffold + sync)"
( cd "$APP" && node "$CLI" mobile ios --no-build >/dev/null 2>&1 ) && ok "ios scaffold ran" || bad "ios scaffold crashed"
[ -d "$APP/mobile/ios" ] && ok "mobile/ios/ scaffolded" || bad "no mobile/ios/"
[ -f "$APP/mobile/ios/Generated/server.mjs" ] && ok "server.mjs synced into ios Generated" || bad "server.mjs not synced (ios)"

# ── TARGET 8: ios --generate with NO xcodegen → clean error ──────────────────
step "TARGET 8 — apex mobile ios --generate (no xcodegen installed)"
OUT="$( cd "$APP" && node "$CLI" mobile ios --generate --no-build 2>&1 )"; CODE=$?
if [ $CODE -ne 0 ]; then ok "exits non-zero (did not falsely succeed)"; else bad "exited 0 despite missing xcodegen"; fi
echo "$OUT" | grep -qi "xcodegen not found" && ok "prints clean 'XcodeGen not found' message" || bad "no clean xcodegen message"
echo "$OUT" | grep -q "spawnSync" && bad "LEAKED raw spawnSync stack trace" || ok "no raw spawnSync stack trace"

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "  PASS: $pass    FAIL: $fail"
echo "═══════════════════════════════════════════════"
[ "${APEX_E2E_KEEP:-}" = "1" ] || rm -rf "$WORK"
[ $fail -eq 0 ]
