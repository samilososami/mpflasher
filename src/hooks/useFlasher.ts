import { useState, useCallback, useRef } from 'react';
import {
  ChipInfo, FlashProgress, FlashPhase, LogEntry, LogLevel,
  requestPort, detectChip, flashFirmware, verifyMicroPython, downloadFirmware,
} from '../lib/esptool';

export type Step = 'connect' | 'firmware' | 'flash' | 'verify' | 'done';

export function useFlasher() {
  const [step, setStep]               = useState<Step>('connect');
  const [chipInfo, setChipInfo]       = useState<ChipInfo | null>(null);

  const [firmwareData, setFirmwareData] = useState<Uint8Array | null>(null);
  const [firmwareName, setFirmwareName] = useState<string>('');
  const [downloadPct, setDownloadPct]   = useState<number>(0);
  const [downloadFailed, setDownloadFailed] = useState(false);

  const [logs, setLogs]               = useState<LogEntry[]>([]);
  const [progress, setProgress]       = useState<FlashProgress | null>(null);
  const [flashPhase, setFlashPhase]   = useState<FlashPhase | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [portNotFound, setPortNotFound] = useState(false);

  const portRef = useRef<SerialPort | null>(null);

  const addLog = useCallback((message: string, level: LogLevel = 'info') => {
    setLogs(prev => [...prev, { message, level, timestamp: Date.now() }]);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  // ─── Flujo completo en un solo click ─────────────────────────────────────────
  const handleConnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPortNotFound(false);
    setDownloadFailed(false);
    clearLogs();

    // 1. Pedir puerto al navegador
    const port = await requestPort(addLog);
    if (!port) {
      setPortNotFound(true);
      setIsLoading(false);
      return;
    }

    portRef.current = port;

    // 2. Detectar chip
    const info = await detectChip(port, 'steamakers', addLog);
    if (!info) {
      setError('No se pudo detectar el chip. Desconecta el USB, vuelve a conectarlo y pulsa de nuevo.');
      setIsLoading(false);
      return;
    }

    setChipInfo(info);
    setStep('firmware');
    setDownloadPct(0);

    // 3. Descargar firmware automáticamente
    const result = await downloadFirmware(info.chipFamily, addLog, setDownloadPct);

    if (!result) {
      setDownloadFailed(true);
      setError('No se pudo descargar el firmware. Carga el archivo .bin manualmente.');
      setIsLoading(false);
      return;
    }

    setFirmwareData(result.data);
    setFirmwareName(result.filename);

    // 4. Flashear automáticamente
    setStep('flash');
    setProgress(null);
    setFlashPhase(null);

    const ok = await flashFirmware(port, result.data, info, addLog, setProgress, setFlashPhase);

    if (!ok) {
      setError('Flash fallido. Revisa los logs y vuelve a intentarlo.');
      setIsLoading(false);
      return;
    }

    // 5. Verificar
    setStep('verify');
    setFlashPhase(null);
    const verified = await verifyMicroPython(port, addLog);
    setStep(verified ? 'done' : 'verify');
    if (!verified) setError('Verificación fallida — resetea la placa manualmente.');

    setIsLoading(false);
  }, [addLog, clearLogs]);

  // ─── Fallback: usuario sube .bin manualmente ──────────────────────────────────
  const handleFileSelectedAndFlash = useCallback(async (file: File) => {
    const port = portRef.current;
    const info = chipInfo;
    if (!port || !info) return;

    const buffer = await file.arrayBuffer();
    const fwData = new Uint8Array(buffer);

    setFirmwareData(fwData);
    setFirmwareName(file.name);
    setError(null);
    setDownloadFailed(false);
    setIsLoading(true);
    clearLogs();
    setStep('flash');
    setProgress(null);
    setFlashPhase(null);

    const ok = await flashFirmware(port, fwData, info, addLog, setProgress, setFlashPhase);

    if (!ok) {
      setError('Flash fallido. Revisa los logs.');
      setIsLoading(false);
      return;
    }

    setStep('verify');
    setFlashPhase(null);
    const verified = await verifyMicroPython(port, addLog);
    setStep(verified ? 'done' : 'verify');
    if (!verified) setError('Verificación fallida — resetea la placa manualmente.');

    setIsLoading(false);
  }, [chipInfo, addLog, clearLogs]);

  // ─── Reset ────────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setStep('connect');
    setChipInfo(null);
    setFirmwareData(null);
    setFirmwareName('');
    setDownloadPct(0);
    setDownloadFailed(false);
    setLogs([]);
    setProgress(null);
    setFlashPhase(null);
    setError(null);
    setIsLoading(false);
    setPortNotFound(false);
    portRef.current = null;
  }, []);

  return {
    step, setStep,
    chipInfo,
    firmwareData, firmwareName, downloadPct, downloadFailed,
    flashPhase,
    logs, progress,
    isLoading, error,
    portNotFound,
    handleConnect,
    handleFileSelectedAndFlash,
    reset,
  };
}
