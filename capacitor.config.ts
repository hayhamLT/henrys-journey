
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.henrysjourney.app',
  appName: 'Henrys Journey',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'henrysjourney.app'
  },
  ios: {
    contentInset: 'never'
  }
};

export default config;
