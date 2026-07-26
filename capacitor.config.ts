import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.henrysjourney.app',
  appName: "Henry's Journey",
  webDir: 'dist',
  ios: {
    contentInset: 'never',
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: '#1e293b',
    // Google OAuth blocks the Capacitor WKWebView with error 403 disallowed_useragent
    // unless the User-Agent looks like real mobile Safari. This impersonation makes
    // signInWithPopup / signInWithRedirect complete successfully.
    overrideUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  },
  server: {
    // Load bundled assets by default; still allows remote cloud sync.
    // Uncomment during dev to point at a live vite server:
    // url: 'http://localhost:5173',
    // cleartext: true,
    androidScheme: 'https',
    // Firebase Auth's authorized-domains list needs to match the WebView origin.
    // Keep Capacitor's default so `capacitor://localhost` is the origin that
    // gets whitelisted in Firebase Console.
    iosScheme: 'capacitor',
    allowNavigation: [
      'henry-s-journey.web.app',
      'henrysjourney.app',
      '*.googleapis.com',
      '*.gstatic.com',
      '*.firebaseio.com',
      '*.firebase.googleapis.com',
      '*.google.com',
      'accounts.google.com',
      'cdn.tailwindcss.com',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#1e293b',
      androidSplashResourceName: 'splash',
      showSpinner: true,
      spinnerColor: '#22c55e',
      iosSpinnerStyle: 'small',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1e293b',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    FirebaseAuthentication: {
      // Which OAuth providers the plugin should wire up on iOS/Android.
      // Without this list the plugin refuses the sign-in with
      // "Google sign-in provider is not enabled".
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
};

export default config;
