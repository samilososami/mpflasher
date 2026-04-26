import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { DRIVER_URLS } from '../lib/esptool';
import { IconUsb, IconLoader, IconWarning, IconWindows, IconApple, IconLinux, IconDownload, IconX } from './Icons';
import styles from './Steps.module.css';

interface ConnectStepProps {
  onConnect: () => void;
  isLoading: boolean;
  portNotFound: boolean;
  error: string | null;
}

const DRIVERS = [
  { label: 'Windows', icon: <IconWindows size={15} />, url: DRIVER_URLS.windows, note: 'Windows 7 / 8 / 10 / 11' },
  { label: 'macOS',   icon: <IconApple size={15} />,   url: DRIVER_URLS.mac,     note: 'macOS VCP Driver' },
  { label: 'Linux',   icon: <IconLinux size={15} />,   url: DRIVER_URLS.linux,   note: 'Linux 3.x / 4.x' },
];

export function ConnectStep({ onConnect, isLoading, portNotFound, error }: ConnectStepProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className={styles.step}>
      {/* Header */}
      <div className={styles.stepHeader}>
        <div className={styles.stepIconWrap}>
          <IconUsb size={18} color="var(--accent)" />
        </div>
        <div>
          <h2 className={styles.stepTitle}>Conectar placa</h2>
          <p className={styles.stepSub}>Conecta la ESP32 STEAMakers por USB</p>
        </div>
      </div>

      {/* Info */}
      <div className={styles.infoBox}>
        <div className={styles.infoBoxDot} />
        <div>
          <div className={styles.infoBoxTitle}>Sin botón BOOT necesario</div>
          <p className={styles.infoBoxText}>
            La STEAMakers entra en modo bootloader automáticamente. Solo conecta y pulsa <strong>Conectar</strong> — el proceso completo es automático.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.errorBox}>
          <IconWarning size={14} color="var(--red)" />
          <span>{error}</span>
        </div>
      )}

      {/* Botón principal */}
      <button className={styles.btnPrimary} onClick={onConnect} disabled={isLoading}>
        {isLoading
          ? <><IconLoader size={15} color="#fff" /> Detectando placa...</>
          : <><IconUsb size={15} color="#fff" /> Conectar</>
        }
      </button>

      {/* Ayuda si no aparece el puerto */}
      {portNotFound && !isLoading && (
        <div className={styles.noPortWrap}>
          <button className={styles.btnNoPort} onClick={() => setShowModal(true)}>
            ¿No aparece el dispositivo?
          </button>
        </div>
      )}

      {/* Modal driver CP210x — renderizado con portal para escapar overflow */}
      {showModal && ReactDOM.createPortal(
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle}>Driver CP210x requerido</div>
                <div className={styles.modalSub}>La placa no aparece sin este driver instalado</div>
              </div>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>
                <IconX size={16} color="currentColor" />
              </button>
            </div>

            <p className={styles.modalText}>
              La ESP32 STEAMakers usa el chip <strong>Silicon Labs CP210x</strong> para la comunicación USB.
              Si no aparece ningún puerto al conectar, instala el driver de tu sistema operativo:
            </p>

            <div className={styles.driverGrid}>
              {DRIVERS.map(d => (
                <a
                  key={d.label}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.driverCard}
                >
                  <span className={styles.driverIcon}>{d.icon}</span>
                  <div>
                    <div className={styles.driverLabel}>{d.label}</div>
                    <div className={styles.driverNote}>{d.note}</div>
                  </div>
                  <IconDownload size={13} color="var(--text-muted)" />
                </a>
              ))}
            </div>

            <p className={styles.modalHint}>
              Tras instalar el driver, desconecta y vuelve a conectar la placa. Luego cierra esta ventana y pulsa <strong>Conectar</strong> de nuevo.
            </p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
