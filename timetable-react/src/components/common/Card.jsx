import React from 'react';
import styles from './Card.module.css';

export const Card = ({ children, className = '' }) => (
  <div className={`${styles.card} ${className}`}>{children}</div>
);

export const CardHeader = ({ title, subtitle, action }) => (
  <div className={styles.header}>
    <div>
      <h3 className={styles.title}>{title}</h3>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
    {action && <div className={styles.action}>{action}</div>}
  </div>
);

export const CardBody = ({ children, noPad = false }) => (
  <div className={noPad ? '' : styles.body}>{children}</div>
);

export const StatCard = ({ icon, value, label, color = 'blue' }) => (
  <div className={`${styles.statCard} ${styles[`stat_${color}`]}`}>
    <div className={styles.statBar} />
    <span className={styles.statIcon}>{icon}</span>
    <div className={styles.statValue}>{value ?? '—'}</div>
    <div className={styles.statLabel}>{label}</div>
  </div>
);
