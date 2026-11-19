// Fixed scenes for screenshots: ?shot=editor shows the page with the sample
// photo in every panel; ?shot=cover shows the cover alone at the size the
// `size` query picks (square, portrait or wide). window.__shotReady is set
// once the poster has been painted.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const caption = query.get('caption') ?? 'Sunset Heist';
  const tagline = query.get('tagline') ?? 'Boulevard Nights';
  const grade = query.get('grade') ?? 'sunset';
  const size = query.get('size') ?? 'square';
  await load('samples/vice-boulevard.png', caption, tagline, grade, size);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
