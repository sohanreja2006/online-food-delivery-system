import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Gracefully suppress unhandled offline network errors (e.g. ERR_INTERNET_DISCONNECTED)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason || '');
    if (
      msg.includes('Failed to fetch') ||
      msg.includes('ERR_INTERNET_DISCONNECTED') ||
      msg.includes('NetworkError') ||
      msg.includes('Load failed')
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

