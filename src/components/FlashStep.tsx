import React from 'react';
import { FlashProgress, FlashPhase } from '../lib/esptool';
import { IconFlash, IconLoader, IconWarning } from './Icons';
import styles from './Steps.module.css';

interface FlashStepProps {
  progress: FlashProgress | null;
  flashPhase: FlashPhase | null;
  isLoading: boolean;
  error: string | null;
}

function phaseLabel(phase: FlashPhase | null, progress: FlashProgress | null): string {
  if (phase === 'erasing')   return 'Borrando firmware anterior...';
  if (phase === 'writing')   return 'Escribiendo MicroPython...';
  if (phase === 'resetting') return 'Reiniciando placa...';
  if (progress)              return 'Escribiendo MicroPython...';
  return 'Preparando conexión...';
}

export function FlashStep({ progress, flashPhase, isLoading, error }: FlashStepProps) {
  const percent = progress?.percent ?? 0;
  const speed = progress?.speed ?? 0;

  return (
    <div className={styles.step}>
      {/* Header */}
      <div className={styles.stepHeader}>
        <div className={styles.stepIconWrap}>
          {isLoading
            ? <IconLoader size={18} color="var(--accent)" />
            : <IconFlash size={18} color="var(--accent)" />
          }
        </div>
        <div>
          <h2 className={styles.stepTitle}>Instalando MicroPython</h2>
          <p className={styles.stepSub}>No desconectes el cable USB</p>
        </div>
      </div>

      {/* Progreso */}
      <div className={styles.progressWrap}>
        <div className={styles.progressPhase}>
          {isLoading && <IconLoader size={13} color="var(--accent)" />}
          {phaseLabel(flashPhase, progress)}
        </div>

        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>
            {progress
              ? `${(progress.bytesWritten / 1024).toFixed(0)} / ${(progress.totalBytes / 1024).toFixed(0)} KB`
              : flashPhase === 'erasing' ? 'Borrando...' : 'Esperando...'
            }
          </span>
          <span className={styles.progressPercent}>{percent}%</span>
        </div>

        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${flashPhase === 'erasing' ? 0 : percent}%` }}
          />
        </div>

        {speed > 0 && (
          <div className={styles.progressSpeed}>{(speed / 1024).toFixed(1)} KB/s</div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className={styles.errorBox}>
          <IconWarning size={14} color="var(--red)" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
