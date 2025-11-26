import { NavigationContainer } from '@react-navigation/native';
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';

import {
  Platform,
  Pressable,
  StatusBar,
  View,
  Text,
  Alert,
} from 'react-native';
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
  ChannelPreviewMessengerProps,
  Chat,
  Copy,
  DownloadArrow,
  DownloadCloud,
  Edit,
  Flag,
  mergeThemes,
  Message,
  MessageList,
  MessageTextContainer,
  OverlayProvider,
  ThemeProvider,
  useChannelsContext,
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
import {
  ChannelSort,
  LocalMessage,
  Channel as ChannelClass,
} from 'stream-chat';
import { startAI } from './http/requests.ts';
import {
  MarkdownRichText,
  AIMessageComposer,
  AIMessageComposerProps,
} from '@stream-io/ai-components-react-native';

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
              enableOfflineSupport={false}
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

const ChannelPreview = (props: ChannelPreviewMessengerProps) => {
  const channel = props.channel;
  const { onSelect } = useChannelsContext();
  const onPress = useStableCallback(() => {
    onSelect?.(channel);
  });
  return (
    <Pressable
      style={({ pressed }) => ({
        paddingVertical: 8,
        paddingHorizontal: 12,
        opacity: pressed ? 0.6 : 1,
      })}
      onPress={onPress}
    >
      <Text style={{ fontSize: 15, fontWeight: 'bold' }} numberOfLines={1}>
        {channel.data?.name ?? channel.cid}
      </Text>
    </Pressable>
  );
};

const MenuDrawer = ({ navigation }: DrawerContentComponentProps) => {
  const { setChannel } = useAppContext();
  const onSelect = useStableCallback((channel: ChannelClass) => {
    setChannel(channel);
    navigation.closeDrawer();
  });
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          marginHorizontal: 12,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: 'grey',
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: 'bold' }}>Conversations</Text>
      </View>
      <ChannelList
        filters={filters}
        sort={sort}
        onSelect={onSelect}
        Preview={ChannelPreview}
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
    <Drawer.Screen name="Chat" component={AppContent} />
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
          // TODO: Think of a better way to do this than this hack. It's garbage.
          if (
            channel.state.messages &&
            channel.state.messages.length === 1 &&
            channel.id
          ) {
            await channel.watch({
              created_by_id: messageData.user_id,
            });
            await startAI(channel.id);
          }
          return await channel?.sendMessage(messageData);
        }}
        StreamingMessageView={StreamingMessageView}
        Message={CustomMessage}
        // MessageText={MessageText}
        MessageAvatar={() => null}
        MessageFooter={() => null}
        enableSwipeToReply={false}
        EmptyStateIndicator={EmptyStateIndicator}
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
        <MessageComposerAI
          key={channel.cid}
          bottomSheetInsets={insets}
          bottomSheetOptions={bottomSheetOptions}
        />
      </Channel>
    </View>
  );
}

const bottomSheetOptions = [
  {
    title: 'Create Image',
    subtitle: 'Visualize anything',
    action: () => Alert.alert('Pressed on Create Image !'),
    Icon: DownloadArrow,
  },
  {
    title: 'Thinking',
    subtitle: 'Think longer for better answers',
    action: () => Alert.alert('Pressed on Thinking !'),
    Icon: Flag,
  },
  {
    title: 'Deep research',
    subtitle: 'Get a detailed report',
    action: () => Alert.alert('Pressed on Deep research !'),
    Icon: DownloadCloud,
  },
  {
    title: 'Web search',
    subtitle: 'Find real-time news and info',
    action: () => Alert.alert('Pressed on Web search !'),
    Icon: Copy,
  },
  {
    title: 'Study and learn',
    subtitle: 'Learn a new concept',
    action: () => Alert.alert('Pressed on Study and learn !'),
    Icon: Edit,
  },
];

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

const EmptyStateIndicator = () => (
  <View
    style={{
      flex: 1,
      backgroundColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
      What can I help with ?
    </Text>
  </View>
);

export default App;
