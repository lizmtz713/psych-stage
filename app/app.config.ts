// App Configuration with Environment Variables
// Supports OpenAI and Anthropic API integration

import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'VIBE',
  slug: 'vibe-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#6366F1',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.vibe.mentalhealth',
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#6366F1',
    },
    package: 'com.vibe.mentalhealth',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    // AI Provider Configuration
    // Set to 'openai' or 'anthropic'
    aiProvider: process.env.AI_PROVIDER || 'anthropic',
    
    // API Keys (set in environment or .env file)
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    
    // Firebase Configuration
    firebaseApiKey: process.env.FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.FIREBASE_APP_ID,
    
    // Feature Flags
    enableAIRoleplay: process.env.ENABLE_AI_ROLEPLAY !== 'false',
    enableProgressTracking: process.env.ENABLE_PROGRESS_TRACKING !== 'false',
    
    // Expo
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
  plugins: [
    'expo-router',
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: true, // For development only
        },
      },
    ],
  ],
});
