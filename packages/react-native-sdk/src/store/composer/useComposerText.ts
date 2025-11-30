import { type MessageComposerState } from './store';
import { useStateStore } from '@stream-io/state-store/react-bindings';
import { useMessageComposerContext } from '../../contexts';

const selector = ({ text }: MessageComposerState) => ({
  text,
});

export const useComposerText = () => {
  const { state } = useMessageComposerContext();
  return useStateStore(state, selector);
};
