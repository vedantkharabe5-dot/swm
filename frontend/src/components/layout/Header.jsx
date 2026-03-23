'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import styles from './Header.module.css';

export default function Header({ title, subtitle }) {
  const [alerts, setAlerts] = useState(0);
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true
      }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);

    // Fetch active alert count
    api.getAlertStats()
      .then(data => setAlerts(data?.active || 0))
      .catch(() => {});

    return () => clearInterval(timer);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.titleSection}>
        {title && <h1 className={styles.title}>{title}</h1>}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      <div className={styles.actions}>
        <div className={styles.timeDisplay}>
          <span className={styles.liveDot} />
          <span>{time}</span>
        </div>
        <div className={styles.alertBadge}>
          🔔
          {alerts > 0 && <span className={styles.alertCount}>{alerts}</span>}
        </div>
      </div>
    </header>
  );
}
