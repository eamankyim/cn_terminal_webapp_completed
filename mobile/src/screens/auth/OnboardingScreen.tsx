import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Placeholder headlines for slides 2–3 (filenames had no copy hints).
 * Edit these if marketing provides final taglines.
 */
const SLIDES: ReadonlyArray<{
  id: string;
  line1: string;
  line2: string;
  background: ImageSourcePropType;
}> = [
  {
    id: 'see-everything',
    line1: 'SEE',
    line2: 'EVERYTHING',
    background: require('../../../assets/splash-background.png'),
  },
  {
    id: 'keep-it-moving',
    line1: 'KEEP IT',
    line2: 'MOVING',
    background: require('../../../assets/onboarding-background-2.png'),
  },
  {
    id: 'across-the-map',
    line1: 'ACROSS THE',
    line2: 'MAP',
    background: require('../../../assets/onboarding-background-3.png'),
  },
];

interface Props {
  navigation: {
    navigate: (screen: string) => void;
  };
}

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const logoSize = Math.min(SCREEN_WIDTH * 0.42, 180);
  const logoAreaHeight = SCREEN_HEIGHT * 0.3;
  const isLast = index >= SLIDES.length - 1;

  const goToSlide = (next: number) => {
    const clamped = Math.max(0, Math.min(next, SLIDES.length - 1));
    scrollRef.current?.scrollTo({ x: clamped * SCREEN_WIDTH, animated: true });
    setIndex(clamped);
  };

  const onMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setIndex(Math.max(0, Math.min(next, SLIDES.length - 1)));
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {SLIDES.map((slide) => (
          <ImageBackground
            key={slide.id}
            source={slide.background}
            style={[styles.slide, { width: SCREEN_WIDTH }]}
            resizeMode="cover"
          >
            <View style={styles.scrim} pointerEvents="none" />

            <View
              style={[
                styles.content,
                {
                  paddingTop: insets.top + 12,
                  paddingBottom: Math.max(insets.bottom, 16) + 12,
                },
              ]}
            >
              <View style={[styles.logoArea, { height: logoAreaHeight - insets.top }]}>
                <Image
                  source={require('../../../assets/cn_logo.png')}
                  style={{ width: logoSize, height: logoSize }}
                  resizeMode="contain"
                  accessibilityLabel="CN Terminal"
                />
              </View>

              <View style={styles.headlineBlock}>
                <Text style={styles.headline}>{slide.line1}</Text>
                <Text style={styles.headline}>{slide.line2}</Text>
              </View>
            </View>
          </ImageBackground>
        ))}
      </ScrollView>

      <View
        style={[
          styles.controls,
          { paddingBottom: Math.max(insets.bottom, 16) + 12 },
        ]}
        pointerEvents="box-none"
      >
        {isLast ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('Setup')}
            activeOpacity={0.85}
            style={styles.continueButton}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
            <Text style={styles.continueLabel}>Continue</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.indicators} accessibilityRole="tablist">
          {SLIDES.map((slide, i) => {
            const active = i === index;
            return (
              <View
                key={slide.id}
                style={[styles.dot, active && styles.dotActive]}
                accessibilityLabel={`Step ${i + 1} of ${SLIDES.length}`}
                accessibilityState={{ selected: active }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

const HEADLINE_SIZE = Math.min(SCREEN_WIDTH * 0.155, 64);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
  },
  pager: {
    flex: 1,
  },
  slide: {
    flex: 1,
    height: '100%',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.32)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headlineBlock: {
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  headline: {
    color: '#FFFFFF',
    fontSize: HEADLINE_SIZE,
    lineHeight: HEADLINE_SIZE * 1.02,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 28,
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
    minWidth: 180,
    alignItems: 'center',
  },
  continueLabel: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  dotActive: {
    width: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
});
