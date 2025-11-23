import { NavigationContainer } from '@react-navigation/native';
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';

import { Platform, StatusBar, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useMemo } from 'react';
import {
  AITypingIndicatorView,
  Channel,
  ChannelList,
  Chat,
  mergeThemes,
  Message,
  MessageList,
  MessageTextContainer,
  OverlayProvider,
  ThemeProvider,
  useCreateChatClient,
  useMessageComposer,
  useMessageContext,
  useMessageInputContext,
  useStableCallback,
  useTheme,
} from 'stream-chat-react-native';
import { AppProvider, useAppContext } from './contexts/AppContext.tsx';
import {
  chatApiKey,
  chatUserId,
  chatUserName,
  chatUserToken,
} from './chatConfig.ts';
import { ChannelSort, LocalMessage } from 'stream-chat';
import { startAI } from './http/requests.ts';
import {
  MarkdownRichText,
  AIMessageComposer,
  AIMessageComposerProps,
} from '@stream-io/ai-components-react-native';
import { createAnimatedComponent } from 'react-native-reanimated';

const Drawer = createDrawerNavigator();

const chatTheme = {};

const isMessageAIGenerated = (message: LocalMessage) => !!message.ai_generated;

function App() {
  const chatClient = useCreateChatClient({
    apiKey: chatApiKey,
    tokenOrProvider: chatUserToken,
    userData: { id: chatUserId, name: chatUserName },
  });

  if (!chatClient) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppProvider client={chatClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <OverlayProvider value={{ style: chatTheme }}>
            <Chat
              client={chatClient}
              isMessageAIGenerated={isMessageAIGenerated}
              enableOfflineSupport={true}
            >
              <NavigationContainer>
                <DrawerNavigator />
              </NavigationContainer>
            </Chat>
          </OverlayProvider>
        </GestureHandlerRootView>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const filters = {
  members: {
    $in: [chatUserId],
  },
};

const sort: ChannelSort = { last_updated: -1 };

const MenuDrawer = ({ navigation }: DrawerContentComponentProps) => {
  const { setChannel } = useAppContext();
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ChannelList
        filters={filters}
        sort={sort}
        onSelect={(channel) => {
          setChannel(channel);
          navigation.closeDrawer();
        }}
      />
    </SafeAreaView>
  );
};

const DrawerNavigator = () => (
  <Drawer.Navigator
    drawerContent={MenuDrawer}
    screenOptions={{
      drawerStyle: {
        width: 300,
      },
    }}
  >
    <Drawer.Screen name="Home" component={AppContent} />
  </Drawer.Navigator>
);

function AppContent() {
  const { channel } = useAppContext();
  const { bottom } = useSafeAreaInsets();

  const safeAreaInsets = useSafeAreaInsets();
  const insets = useMemo(
    () => ({
      ...safeAreaInsets,
      bottom:
        safeAreaInsets.bottom +
        (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) * 2 : 0),
    }),
    [safeAreaInsets],
  );

  if (!channel) {
    return null;
  }

  return (
    <View style={{ flex: 1, paddingBottom: bottom, backgroundColor: 'white' }}>
      <Channel
        channel={channel}
        doSendMessageRequest={async (_, messageData) => {
          await channel.watch({
            created_by_id: messageData.user_id,
          });
          await startAI(channel.id);
          return await channel?.sendMessage(messageData);
        }}
        StreamingMessageView={StreamingMessageView}
        Message={CustomMessage}
        // MessageText={MessageText}
        MessageAvatar={() => null}
        MessageFooter={() => null}
        // enableSwipeToReply={false}
      >
        <MessageList
          additionalFlatListProps={{
            maintainVisibleContentPosition: {
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 0,
            },
          }}
        />
        <AITypingIndicatorView />
        {/*<MessageInput />*/}
        <MessageComposerAI bottomSheetInsets={insets} bottomSheetOptions={[]} />
      </Channel>
    </View>
  );
}

const CustomMessage = (props) => {
  const { theme } = useTheme();
  const isFromBot = props.message.ai_generated;

  const modifiedTheme = useMemo(() => {
    if (!isFromBot) {
      return theme;
    }

    return mergeThemes({
      theme,
      style: {
        messageSimple: {
          content: {
            containerInner: {
              backgroundColor: 'transparent',
              borderRadius: 0,
              borderColor: 'transparent',
            },
            textContainer: { maxWidth: '100%' },
          },
        },
      },
    });
  }, [theme, isFromBot]);
  return (
    <ThemeProvider mergedStyle={modifiedTheme}>
      <Message {...props} />
    </ThemeProvider>
  );
};

const StreamingMessageView = (props) => {
  const { message } = useMessageContext();
  return (
    <View style={{ width: '100%', paddingHorizontal: 16 }}>
      <MarkdownRichText text={message.text ?? ''} />
    </View>
  );
};

const MessageComposerAI = (props: AIMessageComposerProps) => {
  const messageComposer = useMessageComposer();
  const { sendMessage } = useMessageInputContext();

  const serializeToMessage = useStableCallback(
    async ({ text, attachments }: { text: string; attachments?: any[] }) => {
      messageComposer.textComposer.setText(text);
      console.log('TEST: ', attachments);
      if (attachments && attachments.length > 0) {
        const localAttachments = await Promise.all(
          attachments.map((a) =>
            messageComposer.attachmentManager.fileToLocalUploadAttachment(a),
          ),
        );
        messageComposer.attachmentManager.upsertAttachments(localAttachments);
        // console.log(
        //   'TEST2: ',
        //   localAttachments,
        //   messageComposer.attachmentManager.attachments,
        // );
      }

      await sendMessage();
    },
  );

  return <AIMessageComposer {...props} onSendMessage={serializeToMessage} />;
};

export default App;
