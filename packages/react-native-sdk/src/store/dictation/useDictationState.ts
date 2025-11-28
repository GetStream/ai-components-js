import { type DictationStoreState, store } from './store';
import { useStateStore } from '@stream-io/state-store/react-bindings';

const selector = ({ state, isRecording, error }: DictationStoreState) => ({
  state,
  isRecording,
  error,
});

export const useDictationState = () => useStateStore(store, selector);
