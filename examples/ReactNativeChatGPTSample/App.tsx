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
  Dimensions,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useCallback, useMemo } from 'react';
import {
  AIStates,
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
  MessageProps,
  OverlayProvider,
  useAIState,
  useChannelContext,
  useChannelsContext,
  useCreateChatClient,
  useMessageComposer,
  useMessageContext,
  useMessageInputContext,
  useStableCallback,
  useTheme,
  ThemeProvider,
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
  StreamTheme,
} from '@stream-io/ai-components-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

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
        <StreamTheme>
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
        </StreamTheme>
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

const AppContent = () => {
  const { channel } = useAppContext();
  const { bottom } = useSafeAreaInsets();

  const preSendMessageRequest = useStableCallback(async ({ localMessage }) => {
    if (!channel) {
      return;
    }

    if (!channel.initialized) {
      await channel.watch({
        created_by_id: localMessage.user_id,
      });
    }

    if (
      !Object.keys(channel.state.watchers).some((watcher) =>
        watcher.startsWith('ai-bot'),
      ) &&
      channel.id
    ) {
      await startAI(channel.id);
    }
  });

  if (!channel) {
    return null;
  }

  return (
    <Animated.View
      key={channel.id}
      style={{ flex: 1, paddingBottom: bottom, backgroundColor: '#fcfcfc' }}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
    >
      <Channel
        channel={channel}
        initializeOnMount={false}
        // @ts-expect-error This will be fixed upstream, the type is wrong
        preSendMessageRequest={preSendMessageRequest}
        StreamingMessageView={StreamingMessageView}
        Message={CustomMessage}
        enableSwipeToReply={false}
        EmptyStateIndicator={EmptyStateIndicator}
        allowSendBeforeAttachmentsUpload={true}
        NetworkDownIndicator={RenderNull}
        MessageAvatar={RenderNull}
        MessageFooter={RenderNull}
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
        <MessageComposerAI bottomSheetOptions={bottomSheetOptions} />
      </Channel>
    </Animated.View>
  );
};

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

const CustomMessage = (props: MessageProps) => {
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

const w = Dimensions.get('window').width - 32;

const StreamingMessageView = () => {
  const { message } = useMessageContext();
  return (
    <View style={{ width: w, paddingLeft: 16 }}>
      <MarkdownRichText text={message.text ?? ''} />
    </View>
  );
};

const MessageComposerAI = (
  props: Pick<AIMessageComposerProps, 'bottomSheetOptions'>,
) => {
  const messageComposer = useMessageComposer();
  const { sendMessage } = useMessageInputContext();
  const { channel } = useChannelContext();

  const { aiState } = useAIState(channel);

  const stopGenerating = useCallback(
    () => channel?.stopAIResponse(),
    [channel],
  );

  const isGenerating = [AIStates.Thinking, AIStates.Generating].includes(
    aiState,
  );

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

  const serializeToMessage = useStableCallback(
    async ({ text, attachments }: { text: string; attachments?: any[] }) => {
      messageComposer.textComposer.setText(text);
      if (attachments && attachments.length > 0) {
        const localAttachments = await Promise.all(
          attachments.map((a) =>
            messageComposer.attachmentManager.fileToLocalUploadAttachment(a),
          ),
        );
        messageComposer.attachmentManager.upsertAttachments(localAttachments);
      }

      await sendMessage();
    },
  );

  return (
    <AIMessageComposer
      {...props}
      bottomSheetInsets={insets}
      onSendMessage={serializeToMessage}
      isGenerating={isGenerating}
      stopGenerating={stopGenerating}
    />
  );
};

const EmptyStateIndicator = () => (
  <View
    style={{
      flex: 1,
      width: '100%',
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
      What can I help with ?
    </Text>
  </View>
);

const RenderNull = () => null;

export default App;
