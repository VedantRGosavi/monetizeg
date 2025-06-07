import { type Config } from 'tailwindcss'

const config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        phalo: '#123c2b'
      }
    }
  },
  plugins: []
} satisfies Config

export default config
