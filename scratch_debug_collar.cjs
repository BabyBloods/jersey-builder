const { spawn } = require('child_process');
const http = require('http');

async function debug() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--window-size=1280,800',
    'http://localhost:5173'
  ]);

  await new Promise(r => setTimeout(r, 4000));

  const tabs = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9224/json', (res) => {
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
  await send('Console.enable');

  ws.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Console.messageAdded' || msg.method === 'Runtime.consoleAPICalled') {
      console.log('BROWSER LOG:', JSON.stringify(msg.params));
    }
  });

  await new Promise(r => setTimeout(r, 4000));

  // Step 2
  await send('Runtime.evaluate', { expression: 'document.getElementById("btn-proceed-step2")?.click()' });
  await new Promise(r => setTimeout(r, 1000));

  // Tab bahan
  await send('Runtime.evaluate', { expression: 'document.getElementById("tab-button-bahan")?.click()' });
  await new Promise(r => setTimeout(r, 1000));

  // Before click
  const before = await send('Runtime.evaluate', {
    expression: 'document.getElementById("collar-type-vneck-btn")?.className + " / " + document.getElementById("collar-type-vneck-btn")?.style.background'
  });
  console.log('Before click:', before);

  // Click
  await send('Runtime.evaluate', {
    expression: 'document.getElementById("collar-type-vneck-btn")?.click()'
  });
  await new Promise(r => setTimeout(r, 1000));

  // After click
  const after = await send('Runtime.evaluate', {
    expression: 'document.getElementById("collar-type-vneck-btn")?.style.background + " | ribbon: " + document.getElementById("collar-type-ribbon-btn")?.style.background'
  });
  console.log('After click:', after);

  // Check Three.js scene glb-collar geometry
  const collarInfo = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const c = document.querySelector('canvas');
        // Let's see if we can find glb-collar in scene
        return 'checked';
      })()
    `
  });
  console.log('Collar info:', collarInfo);

  ws.close();
  edge.kill();
  process.exit(0);
}

debug().catch(e => {
  console.error(e);
  process.exit(1);
});
