import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { StyleSheet } from 'react-native';
import {
  Chat,
  OverlayProvider,
  useCreateChatClient,
  WithComponents,
} from 'stream-chat-expo';
import {
  chatApiKey,
  chatUserId,
  chatUserName,
  chatUserToken,
} from '../chatConfig';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../contexts/AppContext';
import { StreamTheme } from '@stream-io/chat-react-native-ai';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { LocalMessage } from 'stream-chat';
import { ChannelPreview, MenuDrawer } from '../screens/MenuDrawer';
import {
  CustomMessage,
  CustomStreamingMessageView,
  EmptyStateIndicator,
  RenderNull,
} from '../screens/ChatContent';

const isMessageAIGenerated = (message: LocalMessage) => !!message.ai_generated;

export default function Layout() {
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
          <GestureHandlerRootView style={styles.container}>
            <OverlayProvider>
              <WithComponents
                overrides={{
                  StreamingMessageView: CustomStreamingMessageView,
                  Message: CustomMessage,
                  EmptyStateIndicator,
                  NetworkDownIndicator: RenderNull,
                  MessageAuthor: RenderNull,
                  MessageFooter: RenderNull,
                  ChannelPreview,
                }}
              >
                <Chat
                  client={chatClient}
                  isMessageAIGenerated={isMessageAIGenerated}
                >
                  <Drawer
                    drawerContent={MenuDrawer}
                    screenOptions={{ drawerStyle: { width: 300 } }}
                  >
                    <Drawer.Screen name={'index'} />
                  </Drawer>
                </Chat>
              </WithComponents>
            </OverlayProvider>
          </GestureHandlerRootView>
        </StreamTheme>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
