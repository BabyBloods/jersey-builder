const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function run() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--window-size=1280,800',
    'http://localhost:5173'
  ]);

  await new Promise(r => setTimeout(r, 4000));

  const tabs = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9223/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const pageTab = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  let msgId = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = msgId++;
    const handler = (evt) => {
      const parsed = JSON.parse(evt.data);
      if (parsed.id === id) {
        ws.removeEventListener('message', handler);
        resolve(parsed.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await new Promise(r => ws.addEventListener('open', r));
  await send('Page.enable');
  await send('Runtime.enable');
  await new Promise(r => setTimeout(r, 4000));

  // Click "Sesuaikan" button to enter Step 2
  console.log('Clicking Sesuaikan...');
  await send('Runtime.evaluate', {
    expression: 'document.getElementById("btn-proceed-step2")?.click()'
  });
  await new Promise(r => setTimeout(r, 2000));

  // Click tab "Bahan & Model"
  console.log('Clicking Bahan & Model tab...');
  await send('Runtime.evaluate', {
    expression: 'document.getElementById("tab-button-bahan")?.click()'
  });
  await new Promise(r => setTimeout(r, 1000));

  // Click Collar V-Neck button
  console.log('Clicking collar-type-vneck-btn...');
  const vneckRes = await send('Runtime.evaluate', {
    expression: 'document.getElementById("collar-type-vneck-btn")?.click(); document.getElementById("collar-type-vneck-btn")?.outerHTML'
  });
  console.log('V-Neck button eval:', vneckRes);
  await new Promise(r => setTimeout(r, 2000));

  const shotVneck = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\Unknown\\.gemini\\antigravity-ide\\brain\\b7cbe2c7-4ce6-44fc-ad64-9f1bcfbd156c\\.tempmediaStorage\\live_collar_vneck.png', Buffer.from(shotVneck.data, 'base64'));
  console.log('Saved live_collar_vneck.png');

  // Click Collar Ribbon button
  console.log('Clicking collar-type-ribbon-btn...');
  const ribbonRes = await send('Runtime.evaluate', {
    expression: 'document.getElementById("collar-type-ribbon-btn")?.click(); document.getElementById("collar-type-ribbon-btn")?.outerHTML'
  });
  console.log('Ribbon button eval:', ribbonRes);
  await new Promise(r => setTimeout(r, 2000));

  const shotRibbon = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\Unknown\\.gemini\\antigravity-ide\\brain\\b7cbe2c7-4ce6-44fc-ad64-9f1bcfbd156c\\.tempmediaStorage\\live_collar_ribbon.png', Buffer.from(shotRibbon.data, 'base64'));
  console.log('Saved live_collar_ribbon.png');

  ws.close();
  edge.kill();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
