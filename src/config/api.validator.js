/**
 * API Configuration Validator
 * 
 * Este script valida se a configuração de API está correta
 * Use para debugging e diagnóstico
 */

import { Platform } from 'react-native';
import apiConfig from './api.config';

/**
 * Validação completa da configuração de API
 * @returns {object} Relatório de validação
 */
export const validateApiConfig = () => {
  const report = {
    timestamp: new Date().toISOString(),
    isValid: true,
    warnings: [],
    errors: [],
    info: {},
  };

  try {
    // 1. Verificar se o arquivo está carregado
    if (!apiConfig || !apiConfig.BASE_URL) {
      report.errors.push('❌ apiConfig not loaded or BASE_URL is missing');
      report.isValid = false;
      return report;
    }

    report.info.baseUrl = apiConfig.BASE_URL;
    report.info.environment = apiConfig.ENVIRONMENT;

    // 2. Verificar plataforma
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
      report.errors.push(`❌ Unknown platform: ${Platform.OS}`);
      report.isValid = false;
    }

    // 3. Verificar configuração específica por plataforma
    if (Platform.OS === 'android') {
      // Validar URL para Android
      if (!apiConfig.BASE_URL.startsWith('http')) {
        report.errors.push('❌ Invalid BASE_URL format for Android');
        report.isValid = false;
      }

      // Se é desenvolvimento, avisar sobre IP
      if (apiConfig.ENVIRONMENT.isDevelopment) {
        if (
          apiConfig.BASE_URL.includes('YOUR_WINDOWS_IP_HERE') ||
          apiConfig.BASE_URL.includes('localhost')
        ) {
          report.warnings.push(
            '⚠️  WINDOWS_MACHINE_IP not properly configured. ' +
            'Update src/config/api.config.js with your actual Windows IP'
          );
        }
      }
    }

    // 4. Verificar modo de build
    if (apiConfig.ENVIRONMENT.isDevelopment) {
      report.info.buildMode = 'DEVELOPMENT';

      // Deve ter uma URL localhost ou 10.0.2.2
      const isDev = apiConfig.BASE_URL.includes('localhost') ||
                    apiConfig.BASE_URL.includes('10.0.2.2') ||
                    apiConfig.BASE_URL.includes('192.168') ||
                    apiConfig.BASE_URL.includes('172.16');

      if (!isDev && Platform.OS === 'android') {
        report.warnings.push(
          '⚠️  In development mode, expected a local development URL'
        );
      }
    } else {
      report.info.buildMode = 'PRODUCTION/RELEASE';

      // Deve ser HTTPS
      if (!apiConfig.BASE_URL.startsWith('https://')) {
        report.errors.push(
          '❌ Production URL must use HTTPS, not HTTP'
        );
        report.isValid = false;
      }

      // Não deve ter localhost ou IPs locais
      if (
        apiConfig.BASE_URL.includes('localhost') ||
        apiConfig.BASE_URL.includes('10.0.2.2') ||
        apiConfig.BASE_URL.includes('127.0.0.1') ||
        apiConfig.BASE_URL.includes('192.168') ||
        apiConfig.BASE_URL.includes('172.16')
      ) {
        report.errors.push(
          '❌ Production URL should not contain local/private IPs'
        );
        report.isValid = false;
      }
    }

    // 5. Verificar funções auxiliares
    const debugInfo = apiConfig.getDebugInfo?.();
    if (!debugInfo) {
      report.warnings.push('⚠️  getDebugInfo() function not available');
    } else {
      report.info.debugInfo = debugInfo;
    }

    const endpoint = apiConfig.getEndpoint?.('/test');
    if (!endpoint || !endpoint.startsWith('http')) {
      report.warnings.push('⚠️  getEndpoint() function issue detected');
    } else {
      report.info.testEndpoint = endpoint;
    }

  } catch (error) {
    report.errors.push(`❌ Validation error: ${error.message}`);
    report.isValid = false;
  }

  return report;
};

/**
 * Print validation report in a readable format
 */
export const printValidationReport = () => {
  const report = validateApiConfig();

  console.log(
    '\n' +
    '╔════════════════════════════════════════════════════════╗\n' +
    '║         API CONFIGURATION VALIDATION REPORT            ║\n' +
    '╚════════════════════════════════════════════════════════╝\n'
  );

  console.log(`⏰ Timestamp: ${report.timestamp}`);
  console.log(`📊 Status: ${report.isValid ? '✅ VALID' : '❌ INVALID'}\n`);

  // Info
  if (Object.keys(report.info).length > 0) {
    console.log('📋 Configuration Info:');
    console.log(`   Base URL: ${report.info.baseUrl}`);
    console.log(`   Build Mode: ${report.info.buildMode}`);
    console.log(`   Platform: ${report.info.environment?.platform}`);
    console.log(`   Is Development: ${report.info.environment?.isDevelopment}`);
    console.log(`   Is Emulator: ${report.info.environment?.isAndroidEmulator}\n`);
  }

  // Errors
  if (report.errors.length > 0) {
    console.log('❌ Errors:');
    report.errors.forEach(error => console.log(`   ${error}`));
    console.log('');
  }

  // Warnings
  if (report.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    report.warnings.forEach(warning => console.log(`   ${warning}`));
    console.log('');
  }

  console.log(
    '╔════════════════════════════════════════════════════════╗\n' +
    '║                   END OF REPORT                        ║\n' +
    '╚════════════════════════════════════════════════════════╝\n'
  );

  return report;
};

/**
 * Quick health check - test if API is reachable
 */
export const healthCheck = async (endpoint = '/health') => {
  try {
    console.log(`🏥 Health Check: ${apiConfig.getEndpoint(endpoint)}`);

    const response = await fetch(apiConfig.getEndpoint(endpoint), {
      method: 'GET',
      timeout: 5000,
    });

    if (response.ok) {
      console.log('✅ API is reachable!');
      return true;
    } else {
      console.log(`⚠️  API responded with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Health check failed: ${error.message}`);
    return false;
  }
};

/**
 * USAGE IN YOUR APP:
 * 
 * import { printValidationReport, healthCheck } from './config/api.validator';
 * 
 * // In your startup/splash screen:
 * useEffect(() => {
 *   const report = printValidationReport();
 *   
 *   if (!report.isValid) {
 *     Alert.alert(
 *       'API Configuration Error',
 *       'Please check the logs and update api.config.js',
 *       [{ text: 'OK', onPress: () => {} }]
 *     );
 *   }
 * }, []);
 */

export default {
  validateApiConfig,
  printValidationReport,
  healthCheck,
};
