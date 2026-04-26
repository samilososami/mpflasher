import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'http'

const BOARD_PAGES: Record<string, string> = {
  'ESP32':    'https://micropython.org/download/ESP32_GENERIC/',
  'ESP32-S2': 'https://micropython.org/download/ESP32_GENERIC_S2/',
  'ESP32-S3': 'https://micropython.org/download/ESP32_GENERIC_S3/',
  'ESP32-C3': 'https://micropython.org/download/ESP32_GENERIC_C3/',
  'ESP32-C6': 'https://micropython.org/download/ESP32_GENERIC_C6/',
  'ESP32-H2': 'https://micropython.org/download/ESP32_GENERIC_H2/',
}

async function apiFirmwareHandler(req: IncomingMessage, res: ServerResponse) {
  try {
    const qs = new URLSearchParams((req.url ?? '').replace(/^[^?]*/, ''))
    const chip = qs.get('chip') || 'ESP32'
    const pageUrl = BOARD_PAGES[chip] ?? BOARD_PAGES['ESP32']

    const pageRes = await fetch(pageUrl, {
      headers: { 'User-Agent': 'MicroPython-Flasher/1.0' },
    })
    if (!pageRes.ok) {
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: `micropython.org returned ${pageRes.status}` }))
      return
    }

    const html = await pageRes.text()
    const match = html.match(/href="(\/resources\/firmware\/[^"]+\.bin)"/)
    if (!match) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'No .bin found on the download page.' }))
      return
    }

    const firmwarePath = match[1]
    const firmwareUrl  = `https://micropython.org${firmwarePath}`
    const filename     = firmwarePath.split('/').pop()!

    const binRes = await fetch(firmwareUrl)
    if (!binRes.ok) {
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: `Firmware fetch failed: ${binRes.status}` }))
      return
    }

    const buffer = Buffer.from(await binRes.arrayBuffer())

    res.writeHead(200, {
      'Content-Type':        'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      String(buffer.length),
      'X-Firmware-Filename': filename,
      'Access-Control-Allow-Origin': '*',
    })
    res.end(buffer)

  } catch (err: unknown) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }))
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'dev-api',
      configureServer(server) {
        server.middlewares.use('/api/firmware', apiFirmwareHandler)
      },
    },
  ],
  server: {
    port: 3000,
  },
  optimizeDeps: {
    include: ['esptool-js', 'atob-lite'],
  },
  resolve: {
    mainFields: ['browser', 'module', 'main'],
  },
})
