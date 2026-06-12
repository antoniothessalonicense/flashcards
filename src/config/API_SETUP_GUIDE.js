/**
 * API Configuration Setup Guide
 * 
 * Este arquivo contém instruções de setup e troubleshooting para resolver
 * problemas de "host unreachable" ao acessar APIs locais do Android.
 */

// ============================================================================
// 🔧 SETUP INSTRUCTIONS
// ============================================================================

/**
 * PASSO 1: Encontrar o IP da sua máquina Windows
 * 
 * 1. Abra PowerShell (ou CMD)
 * 2. Execute: ipconfig | findstr "IPv4"
 * 3. Procure pela linha que começa com "IPv4 Address"
 * 4. Copie o IP (exemplo: 192.168.1.100)
 * 
 * ⚠️ IMPORTANTE: Certifique-se de que este IP está na mesma rede que seu
 *    celular/emulador Android
 */

/**
 * PASSO 2: Configurar o arquivo api.config.js
 * 
 * Abra: src/config/api.config.js
 * 
 * Encontre a linha:
 *   WINDOWS_MACHINE_IP: 'YOUR_WINDOWS_IP_HERE',
 * 
 * E substitua pelo seu IP real. Exemplo:
 *   WINDOWS_MACHINE_IP: '192.168.1.100',
 */

/**
 * PASSO 3: Usar o config em seus serviços de API
 * 
 * Antes (sem usar o config):
 * ────────────────────────────
 * const response = await fetch('http://192.168.1.100:3000/users');
 * 
 * Depois (com o config):
 * ────────────────────────────
 * import apiConfig from './config/api.config';
 * const response = await fetch(`${apiConfig.BASE_URL}/users`);
 * 
 * Melhor (com helpers):
 * ────────────────────────────
 * import { apiGet } from './config/api.service';
 * const users = await apiGet('/users');
 */

// ============================================================================
// 🐛 TROUBLESHOOTING GUIDE
// ============================================================================

/**
 * PROBLEMA 1: "Host Unreachable" no Emulador Android
 * 
 * CAUSA: Usando 'localhost' ou '127.0.0.1' em vez de '10.0.2.2'
 * 
 * SOLUÇÃO:
 * - O arquivo api.config.js já detecta automaticamente o emulador
 * - Certifique-se de que __DEV__ === true (desenvolvimento)
 * - Se ainda tiver problemas, verifique:
 *   1. Sua API está rodando? (netstat -ano | findstr :3000)
 *   2. Seu firewall permite conexões na porta 3000?
 *   3. Tente acessar http://10.0.2.2:3000 diretamente de um navegador
 *      dentro do emulador
 */

/**
 * PROBLEMA 2: "Host Unreachable" em Celular Físico
 * 
 * CAUSA: Usando '10.0.2.2' (funciona só em emulador) ou IP incorreto
 * 
 * SOLUÇÃO:
 * - Atualize WINDOWS_MACHINE_IP no api.config.js com seu IP real
 * - Verifique se o celular está na MESMA rede WiFi que seu PC
 * - Teste manualmente:
 *   1. No seu celular, abra um navegador
 *   2. Acesse: http://seu_ip_windows:3000
 *   3. Se não funcionar, problema é de rede (firewall, WiFi, etc.)
 */

/**
 * PROBLEMA 3: "ERR_CLEARTEXT_NOT_PERMITTED" no Android
 * 
 * CAUSA: Android 9+ não permite requisições HTTP não-criptografadas por padrão
 * 
 * SOLUÇÃO:
 * 1. Para DESENVOLVIMENTO: Configure cleartextTrafficPolicy
 *    Arquivo: android/app/src/debug/AndroidManifest.xml
 *    Adicione: android:usesCleartextTraffic="true"
 * 
 * 2. Para PRODUÇÃO: Use HTTPS (não use este arquivo em release)
 * 
 * 3. Alternativa segura:
 *    Use um proxy/VPN em produção para encriptar o tráfego
 */

/**
 * PROBLEMA 4: Aplicação buildada (APK) não conecta à API
 * 
 * CAUSA: Provável que o app foi buildado como release (não DEV)
 * 
 * SOLUÇÃO:
 * - Se é um "Development Build" (expo run:android):
 *   1. Certifique-se que __DEV__ === true
 *   2. Limpe o cache: expo prebuild --clean
 *   3. Reconstrua: expo run:android
 * 
 * - Se é um APK release:
 *   1. Verifique o PROD_API_URL no api.config.js
 *   2. Certifique-se que é uma URL válida (HTTPS)
 *   3. Em release, __DEV__ === false, então usará sempre PROD_API_URL
 */

/**
 * PROBLEMA 5: API responde no Windows mas app não conecta
 * 
 * PASSOS DE DIAGNÓSTICO:
 * 
 * 1. Verifique se a API está rodando:
 *    - Windows PowerShell: netstat -ano | findstr :3000
 *    - Você deve ver a porta 3000 em estado LISTENING
 * 
 * 2. Verifique conectividade básica:
 *    - Do emulador/celular, abra um navegador
 *    - Acesse: http://10.0.2.2:3000 (emulador) ou http://seu_ip:3000 (celular)
 *    - Se responder, é problema de app, não de rede
 * 
 * 3. Verifique o endpoint:
 *    - Seu app está chamando o endpoint correto?
 *    - Verifique os logs do navegador vs. logs da API
 *    - Use: apiConfig.getDebugInfo() para ver a URL real
 * 
 * 4. Teste com curl (do seu PC):
 *    - powershell -Command "Invoke-WebRequest -Uri 'http://localhost:3000/health'"
 *    - Se funcionar, o problema é de rede/emulador
 */

// ============================================================================
// 💡 DICAS DE PRODUÇÃO
// ============================================================================

/**
 * PARA RELEASE/PRODUÇÃO:
 * 
 * 1. Nunca deixe 'YOUR_WINDOWS_IP_HERE' no código de produção
 * 2. Configure PROD_API_URL com sua URL real (HTTPS)
 * 3. Use variáveis de ambiente se necessário (EAS Secrets)
 * 4. Sempre use HTTPS em produção (certificado SSL válido)
 * 5. Configure CORS corretamente no seu servidor backend
 * 6. Registre todos os erros de rede para debugging
 */

/**
 * PARA DESENVOLVIMENTO COM EQUIPE:
 * 
 * 1. Cada desenvolvedor deve configurar seu próprio IP
 * 2. Considere usar um servidor mock local (json-server, etc.)
 * 3. Ou use um servidor compartilhado durante desenvolvimento
 * 4. Configure um arquivo .env local (não versionado) para dados sensíveis
 */

// ============================================================================
// 🔍 DEBUGGING
// ============================================================================

/**
 * Para debugar qual URL seu app está usando:
 * 
 * 1. Adicione isto em um lugar acessível (ex: sobre do app):
 *    import apiConfig from './config/api.config';
 *    console.log(apiConfig.getDebugInfo());
 * 
 * 2. Resultado esperado:
 *    {
 *      baseUrl: "http://10.0.2.2:3000" ou "http://seu_ip:3000",
 *      platform: "android" ou "ios",
 *      isDev: true ou false,
 *      isRelease: false ou true,
 *      isEmulator: true ou false,
 *      windowsIp: "seu_ip_aqui"
 *    }
 * 
 * 3. Se a URL estiver incorreta, verifique:
 *    - O valor de __DEV__ está correto?
 *    - O platform está correto?
 *    - O WINDOWS_MACHINE_IP está configurado?
 */

export default {
  setupGuide: 'Leia este arquivo para instruções de setup',
};
