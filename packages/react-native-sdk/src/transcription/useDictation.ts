import { useCallback, useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { AIDictation } from '../native/AIDictation';
import type { DictationError, DictationState } from '../native/AIDictation';
import type { DictationResult } from '../native-specs/NativeAIDictation';

type StartOptions = {
  language?: string;
  interimResults?: boolean;
  silenceTimeoutMs?: number;
};

// TODO: a generic utility can be created for ensuring permissions
async function ensureAndroidPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

// TODO: add proper jsdocs
export const useDictation = (defaultOptions?: StartOptions) => {
  const [state, setState] = useState<DictationState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<DictationError | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const unsubscribeResult = AIDictation.addResultListener(
      (result: DictationResult) => {
        setTranscript(result.text);
        if (result.isFinal) {
          setIsRecording(false);
          setState('idle');
        }
      },
    );

    const unsubscribeState = AIDictation.addStateListener(({ state: next }) => {
      setState(next);
      setIsRecording(next === 'listening' || next === 'starting');
    });

    const unsubscribeError = AIDictation.addErrorListener((err) => {
      setError(err);
      setIsRecording(false);
      setState('idle');
    });

    return () => {
      unsubscribeResult();
      unsubscribeState();
      unsubscribeError();
    };
  }, []);

  const start = useCallback(
    async (override?: StartOptions) => {
      const hasPerm = await ensureAndroidPermission();
      if (!hasPerm) {
        setError({
          code: 'NO_PERMISSION',
          message: 'Microphone permission not granted',
        });
        return;
      }

      setError(null);
      setTranscript('');

      // TODO: this should be configurable from the outside
      const opts: StartOptions = {
        interimResults: true,
        silenceTimeoutMs: 2500,
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

  return {
    state,
    transcript,
    error,
    isRecording,
    start,
    stop,
    cancel,
  };
};
