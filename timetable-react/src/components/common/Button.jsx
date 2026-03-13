import React from 'react';
import styles from './Button.module.css';

const Button = ({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, onClick, type = 'button', icon,
}) => {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${loading ? styles.loading : ''}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <span className={styles.spinner} />
      ) : (
        icon && <span className={styles.icon}>{icon}</span>
      )}
      {children}
    </button>
  );
};

export default Button;
