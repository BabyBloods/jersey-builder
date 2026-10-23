const { spawn } = require('child_process');
const http = require('http');

async function run() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--window-size=1280,800',
    'http://localhost:5173'
  ]);

  await new Promise(r => setTimeout(r, 4000));

  // Get WebSocket debugger URL
  const tabs = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const pageTab = tabs.find(t => t.type === 'page');
  console.log('Page tab found:', pageTab.id);

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

  console.log('Connected to CDP');
  await send('Page.enable');
  await send('Runtime.enable');

  // Wait 4s for initial load
  await new Promise(r => setTimeout(r, 4000));

  // 1. Click Long Sleeve Template
  console.log('Clicking template-card-fuji-ridge-long-01...');
  await send('Runtime.evaluate', {
    expression: 'document.getElementById("template-card-fuji-ridge-long-01")?.click()'
  });
  await new Promise(r => setTimeout(r, 2000));

  const longShot = await send('Page.captureScreenshot', { format: 'png' });
  const fs = require('fs');
  fs.writeFileSync('C:\\Users\\Unknown\\.gemini\\antigravity-ide\\brain\\b7cbe2c7-4ce6-44fc-ad64-9f1bcfbd156c\\.tempmediaStorage\\test_long_sleeve.png', Buffer.from(longShot.data, 'base64'));
  console.log('Long sleeve screenshot saved.');

  // 2. Click Polo Short Sleeve Template
  console.log('Clicking template-card-fuji-ridge-polo-01...');
  await send('Runtime.evaluate', {
    expression: 'document.getElementById("template-card-fuji-ridge-polo-01")?.click()'
  });
  await new Promise(r => setTimeout(r, 2000));

  const poloShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\Unknown\\.gemini\\antigravity-ide\\brain\\b7cbe2c7-4ce6-44fc-ad64-9f1bcfbd156c\\.tempmediaStorage\\test_polo_vneck.png', Buffer.from(poloShot.data, 'base64'));
  console.log('Polo V-Neck screenshot saved.');

  ws.close();
  edge.kill();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
