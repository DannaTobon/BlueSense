import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '@/features/auth/auth-session';
import { fetchCurrentIdentity, type ApiIdentity } from '@/services/api-client';
import { readApiConfig } from '@/services/api-config';

export type ApiCheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'success'; identity: ApiIdentity }
  | {
      status: 'error';
      reason: 'unauthorized' | 'network' | 'server' | 'invalid-response' | 'configuration';
      message: string;
      httpStatus?: number;
    };

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

export function useApiIdentityCheck() {
  const { getIdToken, getSessionVersion } = useAuthSession();
  const [state, setState] = useState<ApiCheckState>({ status: 'idle' });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const check = useCallback(async () => {
    const config = readApiConfig();

    if (!config.ok) {
      setState({ status: 'error', reason: 'configuration', message: config.message });
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const sessionVersion = getSessionVersion();
    setState({ status: 'checking' });

    try {
      const token = await getIdToken();
      const result = await fetchCurrentIdentity({
        baseUrl: config.baseUrl,
        token,
        signal: controller.signal,
      });

      if (controller.signal.aborted || getSessionVersion() !== sessionVersion) {
        return;
      }

      switch (result.status) {
        case 'success':
          setState({ status: 'success', identity: result.identity });
          return;
        case 'unauthorized':
          setState({
            status: 'error',
            reason: 'unauthorized',
            message:
              'La API rechazó el token (HTTP 401). La sesión de Firebase sigue activa en la app.',
          });
          return;
        case 'network-error':
          setState({
            status: 'error',
            reason: 'network',
            message:
              'No se pudo contactar con la API. La sesión de Firebase sigue activa; revisa la URL y que el servidor esté disponible.',
          });
          return;
        case 'server-error':
          setState({
            status: 'error',
            reason: 'server',
            message: `La API respondió con un error (HTTP ${result.httpStatus}). La sesión de Firebase sigue activa.`,
            httpStatus: result.httpStatus,
          });
          return;
        case 'invalid-response':
          setState({
            status: 'error',
            reason: 'invalid-response',
            message: 'La API devolvió una respuesta inesperada.',
          });
          return;
      }
    } catch (error: unknown) {
      if (
        controller.signal.aborted ||
        getSessionVersion() !== sessionVersion ||
        isAbortError(error)
      ) {
        return;
      }

      setState({
        status: 'error',
        reason: 'network',
        message:
          'No se pudo completar la comprobación. La sesión de Firebase sigue activa; revisa la conexión e inténtalo de nuevo.',
      });
    }
  }, [getIdToken, getSessionVersion]);

  return { state, check };
}
