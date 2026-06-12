# 🚀 Guia de Setup Rápido - Configuração de API

## ⚡ 5 Minutos de Setup

### 1️⃣ Encontre seu IP Windows (30 segundos)

Abra **PowerShell** (Win + X, depois escolha PowerShell):

```powershell
ipconfig | findstr "IPv4"
```

Procure por uma linha assim:
```
IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

**Copie este IP** (no exemplo: `192.168.1.100`)

### 2️⃣ Configure o arquivo de API (1 minuto)

Abra: `src/config/api.config.js`

Encontre esta linha (aprox. linha 11):
```javascript
WINDOWS_MACHINE_IP: 'YOUR_WINDOWS_IP_HERE',
```

Substitua por seu IP real:
```javascript
WINDOWS_MACHINE_IP: '192.168.1.100',
```

**Pronto! ✅**

### 3️⃣ Teste a Conexão (1 minuto)

```bash
npm run test:api
```

Você deve ver algo como:
```
🔌 Testing: localhost (iOS)
   URL: http://localhost:3000/health
   ❌ Failed: ECONNREFUSED

🔌 Testing: Emulator (Android)
   URL: http://10.0.2.2:3000/health
   ✅ Connected (45ms)
   Status: 200

🔌 Testing: Device (192.168.1.100)
   URL: http://192.168.1.100:3000/health
   ✅ Connected (127ms)
   Status: 200
```

### 4️⃣ Use na sua Aplicação (2 minutos)

Em qualquer lugar do seu código:

```javascript
// Opção 1: Simples
import apiConfig from './config/api.config';
const url = `${apiConfig.BASE_URL}/users`;

// Opção 2: Com helper
import { apiGet, apiPost } from './config/api.service';
const users = await apiGet('/users');

// Opção 3: Com builder
import apiConfig from './config/api.config';
const url = apiConfig.getEndpoint('/users');
```

---

## 🎯 Qual URL será usada automaticamente?

| Cenário | URL |
|---------|-----|
| **Emulador Android** | `http://10.0.2.2:3000` ✅ |
| **Device Android (você)** | `http://SEU_IP:3000` ✅ |
| **iOS Simulator** | `http://localhost:3000` ✅ |
| **Release/Produção** | `https://api.flashcards.com` ✅ |

---

## 🐛 Ainda com problemas?

### ❌ Erro: "Host Unreachable"

```bash
# Passo 1: Verifique se sua API está rodando
netstat -ano | findstr :3000

# Passo 2: Teste conectividade manual
Invoke-WebRequest -Uri 'http://localhost:3000/health'

# Passo 3: Verifique o Firewall Windows
# Settings → Windows Defender Firewall → Allow app through firewall
```

### ❌ Erro: "Connection Refused"

- Certifique-se de que sua API **está rodando** na porta 3000
- Se está em porta diferente, edite `DEV_API_PORT` em `api.config.js`

### ❌ Erro: "ERR_CLEARTEXT_NOT_PERMITTED" (Android)

Para desenvolvimento, edite:
`android/app/src/debug/AndroidManifest.xml`

Adicione esta propriedade:
```xml
<application
  android:usesCleartextTraffic="true"
  ...>
</application>
```

> ⚠️ Isso é **apenas para desenvolvimento**

---

## 📁 Arquivos Criados

```
src/config/
├── api.config.js              ⭐ PRINCIPAL - Configuração dinâmica
├── api.service.js             Helpers para requisições
├── api.validator.js           Validação e diagnóstico
├── api.example.js             Exemplos de serviços reais
├── ApiContext.example.js      Integração com Context
├── API_SETUP_GUIDE.js         Troubleshooting detalhado
└── README.md                  Documentação completa

+ test-api-connection.js       🧪 Script de teste
```

---

## 📊 Debug: Ver qual URL está sendo usada

Em qualquer componente:

```javascript
import apiConfig from './config/api.config';

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

---

## ✅ Checklist Final

- [ ] IP do Windows configurado em `api.config.js`
- [ ] API está rodando em `localhost:3000`
- [ ] `npm run test:api` passa no mínimo um teste
- [ ] Firewall do Windows permite conexões na porta 3000
- [ ] Device/Emulador está na mesma rede WiFi (para device físico)

---

## 💡 Próximos Passos

1. **Integre com seus serviços de API**
   - Veja exemplos em `src/config/api.example.js`

2. **Configure em sua AppContext** (opcional)
   - Veja exemplo em `src/config/ApiContext.example.js`

3. **Para Produção:**
   - Atualize `PROD_API_URL` com sua URL real (HTTPS)
   - Use variáveis de ambiente se necessário

---

## 🎓 Referência Rápida

```javascript
// 1. Importar
import apiConfig from './config/api.config';
import { apiGet, apiPost, apiPut, apiDelete } from './config/api.service';

// 2. Usar
const baseUrl = apiConfig.BASE_URL;           // "http://10.0.2.2:3000"
const url = apiConfig.getEndpoint('/users');  // "http://10.0.2.2:3000/users"

// 3. Requisições
const users = await apiGet('/users');
const user = await apiPost('/users', { name: 'João' });
await apiPut(`/users/${id}`, { name: 'João Silva' });
await apiDelete(`/users/${id}`);

// 4. Debug
console.log(apiConfig.getDebugInfo());
apiConfig.printValidationReport?.();
```

---

**✨ Pronto para desenvolvedor! Agora você pode acessar sua API local sem "host unreachable".**

Dúvidas? Veja a documentação completa em `src/config/README.md`
