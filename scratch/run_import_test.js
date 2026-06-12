const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const deviceId = '192.168.100.2:42915';

function runAdb(cmd) {
  const prefix = `adb -s ${deviceId} `;
  try {
    return execSync(prefix + cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (err) {
    throw new Error(`Erro no ADB: "${prefix + cmd}". Detalhes: ${err.message}`);
  }
}

// Remove acentos e normaliza para ASCII
function normalizeText(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[']/g, '') // remove aspas simples
    .replace(/[ãõ]/g, 'a')
    .replace(/[ç]/g, 'c');
}

const payload = `#CONJUNTO: Inglês Essencial 2
#DESCRIÇÃO: Vocabulário básico

#CARTÃO
FRENTE: Apple
VERSO: Maçã

#CARTÃO
FRENTE: House
VERSO: Casa

#CARTÃO
FRENTE: Watermelon
VERSO: Melancia
#CARTÃO
FRENTE: I
VERSO: eu
#CARTÃO
FRENTE: he
VERSO: ele
#CARTÃO
FRENTE: she
VERSO: ela
#CARTÃO
FRENTE: it
VERSO: ele/ela (objeto ou animal)
#CARTÃO
FRENTE: we
VERSO: nós
#CARTÃO
FRENTE: they
VERSO: eles/elas
#CARTÃO
FRENTE: me
VERSO: me/mim
#CARTÃO
FRENTE: you
VERSO: tu/você
#CARTÃO
FRENTE: him
VERSO: ele (objeto)
#CARTÃO
FRENTE: her
VERSO: dela (objeto)
#CARTÃO
FRENTE: us
VERSO: nós (objeto)
#CARTÃO
FRENTE: them
VERSO: eles/elas (objeto)
#CARTÃO
FRENTE: my
VERSO: meu/minha
#CARTÃO
FRENTE: your
VERSO: teu/tua/seu/sua
#CARTÃO
FRENTE: his
VERSO: dele
#CARTÃO
FRENTE: its
VERSO: dele/dela (objeto ou animal)
#CARTÃO
FRENTE: our
VERSO: nosso/nossa
#CARTÃO
FRENTE: their
VERSO: deles/delas
#CARTÃO
FRENTE: mine
VERSO: meu/minha (posse)
#CARTÃO
FRENTE: yours
VERSO: teu/tua/seu/sua (posse)
#CARTÃO
FRENTE: hers
VERSO: dela (posse)
#CARTÃO
FRENTE: ours
VERSO: nosso/nossa (posse)
#CARTÃO
FRENTE: theirs
VERSO: deles/delas (posse)
#CARTÃO
FRENTE: myself
VERSO: eu mesmo/a
#CARTÃO
FRENTE: yourself
VERSO: você mesmo/a
#CARTÃO
FRENTE: himself
VERSO: ele mesmo
#CARTÃO
FRENTE: herself
VERSO: ela mesma
#CARTÃO
FRENTE: itself
VERSO: ele/ela mesmo/a (objeto ou animal)
#CARTÃO
FRENTE: ourselves
VERSO: nós mesmos/as
#CARTÃO
FRENTE: yourselves
VERSO: vocês mesmos/as
#CARTÃO
FRENTE: themselves
VERSO: eles/elas mesmos/as
#CARTÃO
FRENTE: this
VERSO: este/esta/isso
#CARTÃO
FRENTE: that
VERSO: aquele/aquela/aquilo
#CARTÃO
FRENTE: these
VERSO: estes/estas
#CARTÃO
FRENTE: those
VERSO: aqueles/aquelas
#CARTÃO
FRENTE: who
VERSO: quem
#CARTÃO
FRENTE: whom
VERSO: quem (objeto formal)
#CARTÃO
FRENTE: whose
VERSO: cujo/cuja
#CARTÃO
FRENTE: which
VERSO: qual/quais
#CARTÃO
FRENTE: what
VERSO: o que/o qual
#CARTÃO
FRENTE: whoever
VERSO: quem quer que
#CARTÃO
FRENTE: whomever
VERSO: quem quer que (objeto)
#CARTÃO
FRENTE: whichever
VERSO: qualquer um que
#CARTÃO
FRENTE: whatever
VERSO: qualquer que
#CARTÃO
FRENTE: each other
VERSO: um ao outro
#CARTÃO
FRENTE: one another
VERSO: uns aos outros
#CARTÃO
FRENTE: one
VERSO: um/uma
#CARTÃO
FRENTE: someone
VERSO: alguém
#CARTÃO
FRENTE: somebody
VERSO: alguém
#CARTÃO
FRENTE: something
VERSO: algo
#CARTÃO
FRENTE: anyone
VERSO: qualquer um/alguém
#CARTÃO
FRENTE: anybody
VERSO: qualquer um/alguém
#CARTÃO
FRENTE: anything
VERSO: qualquer coisa
#CARTÃO
FRENTE: everyone
VERSO: todos/todo mundo
#CARTÃO
FRENTE: everybody
VERSO: todos/todo mundo
#CARTÃO
FRENTE: everything
VERSO: tudo
#CARTÃO
FRENTE: no one
VERSO: ninguém
#CARTÃO
FRENTE: nobody
VERSO: ninguém
#CARTÃO
FRENTE: nothing
VERSO: nada
#CARTÃO
FRENTE: another
VERSO: outro/outra
#CARTÃO
FRENTE: other
VERSO: outro/outra
#CARTÃO
FRENTE: others
VERSO: outros/outras
#CARTÃO
FRENTE: either
VERSO: qualquer um dos dois
#CARTÃO
FRENTE: neither
VERSO: nenhum dos dois
#CARTÃO
FRENTE: such
VERSO: tal
#CARTÃO
FRENTE: same
VERSO: mesmo/mesma
#CARTÃO
FRENTE: all
VERSO: todos/tudo
#CARTÃO
FRENTE: any
VERSO: qualquer
#CARTÃO
FRENTE: some
VERSO: algum/alguns
#CARTÃO
FRENTE: several
VERSO: vários
#CARTÃO
FRENTE: few
VERSO: poucos
#CARTÃO
FRENTE: many
VERSO: muitos
#CARTÃO
FRENTE: much
VERSO: muito (singular)
#CARTÃO
FRENTE: more
VERSO: mais
#CARTÃO
FRENTE: most
VERSO: a maioria
#CARTÃO
FRENTE: none
VERSO: nenhum
#CARTÃO
FRENTE: each
VERSO: cada
#CARTÃO
FRENTE: every
VERSO: todo/cada
#CARTÃO
FRENTE: both
VERSO: ambos
#CARTÃO
FRENTE: enough
VERSO: suficiente
#CARTÃO
FRENTE: little
VERSO: pouco
#CARTÃO
FRENTE: certain
VERSO: certo/certa
#CARTÃO
FRENTE: about
VERSO: aproximadamente; a respeito de`;

async function isTypingComplete() {
  const remoteXmlPath = '/sdcard/window_dump.xml';
  const localXmlPath = path.join(__dirname, 'window_dump_verify.xml');
  
  try {
    // Tenta tirar o dump ignorando idle state se necessário
    runAdb(`shell uiautomator dump ${remoteXmlPath}`);
    runAdb(`pull ${remoteXmlPath} "${localXmlPath}"`);
    runAdb(`shell rm ${remoteXmlPath}`);
    
    if (fs.existsSync(localXmlPath)) {
      const content = fs.readFileSync(localXmlPath, 'utf8');
      fs.unlinkSync(localXmlPath);
      
      // Verifica se a última palavra do baralho ("about") foi escrita
      if (content.toLowerCase().includes('about') && content.toLowerCase().includes('respeito')) {
        return true;
      }
    }
  } catch (err) {
    console.log('Aviso ao ler estado de digitação:', err.message);
  }
  return false;
}

async function run() {
  console.log('=== Iniciando Simulação de Importação do Deck Longo ===');
  const lines = payload.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = normalizeText(rawLine).trim();
    
    if (line.length === 0) {
      runAdb('shell input keyevent 66');
    } else if (line.startsWith('#')) {
      runAdb('shell input keyevent 18');
      await sleep(15);
      const rest = line.substring(1).trim();
      if (rest.length > 0) {
        runAdb(`shell "input text '${rest}'"`);
      }
      runAdb('shell input keyevent 66');
    } else {
      runAdb(`shell "input text '${line}'"`);
      runAdb('shell input keyevent 66');
    }
    await sleep(40); // digitação otimizada
  }
  
  console.log('Digitação enviada ao celular! Aguardando o processamento do InputDispatcher do Android...');
  
  // Dynamic Wait Loop
  let complete = false;
  for (let attempt = 1; attempt <= 10; attempt++) {
    console.log(`Verificando se a digitação terminou (tentativa ${attempt}/10)...`);
    await sleep(8000); // aguarda 8 segundos antes de verificar de novo
    complete = await isTypingComplete();
    if (complete) {
      console.log('Confirmação recebida! Toda a digitação foi processada com sucesso.');
      break;
    }
  }
  
  if (!complete) {
    console.log('Aviso: Não foi possível confirmar a digitação completa no dump. Prosseguindo com o clique por timeout.');
  }
  
  // Coordenadas do botão "Importar Texto": Centro: 741, 1655
  console.log('Clicando em "Importar Texto"...');
  runAdb('shell input tap 741 1655');
  await sleep(4000); // tempo para o SQLite processar a criação e exibir o modal de sucesso
  
  console.log('Confirmando alerta de sucesso...');
  // Toca no centro do botão OK do alerta de sucesso
  runAdb('shell input tap 540 1200');
  await sleep(1000);
  
  console.log('=== Simulação de Importação Finalizada com Sucesso! ===');
}

run().catch(console.error);
