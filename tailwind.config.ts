import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        frame: {
          50: '#f7f7f8',
          100: '#eeeef0',
          200: '#d9d9de',
          300: '#b8b8c1',
          400: '#91919e',
          500: '#747483',
          600: '#5d5d69',
          700: '#4c4c56',
          800: '#414149',
          900: '#39393f',
          950: '#18181b',
        },
      },
    },
  },
  plugins: [],
}
export default config
