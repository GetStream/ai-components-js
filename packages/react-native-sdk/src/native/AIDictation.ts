import { NativeEventEmitter, NativeModules } from 'react-native';
import NativeAIDictation, {
  type DictationResult,
  type DictationStartOptions,
} from '../native-specs/NativeAIDictation';

console.log(
  'NATIVEAIDICTATAION',
  NativeAIDictation,
  NativeModules.DictationEventEmitter,
);

const emitter = new NativeEventEmitter(
  NativeModules.DictationEventEmitter ?? NativeAIDictation,
);

export type DictationState = 'idle' | 'starting' | 'listening' | 'stopping';

export type DictationError = {
  code: string;
  message: string;
};

// Low-level API
export const AIDictation = {
  start(options?: DictationStartOptions) {
    NativeAIDictation.start(options);
  },
  stop() {
    NativeAIDictation.stop();
  },
  cancel() {
    NativeAIDictation.cancel();
  },
  isRecording() {
    return NativeAIDictation.isRecording();
  },
  addResultListener(listener: (result: DictationResult) => void) {
    const sub = emitter.addListener('AIDictationResult', listener);
    return () => sub.remove();
  },
  addStateListener(listener: (payload: { state: DictationState }) => void) {
    const sub = emitter.addListener('AIDictationState', listener);
    return () => sub.remove();
  },
  addErrorListener(listener: (payload: DictationError) => void) {
    const sub = emitter.addListener('AIDictationError', listener);
    return () => sub.remove();
  },
};
