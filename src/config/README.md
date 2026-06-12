# 🚀 Configuração de API para React Native + Expo SDK 56

Solução completa para resolver problemas de "host unreachable" ao acessar APIs locais do Android (Emulador e Device Físico).

## 📁 Arquivos Criados

```
src/config/
├── api.config.js              # ⭐ Arquivo principal - configuração dinâmica
├── api.service.js             # Helpers para requisições HTTP
├── api.validator.js           # Validação e diagnóstico
├── ApiContext.example.js      # Exemplo de integração com Context
├── API_SETUP_GUIDE.js         # Guia de setup e troubleshooting
└── README.md                  # Este arquivo
```

## ⚡ Quick Start (30 segundos)

### 1. Configure seu IP do Windows

```powershell
# No PowerShell, execute:
ipconfig | findstr "IPv4"
```

Copie o IP (ex: `192.168.1.100`)

### 2. Edite `src/config/api.config.js`

```javascript
const CONFIG = {
  WINDOWS_MACHINE_IP: '192.168.1.100', // 👈 Cole seu IP aqui
  DEV_API_PORT: 3000,
  PROD_API_URL: 'https://api.flashcards.com',
  EMULATOR_HOST_ALIAS: '10.0.2.2',
};
```

### 3. Use em seu código

```javascript
import apiConfig from './config/api.config';

// Método 1: Usar a BASE_URL diretamente
const response = await fetch(`${apiConfig.BASE_URL}/users`);

// Método 2: Usar helper
const url = apiConfig.getEndpoint('/users');
const response = await fetch(url);

// Método 3: Usar serviço com tratamento de erro
import { apiGet, apiPost } from './config/api.service';
const users = await apiGet('/users');
const newCard = await apiPost('/cards', { front: 'Hello', back: 'World' });
```

## 🔧 Como Funciona

### Detecção Automática

O `api.config.js` detecta automaticamente:

| Cenário | BASE_URL |
|---------|----------|
| **Emulador Android (DEV)** | `http://10.0.2.2:3000` |
| **Device Físico Android (DEV)** | `http://SEU_IP:3000` |
| **iOS Simulator (DEV)** | `http://localhost:3000` |
| **Release/Produção** | `https://api.flashcards.com` |

### Lógica de Detecção

```javascript
// Prioridade de decisão:
1. if (isReleaseBuild) → use PROD_API_URL
2. else if (isAndroidDev && isEmulator) → use 10.0.2.2
3. else if (isAndroidDev && isDevice) → use WINDOWS_MACHINE_IP
4. else if (isIOSDev) → use localhost
5. fallback → use PROD_API_URL
```

## 🎯 Exemplos Práticos

### Exemplo 1: Integração com AppContext

```javascript
// src/context/AppContext.js
import apiConfig from '../config/api.config';

export const AppProvider = ({ children }) => {
  const [apiBaseUrl] = useState(apiConfig.BASE_URL);
  
  // ... resto do seu contexto
  
  return (
    <AppContext.Provider value={{ apiBaseUrl, ... }}>
      {children}
    </AppContext.Provider>
  );
};
```

### Exemplo 2: Serviço de API

```javascript
// src/services/userService.js
import { apiGet, apiPost, apiDelete } from '../config/api.service';

export const userService = {
  getAll: () => apiGet('/users'),
  getById: (id) => apiGet(`/users/${id}`),
  create: (data) => apiPost('/users', data),
  delete: (id) => apiDelete(`/users/${id}`),
};

// Uso em componente:
const users = await userService.getAll();
```

### Exemplo 3: Fetch Customizado

```javascript
// src/services/cardService.js
import apiConfig from '../config/api.config';

export const cardService = {
  getCards: async (deckId) => {
    const url = apiConfig.getEndpoint(`/decks/${deckId}/cards`);
    const response = await fetch(url, {
      headers: apiConfig.getDefaultHeaders(),
    });
    return response.json();
  },
};
```

## 🐛 Troubleshooting

### ❌ "Host Unreachable" no Emulador

**Checklist:**

```bash
# 1. API está rodando?
netstat -ano | findstr :3000

# 2. Firewall permite a porta?
# Windows Firewall → Permitir apps pelo firewall

# 3. Emulador consegue acessar a URL?
# Abra navegador no emulador e acesse: http://10.0.2.2:3000

# 4. Código está usando 10.0.2.2?
import apiConfig from './config/api.config';
console.log(apiConfig.BASE_URL); // Deve mostrar http://10.0.2.2:3000
```

### ❌ "Host Unreachable" em Device Físico

**Checklist:**

```bash
# 1. Celular está na mesma rede WiFi?
# Vá para Configurações → WiFi → verifique a rede

# 2. IP do Windows está correto?
ipconfig | findstr "IPv4"

# 3. Celular consegue acessar?
# Navegador → http://seu_ip_windows:3000

# 4. Firewall Windows permite?
# Settings → Windows Defender Firewall → Allow app through firewall
```

### ❌ "ERR_CLEARTEXT_NOT_PERMITTED"

**Solução para Android 9+:**

```xml
<!-- android/app/src/debug/AndroidManifest.xml -->
<application
  android:usesCleartextTraffic="true"
  ...>
</application>
```

> ⚠️ Isso é APENAS para desenvolvimento. Em produção, use HTTPS.

## 🧪 Validação da Configuração

```javascript
import { printValidationReport, healthCheck } from './config/api.validator';

// No seu App.js ou splash screen:
useEffect(() => {
  const report = printValidationReport();
  
  if (!report.isValid) {
    console.error('❌ API Config invalid!', report.errors);
  }
  
  // Testar se a API está acessível
  healthCheck('/health');
}, []);
```

## 📊 Debug Info

```javascript
import apiConfig from './config/api.config';

// Ver informações de debug:
console.log(apiConfig.getDebugInfo());

// Output:
// {
//   baseUrl: "http://10.0.2.2:3000",
//   platform: "android",
//   isDev: true,
//   isRelease: false,
//   isEmulator: true,
//   windowsIp: "192.168.1.100"
// }
```

## 🚀 Melhores Práticas

✅ **DO:**

- Use `apiConfig.BASE_URL` em vez de hardcoding URLs
- Use `apiConfig.getEndpoint(path)` para construir URLs
- Configure o IP do Windows em `api.config.js`
- Valide a configuração no startup do app
- Use HTTPS em produção sempre

❌ **DON'T:**

- Hardcode `http://localhost:3000` (falha em device físico)
- Commit o arquivo com IP real em repositório público
- Use HTTP em produção
- Ignore avisos sobre WINDOWS_MACHINE_IP não configurado
- Teste com IP `127.0.0.1` ou `localhost` em emulador

## 📱 Testando com Diferentes Ambientes

### Emulador Android

```bash
# Build e run
expo run:android

# Verificar URL
console.log(apiConfig.BASE_URL); // http://10.0.2.2:3000
```

### Device Físico

```bash
# 1. Conectar celular por USB
# 2. Build para device
expo run:android

# Verificar URL (deve usar seu IP)
console.log(apiConfig.BASE_URL); // http://192.168.1.100:3000
```

### iOS Simulator

```bash
expo run:ios

# Verificar URL
console.log(apiConfig.BASE_URL); // http://localhost:3000
```

## 🔐 Produção

Para produção, certifique-se de:

1. **PROD_API_URL** aponta para seu servidor real
2. URL usa **HTTPS** (SSL válido)
3. Remover/comentar avisos de desenvolvimento
4. Usar variáveis de ambiente se necessário (EAS Secrets)

```javascript
// Exemplo de produção
const CONFIG = {
  PROD_API_URL: 'https://api.flashcards.production.com',
  // ...
};
```

## 📚 Referência de Funções

### `apiConfig.BASE_URL`
A URL base da API determinada automaticamente

```javascript
const url = `${apiConfig.BASE_URL}/users`;
```

### `apiConfig.getEndpoint(path)`
Constrói uma URL completa para um endpoint

```javascript
const url = apiConfig.getEndpoint('/users'); // http://10.0.2.2:3000/users
```

### `apiConfig.getDefaultHeaders()`
Headers padrão para requisições HTTP

```javascript
const response = await fetch(url, {
  headers: apiConfig.getDefaultHeaders(),
});
```

### `apiConfig.getDebugInfo()`
Informações de debug do ambiente

```javascript
console.log(apiConfig.getDebugInfo());
```

### `apiConfig.ENVIRONMENT`
Flags do ambiente

```javascript
if (apiConfig.ENVIRONMENT.isDevelopment) {
  // Código de desenvolvimento
}
```

## 🤝 Suporte

Se ainda tiver problemas:

1. Verifique `API_SETUP_GUIDE.js` para troubleshooting detalhado
2. Use `api.validator.js` para diagnosticar
3. Verifique os logs com `printValidationReport()`
4. Abra um issue com a saída de `getDebugInfo()`

---

**✨ Bom desenvolvimento! Agora você pode acessar sua API local sem problemas de "host unreachable".**

