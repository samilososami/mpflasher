import React, { useRef, useState } from 'react';
import { ChipInfo } from '../lib/esptool';
import { IconFile, IconLoader, IconCheck, IconWarning } from './Icons';
import styles from './Steps.module.css';

interface FirmwareStepProps {
  chipInfo: ChipInfo;
  firmwareName: string;
  firmwareReady: boolean;
  downloadPct: number;
  isLoading: boolean;
  downloadFailed: boolean;
  error: string | null;
  onFileSelected: (f: File) => void;
}

export function FirmwareStep({
  chipInfo, firmwareName, firmwareReady, downloadPct,
  isLoading, downloadFailed, error, onFileSelected,
}: FirmwareStepProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.bin')) onFileSelected(f);
  };

  return (
    <div className={styles.step}>
      {/* Header */}
      <div className={styles.stepHeader}>
        <div className={`${styles.stepIconWrap} ${styles.stepIconGreen}`}>
          {isLoading
            ? <IconLoader size={18} color="var(--green)" />
            : <IconFile size={18} color="var(--green)" />
          }
        </div>
        <div>
          <h2 className={styles.stepTitle}>Descargando firmware</h2>
          <p className={styles.stepSub}>{chipInfo.chipName} · MicroPython {chipInfo.chipFamily}</p>
        </div>
      </div>

      {/* Estado de descarga */}
      {firmwareReady ? (
        <div className={styles.firmwareReady}>
          <IconCheck size={16} color="var(--green)" />
          <div>
            <div className={styles.firmwareReadyName}>{firmwareName}</div>
            <div className={styles.firmwareReadySub}>Descargado — iniciando flash...</div>
          </div>
        </div>
      ) : !downloadFailed ? (
        <div className={styles.downloadState}>
          <div className={styles.downloadStateLabel}>
            {isLoading
              ? <><IconLoader size={13} color="var(--accent)" />{downloadPct > 0 ? `Descargando MicroPython...` : 'Conectando a micropython.org...'}</>
              : 'Preparando descarga...'
            }
            {downloadPct > 0 && (
              <span className={styles.downloadPct}>{downloadPct}%</span>
            )}
          </div>
          {downloadPct > 0 && (
            <div className={styles.downloadTrack}>
              <div className={styles.downloadFill} style={{ width: `${downloadPct}%` }} />
            </div>
          )}
        </div>
      ) : null}

      {/* Error */}
      {error && (
        <div className={styles.errorBox}>
          <IconWarning size={14} color="var(--red)" />
          <span>{error}</span>
        </div>
      )}

      {/* Fallback manual si la descarga falló */}
      {downloadFailed && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>
            Arrastra el archivo <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>.bin</code> de MicroPython para tu {chipInfo.chipFamily}:
          </p>
          <div
            className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".bin"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) onFileSelected(f); }}
            />
            <IconFile size={22} color="var(--text-muted)" />
            <div className={styles.dropLabel}>Arrastra el .bin aquí o pulsa para buscar</div>
            <div className={styles.dropSub}>El flash comenzará automáticamente</div>
          </div>
        </div>
      )}
    </div>
  );
}
