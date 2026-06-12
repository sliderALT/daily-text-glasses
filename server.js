// server.js — Daily Text for Even G2 Glasses
// Fetches daily text from wol.jw.org and serves it to the glasses app

const express = require('express')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 5173

const app = express()

// Serve static files from the dist folder (built Vite app)
app.use(express.static(path.join(__dirname, 'dist')))

// ── Parse helpers ─────────────────────────────────────────────────────────────

function stripTags(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseScripture(html) {
  const match = html.match(/<em>([\s\S]*?)<\/em>/)
  return match ? stripTags(match[1]).trim() : ''
}

function parseBody(html) {
  const paragraphs = html.split(/<p[\s\S]*?>/g)
  const parts = []
  for (let i = 1; i < paragraphs.length; i++) {
    const text = stripTags(paragraphs[i]).trim()
    if (text.length > 10) parts.push(text)
  }
  return parts.join('\n\n')
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

async function fetchDailyText() {
  const now = new Date()
  const url = `https://wol.jw.org/wol/dt/r1/lp-e/${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`
  console.log('Fetching:', url)
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`WOL returned ${resp.status}`)
  const json = await resp.json()
  const item = json.items[0]
  if (!item) throw new Error('No item in response')

  const divider = '-----------------------------------'
  const scripture = parseScripture(item.content)
  let body = parseBody(item.content)

  // Build the full text and truncate to 900 chars (SDK limit is 1000)
  const full = [formatDate(now), divider, scripture, '', body, '', divider, 'swipe to scroll'].join('\n')
  const text = full
    .replace(/[^\x00-\x7F]/g, '-')
    .replace(/\r/g, '')
    .slice(0, 900)

  console.log('Scripture:', scripture)
  return { text }
}

// ── Cache ─────────────────────────────────────────────────────────────────────

let cache = null
let cacheDate = ''

async function refreshCache() {
  try {
    cache = await fetchDailyText()
    cacheDate = new Date().toDateString()
    console.log('Cache refreshed ✓')
  } catch (err) {
    console.error('Fetch failed:', err.message)
    if (!cache) cache = { text: 'Could not load daily text. Please try again later.' }
  }
}

function scheduleRefresh() {
  const now = new Date()
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5)
  setTimeout(async () => {
    await refreshCache()
    scheduleRefresh()
  }, tomorrow.getTime() - now.getTime())
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/daily-text.json', async (req, res) => {
  if (!cache || cacheDate !== new Date().toDateString()) {
    await refreshCache()
  }
  res.json(cache)
})

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// ── Start ─────────────────────────────────────────────────────────────────────

refreshCache().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
  scheduleRefresh()
})
