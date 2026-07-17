---
"@apex-stack/core": patch
---

Fix the dev server opening a second port for Vite HMR (`port + 1`, e.g. 3001). On Windows that
extra port is frequently unbindable or firewall-blocked, so the HMR WebSocket dies
("WebSocket closed without opened") and every `/pages/*.alpine` module then fails to load
(empty MIME → "apex_c… is not defined" during client-side navigation / morph). The dev server
now creates its HTTP server up front and passes it to Vite as `hmr.server`, so HMR shares the
single dev-server port — no second port to bind or get firewalled. Windows-verified.
