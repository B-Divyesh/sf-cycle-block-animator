import { readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('../dist', import.meta.url).pathname;
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (!entry.name.endsWith('.map') && entry.name !== 'sw.js') files.push('/' + relative(root, full));
  }
}
await walk(root);
const fingerprint = files.join('|').split('').reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 0).toString(36);
const source = `const CACHE='cycle-blocks-${fingerprint}';\nconst SHELL=${JSON.stringify(files)};\nself.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL))));\nself.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('cycle-blocks-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));\nself.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting()});\nself.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;if(e.request.mode==='navigate'){e.respondWith((async()=>{try{const response=await fetch(e.request);if(response.ok)e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,response.clone())));return response}catch{return await caches.match(u.pathname,{ignoreSearch:true})||await caches.match('/index.html')||await caches.match('/offline.html')}})());return}e.respondWith((async()=>{const cached=await caches.match(u.pathname,{ignoreSearch:true});if(cached)return cached;const response=await fetch(e.request);if(response.ok)e.waitUntil(caches.open(CACHE).then(c=>c.put(u.pathname,response.clone())));return response})())})`;
await writeFile(join(root, 'sw.js'), source);
console.log(`service worker: ${files.length} files precached`);
