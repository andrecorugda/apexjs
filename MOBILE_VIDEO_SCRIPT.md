# Apex JS — Mobile launch video script (~60s)

Voiceover: **female narrator** — warm, confident, unhurried; a touch of wonder at the reveal, never
hypey. Grounded in what actually ships. A 30-second cut is marked at the end.

**VO tone notes:** conversational, like showing a friend something genuinely cool. Land the pauses
(the "…" beats). Emphasis on the **bold** words. Total VO ≈ 130 words (~55s at a relaxed pace).

---

### Scene 1 — Hook (0:00–0:07)
- **Visual:** a phone in a hand, screen on, an app running. Camera pushes in; a small "✈ Airplane mode" badge sits in the status bar.
- **On-screen text:** `a full-stack app`
- **VO (female):** "You built a full-stack app. Server rendering. A real database. Auth."

### Scene 2 — The reveal (0:07–0:15)
- **Visual:** finger swipes down Control Center → airplane mode toggles **on**. The app keeps working — a page loads instantly.
- **On-screen text:** `now watch this` → `✈ no signal`
- **VO (female):** "Now watch this. It's running **on the phone**… in airplane mode. No server. No network."

### Scene 3 — One command (0:15–0:24)
- **Visual:** clean terminal. Type `apex build --mobile`, then `apex mobile android`. A green check; an app icon lands on the home screen.
- **On-screen text:** `apex build --mobile`
- **VO (female):** "One command. Apex compiles your **whole app** — pages, API, database — into a single bundle, and installs it as a native app."

### Scene 4 — How it works (0:24–0:38)
- **Visual:** simple animated diagram: WebView on top, an arrow down into a box labeled **Apex engine · server.mjs**, with `pages · /api · SQLite · auth` inside. Small caption: `no server · no port`.
- **On-screen text:** `your server runs on the device`
- **VO (female):** "Because Apex runs your **server** on the device — in the phone's own JavaScript engine. Every tap is just a function call. Your code answers it… right there. Offline."

### Scene 5 — Demo (0:38–0:48)
- **Visual:** on-device, airplane mode still on: type a guestbook message → **Post** → it appears. Then log in → "Signed in as Ada." Snappy, real.
- **On-screen text:** `post · login · all offline`
- **VO (female):** "Post a message. Log in. It all just works — with no signal — because your database is on the device too."

### Scene 6 — The kicker + CTA (0:48–1:00)
- **Visual:** split screen — the same app in a desktop browser (web) and on the phone — then both collapse into one file: `pages/index.alpine`. End card: Apex logo + `apexjs.site`.
- **On-screen text:** `one codebase → web + phone` → `apexjs.site`
- **VO (female):** "And it's the **same code** you deploy to the web. One TypeScript codebase — the web, and now the phone. That's Apex."

---

## 30-second cut (trim to Scenes 1, 2, 3, 5, 6)

- **VO (female):** "You built a full-stack app — server rendering, a database, auth. Now watch: it's
  running on the phone, in airplane mode. One command — `apex build --mobile` — and your **whole
  server** runs on the device. Post a message, log in, all offline. Same code you ship to the web.
  One codebase — web, and now the phone. That's Apex. **apexjs.site**."

---

## Recording notes (assets to capture)
- **Terminal:** a real `apex build --mobile` then `apex mobile android` (clean prompt, large font).
- **Emulator/device, airplane mode ON:** the guestbook post + the `/account` login → "Signed in as
  Ada." (This is the money shot — capture it in one take.)
- **Web side-by-side:** the same app in a browser for Scene 6.
- **Diagram (Scene 4):** animate the one in `MOBILE_LAUNCH.md` / the landing "how it works" section.
- Keep captions short and lowercase; let the VO carry it. Background: soft, building slightly at the
  reveal (Scene 2) and the kicker (Scene 6).

## Honest guardrails (so the video stays true)
- Show it as a **WebView app running your server offline** — don't imply native-widget UI.
- The airplane-mode demo is real and reproducible; that's the whole pitch. Don't fake data.
