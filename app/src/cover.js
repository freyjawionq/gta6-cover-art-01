// Draws the poster: three photo panels in an original multi-panel grid, a sunset
// or neon colour grade over the whole poster, and a bold caption band along the
// foot. No Rockstar artwork, logos or fonts are used anywhere: the lettering is
// the browser's local bold sans stack, and every panel photo comes from the
// user's own files or the sample image this app ships.

/** Poster sizes the app exports, in pixels. */
export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

/** Colour grades: [sky top, sky mid, sky low, accent line, tint]. */
export const GRADES = {
  sunset: ['#2b1055', '#7597de', '#ff7e5f', '#feb47b', 'rgba(255, 94, 98, 0.16)'],
  neon: ['#0f0c29', '#302b63', '#ff2e88', '#00f5d4', 'rgba(0, 245, 212, 0.10)'],
  dusk: ['#141e30', '#35507a', '#e96443', '#ffd166', 'rgba(80, 60, 180, 0.18)'],
};

/**
 * Panel grid per poster shape, as fractions of the poster. Each entry is
 * [x, y, w, h] of one photo panel; the caption band is the strip left over.
 * Square: big hero left, two stacked panels right, caption band below.
 * Portrait: hero across the top, two panels side by side, caption band below.
 * Wide: hero left, two stacked panels right, caption band below.
 */
export function layoutFor(w, h) {
  const ratio = w / h;
  if (ratio > 1.4) {
    return {
      panels: [[0, 0, 0.56, 0.76], [0.56, 0, 0.44, 0.38], [0.56, 0.38, 0.44, 0.38]],
      band: [0, 0.76, 1, 0.24],
    };
  }
  if (ratio < 0.95) {
    return {
      panels: [[0, 0, 1, 0.52], [0, 0.52, 0.5, 0.22], [0.5, 0.52, 0.5, 0.22]],
      band: [0, 0.74, 1, 0.26],
    };
  }
  return {
    panels: [[0, 0, 0.62, 0.64], [0.62, 0, 0.38, 0.32], [0.62, 0.32, 0.38, 0.32]],
    band: [0, 0.64, 1, 0.36],
  };
}

function fitCaption(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  }
  return size;
}

/** Draws one photo into a panel rect, cover-fit, with the panel's pan/zoom. */
function drawPanelPhoto(ctx, photo, px, py, pw, ph, panel) {
  if (!photo) return;
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const base = Math.max(pw / iw, ph / ih);
  const scale = base * (panel.scale || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = px + (pw - dw) / 2 + (panel.ox || 0) * pw;
  const dy = py + (ph - dh) / 2 + (panel.oy || 0) * ph;
  ctx.drawImage(photo, dx, dy, dw, dh);
}

/**
 * Draws the whole poster onto `canvas` (at the canvas's own pixel size).
 * `state` is { panels: [{ photo, scale, ox, oy } x3], caption, tagline, grade }.
 * A panel photo is an HTMLImageElement (or any drawable) or null.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const { panels, band } = layoutFor(w, h);
  const gap = Math.max(4, Math.round(w * 0.006));

  // Poster base: deep dusk, so the gaps read as poster seams.
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, w, h);

  // Photo panels.
  panels.forEach(([fx, fy, fw, fh], i) => {
    const px = fx * w + gap;
    const py = fy * h + gap;
    const pw = fw * w - gap * 2;
    const ph = fh * h - gap * 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    const panel = state.panels[i] || {};
    if (panel.photo) {
      drawPanelPhoto(ctx, panel.photo, px, py, pw, ph, panel);
    } else {
      const g = ctx.createLinearGradient(px, py, px, py + ph);
      g.addColorStop(0, grade[0]);
      g.addColorStop(0.55, grade[1]);
      g.addColorStop(1, grade[2]);
      ctx.fillStyle = g;
      ctx.fillRect(px, py, pw, ph);
      // Empty-panel sun disc, so a panel without a photo still reads as a sunset.
      const cx = px + pw * 0.5;
      const cy = py + ph * 0.42;
      const r = Math.min(pw, ph) * 0.16;
      ctx.fillStyle = grade[3];
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Warm wash rising from the panel's foot.
    const wash = ctx.createLinearGradient(0, py + ph * 0.4, 0, py + ph);
    wash.addColorStop(0, 'rgba(255, 110, 80, 0)');
    wash.addColorStop(1, 'rgba(180, 30, 110, 0.38)');
    ctx.fillStyle = wash;
    ctx.fillRect(px, py, pw, ph);
    ctx.restore();
    // Neon seam around the panel.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(2, gap * 0.5);
    ctx.strokeRect(px, py, pw, ph);
  });

  // Caption band: sunset gradient, sun disc, caption, tagline.
  const [bx, by, bw, bh] = [band[0] * w, band[1] * h, band[2] * w, band[3] * h];
  const bg = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
  bg.addColorStop(0, grade[0]);
  bg.addColorStop(0.5, grade[1]);
  bg.addColorStop(1, grade[2]);
  ctx.fillStyle = bg;
  ctx.fillRect(bx, by, bw, bh);
  const sunX = bx + bw * 0.86;
  const sunY = by + bh * 0.42;
  const sunR = Math.min(bw, bh) * 0.30;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.2);
  glow.addColorStop(0, grade[3]);
  glow.addColorStop(1, 'rgba(255, 126, 95, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = grade[3];
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  // Accent line above the band.
  ctx.fillStyle = grade[3];
  ctx.fillRect(bx, by, bw, Math.max(3, h * 0.004));

  // Caption: bold white capitals with a dark outline, fitted to the band.
  const text = (state.caption || '').trim().toUpperCase();
  const tagline = (state.tagline || '').trim().toUpperCase();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const padX = bw * 0.045;
  const textW = bw * 0.66;
  if (text) {
    const size = fitCaption(ctx, text, textW, bh * 0.42);
    const ty = by + bh * (tagline ? 0.38 : 0.5);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(20, 5, 35, 0.9)';
    ctx.lineWidth = size * 0.14;
    ctx.strokeText(text, bx + padX, ty);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 46, 136, 0.65)';
    ctx.shadowBlur = size * 0.18;
    ctx.fillText(text, bx + padX, ty);
    ctx.shadowBlur = 0;
  }
  if (tagline) {
    let tSize = Math.max(12, bh * 0.13);
    ctx.font = `700 ${tSize}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(tSize * 0.28)}px`; } catch { /* older canvas */ }
    while (tSize > 10 && ctx.measureText(tagline).width > textW) {
      tSize -= 1;
      ctx.font = `700 ${tSize}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
    }
    ctx.fillStyle = grade[3];
    ctx.fillText(tagline, bx + padX, by + bh * 0.78);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }

  // Whole-poster grade tint and vignette, so the panels and band read as one poster.
  ctx.fillStyle = grade[4];
  ctx.fillRect(0, 0, w, h);
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(10, 0, 25, 0.35)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}
