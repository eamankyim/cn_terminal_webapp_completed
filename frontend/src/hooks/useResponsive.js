import { Grid } from 'antd';

const { useBreakpoint } = Grid;

/**
 * Custom hook for responsive design utilities
 * Uses Ant Design's built-in breakpoint system
 * 
 * Breakpoints:
 * xs: < 576px
 * sm: >= 576px
 * md: >= 768px
 * lg: >= 992px
 * xl: >= 1200px
 * xxl: >= 1600px
 */
export const useResponsive = () => {
  const screens = useBreakpoint();

  return {
    // Screen size flags
    isXs: screens.xs && !screens.sm,
    isSm: screens.sm && !screens.md,
    isMd: screens.md && !screens.lg,
    isLg: screens.lg && !screens.xl,
    isXl: screens.xl && !screens.xxl,
    isXxl: screens.xxl,
    
    // Combined flags for common use cases
    isMobile: screens.xs && !screens.md,        // xs or sm
    isTablet: screens.md && !screens.lg,        // md only
    isDesktop: screens.lg,                      // lg, xl, or xxl
    
    // Exact screen state
    screens,
    
    // Utility functions
    getColSpan: (mobile, tablet, desktop) => {
      if (!screens.md) return mobile;           // xs or sm
      if (!screens.lg) return tablet;           // md
      return desktop;                           // lg, xl, xxl
    },
    
    // Grid column spans for common layouts
    gridConfig: {
      xs: { span: 24 },                         // Full width on mobile
      sm: { span: 12 },                         // Half width on small tablets
      md: { span: 12 },                         // Half width on tablets
      lg: { span: 8 },                          // Third width on desktop
      xl: { span: 6 },                          // Quarter width on large desktop
      xxl: { span: 6 }                          // Quarter width on extra large
    },
    
    // Spacing helpers
    spacing: {
      xs: screens.xs && !screens.sm ? 8 : 16,
      sm: screens.xs && !screens.sm ? 12 : 24,
      md: screens.xs && !screens.sm ? 16 : 32,
      lg: screens.xs && !screens.sm ? 24 : 48,
      xl: screens.xs && !screens.sm ? 32 : 64
    },
    
    // Font size helpers
    fontSize: {
      xs: screens.xs && !screens.sm ? 12 : 14,
      sm: screens.xs && !screens.sm ? 14 : 16,
      md: screens.xs && !screens.sm ? 16 : 18,
      lg: screens.xs && !screens.sm ? 18 : 24,
      xl: screens.xs && !screens.sm ? 24 : 32
    }
  };
};

export default useResponsive;
