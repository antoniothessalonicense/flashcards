#!/usr/bin/env node

/**
 * Quick API Connection Tester
 * 
 * Execute via: node test-api-connection.js
 * Ou adicione ao package.json como script:
 *   "scripts": {
 *     "test:api": "node scripts/test-api-connection.js"
 *   }
 * 
 * Depois execute: npm run test:api
 */

const http = require('http');
const { exec } = require('child_process');
const os = require('os');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getWindowsIP() {
  return new Promise((resolve) => {
    exec('ipconfig | findstr "IPv4"', (error, stdout, stderr) => {
      if (error) {
        resolve(null);
        return;
      }

      const lines = stdout.split('\n');
      let ip = null;

      lines.forEach((line) => {
        const match = line.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (match && !match[1].startsWith('127.')) {
          ip = match[1];
        }
      });

      resolve(ip);
    });
  });
}

async function testConnection(url, label) {
  return new Promise((resolve) => {
    log(`\n🔌 Testing: ${label}`, 'cyan');
    log(`   URL: ${url}`, 'gray');

    const startTime = Date.now();

    const req = http.get(url, { timeout: 5000 }, (res) => {
      const elapsed = Date.now() - startTime;
      log(`   ✅ Connected (${elapsed}ms)`, 'green');
      log(`   Status: ${res.statusCode}`, 'gray');
      resolve(true);
    });

    req.on('error', (error) => {
      const elapsed = Date.now() - startTime;
      log(`   ❌ Failed (${elapsed}ms): ${error.code || error.message}`, 'red');
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      const elapsed = Date.now() - startTime;
      log(`   ❌ Timeout (${elapsed}ms)`, 'red');
      resolve(false);
    });
  });
}

async function main() {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║     API Connection Tester for React Native Flashcards   ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝\n', 'cyan');

  // Get Windows IP
  const windowsIP = await getWindowsIP();

  if (windowsIP) {
    log(`Your Windows IP: ${windowsIP}`, 'green');
  } else {
    log('⚠️  Could not auto-detect Windows IP', 'yellow');
    log('   Run: ipconfig | findstr "IPv4"', 'gray');
  }

  log('\nTesting common development URLs:\n', 'blue');

  const tests = [];

  // Test localhost (for iOS simulator)
  tests.push(testConnection('http://localhost:3000/health', 'localhost (iOS)'));

  // Test 10.0.2.2 (Android emulator)
  tests.push(testConnection('http://10.0.2.2:3000/health', 'Emulator (Android)'));

  // Test Windows IP if available
  if (windowsIP) {
    tests.push(
      testConnection(`http://${windowsIP}:3000/health`, `Device (${windowsIP})`)
    );
  }

  // Test common alternative ports
  tests.push(testConnection('http://localhost:8000/health', 'localhost:8000'));
  tests.push(testConnection('http://localhost:5000/health', 'localhost:5000'));

  const results = await Promise.all(tests);

  // Summary
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║                      SUMMARY                           ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝\n', 'cyan');

  const successCount = results.filter(Boolean).length;
  const totalCount = results.length;

  if (successCount > 0) {
    log(`✅ ${successCount}/${totalCount} connections successful`, 'green');
    log('\n✨ Your API is reachable! Update api.config.js with the working URL.', 'green');
  } else {
    log(`❌ ${totalCount}/${totalCount} connections failed`, 'red');
    log('\nTroubleshooting checklist:', 'yellow');
    log('  1. Is your API server running?', 'gray');
    log('     Windows: netstat -ano | findstr :3000', 'gray');
    log('  2. Is the port correct? (default: 3000)', 'gray');
    log('  3. Check Windows Firewall settings', 'gray');
    log('  4. Is the device/emulator on the same network?', 'gray');
  }

  log('\nNext steps:', 'blue');
  log('  1. Edit src/config/api.config.js', 'gray');
  log('  2. Update WINDOWS_MACHINE_IP with your IP', 'gray');
  log('  3. Adjust DEV_API_PORT if needed', 'gray');
  log('  4. Update PROD_API_URL for production\n', 'gray');
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});
