/**
 * Corner radius tokens for StyleSheet usage.
 * Prefer NativeWind classes (`rounded-xl`, `rounded-full`, etc.) when available;
 * use these when writing plain StyleSheet objects (auth screens, etc.).
 */
export const radii = {
  /** Buttons, inputs, search bars, filter controls — generously rounded */
  control: 16,
  /** Cards, quick-action tiles, menu panels */
  card: 20,
  /** Bottom sheets / modal top corners */
  sheet: 24,
  /** Status badges, chips, pills, page dots */
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radii;
