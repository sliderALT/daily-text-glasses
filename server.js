const express = require('express')
const path = require('path')

const PORT = process.env.PORT || 5173
const app = express()

app.use(express.static(path.join(__dirname, 'dist')))

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

  const scripture = parseScripture(item.content)
  const body = parseBody(item.content)
  const date = formatDate(now)
  const divider = '-----------------------------------'

  // Build text and enforce 900 char limit
  // Strip ALL non-ASCII characters first
  const full = [date, divider, scripture, '', body, '', divider, 'swipe to scroll']
    .join('\n')
    .replace(/[^\x00-\x7F]/g, '-')
    .replace(/\r/g, '')

  const text = full.slice(0, 900)
  console.log(`Text length: ${text.length} chars, scripture: ${scripture}`)
  return { text }
}

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

app.get('/daily-text.json', async (req, res) => {
  if (!cache || cacheDate !== new Date().toDateString()) {
    await refreshCache()
  }
  console.log(`Serving ${cache.text.length} chars to client`)
  res.json(cache)
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

refreshCache().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
  scheduleRefresh()
})
