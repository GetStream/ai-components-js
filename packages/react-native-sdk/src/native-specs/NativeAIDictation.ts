import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type DictationStartOptions = {
  language?: string;
  interimResults?: boolean;
  silenceTimeoutMs?: number;
};

export type DictationResult = {
  text: string;
  isFinal: boolean;
};

export interface Spec extends TurboModule {
  start(options?: DictationStartOptions): void;
  stop(): void;
  cancel(): void;
  isRecording(): boolean;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeAIDictation');
