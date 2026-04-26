import React, { useEffect, useRef } from 'react';
import { useFlasher, Step } from './hooks/useFlasher';
import { isWebSerialSupported } from './lib/esptool';
import { ConnectStep } from './components/ConnectStep';
import { FirmwareStep } from './components/FirmwareStep';
import { FlashStep } from './components/FlashStep';
import { VerifyStep, DoneStep } from './components/VerifyStep';
import { IconFlash, IconWarning, IconCheck } from './components/Icons';
import styles from './App.module.css';

function getRedirectUrl(): string | null {
  const search = window.location.search;
  const param = new URLSearchParams(search).get('redirect');
  if (param) return param;
  if (search.startsWith('?=')) return decodeURIComponent(search.slice(2));
  return null;
}

const redirectUrl = getRedirectUrl();

// Limpiar la URL sin recargar la página
if (redirectUrl && window.location.search) {
  window.history.replaceState({}, '', window.location.pathname);
}

type VisualStep = 0 | 1 | 2;

function getVisualStep(step: Step): VisualStep {
  if (step === 'connect') return 0;
  if (step === 'done') return 2;
  return 1;
}

const VISUAL_STEPS = [
  { label: 'Conectar' },
  { label: 'Instalar' },
  { label: 'Verificar' },
];

const STEP_TITLES: Record<Step, string> = {
  connect: 'Conectar dispositivo',
  firmware: 'Firmware',
  flash: 'Instalación en curso',
  verify: 'Verificando',
  done: '¡Completado!',
};

const STEP_DESCRIPTIONS: Record<Step, string> = {
  connect: 'Conecta tu placa ESP32 al ordenador mediante un cable USB y pulsa el botón para iniciar la comunicación.',
  firmware: 'Se ha detectado tu placa. Revisa los detalles del chip y el firmware que se va a instalar.',
  flash: 'El firmware se está escribiendo en la memoria flash de tu ESP32. No desconectes el cable USB.',
  verify: 'Comprobando que el firmware se ha instalado correctamente en la placa.',
  done: 'Tu ESP32 ya tiene MicroPython instalado y está lista para programar.',
};


export default function App() {
  const flasher = useFlasher();
  const supported = isWebSerialSupported();

  const consoleRef = useRef<HTMLDivElement>(null);
  const visualStep = getVisualStep(flasher.step);

  // Auto-scroll de la consola al añadir logs
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [flasher.logs]);

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <IconFlash size={18} color="var(--accent)" />
            </div>
            <div>
              <div className={styles.logoTitle}>MicroPython Flasher</div>
              <div className={styles.logoBadge}>
                <span className={styles.logoBadgeDot} />
                STEAMakers
              </div>
            </div>
          </div>

          <div className={styles.stepper}>
            {VISUAL_STEPS.map((s, i) => {
              const isActive = visualStep === i;
              const isDone = visualStep > i;
              return (
                <div key={i} className={styles.stepperRow}>
                  <div className={styles.stepperCol}>
                    <div
                      className={[
                        styles.stepperDot,
                        isActive ? styles.stepperDotActive : '',
                        isDone ? styles.stepperDotDone : '',
                      ].join(' ')}
                    >
                      {isDone ? <IconCheck size={14} color="var(--bg-base)" /> : <span className={styles.stepperNum}>{i + 1}</span>}
                    </div>
                    {i < VISUAL_STEPS.length - 1 && (
                      <div
                        className={[
                          styles.stepperLine,
                          isDone ? styles.stepperLineDone : '',
                        ].join(' ')}
                      />
                    )}
                  </div>
                  <span
                    className={[
                      styles.stepperLabel,
                      isActive ? styles.stepperLabelActive : '',
                      isDone ? styles.stepperLabelDone : '',
                    ].join(' ')}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <footer className={styles.footer}>
          <p>esptool-js · Web Serial API</p>
          <p style={{ marginTop: '4px', opacity: 0.7 }}>by Sami González Kamel</p>
        </footer>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <h1 className={styles.pageTitle}>{STEP_TITLES[flasher.step]}</h1>
            <p className={styles.pageDescription}>{STEP_DESCRIPTIONS[flasher.step]}</p>
          </div>
        </header>

        {!supported && (
          <div className={styles.warningBar}>
            <div className={styles.browserWarning}>
              <IconWarning size={15} color="var(--amber)" />
              <span>
                Web Serial requiere <strong>Chrome</strong>, <strong>Edge</strong> u <strong>Opera</strong>.
              </span>
            </div>
          </div>
        )}

        <div className={styles.contentArea}>
          <div className={styles.contentMain}>
            <div className={styles.contentWrapper}>
              {!supported ? (
                <div style={{ padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                  Abre esta página en Chrome, Edge u Opera para comenzar.
                </div>
              ) : (
                <div className={styles.stepContainer}>
                  {flasher.step === 'connect' && (
                    <ConnectStep
                      onConnect={flasher.handleConnect}
                      isLoading={flasher.isLoading}
                      portNotFound={flasher.portNotFound}
                      error={flasher.error}
                    />
                  )}

                  {flasher.step === 'firmware' && flasher.chipInfo && (
                    <FirmwareStep
                      chipInfo={flasher.chipInfo}
                      firmwareName={flasher.firmwareName}
                      firmwareReady={!!flasher.firmwareData}
                      downloadPct={flasher.downloadPct}
                      isLoading={flasher.isLoading}
                      downloadFailed={flasher.downloadFailed}
                      error={flasher.error}
                      onFileSelected={flasher.handleFileSelectedAndFlash}
                    />
                  )}

                  {flasher.step === 'flash' && (
                    <FlashStep
                      progress={flasher.progress}
                      flashPhase={flasher.flashPhase}
                      isLoading={flasher.isLoading}
                      error={flasher.error}
                    />
                  )}

                  {flasher.step === 'verify' && (
                    <VerifyStep
                      isLoading={flasher.isLoading}
                      error={flasher.error}
                    />
                  )}

                  {flasher.step === 'done' && flasher.chipInfo && (
                    <DoneStep
                      chipName={flasher.chipInfo.chipName}
                      redirectUrl={redirectUrl}
                      onReset={flasher.reset}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Console - always visible on the right */}
          <div className={styles.consolePanel}>
            <div className={styles.consolePanelHeader}>
              <span className={styles.consolePanelTitle}>Terminal</span>
            </div>
            <div className={styles.consolePanelInner} ref={consoleRef}>
              {flasher.logs.length === 0 ? (
                <span className={styles.logLineInfo}>Sin actividad aún.</span>
              ) : (
                flasher.logs.map((log, i) => (
                  <span
                    key={i}
                    className={`${styles.logLine} ${styles[`logLine${log.level.charAt(0).toUpperCase() + log.level.slice(1)}`]}`}
                  >
                    <span style={{ color: 'var(--text-dim)', userSelect: 'none' }}>
                      {new Date(log.timestamp).toISOString().split('T')[1].split('.')[0]}{' '}
                    </span>
                    {log.message}{'\n'}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
