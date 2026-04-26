import React from 'react';
import { IconCheck, IconLoader, IconRefresh, IconArrowLeft, IconWarning } from './Icons';
import styles from './Steps.module.css';

interface VerifyStepProps {
  isLoading: boolean;
  error: string | null;
}

export function VerifyStep({ isLoading, error }: VerifyStepProps) {
  return (
    <div className={styles.step}>
      <div className={styles.stepHeader}>
        <div className={`${styles.stepIconWrap} ${styles.stepIconGreen}`}>
          {isLoading
            ? <IconLoader size={18} color="var(--green)" />
            : <IconCheck size={18} color="var(--green)" />
          }
        </div>
        <div>
          <h2 className={styles.stepTitle}>Verificando instalación</h2>
          <p className={styles.stepSub}>Esperando respuesta de MicroPython...</p>
        </div>
      </div>

      <div className={styles.verifyWrap}>
        <IconLoader size={28} color="var(--green)" />
        <div className={styles.verifyLabel}>Comprobando REPL de MicroPython</div>
        <div className={styles.verifySub}>Esto puede tardar hasta 10 segundos</div>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <IconWarning size={14} color="var(--red)" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

interface DoneStepProps {
  chipName: string;
  redirectUrl: string | null;
  onReset: () => void;
}

function formatRedirectHost(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
  } catch {
    return url;
  }
}

function getRedirectHref(url: string): string {
  return url.startsWith('http') ? url : `https://${url}`;
}

export function DoneStep({ chipName, redirectUrl, onReset }: DoneStepProps) {
  return (
    <div className={styles.step}>
      <div className={styles.doneWrap}>
        <div className={styles.doneCircle}>
          <IconCheck size={28} color="var(--green)" />
        </div>
        <div className={styles.doneTitle}>¡MicroPython instalado!</div>
        <div className={styles.doneSub}>
          <span style={{ color: 'var(--green)' }}>{chipName}</span> está listo para programar.
        </div>
      </div>

      {redirectUrl ? (
        <>
          <a
            href={getRedirectHref(redirectUrl)}
            className={styles.btnPrimary}
            style={{ textDecoration: 'none' }}
          >
            <IconArrowLeft size={15} color="#fff" />
            Volver a {formatRedirectHost(redirectUrl)}
          </a>
          <button className={styles.btnGhost} onClick={onReset}>
            <IconRefresh size={13} color="currentColor" />
            Flashear otra placa
          </button>
        </>
      ) : (
        <button className={styles.btnSecondary} onClick={onReset}>
          <IconRefresh size={14} color="currentColor" />
          Flashear otra placa
        </button>
      )}
    </div>
  );
}
