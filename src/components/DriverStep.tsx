import React from 'react';
import { DRIVER_URLS } from '../lib/esptool';
import { IconDownload, IconWindows, IconApple, IconLinux, IconWarning } from './Icons';
import styles from './Steps.module.css';

export function DriverStep({ onContinue }: { onContinue: () => void }) {
  const drivers = [
    { label: 'Windows', icon: <IconWindows size={16} />, url: DRIVER_URLS.windows, note: 'Windows 7 / 8 / 10 / 11' },
    { label: 'macOS', icon: <IconApple size={16} />, url: DRIVER_URLS.mac, note: 'macOS VCP Driver' },
    { label: 'Linux', icon: <IconLinux size={16} />, url: DRIVER_URLS.linux, note: 'Source for Linux 3.x / 4.x' },
  ];

  return (
    <div className={styles.step}>
      <div className={styles.stepHeader}>
        <div className={styles.stepIcon}>
          <IconWarning size={18} color="var(--amber)" />
        </div>
        <div>
          <h2 className={styles.stepTitle}>CP210x Driver</h2>
          <p className={styles.stepSub}>USB-to-Serial bridge required for most ESP32 boards</p>
        </div>
      </div>

      <div className={styles.infoBox}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Most ESP32 boards use a <strong style={{ color: 'var(--text-primary)' }}>Silicon Labs CP210x</strong> chip for USB communication. Install the driver for your OS so the board shows up as a serial port.
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          Already see a COM port (Windows) or /dev/ttyUSB (Linux)? Skip this step.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Download Driver</div>
        <div className={styles.driverGrid}>
          {drivers.map(d => (
            <a key={d.label} href={d.url} target="_blank" rel="noopener noreferrer" className={styles.driverCard}>
              <span className={styles.driverIcon}>{d.icon}</span>
              <div>
                <div className={styles.driverLabel}>{d.label}</div>
                <div className={styles.driverNote}>{d.note}</div>
              </div>
              <IconDownload size={14} color="var(--text-muted)" className={styles.driverArrow} />
            </a>
          ))}
        </div>
      </div>

      <button className={styles.btnPrimary} onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}
