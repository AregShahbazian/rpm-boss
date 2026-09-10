import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.mby4m.rpmboss',
  appName: 'RPM Boss',
  webDir: 'dist',
  android: {
    // The web build is served from the app's own bundle; nothing is fetched.
    allowMixedContent: false,
  },
}

export default config
