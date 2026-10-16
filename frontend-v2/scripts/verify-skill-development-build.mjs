import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);

try {
  const manifest = JSON.parse(await readFile(new URL('.next/prerender-manifest.json', root), 'utf8'));
  assert.ok(manifest.routes['/skill-development'], 'The Skill Development route must be included in the production build.');

  const html = await readFile(new URL('.next/server/app/skill-development.html', root), 'utf8');
  for (const text of ['Our Sincere Gratitude', 'Dr. Ishdeep Singla', 'Technical Training team', 'Our vision', 'Our goal']) {
    assert.ok(html.includes(text), 'The built Skill Development page is missing: ' + text);
  }
  assert.match(html, /href="\/skill-development"/, 'The production footer must link to the Skill Development page.');

  for (const filename of ['cu-emblem.png', 'dr-ishdeep-singla.jpeg']) {
    const asset = new URL('public/' + filename, root);
    assert.ok((await stat(asset)).size > 0, 'Missing or empty page image: ' + fileURLToPath(asset));
    assert.ok(html.includes(filename), 'The built page must reference its image: ' + filename);
  }

  console.log('Verified production Skill Development page, mentor images, and footer link.');
} catch (error) {
  console.error('Skill Development build verification failed: ' + error.message);
  process.exitCode = 1;
}
