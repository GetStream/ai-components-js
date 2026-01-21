import { useEffect, useRef } from 'react';
import {
  StreamingMessage,
  type StreamingMessageRef,
} from '@stream-io/chat-react-ai';
import {
  Attachment,
  MessageErrorIcon,
  useChatContext,
  useMessageContext,
} from 'stream-chat-react';
import clsx from 'clsx';

export const MessageBubble = () => {
  const { message, isMyMessage, highlighted, handleAction } =
    useMessageContext();
  const { channel } = useChatContext();
  const ref = useRef<StreamingMessageRef | null>(null);

  useEffect(() => {
    if (!channel) return;

    const aiIndicatorStopListener = channel.on('ai_indicator.stop', () => {
      ref.current?.skipAnimation();
    });

    return () => {
      aiIndicatorStopListener.unsubscribe();
    };
  }, [channel]);

  const attachments = message?.attachments || [];
  const hasAttachments = attachments.length > 0;

  const rootClassName = clsx(
    'str-chat__message str-chat__message-simple',
    `str-chat__message--${message.type}`,
    `str-chat__message--${message.status}`,
    {
      'str-chat__message--me': isMyMessage(),
      'str-chat__message--other': !isMyMessage(),
      'str-chat__message--has-attachment': hasAttachments,
      'str-chat__message--highlighted': highlighted,
      'str-chat__message-send-can-be-retried':
        message?.status === 'failed' && message?.error?.status !== 403,
    },
  );

  return (
    <div className={rootClassName}>
      <div className="str-chat__message-inner" data-testid="message-inner">
        <div className="str-chat__message-bubble">
          {hasAttachments && (
            <Attachment
              actionHandler={handleAction}
              attachments={attachments}
            />
          )}
          {message?.text && <StreamingMessage ref={ref} text={message.text} />}
          <MessageErrorIcon />
        </div>
      </div>
    </div>
  );
};
