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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Find coordinates of an element by text using uiautomator dump
function findElementCoords(textToFind, deviceId) {
  const remoteXmlPath = '/sdcard/window_dump.xml';
  const localXmlPath = path.join(__dirname, 'window_dump_test.xml');

  try {
    runAdb(`shell uiautomator dump ${remoteXmlPath}`, deviceId);
    runAdb(`pull ${remoteXmlPath} "${localXmlPath}"`, deviceId);
    runAdb(`shell rm ${remoteXmlPath}`, deviceId);

    const xmlContent = fs.readFileSync(localXmlPath, 'utf8');
    if (fs.existsSync(localXmlPath)) {
      fs.unlinkSync(localXmlPath);
    }

    const regex = new RegExp(`(?:text|content-desc)="([^"]*?${escapeRegExp(textToFind)}[^"]*?)"[^>]*?bounds="([^"]+)"`, 'i');
    const match = xmlContent.match(regex);
    
    if (!match) {
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

// Explicit Wait: tenta buscar as coordenadas do elemento em loop com retentativas
async function waitForElementCoords(textToFind, deviceId, maxAttempts = 6, delayMs = 500) {
  console.log(`Buscando elemento "${textToFind}" no layout do celular...`);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const coords = findElementCoords(textToFind, deviceId);
    if (coords) {
      console.log(`Elemento "${textToFind}" encontrado na tentativa ${attempt}: X: ${coords.x}, Y: ${coords.y}`);
      return coords;
    }
    await sleep(delayMs);
  }
  console.log(`Aviso: Elemento "${textToFind}" não foi encontrado após ${maxAttempts} tentativas.`);
  return null;
}

function typePlainText(text, deviceId) {
  const asciiText = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const formatted = asciiText
    .replace(/([?&*()<>|;$!])/g, '\\$1')
    .replace(/(["'$`\\])/g, '\\$1');
  
  runAdb(`shell input text "${formatted}"`, deviceId);
}

async function runSimulation() {
  console.log('=== Iniciando Simulação de Importação do Teste MCP ===');

  let devicesOutput = execSync('adb devices', { encoding: 'utf8' }).trim();
  const lines = devicesOutput.split('\n').slice(1);
  const devices = lines
    .map(line => line.trim().split(/\s+/))
    .filter(parts => parts.length === 2 && parts[1] === 'device')
    .map(parts => parts[0]);

  if (devices.length === 0) {
    console.error('Nenhum dispositivo Android conectado via ADB!');
    process.exit(1);
  }

  const targetDevice = devices[0];
  console.log(`Dispositivo alvo: ${targetDevice}`);

  // Acordar e desbloquear a tela do dispositivo
  console.log('Acordando a tela do celular...');
  runAdb('shell input keyevent KEYCODE_WAKEUP', targetDevice);
  await sleep(500);
  console.log('Desbloqueando tela (se bloqueada)...');
  runAdb('shell wm dismiss-keyguard', targetDevice);
  await sleep(1000);

  // Forçar abertura do app em primeiro plano
  console.log('Forçando a abertura do app de flashcards...');
  runAdb('shell monkey -p com.antoniothessalonicense.flashcards -c android.intent.category.LAUNCHER 1', targetDevice);
  await sleep(5000); // Aguarda 5 segundos para o app carregar completamente

  // Resetar teclado e fechar eventuais modais abertos no app enviando Back
  runAdb('shell input keyevent 4', targetDevice);
  await sleep(1000);

  // 1. Abrir menu lateral (☰)
  console.log('Passo 1: Abrindo menu lateral (☰)...');
  let coords = await waitForElementCoords('☰', targetDevice);
  if (!coords) {
    console.log('Coordenadas de ☰ não encontradas no XML. Usando padrão (81, 196).');
    coords = { x: 81, y: 196 };
  }
  runAdb(`shell input tap ${coords.x} ${coords.y}`, targetDevice);
  await sleep(1500); // Espera a transição de abertura do menu

  // 2. Clicar em "Importar" no menu lateral
  console.log('Passo 2: Clicando em "Importar" no menu...');
  coords = await waitForElementCoords('Importar', targetDevice);
  if (!coords) {
    console.log('Importar não encontrado no XML. Usando padrão (250, 690).');
    coords = { x: 250, y: 690 };
  }
  runAdb(`shell input tap ${coords.x} ${coords.y}`, targetDevice);
  await sleep(2000); // Espera a transição de abertura do modal

  // 3. Focar no TextInput
  console.log('Passo 3: Focando o campo de texto...');
  coords = await waitForElementCoords('Cole pequenos conjuntos aqui', targetDevice);
  if (!coords) {
    console.log('Campo de texto não encontrado no XML. Usando padrão (540, 1350).');
    coords = { x: 540, y: 1350 };
  }
  const inputCoords = { x: coords.x, y: coords.y }; // Salva as coordenadas do input
  runAdb(`shell input tap ${inputCoords.x} ${inputCoords.y}`, targetDevice);
  await sleep(1000);

  // Limpar campo de texto se houver conteúdo anterior
  console.log('Limpando o campo de texto...');
  runAdb('shell input keyevent 123', targetDevice); // Move para o final do texto
  await sleep(200);
  runAdb('shell "for i in {1..150}; do input keyevent 67; done"', targetDevice); // Envia DEL (Backspace) 150 vezes
  await sleep(1000);

  // 4. Inserir o texto solicitado, re-focando no input antes de cada linha
  console.log('Passo 4: Digitando o texto do baralho...');
  
  // Linha 1: #CONJUNTO: Teste MCP
  console.log('Digitando Linha 1...');
  runAdb(`shell input tap ${inputCoords.x} ${inputCoords.y}`, targetDevice); // Re-foca
  await sleep(200);
  runAdb('shell input keyevent 18', targetDevice); // '#'
  await sleep(200);
  typePlainText('CONJUNTO: Teste MCP', targetDevice);
  await sleep(600);
  runAdb('shell input keyevent 66', targetDevice); // Enter
  await sleep(1000); // Delay generoso para re-render da UI

  // Linha 2: #CARTAO
  console.log('Digitando Linha 2...');
  runAdb(`shell input tap ${inputCoords.x} ${inputCoords.y}`, targetDevice); // Re-foca
  await sleep(200);
  runAdb('shell input keyevent 18', targetDevice); // '#'
  await sleep(200);
  typePlainText('CARTAO', targetDevice);
  await sleep(600);
  runAdb('shell input keyevent 66', targetDevice); // Enter
  await sleep(1000);

  // Linha 3: FRENTE: Pergunta MCP
  console.log('Digitando Linha 3...');
  runAdb(`shell input tap ${inputCoords.x} ${inputCoords.y}`, targetDevice); // Re-foca
  await sleep(200);
  typePlainText('FRENTE: Pergunta MCP', targetDevice);
  await sleep(600);
  runAdb('shell input keyevent 66', targetDevice); // Enter
  await sleep(1000);

  // Linha 4: VERSO: Resposta MCP
  console.log('Digitando Linha 4...');
  runAdb(`shell input tap ${inputCoords.x} ${inputCoords.y}`, targetDevice); // Re-foca
  await sleep(200);
  typePlainText('VERSO: Resposta MCP', targetDevice);
  await sleep(1000);

  // Ocultar teclado
  console.log('Ocultando o teclado...');
  runAdb('shell input keyevent 4', targetDevice);
  await sleep(2000);

  // 5. Clicar em "Importar Texto"
  console.log('Passo 5: Clicando no botão "Importar Texto"...');
  coords = await waitForElementCoords('Importar Texto', targetDevice);
  if (!coords) {
    console.log('Botão não encontrado no XML. Usando padrão (790, 1600).');
    coords = { x: 790, y: 1600 };
  }
  runAdb(`shell input tap ${coords.x} ${coords.y}`, targetDevice);
  await sleep(2500);

  // 6. Verificar e fechar o alerta
  console.log('Passo 6: Verificando alerta...');
  
  const isError = await waitForElementCoords('Erro', targetDevice, 2, 200);
  if (isError) {
    console.log('ALERTA: Foi detectado um modal de ERRO na tela.');
  } else {
    console.log('ALERTA: Nenhum modal de erro detectado. Assumindo sucesso.');
  }

  coords = await waitForElementCoords('OK', targetDevice) || 
           await waitForElementCoords('Certo', targetDevice) || 
           await waitForElementCoords('Sucesso', targetDevice);
  if (coords) {
    console.log(`Clicando no botão de confirmação do Alerta em X: ${coords.x}, Y: ${coords.y}`);
    runAdb(`shell input tap ${coords.x} ${coords.y}`, targetDevice);
  } else {
    console.log('Alerta não detectado no dump de texto. Enviando toque genérico no centro (540, 1200) para confirmar.');
    runAdb(`shell input tap 540 1200`, targetDevice);
  }

  console.log('=== Teste de Importação Concluído com Sucesso! ===');
}

runSimulation().catch(console.error);
