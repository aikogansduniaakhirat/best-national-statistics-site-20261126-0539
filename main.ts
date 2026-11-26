// Nusa Data — the hand-in program (Node 22, standard library only).
//
// The site is app/: plain static files a browser opens at app/index.html (ES modules,
// one stylesheet, no build step, nothing fetched over the network). This program copies
// app/ and screenshots/ beside it into /output and writes /output/dossier.json — the
// summary the judge reads — with the vendored make.fun library, whose copy of the file
// must be byte for byte identical to ours.
//
//   node serve.ts                                   # look at it on http://localhost:8080
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Outside the grader's container MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The grader refuses an entry over these, so refuse it here first, with a reason a
// reader can act on, rather than at submission time.
const LIMITS = { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 16777216 };

function walk(dir) {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const inner = walk(full);
      files += inner.files + 1;
      bytes += inner.bytes;
    } else {
      files += 1;
      bytes += statSync(full).size;
    }
  }
  return { files, bytes };
}

const appDir = join(here, 'app');
if (!existsSync(appDir)) throw new Error('app/ is missing: the site lives there');

// The three pages the brief is about must be there, or the build is wrong and the
// output would be an empty shell.
for (const needed of ['index.html', 'main.js', 'style.css', 'views.js', 'chart.js', 'format.js', 'data.js']) {
  if (!existsSync(join(appDir, needed))) throw new Error(`app/${needed} is missing`);
}

const appSize = walk(appDir);
if (appSize.files > LIMITS.app_max_files) throw new Error(`app/ holds ${appSize.files} files, over ${LIMITS.app_max_files}`);
if (appSize.bytes > LIMITS.app_max_bytes) throw new Error(`app/ is ${appSize.bytes} bytes, over ${LIMITS.app_max_bytes}`);

const shotsDir = join(here, 'screenshots');
if (existsSync(shotsDir)) {
  const shots = readdirSync(shotsDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  if (shots.length > LIMITS.screenshots.max) throw new Error(`screenshots/ holds ${shots.length}, over ${LIMITS.screenshots.max}`);
  for (const shot of shots) {
    const size = statSync(join(shotsDir, shot)).size;
    if (size > LIMITS.screenshots.max_bytes) throw new Error(`screenshots/${shot} is ${size} bytes, over ${LIMITS.screenshots.max_bytes}`);
  }
}

mkdirSync(out, { recursive: true });
cpSync(appDir, join(out, 'app'), { recursive: true });

mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

const dossier = buildDossier(out, LIMITS);
writeFileSync(join(out, 'dossier.json'), dossier);

const parsed = JSON.parse(dossier.toString());
console.log(`Nusa Data handed in: ${appSize.files} files, ${appSize.bytes} bytes of app/, ` +
  `${existsSync(shotsDir) ? readdirSync(shotsDir).length : 0} screenshots, dossier ${dossier.length} bytes.`);
if (parsed && typeof parsed === 'object' && parsed.text_bytes !== undefined) {
  console.log(`dossier text_bytes ${parsed.text_bytes} of ${LIMITS.text_max_bytes}`);
}
