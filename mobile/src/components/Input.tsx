import React from 'react';
import {
  TextInput,
  StyleSheet,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { radii } from '../theme/radii';
import { controlHeight, inputs } from '../theme/inputs';

export type InputProps = TextInputProps & {
  className?: string;
};

/**
 * Standard text field: `controlHeight` (52px) tall, 16px type, 16px horizontal padding.
 * Pass `multiline` for comments/descriptions (min-height 52, extra vertical pad).
 */
export const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      className,
      style,
      multiline,
      placeholderTextColor = '#999',
      ...rest
    },
    ref,
  ) => {
    const sizeClass = multiline
      ? 'min-h-[52px] py-3.5 px-4'
      : 'h-[52px] py-0 px-4';

    return (
      <TextInput
        ref={ref}
        multiline={multiline}
        placeholderTextColor={placeholderTextColor}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`border border-gray-300 rounded-xl text-base text-black ${sizeClass}${
          className ? ` ${className}` : ''
        }`}
        style={style}
        {...rest}
      />
    );
  },
);

Input.displayName = 'Input';

/** StyleSheet sizing for auth / non-NativeWind inputs (Login, etc.) */
export const inputControlStyle: TextStyle = {
  height: controlHeight,
  paddingHorizontal: inputs.paddingHorizontal,
  paddingVertical: 0,
  fontSize: inputs.fontSize,
  borderRadius: radii.control,
};

export const inputStyles = StyleSheet.create({
  control: inputControlStyle,
  multiline: {
    minHeight: inputs.multilineMinHeight,
    paddingHorizontal: inputs.paddingHorizontal,
    paddingVertical: inputs.multilinePaddingVertical,
    fontSize: inputs.fontSize,
    borderRadius: radii.control,
    textAlignVertical: 'top',
  },
});
