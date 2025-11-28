import { useCallback, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { AIDictation } from '../native/AIDictation';
import type { DictationResult } from '../native-specs/NativeAIDictation';
import { useStableCallback } from '../internal/hooks/useStableCallback';
import { type DictationStoreState, store } from '../store/dictation/store';
import { useStateStore } from '@stream-io/state-store/react-bindings';

type StartOptions = {
  language?: string;
  interimResults?: boolean;
  silenceTimeoutMs?: number;
};

const DEFAULT_OPTIONS = {
  language: 'en-US',
  interimResults: true,
  silenceTimeoutMs: 2500,
};

const ensureAndroidRecordingPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

const selector = ({ isRecording }: DictationStoreState) => ({
  isRecording,
});

// TODO: add proper jsdocs
export const useDictation = (
  defaultOptions: StartOptions = DEFAULT_OPTIONS,
) => {
  const { isRecording } = useStateStore(store, selector);

  useEffect(() => {
    const unsubscribeResult = AIDictation.addResultListener(
      (result: DictationResult) => {
        store.partialNext({
          transcript: result.text,
          ...(result.isFinal ? { isRecording: false, state: 'idle' } : {}),
        });
      },
    );

    const unsubscribeState = AIDictation.addStateListener(({ state: next }) => {
      store.partialNext({
        state: next,
        isRecording: next === 'listening' || next === 'starting',
      });
    });

    const unsubscribeError = AIDictation.addErrorListener((error) => {
      store.partialNext({ error, isRecording: false, state: 'idle' });
    });

    return () => {
      unsubscribeResult();
      unsubscribeState();
      unsubscribeError();
    };
  }, []);

  const start = useCallback(
    async (override?: StartOptions) => {
      const hasPermission = await ensureAndroidRecordingPermissions();
      if (!hasPermission) {
        store.partialNext({
          error: {
            code: 'NO_PERMISSION',
            message: 'Microphone permission not granted',
          },
        });
        return;
      }

      store.partialNext({ error: null, transcript: '' });

      // TODO: this should be configurable from the outside
      const opts: StartOptions = {
        ...defaultOptions,
        ...override,
      };

      AIDictation.start(opts);
    },
    [defaultOptions],
  );

  const stop = useCallback(() => {
    AIDictation.stop();
  }, []);

  const cancel = useCallback(() => {
    AIDictation.cancel();
  }, []);

  const toggle = useStableCallback(() => {
    if (isRecording) {
      stop();
    } else {
      void start();
    }
  });

  return {
    start,
    stop,
    toggle,
    cancel,
  };
};
