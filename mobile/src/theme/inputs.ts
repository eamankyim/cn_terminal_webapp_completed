/**
 * Shared control height for text fields and primary action buttons.
 * Prefer this token (or `inputs.height`) over hard-coded 52s.
 */
export const controlHeight = 52;

/**
 * Standard text-input sizing tokens.
 * Prefer the shared `Input` component; use these for StyleSheet-only screens
 * (e.g. Login) or custom search/filter chrome.
 */
export const inputs = {
  /** Primary single-line control height (comfortable touch + readability) */
  height: controlHeight,
  /** Minimum font size (avoids iOS input zoom) */
  fontSize: 16,
  /** Horizontal padding inside the field */
  paddingHorizontal: 16,
  /** Vertical padding for multiline fields */
  multilinePaddingVertical: 14,
  /** Minimum height for multiline fields */
  multilineMinHeight: controlHeight,
} as const;

/** NativeWind classes for a bordered single-line form field */
export const inputFieldClass =
  'border border-gray-300 rounded-xl px-4 h-[52px] py-0 text-base text-black';

/** NativeWind classes for a bordered multiline form field */
export const inputMultilineClass =
  'border border-gray-300 rounded-xl px-4 min-h-[52px] py-3.5 text-base text-black';

/**
 * NativeWind height/alignment for action buttons matching inputs.
 * Pair with color/border classes (e.g. `bg-black`, `border border-gray-300`).
 */
export const buttonHeightClass = 'h-[52px] items-center justify-center';

/** Primary action button label size (pairs with 52px control height). */
export const buttonFontSize = 17;

/** NativeWind text class for primary/secondary CTA labels. */
export const buttonTextClass = 'text-[17px] font-semibold';
