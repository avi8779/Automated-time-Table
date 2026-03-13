import React, { useState } from 'react';
import styles from './Table.module.css';

export const Badge = ({ children, variant = 'default' }) => (
  <span className={`${styles.badge} ${styles[`badge_${variant}`]}`}>{children}</span>
);

export const EmptyState = ({ icon = '📭', title, description }) => (
  <div className={styles.emptyState}>
    <div className={styles.emptyIcon}>{icon}</div>
    <h3 className={styles.emptyTitle}>{title}</h3>
    {description && <p className={styles.emptyDesc}>{description}</p>}
  </div>
);

export const Spinner = ({ center = false }) => (
  <div className={`${styles.spinnerWrap} ${center ? styles.spinnerCenter : ''}`}>
    <div className={styles.spinner} />
  </div>
);

const Table = ({ columns, data, loading, emptyIcon, emptyTitle, emptyDesc, searchable = true }) => {
  const [query, setQuery] = useState('');

  const filtered = searchable && query
    ? data.filter((row) =>
        Object.values(row).some((v) =>
          String(v || '').toLowerCase().includes(query.toLowerCase())
        )
      )
    : data;

  return (
    <div className={styles.wrapper}>
      {searchable && (
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button className={styles.clearBtn} onClick={() => setQuery('')}>✕</button>
            )}
          </div>
          <span className={styles.count}>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={styles.th} style={col.width ? { width: col.width } : {}}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className={styles.loadingCell}>
                  <Spinner center />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  <EmptyState
                    icon={emptyIcon || '📭'}
                    title={emptyTitle || 'No records found'}
                    description={emptyDesc}
                  />
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr key={row.id || i} className={styles.tr}>
                  {columns.map((col) => (
                    <td key={col.key} className={styles.td}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
