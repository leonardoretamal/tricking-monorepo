'use client';

import { useEffect } from 'react';

// Registra el service worker solo en produccion. En desarrollo no hace nada para no
// interferir con el hot reload. La limpieza quita el listener de load por si el
// componente se desmonta antes de que la pagina termine de cargar.
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    if (!('serviceWorker' in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // El registro es best-effort: si falla, la app sigue funcionando sin PWA.
      });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }

    return () => {
      window.removeEventListener('load', register);
    };
  }, []);

  return null;
}
