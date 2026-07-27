/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "#F5F7F6",
        "dark-bg": "#0D1117",
        "dark-surface": "#151D27",
        "dark-elevated": "#1C2632",
        primary: {
          DEFAULT: "#153B35",
          light: "#d5ece7",
          dark: "#0b201d",
          50: '#eaf1ef',
          100: '#cbdad7',
          200: '#a8c1bc',
          300: '#82a59e',
          400: '#608b83',
          500: '#417169',
          600: '#2b5851',
          700: '#1b453e',
          800: '#153B35',
          900: '#102d29',
        },
        secondary: {
          DEFAULT: "#245B55",
          light: "#d5eae8",
          dark: "#122f2c",
          50: '#eef6f5',
          100: '#d5eae8',
          200: '#b2d9d5',
          300: '#88c2bc',
          400: '#61a8a0',
          500: '#438d85',
          600: '#30716a',
          700: '#265b55',
          800: "#245B55",
          900: '#1e4844',
        },
        accent: {
          DEFAULT: "#2388FF",
          light: "#dbeafe",
          dark: "#1e40af",
        },
        highlight: {
          DEFAULT: "#C48A2A",
          light: "#fef3c7",
          dark: "#b45309",
        },
        status: {
          success: "#3FAE5A",
          warning: "#C98416",
          critical: "#B9382A",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(0, 0, 0, 0.1), 0 12px 32px -4px rgba(0, 0, 0, 0.05)',
        'premium-hover': '0 8px 30px -4px rgba(0, 0, 0, 0.15), 0 24px 40px -8px rgba(0, 0, 0, 0.1)',
        'premium-inset': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-right': 'slideRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
