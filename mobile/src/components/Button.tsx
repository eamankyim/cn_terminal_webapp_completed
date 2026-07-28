import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: Variant;
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-black',
  secondary: 'bg-white border border-black',
  ghost: 'bg-transparent',
};

const textClass: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-black',
  ghost: 'text-black',
};

export const Button: React.FC<ButtonProps> = ({
  title,
  loading = false,
  variant = 'primary',
  disabled,
  className,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={isDisabled}
      className={`rounded-lg py-3 items-center ${variantClass[variant]} ${
        isDisabled ? 'opacity-60' : ''
      } ${className ?? ''}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#000'} />
      ) : (
        <Text className={`font-semibold ${textClass[variant]}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
