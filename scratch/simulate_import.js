const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper to run ADB command and return stdout
function runAdb(cmd, deviceId = null) {
  const prefix = deviceId ? `adb -s ${deviceId} ` : 'adb ';
  try {
    return execSync(prefix + cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (err) {
    throw new Error(`Erro ao executar comando ADB: "${prefix + cmd}". Detalhes: ${err.message}`);
  }
}

// Helper to sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Find coordinates of an element by text using uiautomator dump
function findElementCoords(textToFind, deviceId) {
  const remoteXmlPath = '/sdcard/window_dump.xml';
  const localXmlPath = path.join(__dirname, 'window_dump.xml');

  try {
    // 1. Dump UI hierarchy XML on device
    runAdb(`shell uiautomator dump ${remoteXmlPath}`, deviceId);
    
    // 2. Pull the XML file to local directory
    runAdb(`pull ${remoteXmlPath} "${localXmlPath}"`, deviceId);
    
    // 3. Remove the XML file from device to clean up
    runAdb(`shell rm ${remoteXmlPath}`, deviceId);

    // 4. Read XML file
    const xmlContent = fs.readFileSync(localXmlPath, 'utf8');
    
    // 5. Clean up local XML file
    if (fs.existsSync(localXmlPath)) {
      fs.unlinkSync(localXmlPath);
    }

    // 6. Find node matching text
    // We match text="..." or content-desc="..." containing textToFind (case-insensitive)
    const regex = new RegExp(`(?:text|content-desc)="([^"]*?${escapeRegExp(textToFind)}[^"]*?)"[^>]*?bounds="([^"]+)"`, 'i');
    const match = xmlContent.match(regex);
    
    if (!match) {
      // Fallback: search for node with the text in a less strict way
      const fallbackRegex = new RegExp(`bounds="([^"]+)"[^>]*?(?:text|content-desc)="([^"]*?${escapeRegExp(textToFind)}[^"]*?)"`, 'i');
      const fallbackMatch = xmlContent.match(fallbackRegex);
      if (fallbackMatch) {
        return parseBounds(fallbackMatch[1]);
      }
      return null;
    }

    return parseBounds(match[2]);
  } catch (error) {
    console.error(`Erro ao buscar elemento com texto "${textToFind}":`, error.message);
    if (fs.existsSync(localXmlPath)) {
      fs.unlinkSync(localXmlPath);
    }
    return null;
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseBounds(boundsStr) {
  // Format: [x1,y1][x2,y2]
  const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!match) return null;
  
  const x1 = parseInt(match[1], 10);
  const y1 = parseInt(match[2], 10);
  const x2 = parseInt(match[3], 10);
  const y2 = parseInt(match[4], 10);
  
  return {
    x: Math.round((x1 + x2) / 2),
    y: Math.round((y1 + y2) / 2)
  };
}

// Safely type text via ADB (spaces need to be escaped or replaced by %s)
function typeText(text, deviceId) {
  // Convert non-ASCII characters to ASCII equivalents to prevent Android 'input text' NullPointerException crash
  const asciiText = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const formatted = asciiText
    .replace(/ /g, '%s')
    .replace(/\n/g, '\\n')
    .replace(/([#?&*()<>|;$!])/g, '\\$1')
    .replace(/(["'$`\\])/g, '\\$1');
  
  runAdb(`shell input text "${formatted}"`, deviceId);
}

async function runSimulation() {
  console.log('=== Iniciando Simulação de Importação ===');

  // Check connected devices
  let devicesOutput = '';
  try {
    devicesOutput = execSync('adb devices', { encoding: 'utf8' }).trim();
  } catch (err) {
    console.error('ADB não está instalado ou não está no PATH de ambiente.');
    process.exit(1);
  }

  const lines = devicesOutput.split('\n').slice(1);
  const devices = lines
    .map(line => line.trim().split(/\s+/))
    .filter(parts => parts.length === 2 && parts[1] === 'device')
    .map(parts => parts[0]);

  if (devices.length === 0) {
    console.error('\nNenhum dispositivo Android conectado via ADB!');
    console.log('Por favor, certifique-se de que:');
    console.log('1. Seu celular está conectado via USB ou Wireless Debugging.');
    console.log('2. A depuração USB (USB Debugging) está ativa nas opções do desenvolvedor.');
    console.log('3. Se você usa Wi-Fi, execute: adb connect <IP_DO_CELULAR>:<PORTA>');
    process.exit(1);
  }

  const targetDevice = devices[0];
  console.log(`Dispositivo alvo detectado: ${targetDevice}`);

  // Dismiss any keyboard or open modals to start from a clean home screen state
  console.log('\nResetando estado da tela (fechando teclado/modais)...');
  try {
    runAdb('shell input keyevent 4', targetDevice); // Back button
    await sleep(500);
    runAdb('shell input keyevent 4', targetDevice); // Back button again
    await sleep(1000);
  } catch (e) {
    // Ignore if adb command fails here
  }

  // Check if the import modal is already open (should be closed now, but check just in case)
  console.log('Verificando se o modal de importação está aberto...');
  let coords = findElementCoords('Cole pequenos conjuntos aqui', targetDevice);
  
  if (coords) {
    console.log('O modal de importação já está aberto! Pulando Passos 1 e 2.');
  } else {
    // Step 1: Open side menu (tap hamburger ☰)
    console.log('\nPasso 1: Abrindo menu lateral (☰)...');
    coords = findElementCoords('☰', targetDevice);
    if (!coords) {
      console.log('Aviso: Não encontramos o ícone ☰ pelo texto. Usando coordenadas conhecidas X: 81, Y: 196...');
      coords = { x: 81, y: 196 };
    }
    
    console.log(`Tocando em X: ${coords.x}, Y: ${coords.y}`);
    runAdb(`shell input tap ${coords.x} ${coords.y}`, targetDevice);
    await sleep(1500); // Wait for menu animation

    // Step 2: Click "Importar" in menu
    console.log('\nPasso 2: Clicando em "Importar" no menu...');
    coords = findElementCoords('Importar', targetDevice);
    if (!coords) {
      console.log('Aviso: Opção "Importar" não encontrada no dump. Usando coordenadas conhecidas X: 421, Y: 1174...');
      coords = { x: 421, y: 1174 };
    }
    console.log(`Tocando em X: ${coords.x}, Y: ${coords.y}`);
    runAdb(`shell input tap ${coords.x} ${coords.y}`, targetDevice);
    await sleep(2000); // Wait for modal animation
  }

  // Step 3: Focus TextInput
  console.log('\nPasso 3: Focando o campo de texto para importação...');
  coords = findElementCoords('Cole pequenos conjuntos aqui', targetDevice);
  if (!coords) {
    console.log('Aviso: Campo de texto de importação não encontrado no dump. Usando coordenadas conhecidas X: 540, Y: 1386...');
    coords = { x: 540, y: 1386 };
  }
  console.log(`Tocando no campo de texto em X: ${coords.x}, Y: ${coords.y}`);
  runAdb(`shell input tap ${coords.x} ${coords.y}`, targetDevice);
  await sleep(1000);

  // Step 4: Write text
  console.log('\nPasso 4: Digitante/Colando o texto do baralho...');
  const cardData = '#CONJUNTO: Estudo Automatico\n#CARTAO\nFRENTE: Qual a capital da Franca?\nVERSO: Paris\n#CARTAO\nFRENTE: Qual a capital da Italia?\nVERSO: Roma';
  
  const dataLines = cardData.split('\n');
  for (let i = 0; i < dataLines.length; i++) {
    if (dataLines[i]) {
      typeText(dataLines[i], targetDevice);
      await sleep(200);
    }
    // Press Enter key to go to next line
    runAdb('shell input keyevent 66', targetDevice);
    await sleep(200);
  }
  console.log('Texto inserido com sucesso.');
  
  // Close the keyboard to reveal the "Importar Texto" button
  console.log('Ocultando o teclado para expor o botão de confirmação...');
  runAdb('shell input keyevent 4', targetDevice);
  await sleep(2000); // Wait 2s for keyboard closing animation to finish completely

  // Step 5: Tap "Importar Texto" button
  console.log('\nPasso 5: Clicando no botão "Importar Texto"...');
  coords = findElementCoords('Importar Texto', targetDevice);
  if (!coords) {
    console.log('Aviso: Botão "Importar Texto" não encontrado no dump. Usando coordenadas conhecidas X: 800, Y: 1600...');
    coords = { x: 800, y: 1600 };
  }
  console.log(`Tocando em X: ${coords.x}, Y: ${coords.y}`);
  runAdb(`shell input tap ${coords.x} ${coords.y}`, targetDevice);
  
  console.log('\n=== Simulação Finalizada! ===');
  console.log('Verifique a tela do seu celular para confirmar o alerta de importação realizada.');
}

runSimulation();
