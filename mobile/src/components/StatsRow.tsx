import React, { Children, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

type StatsRowProps = {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** Spacing between cards. Default 8. */
  gap?: number;
};

/**
 * Layout for bordered stats cards:
 * - 2 or 3 cards → equal flex on one row
 * - 4+ cards → wrap to 2 per row (~48% width)
 */
export const StatsRow: React.FC<StatsRowProps> = ({
  children,
  className,
  style,
  gap = 8,
}) => {
  const items = Children.toArray(children).filter(Boolean);
  const wrapTwoByTwo = items.length >= 4;

  return (
    <View
      className={`flex-row items-stretch ${wrapTwoByTwo ? 'flex-wrap' : ''} ${className ?? ''}`}
      style={[{ gap }, style]}
    >
      {items.map((child, index) => (
        <View
          key={
            React.isValidElement(child) && child.key != null
              ? String(child.key)
              : `stat-${index}`
          }
          style={
            wrapTwoByTwo
              ? { flexBasis: '47%', flexGrow: 1, maxWidth: '48.5%' }
              : { flex: 1, minWidth: 0 }
          }
        >
          {child}
        </View>
      ))}
    </View>
  );
};
