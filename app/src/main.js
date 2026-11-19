// Wires the page: load photos from the machine, assign them to the three
// panels, drag and zoom each photo inside its panel, edit the caption, pick
// a colour grade, and export the poster as a PNG in one of three post sizes.
// Photos are read locally with object URLs and are never uploaded.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, SIZES, GRADES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const taglineInput = document.getElementById('tagline');
const status = document.getElementById('status');
const photoList = document.getElementById('photo-list');
const panelButtons = [...document.querySelectorAll('[data-panel]')];
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panx');
const panYInput = document.getElementById('pany');

const state = {
  size: 'square',
  grade: 'sunset',
  caption: 'Sunset Heist',
  tagline: 'Boulevard Nights',
  selected: 0,
  photos: [], // { img, name }
  panels: [
    { photo: null, scale: 1, ox: 0, oy: 0 },
    { photo: null, scale: 1, ox: 0, oy: 0 },
    { photo: null, scale: 1, ox: 0, oy: 0 },
  ],
};

function redraw() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  drawCover(canvas, state);
  syncPanelControls();
}

function syncPanelControls() {
  const panel = state.panels[state.selected];
  zoomInput.value = String(Math.round((panel.scale || 1) * 100));
  panXInput.value = String(Math.round((panel.ox || 0) * 100));
  panYInput.value = String(Math.round((panel.oy || 0) * 100));
  panelButtons.forEach((btn, i) => {
    btn.classList.toggle('active', i === state.selected);
    btn.textContent = `Panel ${i + 1}${state.panels[i].photo ? ' ●' : ''}`;
  });
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function addPhotoFiles(files) {
  let added = 0;
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const img = await loadImage(URL.createObjectURL(file));
    state.photos.push({ img, name: file.name });
    added += 1;
  }
  if (!added) return;
  renderPhotoList();
  // First photo fills every empty panel, so one photo is enough for a poster.
  const first = state.photos[state.photos.length - added].img;
  state.panels.forEach((p) => { if (!p.photo) p.photo = first; });
  status.textContent = `Loaded ${added} photo${added > 1 ? 's' : ''} — drag a panel photo to position it.`;
  redraw();
}

function renderPhotoList() {
  photoList.innerHTML = '';
  state.photos.forEach((entry, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb';
    btn.textContent = entry.name;
    btn.title = `Use ${entry.name} in panel ${state.selected + 1}`;
    btn.addEventListener('click', () => {
      state.panels[state.selected].photo = entry.img;
      status.textContent = `${entry.name} is now in panel ${state.selected + 1}.`;
      redraw();
    });
    photoList.appendChild(btn);
  });
}

document.getElementById('photos').addEventListener('change', (e) => addPhotoFiles(e.target.files));

document.getElementById('sample').addEventListener('click', async () => {
  const img = await loadImage('samples/vice-boulevard.png');
  state.photos.push({ img, name: 'vice-boulevard.png (sample)' });
  renderPhotoList();
  state.panels.forEach((p) => { if (!p.photo) p.photo = img; });
  status.textContent = 'Sample photo loaded — replace it with your own photos any time.';
  redraw();
});

document.getElementById('fill-all').addEventListener('click', () => {
  const panel = state.panels[state.selected];
  if (!panel.photo) { status.textContent = 'Put a photo in this panel first.'; return; }
  state.panels.forEach((p) => { p.photo = panel.photo; });
  status.textContent = 'All three panels now use this photo.';
  redraw();
});

panelButtons.forEach((btn, i) => {
  btn.addEventListener('click', () => { state.selected = i; redraw(); });
});

document.getElementById('size').addEventListener('change', (e) => {
  state.size = e.target.value;
  redraw();
});
document.getElementById('grade').addEventListener('change', (e) => {
  state.grade = e.target.value;
  redraw();
});
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
taglineInput.addEventListener('input', () => { state.tagline = taglineInput.value; redraw(); });
zoomInput.addEventListener('input', () => {
  state.panels[state.selected].scale = Math.max(0.5, Math.min(3, Number(zoomInput.value) / 100));
  redraw();
});
panXInput.addEventListener('input', () => {
  state.panels[state.selected].ox = Math.max(-0.5, Math.min(0.5, Number(panXInput.value) / 100));
  redraw();
});
panYInput.addEventListener('input', () => {
  state.panels[state.selected].oy = Math.max(-0.5, Math.min(0.5, Number(panYInput.value) / 100));
  redraw();
});

// Drag to pan the selected panel's photo, wheel to zoom it.
let dragging = null;
function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  // Use the same layout the renderer uses, via the poster's aspect ratio.
  const ratio = canvas.width / canvas.height;
  const grids = ratio > 1.4
    ? [[0, 0, 0.56, 0.76], [0.56, 0, 0.44, 0.38], [0.56, 0.38, 0.44, 0.38]]
    : ratio < 0.95
      ? [[0, 0, 1, 0.52], [0, 0.52, 0.5, 0.22], [0.5, 0.52, 0.5, 0.22]]
      : [[0, 0, 0.62, 0.64], [0.62, 0, 0.38, 0.32], [0.62, 0.32, 0.38, 0.32]];
  for (let i = 0; i < 3; i += 1) {
    const [gx, gy, gw, gh] = grids[i];
    if (x >= gx && x < gx + gw && y >= gy && y < gy + gh) return { index: i, x, y };
  }
  return null;
}
canvas.addEventListener('pointerdown', (e) => {
  const hit = panelAt(e.clientX, e.clientY);
  if (!hit) return;
  state.selected = hit.index;
  dragging = { x: e.clientX, y: e.clientY, ox: state.panels[hit.index].ox, oy: state.panels[hit.index].oy };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const panel = state.panels[state.selected];
  panel.ox = Math.max(-0.5, Math.min(0.5, dragging.ox + (e.clientX - dragging.x) / rect.width));
  panel.oy = Math.max(-0.5, Math.min(0.5, dragging.oy + (e.clientY - dragging.y) / rect.height));
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[state.selected];
  panel.scale = Math.max(0.5, Math.min(3, panel.scale * (e.deltaY < 0 ? 1.08 : 0.93)));
  redraw();
}, { passive: false });

// Export the poster at the chosen size as a PNG download.
document.querySelectorAll('[data-export]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.export;
    const size = SIZES[key];
    const off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    drawCover(off, { ...state, size: key });
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `cover-${size.w}x${size.h}.png`;
      a.click();
      status.textContent = `Saved cover-${size.w}x${size.h}.png`;
    }, 'image/png');
  });
});

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, async (sample, text, taglineText, gradeName, sizeKey) => {
    const img = await loadImage(sample);
    state.photos.push({ img, name: 'sample' });
    state.panels.forEach((p) => { p.photo = img; });
    state.caption = text;
    state.tagline = taglineText;
    if (gradeName && GRADES[gradeName]) state.grade = gradeName;
    if (sizeKey && SIZES[sizeKey]) state.size = sizeKey;
    captionInput.value = state.caption;
    taglineInput.value = state.tagline;
    document.getElementById('grade').value = state.grade;
    document.getElementById('size').value = state.size;
    renderPhotoList();
    redraw();
  });
} else {
  redraw();
}
