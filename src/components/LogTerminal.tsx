import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../lib/esptool';

interface LogTerminalProps {
  logs: LogEntry[];
}

export function LogTerminal({ logs }: LogTerminalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div className="log-terminal" ref={ref}>
      {logs.map((log, i) => (
        <span key={i} className={`log-line ${log.level}`}>
          <span style={{ color: 'var(--text-muted)', userSelect: 'none' }}>
            {new Date(log.timestamp).toISOString().split('T')[1].split('.')[0]}{' '}
          </span>
          {log.message}
          {'\n'}
        </span>
      ))}
    </div>
  );
}
