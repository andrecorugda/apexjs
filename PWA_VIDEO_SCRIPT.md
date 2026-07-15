# Apex JS — PWA launch video script (~45s)

Voiceover: **female narrator** — same voice as the mobile launch: genuinely excited, warm, a team
sharing something they're proud of. **Never speaks a URL** (screen-only), so subtitles never read
"dot site". Pace: relaxed; let the airplane-mode beat land. VO ≈ 105 words.

---

### Scene 1 — The hook (0:00–0:08)
- **Visual:** a normal browser tab with an Apex app. The install icon fades into the address bar and gently pulses.
- **On-screen text:** `see that little icon?`
- **VO:** "Here's a little one we love. Your Apex app… in a browser. But see that icon? It wants to be installed."

### Scene 2 — One block (0:08–0:16)
- **Visual:** editor shows the entire setup, typed live:
  ```
  pwa: { name: 'My App' }
  ```
  then a terminal: `apex build` → `✓ PWA — manifest.webmanifest + sw.js`
- **On-screen text:** `the whole setup`
- **VO:** "And making that happen took one line of config. No plugin. No setup. Apex builds everything it needs — automatically."

### Scene 3 — Install it (0:16–0:24)
- **Visual:** click the install icon → prompt card → the app pops open in its **own window** — no tabs, no address bar; its icon lands in the dock/taskbar.
- **On-screen text:** `a real app window`
- **VO:** "Click it… and your web app becomes a real app. Its own window. Its own icon. Right on the dock."

### Scene 4 — The magic beat (0:24–0:34)
- **Visual:** WiFi toggled **off** (or the ✈ icon appears). Reload the installed app. It renders instantly; navigate a page or two.
- **On-screen text:** `✈ offline — still works`
- **VO:** "Now the part that makes people smile. Turn the internet off… and it still works. The whole site's already saved on your device."

### Scene 5 — The trio + close (0:34–0:45)
- **Visual:** three frames side by side — browser (web), the installed PWA window, the phone from the mobile launch — sliding together over one file: `pages/index.alpine`. End card: Apex logo + `apexjs.site`.
- **On-screen text:** `one codebase — web · PWA · mobile` → `apexjs.site`
- **VO:** "So that's the family now: the web… an installable app… and the phone. One codebase, everywhere. This is Apex."

---

## Clean VO / subtitle lines (no URLs — safe for TTS + captions)

```
Here's a little one we love.
Your Apex app, in a browser — but see that icon? It wants to be installed.
And making that happen took one line of config.
No plugin. No setup. Apex builds everything it needs, automatically.
Click it… and your web app becomes a real app.
Its own window. Its own icon. Right on the dock.
Now the part that makes people smile.
Turn the internet off… and it still works.
The whole site's already saved on your device.
So that's the family now: the web, an installable app, and the phone.
One codebase, everywhere.
This is Apex.
```

## 20-second social cut
```
One line of config — and your Apex app installs like a real app.
Its own window, its own icon.
Turn the internet off… it still works.
The web, an installable app, and the phone — one codebase.
This is Apex.
```
(Show `apexjs.site` on the final frame — don't say it.)

## Recording notes
- **Money shot:** Scene 4 — offline reload in the installed window. Real, one take, don't fake it.
- Scene 2's terminal line is real `apex build` output (`✓ PWA — manifest.webmanifest + sw.js (N file(s) precached)`).
- Scene 5 reuses the phone footage from the mobile launch video — continuity between the two launches.
- Honest guardrail: say "the whole site's saved" only for a static/islands build (which is what you'll demo) — that's precisely true.
