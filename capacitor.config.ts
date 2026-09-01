import type { CapacitorConfig } from '@capacitor/cli';

// iOS packaging seam: `npx cap add ios` must work with no code changes.
const config: CapacitorConfig = {
  appId: 'com.franzai.knightfight',
  appName: 'Knightfight',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#0a0a12',
  },
};

export default config;
