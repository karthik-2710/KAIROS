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
        background: "#F7F9F5",
        primary: {
          DEFAULT: "#2E7D32",
          light: "#E8F5E9",
          dark: "#1B5E20",
          50: "#E8F5E9",
          100: "#C8E6C9",
          200: "#A5D6A7",
          300: "#81C784",
          400: "#66BB6A",
          500: "#4CAF50",
          600: "#43A047",
          700: "#388E3C",
          800: "#2E7D32",
          900: "#1B5E20",
        },
        accent: {
          DEFAULT: "#FFB300",
          light: "#FFF8E1",
          dark: "#FF8F00",
          50: "#FFF8E1",
          100: "#FFECB3",
          200: "#FFE082",
          300: "#FFD54F",
          400: "#FFCA28",
          500: "#FFB300",
          600: "#FFA000",
          700: "#FF8F00",
          800: "#FF6F00",
        },
        natural: {
          50: "#F7F9F5",
          100: "#EDF1EA",
          200: "#DCE3D6",
          300: "#C6D1BD",
          400: "#AABCA0",
          500: "#8C9F82",
          600: "#6E7F66",
          700: "#55624E",
          800: "#3B4537",
          900: "#252B22",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        'premium': '0 2px 8px -2px rgba(46, 125, 50, 0.05), 0 12px 24px -4px rgba(46, 125, 50, 0.03)',
        'premium-hover': '0 4px 16px -4px rgba(46, 125, 50, 0.08), 0 20px 32px -8px rgba(46, 125, 50, 0.05)',
        'premium-inset': 'inset 0 1px 2px 0 rgba(255, 255, 255, 0.1)',
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
