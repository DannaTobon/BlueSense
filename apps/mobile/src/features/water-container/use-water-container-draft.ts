import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '@/features/auth/auth-session';
import {
  fetchWaterContainer,
  saveWaterContainer,
  type WaterContainerResult,
} from '@/services/api-client';
import { readApiConfig } from '@/services/api-config';
import type { WaterContainerDraft, WaterContainerInput } from '@/types/water-container';

export type WaterContainerLoadState =
  | { status: 'loading' }
  | { status: 'ready'; draft: WaterContainerDraft | null }
  | { status: 'error'; message: string };

export type WaterContainerSaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

interface DraftRequestOptions {
  baseUrl: string;
  token: string;
  signal?: AbortSignal;
}

interface SaveDraftRequestOptions extends DraftRequestOptions {
  input: WaterContainerInput;
}

export interface WaterContainerDraftDependencies {
  readConfig: typeof readApiConfig;
  fetchDraft: (options: DraftRequestOptions) => Promise<WaterContainerResult>;
  saveDraft: (options: SaveDraftRequestOptions) => Promise<WaterContainerResult>;
}

const DEFAULT_DEPENDENCIES: WaterContainerDraftDependencies = {
  readConfig: readApiConfig,
  fetchDraft: fetchWaterContainer,
  saveDraft: saveWaterContainer,
};

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

function loadErrorMessage(result: Exclude<WaterContainerResult, { status: 'success' }>): string {
  switch (result.status) {
    case 'unauthorized':
      return 'La API rechazó la sesión. Vuelve a iniciar sesión e inténtalo de nuevo.';
    case 'network-error':
      return 'No se pudo contactar con la API. Revisa la conexión y vuelve a intentarlo.';
    case 'server-error':
      return `La API no pudo cargar la configuración (HTTP ${result.httpStatus}).`;
    case 'invalid-response':
      return 'La API devolvió una configuración inesperada.';
    case 'invalid-config':
      return 'La API rechazó la solicitud de consulta.';
    case 'not-found':
      return '';
  }
}

function saveErrorMessage(result: Exclude<WaterContainerResult, { status: 'success' }>): string {
  switch (result.status) {
    case 'unauthorized':
      return 'La API rechazó la sesión. Los datos siguen en el formulario.';
    case 'network-error':
      return 'No se pudo guardar por un problema de conexión. Los datos siguen en el formulario.';
    case 'server-error':
      return `No se pudo guardar la configuración (HTTP ${result.httpStatus}). Los datos siguen en el formulario.`;
    case 'invalid-response':
      return 'La API devolvió una respuesta inesperada. Comprueba la configuración antes de reintentar.';
    case 'invalid-config':
      return 'La API rechazó la configuración. Revisa las medidas e inténtalo de nuevo.';
    case 'not-found':
      return 'La API no confirmó el guardado. Los datos siguen en el formulario.';
  }
}

export function useWaterContainerDraft(
  dependencies: WaterContainerDraftDependencies = DEFAULT_DEPENDENCIES,
) {
  const { getIdToken, getSessionVersion } = useAuthSession();
  const [loadState, setLoadState] = useState<WaterContainerLoadState>({ status: 'loading' });
  const [saveState, setSaveState] = useState<WaterContainerSaveState>({ status: 'idle' });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const load = useCallback(async () => {
    const config = dependencies.readConfig();

    if (!config.ok) {
      setLoadState({ status: 'error', message: config.message });
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const sessionVersion = getSessionVersion();
    setLoadState({ status: 'loading' });
    setSaveState({ status: 'idle' });

    try {
      const token = await getIdToken();
      const result = await dependencies.fetchDraft({
        baseUrl: config.baseUrl,
        token,
        signal: controller.signal,
      });

      if (controller.signal.aborted || getSessionVersion() !== sessionVersion) {
        return;
      }

      if (result.status === 'success') {
        setLoadState({ status: 'ready', draft: result.draft });
        return;
      }

      if (result.status === 'not-found') {
        setLoadState({ status: 'ready', draft: null });
        return;
      }

      setLoadState({ status: 'error', message: loadErrorMessage(result) });
    } catch (error: unknown) {
      if (
        controller.signal.aborted ||
        getSessionVersion() !== sessionVersion ||
        isAbortError(error)
      ) {
        return;
      }

      setLoadState({
        status: 'error',
        message: 'No se pudo cargar la configuración. Revisa la conexión y vuelve a intentarlo.',
      });
    }
  }, [dependencies, getIdToken, getSessionVersion]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(
    async (input: WaterContainerInput) => {
      const config = dependencies.readConfig();

      if (!config.ok) {
        setSaveState({ status: 'error', message: config.message });
        return;
      }

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const sessionVersion = getSessionVersion();
      setSaveState({ status: 'saving' });

      try {
        const token = await getIdToken();
        const result = await dependencies.saveDraft({
          baseUrl: config.baseUrl,
          token,
          input,
          signal: controller.signal,
        });

        if (controller.signal.aborted || getSessionVersion() !== sessionVersion) {
          return;
        }

        if (result.status === 'success') {
          setLoadState({ status: 'ready', draft: result.draft });
          setSaveState({
            status: 'success',
            message:
              'Configuración guardada como borrador. El monitoreo comenzará cuando vincules tu BlueSense.',
          });
          return;
        }

        setSaveState({ status: 'error', message: saveErrorMessage(result) });
      } catch (error: unknown) {
        if (
          controller.signal.aborted ||
          getSessionVersion() !== sessionVersion ||
          isAbortError(error)
        ) {
          return;
        }

        setSaveState({
          status: 'error',
          message: 'No se pudo guardar. Los datos siguen en el formulario.',
        });
      }
    },
    [dependencies, getIdToken, getSessionVersion],
  );

  const clearSaveFeedback = useCallback(() => {
    setSaveState((current) => (current.status === 'saving' ? current : { status: 'idle' }));
  }, []);

  return { loadState, saveState, retry: load, save, clearSaveFeedback };
}
