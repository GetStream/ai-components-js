import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { openSheet } from '../store/bottom-sheet-state-store';
import { BottomSheet } from '../components/BottomSheet';
import { BottomSheetContent } from './ActionSheet';

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
};

export const AIMessageComposer = ({
  bottomSheetInsets,
  bottomSheetOptions = [],
}: AIMessageComposerProps) => {
  const [text, setText] = useState<string>('');
  return (
    <>
      <View pointerEvents={'box-none'} style={styles.absoluteContainer}>
        <View style={styles.row}>
          <Pressable style={styles.roundButton} onPress={openSheet}>
            <View style={styles.plusIcon} />
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

            <Pressable style={styles.iconButton}>
              <View style={styles.micIcon} />
            </Pressable>

            <Pressable style={styles.voiceButton}>
              <View style={styles.waveIcon} />
            </Pressable>
          </View>
        </View>
        <BottomSheet>
          <BottomSheetContent
            bottomSheetInsets={bottomSheetInsets}
            bottomSheetOptions={bottomSheetOptions}
          />
        </BottomSheet>
      </View>
    </>
  );
};

const PILL_HEIGHT = 44;

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
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#555',
    transform: [{ rotate: '90deg' }],
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
  },
  iconButton: {
    marginLeft: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIcon: {
    width: 12,
    height: 16,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#777',
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
