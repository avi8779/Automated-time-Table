import React from 'react';
import styles from './FormField.module.css';

export const FormGrid = ({ children, cols = 2 }) => (
  <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
    {children}
  </div>
);

const FormField = ({
  label, id, type = 'text', value, onChange, placeholder,
  required = false, min, max, options, full = false, error,
}) => {
  return (
    <div className={`${styles.group} ${full ? styles.full : ''}`}>
      <label className={styles.label} htmlFor={id}>
        {label}{required && <span className={styles.req}>*</span>}
      </label>
      {type === 'select' ? (
        <select
          id={id}
          className={`${styles.input} ${error ? styles.hasError : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          className={`${styles.input} ${error ? styles.hasError : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
        />
      )}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
};

export default FormField;
