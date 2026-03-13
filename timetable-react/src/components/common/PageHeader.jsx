import React from 'react';
import styles from './PageHeader.module.css';

const PageHeader = ({ title, subtitle, action }) => (
  <div className={styles.header}>
    <div>
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
    {action && <div className={styles.action}>{action}</div>}
  </div>
);

export default PageHeader;
