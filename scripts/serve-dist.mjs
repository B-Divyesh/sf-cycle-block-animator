import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = new URL('../dist', import.meta.url).pathname;
const port = Number(process.env.PORT ?? 4173);
const types = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8'
};
const policy = "default-src 'self'; base-uri 'self'; connect-src 'self' https://api.sociobot.in; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' blob: data:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self'";

createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', `http://${request.headers.host}`).pathname);
  const stripped = pathname.replace(/^\//, '');
  const relative = pathname === '/' ? 'index.html' : extname(pathname) ? stripped : stripped.replace(/\/?$/, '/index.html');
  const safePath = normalize(relative).replace(/^(\.\.(\/|\\|$))+/, '');
  let status = 200;
  let filePath = join(root, safePath);
  let body;
  try { body = await readFile(filePath); }
  catch { status = 404; filePath = join(root, '404.html'); body = await readFile(filePath); }
  response.statusCode = status;
  response.setHeader('Content-Type', types[extname(filePath)] ?? 'application/octet-stream');
  response.setHeader('Content-Security-Policy', policy);
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(), payment=(), usb=()');
  if (request.method === 'HEAD') response.end();
  else response.end(body);
}).listen(port, '127.0.0.1', () => process.stdout.write(`dist server listening on ${port}\n`));
