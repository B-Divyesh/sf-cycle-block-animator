import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('../dist', import.meta.url).pathname;
const files = [];
// Static Web Apps consumes this file during deployment instead of publishing
// it. Pre-caching it makes Cache.addAll() reject on the live origin.
const deploymentOnlyFiles = new Set(['staticwebapp.config.json']);
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (!entry.name.endsWith('.map') && entry.name !== 'sw.js' && !deploymentOnlyFiles.has(entry.name)) files.push('/' + relative(root, full));
  }
}
await walk(root);
files.sort();
const releaseHash = createHash('sha256');
for (const file of files) {
  releaseHash.update(file);
  releaseHash.update(await readFile(join(root, file.slice(1))));
}
const fingerprint = releaseHash.digest('hex').slice(0, 12);
const source = `const CACHE='cycle-blocks-${fingerprint}';\nconst SHELL=${JSON.stringify(files)};\nself.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL))));\nself.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('cycle-blocks-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));\nself.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting()});\nconst cachedNavigation=async pathname=>await caches.match(pathname,{ignoreSearch:true})||await caches.match(pathname.endsWith('/')?pathname+'index.html':pathname+'/index.html',{ignoreSearch:true});\nself.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;if(e.request.mode==='navigate'){e.respondWith((async()=>{try{const response=await fetch(e.request);if(response.ok)e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,response.clone())));return response}catch{return await cachedNavigation(u.pathname)||await caches.match('/404.html')||await caches.match('/offline.html')}})());return}e.respondWith((async()=>{const cached=await caches.match(u.pathname,{ignoreSearch:true});if(cached)return cached;const response=await fetch(e.request);if(response.ok)e.waitUntil(caches.open(CACHE).then(c=>c.put(u.pathname,response.clone())));return response})())})`;
await writeFile(join(root, 'sw.js'), source);
console.log(`service worker: ${files.length} files precached`);
