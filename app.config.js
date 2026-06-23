const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? 'flashcards (Dev)' : 'flashcards',
    slug: 'flashcards',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: IS_DEV
        ? 'com.antoniothessalonicense.flashcards.dev'
        : 'com.antoniothessalonicense.flashcards',
    },
    scheme: 'flashcards',
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-sharing',
      'expo-dev-client',
      '@react-native-google-signin/google-signin',
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 36,
            targetSdkVersion: 36,
            buildToolsVersion: '35.0.0',
          },
        },
      ],
      'expo-sqlite',
      'expo-status-bar',
    ],
    extra: {
      eas: {
        projectId: 'cca1b2c4-8b50-4b7d-85bf-87a4278ca813',
      },
    },
    owner: 'antoniothessalonicense',
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: 'https://u.expo.dev/cca1b2c4-8b50-4b7d-85bf-87a4278ca813',
    },
  },
};
