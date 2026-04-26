// ─────────────────────────────────────────────────────────────────────────────
// REGLA FUNDAMENTAL:
// esptool-js Transport abre y cierra el puerto él solo.
// NUNCA llames a port.open() antes de pasarlo a Transport.
// Solo abrimos el puerto manualmente en verifyMicroPython(), DESPUÉS de que
// transport.disconnect() lo haya cerrado.
// ─────────────────────────────────────────────────────────────────────────────

import CryptoJS from 'crypto-js';

export type BoardType = 'generic' | 'steamakers';

export interface BoardProfile {
  id: BoardType;
  name: string;
  hasBootButton: boolean;
  description: string;
}

export const BOARD_PROFILES: Record<BoardType, BoardProfile> = {
  steamakers: {
    id: 'steamakers',
    name: 'ESP32 STEAMakers (Keystudio / ESP32-WROOM-32)',
    hasBootButton: false,
    description: 'Sin botón BOOT. Auto-reset via DTR/RTS. Solo conecta y pulsa Connect.',
  },
  generic: {
    id: 'generic',
    name: 'ESP32 genérico / Autodetect',
    hasBootButton: true,
    description: 'Cualquier ESP32 estándar. Requiere bootloader mode: mantén BOOT y pulsa RESET.',
  },
};

export interface ChipInfo {
  chipName: string;
  chipFamily: string;
  flashSize: number;
}

export interface FlashProgress {
  bytesWritten: number;
  totalBytes: number;
  percent: number;
  speed: number;
}

export type LogLevel = 'info' | 'ok' | 'error' | 'warn' | 'accent';
export type FlashPhase = 'erasing' | 'writing' | 'resetting';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
}

export const DRIVER_URLS = {
  windows: 'https://www.silabs.com/documents/public/software/CP210x_Windows_Drivers.zip',
  mac:     'https://www.silabs.com/documents/public/software/Mac_OSX_VCP_Driver.zip',
  linux:   'https://www.silabs.com/documents/public/software/Linux_3.x.x_4.x.x_VCP_Driver_Source.zip',
};

export function isWebSerialSupported(): boolean {
  return 'serial' in navigator;
}

// ─── CRÍTICO: esptool-js espera binary string, no Uint8Array ─────────────────
// El error "bStr.charCodeAt is not a function" ocurre cuando pasas un Uint8Array
// directamente. Hay que convertir.
function uint8ArrayToBinaryString(data: Uint8Array): string {
  let str = '';
  // chunked para no reventar el call stack en firmwares grandes
  const CHUNK = 8192;
  for (let i = 0; i < data.length; i += CHUNK) {
    str += String.fromCharCode(...data.subarray(i, i + CHUNK));
  }
  return str;
}

// ─── Auto-descarga del firmware via serverless function ───────────────────────
export interface FirmwareDownloadResult {
  data: Uint8Array;
  filename: string;
  sizeKB: number;
}

export async function downloadFirmware(
  chipFamily: string,
  onLog: (msg: string, level?: LogLevel) => void,
  onProgress?: (pct: number) => void
): Promise<FirmwareDownloadResult | null> {
  try {
    onLog(`Buscando último firmware para ${chipFamily}...`, 'info');

    const url = `/api/firmware?chip=${encodeURIComponent(chipFamily)}`;
    const res = await fetch(url);

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      onLog(`Error al descargar firmware: ${body.error ?? res.statusText}`, 'error');
      return null;
    }

    const filename = res.headers.get('X-Firmware-Filename') ?? `micropython-${chipFamily}.bin`;
    const totalBytes = Number(res.headers.get('Content-Length') ?? 0);

    onLog(`Descargando ${filename}...`, 'accent');

    // Leer con progreso
    const reader = res.body!.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (totalBytes > 0 && onProgress) {
        onProgress(Math.round((received / totalBytes) * 100));
      }
    }

    const data = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.length; }

    const sizeKB = received / 1024;

    // Un firmware MicroPython real nunca es menor de 100 KB.
    // Si llega algo más pequeño es la fuente TypeScript de la API o un error HTML.
    if (sizeKB < 100) {
      onLog(`Error: el archivo descargado mide ${sizeKB.toFixed(1)} KB — no es un firmware válido.`, 'error');
      onLog('Asegúrate de ejecutar "npm run dev" y de tener conexión a internet.', 'warn');
      return null;
    }

    onLog(`Firmware descargado: ${sizeKB.toFixed(1)} KB`, 'ok');

    return { data, filename, sizeKB };
  } catch (err: unknown) {
    onLog(`Fallo en la descarga: ${err instanceof Error ? err.message : String(err)}`, 'error');
    onLog('Asegúrate de estar en local (npm run dev) o en Vercel donde el /api está disponible.', 'warn');
    return null;
  }
}

// ─── Paso 1: solo pedir permiso al navegador, SIN abrir el puerto ─────────────
export async function requestPort(
  onLog: (msg: string, level?: LogLevel) => void
): Promise<SerialPort | null> {
  try {
    const port = await navigator.serial.requestPort();
    onLog('Puerto seleccionado.', 'ok');
    return port;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'NotFoundError') {
      onLog('No se seleccionó ningún puerto.', 'warn');
    } else {
      onLog(`Error: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
    return null;
  }
}

// ─── Paso 2: detectar chip ────────────────────────────────────────────────────
// Puerto llega CERRADO. Transport lo abre internamente.
export async function detectChip(
  port: SerialPort,
  boardType: BoardType,
  onLog: (msg: string, level?: LogLevel) => void
): Promise<ChipInfo | null> {
  let transport: import('esptool-js').Transport | null = null;

  try {
    const { ESPLoader, Transport } = await import('esptool-js');
    transport = new Transport(port, false);

    const espLoader = new ESPLoader({
      transport,
      baudrate: 115200,
      romBaudrate: 115200,
      enableTracing: false,
      debugLogging: false,
    });

    if (boardType === 'steamakers') {
      onLog('STEAMakers: enviando secuencia de auto-reset...', 'info');
    } else {
      onLog('Conectando al bootloader ROM...', 'info');
    }

    const chipName = await espLoader.main();
    onLog(`Chip: ${chipName}`, 'ok');

    let flashSize = 4;
    try { flashSize = await espLoader.getFlashSize(); } catch { /* opcional */ }
    onLog(`Flash: ${flashSize} MB`, 'info');

    await transport.disconnect();
    transport = null;

    return { chipName, chipFamily: extractFamily(chipName), flashSize };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    onLog(`Detección fallida: ${msg}`, 'error');

    if (msg.includes('already open')) {
      onLog('El puerto está ocupado. Cierra cualquier terminal serial y desconecta el USB.', 'warn');
    } else if (boardType === 'steamakers') {
      onLog('STEAMakers: desconecta el USB, vuelve a conectar y pulsa Connect.', 'warn');
    } else {
      onLog('Mantén BOOT, pulsa RESET, suelta BOOT, luego conecta.', 'warn');
    }

    try { if (transport) await transport.disconnect(); } catch { /* */ }
    return null;
  }
}

// ─── Paso 3: flashear firmware ────────────────────────────────────────────────
// Puerto llega CERRADO (transport.disconnect lo cerró en detectChip).
// Transport lo reabre aquí.
// IMPORTANTE: data debe ser binary string, no Uint8Array.
export async function flashFirmware(
  port: SerialPort,
  firmwareData: Uint8Array,
  chipInfo: ChipInfo,
  onLog: (msg: string, level?: LogLevel) => void,
  onProgress: (p: FlashProgress) => void,
  onPhase?: (phase: FlashPhase) => void,
): Promise<boolean> {
  let transport: import('esptool-js').Transport | null = null;

  try {
    const { ESPLoader, Transport } = await import('esptool-js');

    transport = new Transport(port, false);
    const espLoader = new ESPLoader({
      transport,
      baudrate: 115200,
      romBaudrate: 115200,
      enableTracing: false,
      debugLogging: false,
    });

    onLog('Conectando para flash...', 'info');
    await espLoader.main();

    onLog('Cambiando a 921600 baud...', 'info');
    await espLoader.changeBaud(921600);

    onPhase?.('erasing');
    onLog('Borrando flash...', 'warn');
    await espLoader.eraseFlash();
    onLog('Flash borrado.', 'ok');

    onPhase?.('writing');
    const offset = FIRMWARE_OFFSET[chipInfo.chipFamily] ?? 0x1000;
    onLog(
      `Escribiendo en 0x${offset.toString(16).toUpperCase()} — ${(firmwareData.length / 1024).toFixed(1)} KB`,
      'accent'
    );

    // ── FIX CRÍTICO: convertir Uint8Array a binary string ──────────────────
    // esptool-js internamente hace bStr.charCodeAt(i), que falla si no es string.
    const binaryString = uint8ArrayToBinaryString(firmwareData);

    const startTime = Date.now();

    await espLoader.writeFlash({
      fileArray: [{ data: binaryString, address: offset }],
      flashSize: 'keep',
      eraseAll: false,
      compress: true,
      reportProgress(_: number, written: number, total: number) {
        const elapsed = (Date.now() - startTime) / 1000 || 0.001;
        onProgress({
          bytesWritten: written,
          totalBytes: total,
          percent: Math.round((written / total) * 100),
          speed: written / elapsed,
        });
      },
      calculateMD5Hash: (img: string) =>
        CryptoJS.MD5(CryptoJS.enc.Latin1.parse(img)).toString(),
    } as Parameters<typeof espLoader.writeFlash>[0]);

    onLog('Firmware escrito correctamente.', 'ok');
    onPhase?.('resetting');
    onLog('Reseteando chip...', 'info');
    await espLoader.after('hard_reset');

    await transport.disconnect();
    transport = null;

    return true;
  } catch (err: unknown) {
    onLog(`Error al flashear: ${err instanceof Error ? err.message : String(err)}`, 'error');
    try { if (transport) await transport.disconnect(); } catch { /* */ }
    return false;
  }
}

// ─── Paso 4: verificar MicroPython ───────────────────────────────────────────
// Aquí SÍ abrimos el puerto manualmente (ya cerrado por transport.disconnect).
//
// PROBLEMA: espLoader.after('hard_reset') en esptool-js solo hace setRTS(false).
// Si RTS ya era false tras el flash, no ocurre ningún reset real y el chip se
// queda atrapado en el bootloader ROM sin arrancar MicroPython.
//
// SOLUCIÓN: pulsamos RTS manualmente aquí para forzar el reset correcto:
//   RTS=true  → EN=LOW  → chip en reset (con DTR=false → IO0=HIGH = modo normal)
//   RTS=false → EN=HIGH → chip arranca MicroPython
export async function verifyMicroPython(
  port: SerialPort,
  onLog: (msg: string, level?: LogLevel) => void
): Promise<boolean> {
  return new Promise(async (resolve) => {
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

    const cleanup = async () => {
      try { if (reader) { await reader.cancel(); reader.releaseLock(); } } catch { /* */ }
      try { if (writer) { writer.releaseLock(); } } catch { /* */ }
      try { await port.close(); } catch { /* */ }
    };

    try {
      // Dar tiempo al OS para liberar el puerto tras transport.disconnect()
      await new Promise(r => setTimeout(r, 1000));

      await port.open({ baudRate: 115200 });

      // Pulso de reset hardware:
      // DTR=false → IO0=HIGH (modo normal, no bootloader)
      // RTS=true  → EN=LOW  (mantener chip en reset)
      await port.setSignals({ dataTerminalReady: false, requestToSend: true });
      await new Promise(r => setTimeout(r, 200));
      // RTS=false → EN=HIGH → el chip arranca ahora en modo normal (MicroPython)
      await port.setSignals({ dataTerminalReady: false, requestToSend: false });

      onLog('Esperando REPL de MicroPython...', 'info');

      // Esperar a que MicroPython arranque completamente (~1-2 s para ESP32)
      await new Promise(r => setTimeout(r, 2500));

      reader = port.readable!.getReader();
      writer = port.writable!.getWriter();

      // Ctrl+C x2 + Enter: interrumpe scripts en ejecución y fuerza el prompt >>>
      await writer.write(new Uint8Array([0x03, 0x03, 0x0d]));

      let buffer = '';
      const decoder = new TextDecoder();

      const timeout = setTimeout(async () => {
        onLog('Timeout — REPL no detectado en 10s.', 'error');
        await cleanup();
        resolve(false);
      }, 10000);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value);
        if (buffer.includes('>>>') || buffer.includes('MicroPython')) {
          clearTimeout(timeout);
          onLog('REPL de MicroPython detectado!', 'ok');
          onLog('El dispositivo está listo.', 'ok');
          await cleanup();
          resolve(true);
          break;
        }
      }
    } catch (err: unknown) {
      onLog(`Error de verificación: ${err instanceof Error ? err.message : String(err)}`, 'error');
      await cleanup();
      resolve(false);
    }
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIRMWARE_OFFSET: Record<string, number> = {
  'ESP32':    0x1000,
  'ESP32-S2': 0x0000,
  'ESP32-S3': 0x0000,
  'ESP32-C3': 0x0000,
  'ESP32-C6': 0x0000,
  'ESP32-H2': 0x0000,
};

function extractFamily(name: string): string {
  if (name.includes('S3')) return 'ESP32-S3';
  if (name.includes('S2')) return 'ESP32-S2';
  if (name.includes('C3')) return 'ESP32-C3';
  if (name.includes('C6')) return 'ESP32-C6';
  if (name.includes('H2')) return 'ESP32-H2';
  return 'ESP32';
}
