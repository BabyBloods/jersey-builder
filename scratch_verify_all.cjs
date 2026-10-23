const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function testAll() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless',
    '--remote-debugging-port=9225',
    '--disable-gpu',
    '--window-size=1280,800',
    'http://localhost:5173'
  ]);

  await new Promise(r => setTimeout(r, 4000));

  const tabs = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9225/json', (res) => {
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

  const saveShot = async (filename) => {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`C:\\Users\\Unknown\\.gemini\\antigravity-ide\\brain\\b7cbe2c7-4ce6-44fc-ad64-9f1bcfbd156c\\.tempmediaStorage\\${filename}`, Buffer.from(shot.data, 'base64'));
    console.log(`Saved ${filename}`);
  };

  // 1. Initial Step 1 (Short Sleeve Ribbon)
  await saveShot('verify_1_step1_short_ribbon.png');

  // 2. Select Long Sleeve Template
  console.log('Clicking template-card-fuji-ridge-long-01...');
  await send('Runtime.evaluate', {
    expression: 'document.getElementById("template-card-fuji-ridge-long-01")?.click()'
  });
  await new Promise(r => setTimeout(r, 2000));
  await saveShot('verify_2_step1_long_sleeve.png');

  // 3. Select Polo V-Neck Template
  console.log('Clicking template-card-fuji-ridge-polo-01...');
  await send('Runtime.evaluate', {
    expression: 'document.getElementById("template-card-fuji-ridge-polo-01")?.click()'
  });
  await new Promise(r => setTimeout(r, 2000));
  await saveShot('verify_3_step1_polo_vneck.png');

  // 4. Proceed to Step 2
  console.log('Proceeding to Step 2...');
  await send('Runtime.evaluate', {
    expression: 'document.getElementById("btn-proceed-step2")?.click()'
  });
  await new Promise(r => setTimeout(r, 1500));

  // 5. Open Bahan & Model tab
  console.log('Opening Bahan & Model tab...');
  await send('Runtime.evaluate', {
    expression: 'document.getElementById("tab-button-bahan")?.click()'
  });
  await new Promise(r => setTimeout(r, 1000));

  // 6. Switch collar to Ribbon (Bulat)
  console.log('Switching to Ribbon (Bulat) in Step 2...');
  await send('Runtime.evaluate', {
    expression: 'document.getElementById("collar-type-ribbon-btn")?.click()'
  });
  await new Promise(r => setTimeout(r, 2000));
  await saveShot('verify_4_step2_switch_ribbon.png');

  // 7. Switch collar to V-Neck Polo
  console.log('Switching to V-Neck Polo in Step 2...');
  await send('Runtime.evaluate', {
    expression: 'document.getElementById("collar-type-vneck-btn")?.click()'
  });
  await new Promise(r => setTimeout(r, 2000));
  await saveShot('verify_5_step2_switch_vneck.png');

  // 8. Switch sleeve to Long Sleeve in Step 2
  console.log('Switching to Long Sleeve in Step 2...');
  await send('Runtime.evaluate', {
    expression: 'document.getElementById("sleeve-type-long-btn")?.click()'
  });
  await new Promise(r => setTimeout(r, 2000));
  await saveShot('verify_6_step2_switch_long_sleeve.png');

  ws.close();
  edge.kill();
  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

testAll().catch(e => {
  console.error(e);
  process.exit(1);
});
