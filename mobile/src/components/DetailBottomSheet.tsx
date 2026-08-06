import React from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WINDOW_HEIGHT = Dimensions.get('window').height;
const DEFAULT_HEIGHT_RATIO = 0.9;

interface DetailBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Fraction of window height (default 0.9). */
  heightRatio?: number;
}

/**
 * Tall bottom-sheet presentation for entity details (jobs, clients).
 * Uses RN Modal + slide — no extra deps. Stack routes remain for create/edit.
 */
export const DetailBottomSheet: React.FC<DetailBottomSheetProps> = ({
  visible,
  onClose,
  children,
  heightRatio = DEFAULT_HEIGHT_RATIO,
}) => {
  const insets = useSafeAreaInsets();
  const sheetHeight = Math.round(WINDOW_HEIGHT * heightRatio);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/40"
          onPress={onClose}
          accessibilityLabel="Dismiss"
        />
        <View
          className="bg-white rounded-t-3xl overflow-hidden"
          style={{
            height: sheetHeight,
            paddingBottom: Math.max(insets.bottom, 8),
          }}
        >
          <View className="items-center pt-2.5 pb-1">
            <View className="w-10 h-1 rounded-full bg-gray-300" />
          </View>
          <View className="flex-1">{children}</View>
        </View>
      </View>
    </Modal>
  );
};
