import { useEffect, useState } from 'react';
import { getApiHealth } from '../services/api.js';

/** Comprueba la API al montar la pantalla y cancela la petición al desmontarla. */
export function useApiHealth() {
  const [health, setHealth] = useState({ status: 'checking', detail: 'Esperando respuesta de la API' });

  useEffect(() => {
    const controller = new AbortController();

    getApiHealth({ signal: controller.signal })
      .then((payload) => setHealth({ status: 'online', detail: payload.message }))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setHealth({ status: 'offline', detail: 'Inicia el backend en el puerto 3000' });
        }
      });

    return () => controller.abort();
  }, []);

  return health;
}
