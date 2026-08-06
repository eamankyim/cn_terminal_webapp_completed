export type ColorScheme = 'black' | 'blue';

/** Brand accents for interactive chrome (tabs, primary CTAs, selected states). */
export const ACCENT: Record<ColorScheme, string> = {
  black: '#000000',
  blue: '#008FFF',
};

export const COLOR_SCHEME_STORAGE_KEY = 'cn_terminal_color_scheme';

export function isColorScheme(value: string | null | undefined): value is ColorScheme {
  return value === 'black' || value === 'blue';
}
