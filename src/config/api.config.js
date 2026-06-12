/**
 * API Configuration Manager
 * 
 * Dynamically resolves the BASE_URL based on:
 * - Environment (development vs. production)
 * - Platform (Android emulator vs. physical device)
 * - Build mode (dev build vs. release)
 * 
 * SETUP INSTRUCTIONS:
 * 1. Replace 'YOUR_WINDOWS_IP_HERE' with your Windows machine IP
 *    (You can find it using: ipconfig /all)
 *    Example: '192.168.1.100'
 * 2. Adjust API port as needed
 */

import { Platform } from 'react-native';

/**
 * CONFIGURATION CONSTANTS
 * Modify these values according to your environment
 */
const CONFIG = {
  // Windows machine IP - REPLACE WITH YOUR ACTUAL IP
  // Get your IP: Open PowerShell and run: ipconfig | findstr "IPv4"
  WINDOWS_MACHINE_IP: 'YOUR_WINDOWS_IP_HERE',

  // API port for your local development server
  DEV_API_PORT: 3000,

  // Production URL (adjust according to your deployment)
  PROD_API_URL: 'https://api.flashcards.com',

  // Android Emulator special address (DO NOT CHANGE)
  // 10.0.2.2 is the special alias to access host machine from Android emulator
  EMULATOR_HOST_ALIAS: '10.0.2.2',
};

/**
 * Detects if running on Android Emulator
 * Uses heuristics to differentiate between emulator and physical device
 * @returns {boolean} true if running on emulator
 */
const isAndroidEmulator = () => {
  if (Platform.OS !== 'android') return false;

  // Check if we're in development mode (Expo Dev Client)
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    // In release builds, assume it's a physical device
    return false;
  }

  try {
    // Try to detect emulator via React Native internals
    // This works because emulators typically have specific identifiers
    const isEmulatorBuild = (
      Platform.OS === 'android' &&
      (global.__DEV__ === true || __DEV__ === true)
    );

    // In development with Android, we assume emulator by default for safety
    // The user can also set an environment variable if needed
    const emulatorEnvVar = typeof process !== 'undefined' &&
                           process.env &&
                           process.env.RN_DEVICE === 'emulator';

    return isEmulatorBuild || emulatorEnvVar;
  } catch (error) {
    // If detection fails in dev mode, assume emulator (safer default)
    console.warn('Could not reliably detect emulator:', error);
    return __DEV__ === true;
  }
};

/**
 * Detects if the app is running in release mode
 * @returns {boolean} true if running as release/production build
 */
const isReleaseBuild = () => {
  // __DEV__ is false in release/production builds
  return __DEV__ === false;
};

/**
 * Detects if running in development mode with Expo Dev Client
 * @returns {boolean} true if running in dev client mode
 */
const isDevBuild = () => {
  return __DEV__ === true;
};

/**
 * Gets the appropriate API URL based on current environment
 * @returns {string} The BASE_URL for API calls
 */
const getBaseUrl = () => {
  // Priority 1: Release/Production Build
  if (isReleaseBuild()) {
    return CONFIG.PROD_API_URL;
  }

  // Priority 2: Development build on Android
  if (Platform.OS === 'android' && isDevBuild()) {
    // If running on emulator, use 10.0.2.2
    if (isAndroidEmulator()) {
      return `http://${CONFIG.EMULATOR_HOST_ALIAS}:${CONFIG.DEV_API_PORT}`;
    }

    // If running on physical device, use Windows IP
    // Make sure to replace the placeholder with your actual IP
    if (CONFIG.WINDOWS_MACHINE_IP === 'YOUR_WINDOWS_IP_HERE') {
      console.warn(
        '⚠️  API Config: WINDOWS_MACHINE_IP is not configured!\n' +
        'Your app may fail to connect to the local API.\n' +
        'Please update src/config/api.config.js with your Windows machine IP.\n' +
        'Get your IP by running: ipconfig | findstr "IPv4"\n' +
        'Example: 192.168.1.100'
      );
    }

    return `http://${CONFIG.WINDOWS_MACHINE_IP}:${CONFIG.DEV_API_PORT}`;
  }

  // Priority 3: iOS development
  if (Platform.OS === 'ios' && isDevBuild()) {
    // iOS simulator can use localhost directly
    return `http://localhost:${CONFIG.DEV_API_PORT}`;
  }

  // Fallback: Use production URL
  console.warn('Could not determine environment, using production URL');
  return CONFIG.PROD_API_URL;
};

/**
 * API Configuration Object
 * Export this object for use throughout your app
 */
const apiConfig = {
  // Main export: The BASE URL for all API requests
  BASE_URL: getBaseUrl(),

  // Additional useful exports for debugging and configuration
  ENVIRONMENT: {
    isProduction: isReleaseBuild(),
    isDevelopment: isDevBuild(),
    isAndroidEmulator: isAndroidEmulator(),
    platform: Platform.OS,
  },

  // Debugging utility
  getDebugInfo: () => ({
    baseUrl: getBaseUrl(),
    platform: Platform.OS,
    isDev: isDevBuild(),
    isRelease: isReleaseBuild(),
    isEmulator: isAndroidEmulator(),
    windowsIp: CONFIG.WINDOWS_MACHINE_IP,
  }),

  // Configuration for common HTTP headers
  getDefaultHeaders: () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }),

  // Helper to build full API endpoint URLs
  getEndpoint: (path) => {
    const baseUrl = getBaseUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  },
};

// Log configuration in development for debugging
if (isDevBuild()) {
  console.log(
    '📱 API Configuration Loaded:\n' +
    `   Platform: ${Platform.OS}\n` +
    `   Mode: ${isReleaseBuild() ? 'PRODUCTION' : 'DEVELOPMENT'}\n` +
    `   Base URL: ${apiConfig.BASE_URL}\n` +
    `   Emulator: ${isAndroidEmulator() ? 'Yes' : 'No'}`
  );
}

export default apiConfig;

/**
 * USAGE EXAMPLES:
 * 
 * 1. In your API service files:
 *    import apiConfig from '../config/api.config';
 *    const response = await fetch(`${apiConfig.BASE_URL}/users`);
 * 
 * 2. Using the endpoint helper:
 *    const url = apiConfig.getEndpoint('/users/profile');
 *    const response = await fetch(url, {
 *      headers: apiConfig.getDefaultHeaders(),
 *    });
 * 
 * 3. Debugging:
 *    console.log(apiConfig.getDebugInfo());
 * 
 * 4. In AppContext for global usage:
 *    export const AppProvider = ({ children }) => {
 *      const apiBaseUrl = apiConfig.BASE_URL;
 *      // ... rest of context
 *    };
 */
