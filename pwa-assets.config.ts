import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0.1, resizeOptions: { background: '#0B1A2E' } },
    apple: { ...minimal2023Preset.apple, padding: 0.1, resizeOptions: { background: '#0B1A2E' } },
  },
  images: ['public/favicon.svg'],
})
