/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#000000',
          white: '#ffffff',
        },
      },
      // Soften default scale so existing rounded-* classes inherit pill/button family
      borderRadius: {
        sm: '12px', // was 2px — chips / small controls
        DEFAULT: '12px',
        md: '12px', // was 6px — pagination, compact buttons
        lg: '14px', // was 8px — legacy; prefer xl for new controls
        xl: '16px', // buttons, inputs, search, filter
        '2xl': '20px', // cards / tiles
        '3xl': '24px', // sheets
        control: '16px',
        card: '20px',
        sheet: '24px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
};
