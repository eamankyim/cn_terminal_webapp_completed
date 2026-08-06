import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ACCENT } from '../theme/colors';
import { buttonTextClass, controlHeight } from '../theme/inputs';
import { radii } from '../theme/radii';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: Variant;
}

const variantClass: Record<Variant, string> = {
  primary: '',
  secondary: 'bg-white border',
  ghost: 'bg-transparent',
};

const textClass: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-black',
  ghost: 'text-black',
};

/** StyleSheet sizing for auth / non-NativeWind buttons (Login, Onboarding, etc.) */
export const buttonControlStyle: ViewStyle = {
  height: controlHeight,
  borderRadius: radii.control,
  alignItems: 'center',
  justifyContent: 'center',
};

export const Button: React.FC<ButtonProps> = ({
  title,
  loading = false,
  variant = 'primary',
  disabled,
  className,
  style,
  ...rest
}) => {
  const theme = useTheme();
  const accent = theme.accent ?? ACCENT.black;
  const isDisabled = disabled || loading;

  const accentStyle: ViewStyle =
    variant === 'primary'
      ? { backgroundColor: accent }
      : variant === 'secondary'
        ? { borderColor: accent }
        : {};

  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={isDisabled}
      className={`rounded-xl h-[52px] items-center justify-center ${variantClass[variant]} ${
        isDisabled ? 'opacity-60' : ''
      } ${className ?? ''}`}
      style={[accentStyle, style]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : accent} />
      ) : (
        <Text className={`${buttonTextClass} ${textClass[variant]}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
