// Takes this entry's screenshots: real chrome-headless-shell renders of the
// app's staged scenes (see shots.json), saved as JPEG into screenshots/.
// Run with the app served locally first: `node serve.ts --port 8902`.
// Cover scenes capture the #cover canvas element (the app's own drawing of the
// exported poster); the editor scene captures the whole page.
import puppeteer from 'puppeteer';
import { writeFileSync } from 'node:fs';

const BASE = 'http://localhost:8902';
const SCENES = [
  { name: '1-cover.jpg', query: '?shot=cover&size=wide&caption=Sunset%20Heist&tagline=Boulevard%20Nights&grade=sunset', w: 1280, h: 720, element: '#cover' },
  { name: '2-editor.jpg', query: '?shot=editor&size=square&caption=Sunset%20Heist&tagline=Boulevard%20Nights&grade=sunset', w: 1280, h: 720, element: null },
  { name: '3-cover-portrait.jpg', query: '?shot=cover&size=portrait&caption=Neon%20Run&tagline=Vice%20Nights&grade=neon', w: 1024, h: 1280, element: '#cover' },
  { name: '4-cover-square.jpg', query: '?shot=cover&size=square&caption=Sunset%20Heist&tagline=Boulevard%20Nights&grade=dusk', w: 1024, h: 1024, element: '#cover' },
];

const browser = await puppeteer.launch({
  headless: 'shell',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-color-profile=srgb'],
});
try {
  const page = await browser.newPage();
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
  page.on('console', (msg) => { if (msg.type() === 'error') console.log('CONSOLE:', msg.text()); });
  for (const scene of SCENES) {
    await page.setViewport({ width: scene.w, height: scene.h, deviceScaleFactor: 1 });
    await page.goto(`${BASE}/${scene.query}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForFunction('window.__shotReady === true', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 350)); // one composed frame settles
    let shot;
    if (scene.element) {
      const el = await page.$(scene.element);
      shot = await el.screenshot({ type: 'jpeg', quality: 82 });
    } else {
      shot = await page.screenshot({ type: 'jpeg', quality: 82 });
    }
    writeFileSync(`screenshots/${scene.name}`, shot);
    console.log(scene.name, shot.length, 'bytes');
  }
} finally {
  await browser.close();
}
console.log('SHOTS DONE');
