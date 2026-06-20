
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CharacterPreview } from './components/CharacterPreview';
import './types'; // Ensure types are loaded

const reloadOnAssetFailure = async () => {
  const recoveryKey = 'hj_asset_recovery_once';
  if (sessionStorage.getItem(recoveryKey) === '1') return;
  sessionStorage.setItem(recoveryKey, '1');

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } finally {
    window.location.reload();
  }
};

window.addEventListener('error', (event) => {
  const msg = String(event?.message || '').toLowerCase();
  if (msg.includes('loading chunk') || msg.includes('module script') || msg.includes('failed to fetch')) {
    reloadOnAssetFailure();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = String((event as PromiseRejectionEvent).reason || '').toLowerCase();
  if (reason.includes('loading chunk') || reason.includes('failed to fetch dynamically imported module') || reason.includes('module script')) {
    reloadOnAssetFailure();
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// --- Reliability-first mode: remove old service workers and avoid stale cache traps ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => undefined);

    if ('caches' in window) {
      caches.keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .catch(() => undefined);
    }
  });
}

const root = ReactDOM.createRoot(rootElement);
const isCharPreview = new URLSearchParams(window.location.search).has('charpreview');
root.render(
  <React.StrictMode>
      <ErrorBoundary label="root">
        {isCharPreview ? <CharacterPreview /> : <App />}
      </ErrorBoundary>
  </React.StrictMode>
);
