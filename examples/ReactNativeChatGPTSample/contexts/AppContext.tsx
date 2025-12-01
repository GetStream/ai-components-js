import React, { PropsWithChildren, useMemo, useState } from 'react';
import { Channel, StreamChat } from 'stream-chat';
import { chatUserId } from '../chatConfig.ts';

export type AppContextValue = {
  channel: Channel | undefined;
  setChannel: (channel: Channel) => void;
};

export const AppContext = React.createContext<AppContextValue>({
  setChannel: () => {},
  channel: undefined,
});

// Same alphabet nanoid uses (URL-safe)
const ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-';

/**
 * Pseudo-random nanoid clone.
 * Default length = 21 (same as nanoid)
 *
 * NOT cryptographically secure — perfect for client-side IDs.
 */
export function nanoid(size: number = 21): string {
  let id = '';
  for (let i = 0; i < size; i++) {
    const r = Math.floor(Math.random() * ALPHABET.length);
    id += ALPHABET[r];
  }
  return id;
}

export const AppProvider = ({
  client,
  children,
}: PropsWithChildren<{ client: StreamChat }>) => {
  const [channel, setChannel] = useState<Channel>(() => {
    const c = client.channel('messaging', nanoid(), {
      members: [chatUserId],
    });
    return c;
  });

  const contextValue = useMemo(() => ({ channel, setChannel }), [channel]);

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

export const useAppContext = () => React.useContext(AppContext);
