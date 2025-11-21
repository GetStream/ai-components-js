import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { openSheet } from '../store/bottom-sheet-state-store';
import { BottomSheet } from '../components/BottomSheet';
import { BottomSheetContent } from './ActionSheet';
import { Mic } from '../internal/icons/Mic';
import { SendUp } from '../internal/icons/SendUp';

import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { MediaPickerService } from '../services';
import { useMediaPickerState } from '../services/media-picker-service/hooks/useMediaPickerState.ts';
import type { MediaPickerState } from '../services/media-picker-service/AbstractMediaPickerService.ts';

export type BottomSheetOption = {
  title: string;
  action: () => void | Promise<void>;
  subtitle?: string;
  Icon?: React.ComponentType;
};

export type AIMessageComposerProps = {
  bottomSheetInsets?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  bottomSheetOptions: BottomSheetOption[];
  onSendMessage: (opts: {
    text: string;
    attachments?: MediaPickerState['assets'];
  }) => Promise<void>;
};

export const AIMessageComposer = ({
  bottomSheetInsets,
  bottomSheetOptions = [],
  onSendMessage,
}: AIMessageComposerProps) => {
  const [mediaPickerService] = useState(() =>
    MediaPickerService ? new MediaPickerService() : undefined,
  );
  const [text, setText] = useState<string>('');
  const { attachments } =
    useMediaPickerState({ service: mediaPickerService }) ?? {};
  return (
    <>
      <View pointerEvents={'box-none'} style={styles.absoluteContainer}>
        <View style={styles.row}>
          <Pressable style={styles.roundButton} onPress={openSheet}>
            <Text style={styles.attachIcon}>+</Text>
          </Pressable>

          <View style={styles.inputPill}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={'Ask anything'}
              placeholderTextColor={'#9E9E9E'}
              style={styles.textInput}
              multiline
              underlineColorAndroid={'transparent'}
            />

            {text && text.length > 0 ? (
              <Animated.View
                key={'send-button'}
                entering={ZoomIn.duration(250)}
                exiting={ZoomOut.duration(250)}
              >
                <Pressable
                  style={styles.iconButton}
                  onPress={() => onSendMessage({ text, attachments })}
                >
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
                <Pressable style={styles.iconButton}>
                  <View style={styles.micIcon}>
                    <Mic
                      size={32}
                      viewBox={`0 0 ${32} ${28}`}
                      fill={'#7A7A7A'}
                    />
                  </View>
                </Pressable>
              </Animated.View>
            )}
          </View>
        </View>
        <BottomSheet>
          <BottomSheetContent
            bottomSheetInsets={bottomSheetInsets}
            bottomSheetOptions={bottomSheetOptions}
            mediaPickerService={mediaPickerService}
          />
        </BottomSheet>
      </View>
    </>
  );
};

const PILL_HEIGHT = 52;

const styles = StyleSheet.create({
  absoluteContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  roundButton: {
    width: PILL_HEIGHT,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  plusIcon: {
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: PILL_HEIGHT,
    maxHeight: PILL_HEIGHT * 3,
    borderRadius: PILL_HEIGHT / 2,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111',
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginRight: 24,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachIcon: {
    fontSize: 32,
    textAlign: 'center',
    alignSelf: 'center',
    lineHeight: 32,
    color: '#7A7A7A',
  },
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
  voiceButton: {
    marginLeft: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveIcon: {
    width: 16,
    height: 10,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
});
