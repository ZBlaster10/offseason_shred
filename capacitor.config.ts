import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.offseasonshred.app',
  appName: 'Offseason Shred',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#0B1A2E',
      showSpinner: false,
    },
  },
}

export default config
