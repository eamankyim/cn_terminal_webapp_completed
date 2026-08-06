import React from 'react';
import { ActivityIndicator, Image, View } from 'react-native';

export const SplashScreen: React.FC = () => {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Image
        source={require('../../../assets/cn_logo.png')}
        style={{ width: 120, height: 120, marginBottom: 24 }}
        resizeMode="contain"
      />
      <ActivityIndicator color="#000000" size="large" />
    </View>
  );
};
