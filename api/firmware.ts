// api/firmware.ts
// Vercel serverless function.
// El browser no puede fetchear micropython.org directamente (CORS).
// Esta función corre en el servidor de Vercel, descarga el firmware y lo devuelve.

const BOARD_PAGES: Record<string, string> = {
  'ESP32':    'https://micropython.org/download/ESP32_GENERIC/',
  'ESP32-S2': 'https://micropython.org/download/ESP32_GENERIC_S2/',
  'ESP32-S3': 'https://micropython.org/download/ESP32_GENERIC_S3/',
  'ESP32-C3': 'https://micropython.org/download/ESP32_GENERIC_C3/',
  'ESP32-C6': 'https://micropython.org/download/ESP32_GENERIC_C6/',
  'ESP32-H2': 'https://micropython.org/download/ESP32_GENERIC_H2/',
};

export default async function handler(
  req: { query: Record<string, string | string[] | undefined> },
  res: {
    status: (code: number) => { json: (data: unknown) => void };
    setHeader: (name: string, value: string) => void;
    send: (data: Buffer) => void;
    json: (data: unknown) => void;
  }
) {
  const chip = (req.query.chip as string) || 'ESP32';
  const pageUrl = BOARD_PAGES[chip] ?? BOARD_PAGES['ESP32'];

  try {
    // 1. Obtener la página de descargas de micropython.org
    const pageRes = await fetch(pageUrl, {
      headers: { 'User-Agent': 'MicroPython-Flasher/1.0' },
    });

    if (!pageRes.ok) {
      return res.status(502).json({ error: `micropython.org returned ${pageRes.status}` });
    }

    const html = await pageRes.text();

    // 2. Extraer la URL del último .bin estable (primer match = más reciente)
    // La página lista los binarios en orden descendente de fecha.
    const match = html.match(/href="(\/resources\/firmware\/[^"]+\.bin)"/);

    if (!match) {
      return res.status(404).json({ error: 'No .bin found on the download page.' });
    }

    const firmwarePath = match[1];
    const firmwareUrl  = `https://micropython.org${firmwarePath}`;
    const filename     = firmwarePath.split('/').pop()!;

    // 3. Descargar el binario
    const binRes = await fetch(firmwareUrl);

    if (!binRes.ok) {
      return res.status(502).json({ error: `Firmware fetch failed: ${binRes.status}` });
    }

    const buffer = Buffer.from(await binRes.arrayBuffer());

    // 4. Devolver el binario al browser con headers adecuados
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', String(buffer.length));
    res.setHeader('X-Firmware-Filename', filename);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(buffer);

  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
