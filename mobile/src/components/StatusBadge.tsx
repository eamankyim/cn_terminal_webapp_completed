import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ACCENT } from '../theme/colors';

type Variant = 'muted' | 'outline' | 'outlineMuted' | 'solid';
type Size = 'sm' | 'md';

interface StatusBadgeProps {
  label: string;
  variant?: Variant;
  size?: Size;
  /** Leading status dot (e.g. Active / Inactive) */
  showDot?: boolean;
  dotColor?: string;
  uppercase?: boolean;
  className?: string;
}

const sizeClass: Record<Size, { container: string; text: string }> = {
  sm: { container: 'px-2.5 py-1', text: 'text-xs' },
  md: { container: 'px-3 py-1.5', text: 'text-sm' },
};

/**
 * Fully rounded status pill — use for job/invoice/estimate/expense/customer statuses.
 * Solid / outline chrome follows the app accent; muted variants stay neutral.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'muted',
  size = 'sm',
  showDot = false,
  dotColor,
  uppercase = false,
  className,
}) => {
  const theme = useTheme();
  const accent = theme.accent ?? ACCENT.black;
  const sizing = sizeClass[size];

  const containerExtra =
    variant === 'muted'
      ? 'bg-gray-100'
      : variant === 'outlineMuted'
        ? 'border border-gray-400 bg-transparent'
        : variant === 'outline'
          ? 'border bg-transparent'
          : '';

  const textExtra =
    variant === 'muted'
      ? 'text-gray-700'
      : variant === 'outlineMuted'
        ? 'text-gray-600'
        : variant === 'solid'
          ? 'text-white'
          : 'text-black';

  const containerStyle =
    variant === 'solid'
      ? { backgroundColor: accent }
      : variant === 'outline'
        ? { borderColor: accent }
        : undefined;

  const resolvedDot = dotColor ?? accent;

  return (
    <View
      className={`flex-row items-center self-start rounded-full ${sizing.container} ${containerExtra} ${className ?? ''}`}
      style={containerStyle}
    >
      {showDot ? (
        <View
          className="rounded-full mr-1.5"
          style={{ width: 7, height: 7, backgroundColor: resolvedDot }}
        />
      ) : null}
      <Text
        className={`font-semibold ${sizing.text} ${textExtra} ${
          uppercase ? 'uppercase' : ''
        }`}
        style={variant === 'outline' ? { color: accent } : undefined}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};
