import { type DictationStoreState, store } from './store';
import { useStateStore } from '@stream-io/state-store/react-bindings';

const selector = ({ transcript }: DictationStoreState) => ({
  transcript,
});

export const useDictationTranscript = () => useStateStore(store, selector);
