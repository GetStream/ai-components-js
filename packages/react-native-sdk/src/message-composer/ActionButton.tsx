import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Pressable, StyleSheet, View } from 'react-native';
import { SendUp } from '../internal/icons/SendUp';
import { Mic } from '../internal/icons/Mic';
import React, { useEffect } from 'react';
import { type DictationStoreState, store } from '../store/dictation/store';
import { useStateStore } from '@stream-io/state-store/react-bindings';
import { useDictation } from '../transcription/useDictation';
import { useComposerHasText } from '../store/composer/useComposerHasText';
import { useMessageComposerContext } from '../contexts/message-composer-context';

const selector = ({ isRecording }: DictationStoreState) => ({
  isRecording,
});

export const ActionButton = () => {
  const { cancel, toggle } = useDictation();
  const { hasText } = useComposerHasText();
  const { isRecording } = useStateStore(store, selector);
  const { sendMessage } = useMessageComposerContext();

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return hasText && !isRecording ? (
    <Animated.View
      key={'send-button'}
      entering={ZoomIn.duration(250)}
      exiting={ZoomOut.duration(250)}
    >
      <Pressable style={styles.iconButton} onPress={sendMessage}>
        <View style={styles.sendIcon}>
          <SendUp size={24} />
        </View>
      </Pressable>
    </Animated.View>
  ) : (
    <Animated.View
      key={'mic-button'}
      entering={ZoomIn.duration(250)}
      exiting={ZoomOut.duration(250)}
    >
      <Pressable style={styles.iconButton} onPress={toggle}>
        <View style={styles.micIcon}>
          <Mic
            size={32}
            viewBox={`0 0 ${32} ${28}`}
            fill={isRecording ? 'blue' : '#7A7A7A'}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  micIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#777',
  },
  sendIcon: {
    width: 32,
    height: 32,
    backgroundColor: 'black',
    borderRadius: 16,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
