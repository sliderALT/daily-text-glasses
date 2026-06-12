# Daily Text for Even G2 Glasses

Displays the daily Bible text from [wol.jw.org](https://wol.jw.org) on your Even Realities G2 smart glasses.

Each day the app fetches the scripture reference and commentary, formats it for the
576×288 greyscale display, and supports native firmware scrolling so you can read the
full text with swipe gestures.

---

## Features

- **Auto-fetches** today's text from `wol.jw.org/wol/dt/r1/lp-e/{year}/{month}/{day}`
- **Swipe to scroll** — native firmware scrolling handles long commentary
- **Retry on error** — single press retries the fetch if the network is unavailable
- **Foreground refresh** — re-fetches whenever you open the app (handles day changes)
- **Midnight auto-refresh** — timer fires at 00:00:05 to load the new day's text without restarting
- **Loading screen** shown immediately while the network request is in flight

---

## Requirements

- Node.js v20 LTS or v22+
- Even Realities App on your phone, paired to Even G2 glasses
- `@evenrealities/evenhub-cli` (for QR sideloading or packaging)
- `@evenrealities/evenhub-simulator` (optional, for local testing without hardware)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2a. Run in the simulator (no hardware needed)
npm run dev
# In a second terminal:
npx @evenrealities/evenhub-simulator http://localhost:5173

# 2b. Sideload to real glasses via QR
npm run dev
# In a second terminal (replace IP with your machine's LAN IP):
npx @evenrealities/evenhub-cli qr --url "http://192.168.1.100:5173"
# Scan the QR with the Even Realities App
```

---

## Build & Package

```bash
# Build for production
npm run build

# Package as .ehpk for Even Hub distribution
npx @evenrealities/evenhub-cli pack app.json dist
```

---

## Changing the Language

The WOL API supports multiple languages. Edit the URL in `src/main.ts`:

| Language   | Code in URL          |
|------------|----------------------|
| English    | `r1/lp-e`  ← default |
| Spanish    | `r10/lp-s`           |
| Portuguese | `r5/lp-p`            |
| French     | `r30/lp-f`           |
| German     | `r10/lp-g`           |

Replace `r1/lp-e` in the `fetchDailyText` function with the appropriate code.

---

## Gesture Reference (on the glasses)

| Gesture          | Action                          |
|------------------|---------------------------------|
| Swipe up/down    | Scroll the text (native)        |
| Single press     | Retry fetch (on error screen)   |
| Open app         | Auto-refreshes today's text     |

---

## Project Structure

```
daily-text-app/
├── src/
│   └── main.ts        # All app logic — fetch, parse, render, events
├── index.html         # Vite entry point
├── package.json
├── vite.config.ts
├── tsconfig.json
└── app.json           # Even Hub manifest (package_id, permissions, etc.)
```

---

## How the WOL API Works

The endpoint returns JSON:

```
GET https://wol.jw.org/wol/dt/r1/lp-e/2026/5/31
```

```json
{
  "items": [{
    "content": "<em>Acts 17:11</em><p>…commentary HTML…</p>",
    "url": "https://wol.jw.org/en/wol/d/…"
  }]
}
```

The app strips HTML tags, extracts the `<em>` scripture reference and the `<p>` body
paragraphs, then formats them for the glasses display.

---

*Not affiliated with or endorsed by the Watch Tower Bible and Tract Society.*
