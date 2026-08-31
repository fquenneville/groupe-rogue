// GROUPE ROGUE — Page processor
// Extracts shared CSS, JS, and images from self-contained HTML files,
// then writes clean HTML files to the correct repo destinations.
// Run with: node scripts/process-pages.js

const fs = require('fs');
const path = require('path');

const SRC  = 'E:/Shared drives/Groupe Rogue/GROUPE ROGUE/Site web/www 2026-05-05';
const REPO = path.resolve(__dirname, '..');

// ── Destination mapping ──────────────────────────────────────────────────────
const FILES = [
  { src: 'index.html',          dest: 'index.html' },
  { src: 'mouvement.html',      dest: 'mouvement/index.html' },
  { src: 'rogues.html',         dest: 'rogues/index.html' },
  { src: 'memberships.html',    dest: 'memberships/index.html' },
  { src: 'boutique.html',       dest: 'boutique/index.html' },
  { src: 'rogueship.html',      dest: 'rogueship/index.html' },
  { src: 'contact.html',        dest: 'contact/index.html' },
  { src: 'en-index.html',       dest: 'en/index.html' },
  { src: 'en-movement.html',    dest: 'en/movement/index.html' },
  { src: 'en-rogues.html',      dest: 'en/rogues/index.html' },
  { src: 'en-memberships.html', dest: 'en/memberships/index.html' },
  { src: 'en-boutique.html',    dest: 'en/boutique/index.html' },
  { src: 'en-rogueship.html',   dest: 'en/rogueship/index.html' },
  { src: 'en-contact.html',     dest: 'en/contact/index.html' },
];

// ── Image positional mapping per source filename ─────────────────────────────
const IMAGE_MAP = {
  'index.html':       ['Logo_Groupe_Rogue.png', 'Page_acceuil.png',
                       'secteurs-trajectoires.png', 'secteurs-leaderships.png',
                       'secteurs-ecosystemes.png', 'secteurs-futurs.png'],
  'en-index.html':    ['Logo_Groupe_Rogue.png', 'Page_acceuil.png',
                       'secteurs-trajectoires.png', 'secteurs-leaderships.png',
                       'secteurs-ecosystemes.png', 'secteurs-futurs.png'],
  'mouvement.html':   ['Logo_Groupe_Rogue.png',
                       'vecteur-propulseur.png', 'vecteur-motivateur.png',
                       'vecteur-coach.png', 'vecteur-architecte.png',
                       'secteurs-trajectoires.png', 'secteurs-leaderships.png',
                       'secteurs-ecosystemes.png', 'secteurs-futurs.png'],
  'en-movement.html': ['Logo_Groupe_Rogue.png',
                       'vecteur-propulseur.png', 'vecteur-motivateur.png',
                       'vecteur-coach.png', 'vecteur-architecte.png',
                       'secteurs-trajectoires.png', 'secteurs-leaderships.png',
                       'secteurs-ecosystemes.png', 'secteurs-futurs.png'],
};
const DEFAULT_IMAGES = ['Logo_Groupe_Rogue.png'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractBlock(html, openTag, closeTag) {
  const start = html.indexOf(openTag);
  const end   = html.indexOf(closeTag, start);
  if (start === -1 || end === -1) return null;
  return html.slice(start + openTag.length, end);
}

function removeBlock(html, openTag, closeTag) {
  const start = html.indexOf(openTag);
  const end   = html.indexOf(closeTag, start);
  if (start === -1 || end === -1) return html;
  return html.slice(0, start) + html.slice(end + closeTag.length);
}

// ── Step 1 & 2: Extract shared CSS and JS from index.html ────────────────────

console.log('\n── Extracting shared CSS and JS ──');

const indexSrc = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');

const cssContent = extractBlock(indexSrc, '<style>', '</style>');
if (!cssContent) { console.error('ERROR: <style> block not found'); process.exit(1); }
fs.writeFileSync(path.join(REPO, 'shared.css'), cssContent.trimEnd() + '\n', 'utf8');
console.log(`  shared.css written (${cssContent.split('\n').length} lines)`);

const jsContent = extractBlock(indexSrc, '<script>', '</script>');
if (!jsContent) { console.error('ERROR: <script> block not found'); process.exit(1); }
fs.writeFileSync(path.join(REPO, 'shared.js'), jsContent.trimEnd() + '\n', 'utf8');
console.log(`  shared.js written (${jsContent.split('\n').length} lines)`);

// ── Step 3 & 4: Process each HTML file ───────────────────────────────────────

const imagesDir = path.join(REPO, 'images');
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

const BASE64_RE = /src="data:image\/png;base64,([^"]+)"/g;

for (const { src, dest } of FILES) {
  console.log(`\n── Processing ${src} → ${dest} ──`);

  let html = fs.readFileSync(path.join(SRC, src), 'utf8');
  const imageNames = IMAGE_MAP[src] || DEFAULT_IMAGES;

  // 3. Extract and save images; track per-file counter
  let imgIndex = 0;
  const replacements = []; // [{b64, filename}, ...]

  let match;
  const re = new RegExp(BASE64_RE.source, 'g');
  while ((match = re.exec(html)) !== null) {
    const b64 = match[1];
    const filename = imageNames[imgIndex] || null;
    if (!filename) {
      console.warn(`  WARN: more images than expected at index ${imgIndex}, skipping`);
    } else {
      const imgPath = path.join(imagesDir, filename);
      if (!fs.existsSync(imgPath)) {
        fs.writeFileSync(imgPath, Buffer.from(b64, 'base64'));
        console.log(`  Saved /images/${filename}`);
      } else {
        console.log(`  /images/${filename} already exists, skipped`);
      }
      replacements.push({ b64, filename });
    }
    imgIndex++;
  }

  if (imgIndex !== imageNames.length) {
    console.warn(`  WARN: expected ${imageNames.length} images, found ${imgIndex}`);
  }

  // 4a. Strip <style>…</style>
  html = removeBlock(html, '<style>', '</style>');

  // 4b. Strip <script>…</script> (the one before </body>)
  html = removeBlock(html, '<script>', '</script>');

  // 4c. Inject <link> after viewport meta
  html = html.replace(
    /(<meta name="viewport"[^>]*>)/,
    '$1\n<link rel="stylesheet" href="/shared.css">'
  );

  // 4d. Inject <script src> before </body>
  html = html.replace('</body>', '<script src="/shared.js"></script>\n</body>');

  // 4e. Replace base64 srcs with /images/ paths
  for (const { b64, filename } of replacements) {
    // Use a literal string replacement (not regex) to avoid issues with special chars in b64
    html = html.replace(`src="data:image/png;base64,${b64}"`, `src="/images/${filename}"`);
  }

  // 4f. Write to destination
  const destPath = path.join(REPO, dest);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, html, 'utf8');
  console.log(`  Written to ${dest}`);
}

console.log('\n✓ Done. All files processed.\n');
