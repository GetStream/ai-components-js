import { type MessageComposerState } from './store';
import { useStateStore } from '@stream-io/state-store/react-bindings';
import { useMessageComposerContext } from '../../contexts';

const selector = ({ text }: MessageComposerState) => ({
  hasText: !!text && text.length > 0,
});

export const useComposerHasText = () => {
  const { state } = useMessageComposerContext();
  return useStateStore(state, selector);
};
