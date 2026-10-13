// Trusted execution-host provisioning. No packages are installed by student APIs.
import { readFile, writeFile } from 'node:fs/promises';
const [manifestPath, outputPath] = process.argv.slice(2);
if (!manifestPath || !outputPath || process.env.PISTON_TRUSTED_PROVISIONING !== 'yes') throw new Error('Usage: PISTON_TRUSTED_PROVISIONING=yes node scripts/piston/provision.mjs reviewed-manifest.json output.json');
const base = 'http://127.0.0.1:2001/api/v2';
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
// Manifest format: [{ frontendLanguage, package, version, runtimeLanguage }].
const request = async (path, options = {}) => {
  const response = await fetch(`${base}${path}`, { ...options, signal: AbortSignal.timeout(300000) });
  if (!response.ok) throw new Error(`Provisioning request failed (${response.status})`);
  return response.json();
};
if (!Array.isArray(manifest) || !manifest.length || manifest.some(m => !['c','cpp','java','python','javascript','typescript'].includes(m.frontendLanguage) || typeof m.package !== 'string' || !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(m.version) || typeof m.runtimeLanguage !== 'string') || new Set(manifest.map(m => m.frontendLanguage)).size !== manifest.length) throw new Error('Review manifest with unique language mappings and exact versions first');
const packages = await request('/packages');
for (const item of manifest) {
  const pkg = packages.find(p => p.language === item.package && p.language_version === item.version);
  if (!pkg) throw new Error(`Requested package is unavailable: ${item.package} ${item.version}`);
  if (!pkg.installed) await request('/packages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: item.package, version: item.version }) });
}
const runtimes = await request('/runtimes');
const versions = {};
for (const item of manifest) {
  if (!runtimes.some(r => r.language === item.runtimeLanguage && r.version === item.version)) throw new Error(`Installed runtime mismatch for ${item.frontendLanguage}`);
  versions[item.frontendLanguage] = item.version;
}
await writeFile(outputPath, JSON.stringify({ verifiedAt: new Date().toISOString(), versions, runtimes }, null, 2));
console.log('Installed registry verified. Run smoke/security tests before enabling versions on the API and workers.');
