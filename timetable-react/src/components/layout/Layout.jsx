import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import styles from './Layout.module.css';

const Layout = () => {
  return (
    <div className={styles.app}>
      <div className={styles.bg} />
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#181928',
            color: '#e8eaf6',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '10px',
            fontFamily: 'Nunito, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
          },
          success: { iconTheme: { primary: '#68d391', secondary: '#07080f' } },
          error: { iconTheme: { primary: '#fc8181', secondary: '#07080f' } },
        }}
      />
    </div>
  );
};

export default Layout;
