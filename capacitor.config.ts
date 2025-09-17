import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c569ec0a83e2409ea6929cf51ac34f41',
  appName: 'kinder-contribute-hub',
  webDir: 'dist',
  server: {
    url: 'https://c569ec0a-83e2-409e-a692-9cf51ac34f41.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;