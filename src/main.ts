import './styles.css';
import { bakeSheet, buildMetadata, downloadBlob } from './exporter';
import { captureReturnedLicense, checkoutUrl, hasOptimisticUnlock, hasStoredLicense, storeLicense, verifyLicense } from './license';
import { clearProject, loadProject, saveProject } from './storage';
import { makeSheetPlan, normalizeBlock, resolveTimeline, sortFrameNames, timelineDuration } from './timeline';
import type { CycleBlock, PersistedProject, ProjectSettings, SheetPlan, SourceFrame } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;
const DEFAULT_SETTINGS: ProjectSettings = { fps: 12, maxTexture: 2048, targetKiB: 1024, padding: 0, powerOfTwo: false };
let frames: SourceFrame[] = [];
let blocks: CycleBlock[] = [];
let settings = { ...DEFAULT_SETTINGS };
let projectName = 'my-cycle';
let currentFrame = 0;
let selectedSource = 0;
let playing = false;
let timer = 0;
let studio = false;
let status = '';
let statusTone: 'success' | 'warning' | 'danger' | '' = '';
let lastBake: { blob: Blob; plan: SheetPlan; metadata: object } | null = null;
let saveTimer = 0;
let licenseNotice = '';

const escapeHtml = (value: string): string => value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!);
const makeId = (): string => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
const sequence = (): number[] => resolveTimeline(blocks, frames.length);
const formatBytes = (bytes: number): string => bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KiB` : `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
const cleanName = (value: string): string => value.trim().replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '') || 'cycle-blocks';

function projectForStorage(): PersistedProject {
  return {
    version: 1,
    name: projectName,
    updatedAt: Date.now(),
    frames: frames.map(({ url: _url, ...frame }) => frame),
    blocks,
    settings
  };
}

function scheduleSave(): void {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => saveProject(projectForStorage()).catch(() => setStatus('Autosave is unavailable. Export a project backup.', 'warning')), 250);
}

function setStatus(message: string, tone: typeof statusTone = ''): void {
  status = message;
  statusTone = tone;
  const region = document.querySelector<HTMLElement>('#export-status');
  if (region) { region.textContent = message; region.dataset.tone = tone; }
}

function blockMarkup(block: CycleBlock, index: number): string {
  const safe = normalizeBlock(block, frames.length);
  const length = safe.end - safe.start + 1;
  return `<section class="block" data-block="${escapeHtml(block.id)}" aria-labelledby="block-title-${index}">
    <div class="block__top"><h3 id="block-title-${index}">Block ${index + 1}</h3><button type="button" data-action="remove-block" aria-label="Remove block ${index + 1}" ${blocks.length === 1 ? 'disabled' : ''}>×</button></div>
    <div class="fields">
      <label>From frame<input data-field="start" type="number" min="1" max="${frames.length}" value="${safe.start + 1}"></label>
      <label>To frame<input data-field="end" type="number" min="1" max="${frames.length}" value="${safe.end + 1}"></label>
      <label>Passes<input data-field="repeats" type="number" min="1" max="120" value="${safe.repeats}"></label>
      <label>Pass offset<input data-field="offset" type="number" min="-${Math.max(0, length - 1)}" max="${Math.max(0, length - 1)}" value="${safe.offset}"></label>
    </div>
    <p class="block-result">${length} drawings × ${safe.repeats} passes = <strong>${length * safe.repeats} baked frames</strong>. Each new pass starts ${safe.offset === 0 ? 'in the same place' : `${Math.abs(safe.offset)} frame${Math.abs(safe.offset) === 1 ? '' : 's'} ${safe.offset > 0 ? 'later' : 'earlier'}`}.</p>
  </section>`;
}

function render(): void {
  const result = sequence();
  currentFrame = Math.min(currentFrame, Math.max(0, result.length - 1));
  const source = result[currentFrame] ?? 0;
  const frame = frames[source];
  const preview = frame ? `<img id="preview-image" src="${frame.url}" alt="Preview of source frame ${source + 1}, ${escapeHtml(frame.name)}">` : '<p class="preview-placeholder">Import drawings to start the preview. Nothing leaves this browser.</p>';
  const plan = frame ? makeSheetPlan(result.length, frame.width, frame.height, Math.min(settings.maxTexture, studio ? 8192 : 2048), settings.padding, 1, settings.powerOfTwo) : null;
  const estimatedPixels = plan ? plan.width * plan.height : 0;
  const tierLimit = studio ? 120 : 60;
  const tierText = studio ? '<span class="stamp">Studio unlocked</span>' : '<span class="stamp">Free: 60-frame exports</span>';
  const sourceContent = frames.length ? `
    <div class="source-summary"><span class="metric"><strong>${frames.length}</strong><small>source frames</small></span><span class="metric"><strong>${frames[0].width} × ${frames[0].height}</strong><small>source pixels</small></span></div>
    <ol class="thumbs" aria-label="Source frames">${frames.map((item, index) => `<li class="thumb"><button type="button" data-source="${index}" aria-current="${selectedSource === index}" aria-label="Select source frame ${index + 1}, ${escapeHtml(item.name)}"><img src="${item.url}" alt=""></button><span title="${escapeHtml(item.name)}">${index + 1}. ${escapeHtml(item.name)}</span></li>`).join('')}</ol>
    <div class="button-row"><label class="button file-trigger">Add or replace PNGs<input id="png-input" type="file" accept="image/png,.png" multiple></label><button type="button" data-action="clear">Clear project</button></div>` : `
    <div class="empty"><picture><source media="(max-width: 700px)" srcset="/assets/loop-print-480.webp"><img src="/assets/loop-print-1200.webp" width="1200" height="800" fetchpriority="high" decoding="async" alt="A risograph collage of blank animation cels curling in a loop across a print bench"></picture><h3>Drop a numbered PNG sequence</h3><p>Select all drawings at once. Names like idle_1.png, idle_2.png, idle_10.png stay in natural numeric order.</p><label class="button button--primary file-trigger">Choose PNG frames<input id="png-input" type="file" accept="image/png,.png" multiple></label></div>`;

  app.innerHTML = `
    <header class="site-header"><a class="brand" href="/" aria-label="Cycle Blocks home"><img src="/icons/icon.svg" width="38" height="38" alt=""><span>Cycle Blocks</span></a><div class="header-actions"><span class="offline-pill" role="status">Offline — edits still save</span><a class="button" href="#export-panel">Export sheet</a></div></header>
    <section class="masthead" aria-labelledby="page-title"><div><p class="eyebrow">A small loop press for game animators</p><h1 id="page-title">Repeat drawings. Not the busywork.</h1><p class="masthead__lede">Arrange reusable cycle blocks, preview their offsets, then bake only the frames your game needs.</p></div><div class="local-note"><strong>Your art stays here.</strong><p>PNG processing and autosave happen locally—even offline after the first visit.</p></div></section>
    <main id="workspace" class="workspace"><div class="workspace-grid">
      <div class="column">
        <section id="source-panel" class="panel panel--blue drop-zone" aria-labelledby="source-title"><div class="panel-head"><div><h2 id="source-title">Source drawings</h2><p class="help">PNG only · same canvas size · sorted by filename</p></div><span class="step" aria-hidden="true">1</span></div>${sourceContent}<p id="import-status" class="status" role="status" aria-live="polite"></p></section>
        <section class="panel" aria-labelledby="recipe-title"><div class="panel-head"><div><h2 id="recipe-title">Cycle recipe</h2><p class="help">Offset rotates the start drawing on each pass without creating copies.</p></div><span class="step" aria-hidden="true">2</span></div>
          ${frames.length ? `<div class="block-list">${blocks.map(blockMarkup).join('')}</div><div class="button-row"><button type="button" data-action="add-block">+ Add another block</button><span class="metric"><strong>${result.length}</strong><small>baked frames · ${timelineDuration(result.length, settings.fps).toFixed(2)} sec</small></span></div>` : '<p class="help">Your block controls will appear after import.</p>'}
        </section>
        <section class="panel" aria-labelledby="project-title"><div class="panel-head"><div><h2 id="project-title">Project backup</h2><p class="help">Save or restore the full recipe and source PNGs as one local file.</p></div></div><label>Project name<input id="project-name" value="${escapeHtml(projectName)}" maxlength="80"></label><div class="button-row"><button type="button" data-action="save-project" ${frames.length ? '' : 'disabled'}>Download project</button><label class="button file-trigger">Restore project<input id="project-input" type="file" accept="application/json,.cycleblocks.json"></label></div></section>
      </div>
      <div class="column">
        <section class="panel panel--red" aria-labelledby="preview-title"><div class="panel-head"><div><h2 id="preview-title">Loop proof</h2><p class="help">Space plays or pauses. Left and right arrows step frames.</p></div><span class="step" aria-hidden="true">3</span></div><div class="preview-stage" tabindex="0" aria-label="Animation preview. Use Space to play and arrow keys to step.">${preview}</div>
          <div class="preview-controls"><button class="transport" type="button" data-action="play" aria-label="${playing ? 'Pause' : 'Play'} animation" ${result.length ? '' : 'disabled'}>${playing ? 'Ⅱ' : '▶'}</button><input id="scrubber" class="scrubber" type="range" min="0" max="${Math.max(0,result.length - 1)}" value="${currentFrame}" aria-label="Preview frame" ${result.length ? '' : 'disabled'}><span id="frame-readout" class="frame-readout">${result.length ? `${currentFrame + 1} / ${result.length}` : '0 / 0'}</span><span class="shortcut">Source ${result.length ? source + 1 : '—'}</span></div>
          ${result.length ? `<ol class="result-strip" aria-label="Resolved output frames">${result.slice(0, 180).map((item,index) => `<li class="result-frame${index === currentFrame ? ' is-current' : ''}" title="Output ${index + 1} uses source ${item + 1}">${item + 1}</li>`).join('')}</ol>` : ''}
        </section>
        <section id="export-panel" class="panel panel--red" aria-labelledby="export-title"><div class="panel-head"><div><h2 id="export-title">Constrained export</h2><p class="help">The baker scales down only if needed to meet both limits.</p></div><span class="step" aria-hidden="true">4</span></div>
          <div class="settings"><label>Playback FPS<input id="fps" type="number" min="1" max="60" value="${settings.fps}"></label><label>Texture limit<select id="texture-limit"><option value="1024" ${settings.maxTexture === 1024 ? 'selected' : ''}>1024 px</option><option value="2048" ${settings.maxTexture === 2048 ? 'selected' : ''}>2048 px</option><option value="4096" ${settings.maxTexture === 4096 ? 'selected' : ''} ${studio ? '' : 'disabled'}>4096 px · Studio</option><option value="8192" ${settings.maxTexture === 8192 ? 'selected' : ''} ${studio ? '' : 'disabled'}>8192 px · Studio</option></select></label><label>PNG budget (KiB)<input id="budget" type="number" min="64" max="524288" value="${settings.targetKiB}"></label><label>Padding (px)<input id="padding" type="number" min="0" max="64" value="${settings.padding}"></label><label class="check"><input id="power-two" type="checkbox" ${settings.powerOfTwo ? 'checked' : ''}> Power-of-two sheet</label></div>
          <div class="export-summary"><span class="metric"><strong>${plan ? `${plan.width} × ${plan.height}` : 'Needs fit'}</strong><small>full-size layout</small></span><span class="metric"><strong>${result.length} / ${tierLimit}</strong><small>${studio ? 'Studio' : 'free'} frame limit</small></span><span class="metric"><strong>${estimatedPixels ? `${(estimatedPixels / 1_000_000).toFixed(1)} MP` : '—'}</strong><small>canvas area</small></span>${tierText}</div>
          <div class="budget-meter" ${lastBake ? '' : 'hidden'}><div class="budget-bar" aria-hidden="true"><span style="--meter:${lastBake ? Math.min(100,lastBake.blob.size / (settings.targetKiB * 1024) * 100) : 0}%"></span></div></div>
          <p id="export-status" class="status" role="status" aria-live="polite" data-tone="${statusTone}">${escapeHtml(status)}</p>
          <div class="button-row"><button class="button--primary" type="button" data-action="bake" ${result.length ? '' : 'disabled'}>Bake to budget</button><button type="button" data-action="download-png" ${lastBake ? '' : 'disabled'}>Download PNG</button><button type="button" data-action="download-json" ${lastBake ? '' : 'disabled'}>Download JSON</button></div>
          <aside class="pro-box" aria-labelledby="studio-title"><h3 id="studio-title">Studio export <span class="price">$12 once</span></h3><p>${studio ? 'This device is unlocked for 120-frame and 8192 px exports.' : 'Free exports cover 60 frames and 2048 px. Studio unlocks 120-frame loops and textures up to 8192 px. No subscription.'}</p>${studio ? '<p class="status" data-tone="success">License active.</p>' : `<div class="button-row"><a class="button button--blue" href="${checkoutUrl()}">Buy Studio</a></div><form id="license-form"><label for="license-token">Have a license? Paste it here</label><div class="license-form"><input id="license-token" autocomplete="off" spellcheck="false"><button type="submit">Restore</button></div></form><p id="license-status" class="status" role="status" aria-live="polite" data-tone="${licenseNotice ? 'warning' : ''}">${escapeHtml(licenseNotice)}</p>`}<p><small>Checkout and refunds are handled by Sociobot/Dodo, the merchant of record. <a href="/terms/">Terms</a> · <a href="/privacy/">Privacy</a></small></p></aside>
        </section>
      </div>
    </div></main>
    <footer class="site-footer"><p>Cycle Blocks · Local-first by design · Empty-state art generated for this product</p><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav></footer>
    <div id="update-toast" class="toast" hidden><span>A fresh press is ready.</span><button type="button" data-action="update">Update now</button></div>`;
  bindEvents();
  document.body.classList.toggle('is-offline', !navigator.onLine);
}

function bindEvents(): void {
  document.querySelector<HTMLInputElement>('#png-input')?.addEventListener('change', (event) => importPngs((event.target as HTMLInputElement).files));
  document.querySelector<HTMLInputElement>('#project-input')?.addEventListener('change', (event) => restoreBackup((event.target as HTMLInputElement).files?.[0]));
  document.querySelector('#source-panel')?.addEventListener('dragover', (event) => { event.preventDefault(); event.currentTarget instanceof HTMLElement && event.currentTarget.classList.add('is-dragging'); });
  document.querySelector('#source-panel')?.addEventListener('dragleave', (event) => event.currentTarget instanceof HTMLElement && event.currentTarget.classList.remove('is-dragging'));
  document.querySelector('#source-panel')?.addEventListener('drop', (event) => { event.preventDefault(); event.currentTarget instanceof HTMLElement && event.currentTarget.classList.remove('is-dragging'); importPngs((event as DragEvent).dataTransfer?.files ?? null); });
  document.querySelectorAll<HTMLButtonElement>('[data-source]').forEach((button) => button.addEventListener('click', () => { selectedSource = Number(button.dataset.source); currentFrame = Math.max(0, sequence().indexOf(selectedSource)); stopPlayback(); render(); }));
  document.querySelectorAll<HTMLElement>('[data-action]').forEach((element) => element.addEventListener('click', handleAction));
  document.querySelectorAll<HTMLInputElement>('.block input').forEach((input) => input.addEventListener('change', updateBlock));
  document.querySelector<HTMLInputElement>('#scrubber')?.addEventListener('input', (event) => { stopPlayback(); currentFrame = Number((event.target as HTMLInputElement).value); updatePreview(); });
  document.querySelector<HTMLInputElement>('#project-name')?.addEventListener('change', (event) => { projectName = cleanName((event.target as HTMLInputElement).value); scheduleSave(); render(); });
  ['fps','budget','padding'].forEach((id) => document.querySelector<HTMLInputElement>(`#${id}`)?.addEventListener('change', updateSettings));
  document.querySelector<HTMLSelectElement>('#texture-limit')?.addEventListener('change', updateSettings);
  document.querySelector<HTMLInputElement>('#power-two')?.addEventListener('change', updateSettings);
  document.querySelector<HTMLFormElement>('#license-form')?.addEventListener('submit', restoreLicense);
}

async function fileToFrame(file: File): Promise<SourceFrame> {
  const bitmap = await createImageBitmap(file);
  const frame = { id: makeId(), name: file.name, width: bitmap.width, height: bitmap.height, blob: file, url: URL.createObjectURL(file) };
  bitmap.close();
  return frame;
}

async function importPngs(list: FileList | null): Promise<void> {
  if (!list?.length) return;
  setImportStatus('Reading PNG dimensions…');
  const files = Array.from(list);
  const pngs = files.filter((file) => file.type === 'image/png' || file.name.toLowerCase().endsWith('.png'));
  if (pngs.length !== files.length) { setImportStatus('Only PNG files are supported. Remove the other file types and try again.', true); return; }
  try {
    const loaded = sortFrameNames(await Promise.all(pngs.map(fileToFrame)));
    const { width, height } = loaded[0];
    if (width * height > 16_777_216) { loaded.forEach((frame) => URL.revokeObjectURL(frame.url)); throw new Error('Each source drawing must be 16 megapixels or smaller.'); }
    if (loaded.some((frame) => frame.width !== width || frame.height !== height)) { loaded.forEach((frame) => URL.revokeObjectURL(frame.url)); throw new Error('All source PNGs need the same canvas dimensions. Resize the odd frame and import again.'); }
    frames.forEach((frame) => URL.revokeObjectURL(frame.url));
    frames = loaded;
    blocks = [{ id: makeId(), start: 0, end: frames.length - 1, repeats: 1, offset: 0 }];
    projectName = cleanName(pngs[0].name.replace(/\.[^.]+$/, '').replace(/[-_]?\d+$/, ''));
    currentFrame = 0; selectedSource = 0; lastBake = null; status = '';
    scheduleSave(); render();
    setImportStatus(`${frames.length} PNG frame${frames.length === 1 ? '' : 's'} loaded in filename order.`);
  } catch (error) {
    setImportStatus(error instanceof Error ? error.message : 'Those PNGs could not be read.', true);
  }
}

function setImportStatus(message: string, error = false): void {
  const region = document.querySelector<HTMLElement>('#import-status');
  if (region) { region.textContent = message; region.dataset.tone = error ? 'danger' : 'success'; }
}

function updateBlock(event: Event): void {
  const input = event.target as HTMLInputElement;
  const container = input.closest<HTMLElement>('[data-block]');
  const block = blocks.find((item) => item.id === container?.dataset.block);
  if (!block) return;
  const field = input.dataset.field as 'start' | 'end' | 'repeats' | 'offset';
  block[field] = Number(input.value) - (field === 'start' || field === 'end' ? 1 : 0);
  Object.assign(block, normalizeBlock(block, frames.length));
  lastBake = null; currentFrame = 0; scheduleSave(); render();
}

function updateSettings(): void {
  settings = {
    fps: Math.min(60, Math.max(1, Number(document.querySelector<HTMLInputElement>('#fps')?.value) || 12)),
    maxTexture: Number(document.querySelector<HTMLSelectElement>('#texture-limit')?.value) || 2048,
    targetKiB: Math.min(524288, Math.max(64, Number(document.querySelector<HTMLInputElement>('#budget')?.value) || 1024)),
    padding: Math.min(64, Math.max(0, Number(document.querySelector<HTMLInputElement>('#padding')?.value) || 0)),
    powerOfTwo: document.querySelector<HTMLInputElement>('#power-two')?.checked ?? false
  };
  lastBake = null; scheduleSave(); render();
}

function handleAction(event: Event): void {
  const button = event.currentTarget as HTMLElement;
  switch (button.dataset.action) {
    case 'play': playing ? stopPlayback(true) : startPlayback(); break;
    case 'add-block': blocks.push({ id: makeId(), start: 0, end: Math.max(0, frames.length - 1), repeats: 1, offset: 0 }); lastBake = null; scheduleSave(); render(); break;
    case 'remove-block': { const id = button.closest<HTMLElement>('[data-block]')?.dataset.block; blocks = blocks.filter((item) => item.id !== id); lastBake = null; scheduleSave(); render(); break; }
    case 'clear': clearAll(); break;
    case 'bake': void runBake(); break;
    case 'download-png': if (lastBake) downloadBlob(lastBake.blob, `${cleanName(projectName)}.png`); break;
    case 'download-json': if (lastBake) downloadBlob(new Blob([JSON.stringify(lastBake.metadata, null, 2)], { type: 'application/json' }), `${cleanName(projectName)}.json`); break;
    case 'save-project': void downloadProject(); break;
    case 'update': void applyUpdate(); break;
  }
}

function updatePreview(): void {
  const result = sequence();
  if (!result.length) return;
  currentFrame = (currentFrame + result.length) % result.length;
  const image = document.querySelector<HTMLImageElement>('#preview-image');
  const source = result[currentFrame];
  if (image) { image.src = frames[source].url; image.alt = `Preview of source frame ${source + 1}, ${frames[source].name}`; }
  const scrubber = document.querySelector<HTMLInputElement>('#scrubber');
  if (scrubber) scrubber.value = String(currentFrame);
  const readout = document.querySelector('#frame-readout');
  if (readout) readout.textContent = `${currentFrame + 1} / ${result.length}`;
  document.querySelectorAll('.result-frame').forEach((item, index) => item.classList.toggle('is-current', index === currentFrame));
}

function startPlayback(): void {
  if (!sequence().length) return;
  playing = true; render();
  timer = window.setInterval(() => { currentFrame += 1; updatePreview(); }, 1000 / settings.fps);
}

function stopPlayback(shouldRender = false): void {
  playing = false; window.clearInterval(timer);
  if (shouldRender) render();
}

async function runBake(): Promise<void> {
  const result = sequence();
  const limit = studio ? 120 : 60;
  if (result.length > limit) { setStatus(`This recipe has ${result.length} frames. ${studio ? 'Reduce it to 120.' : 'Reduce it to 60 or unlock Studio for 120.'}`, 'warning'); return; }
  const maxTexture = Math.min(settings.maxTexture, studio ? 8192 : 2048);
  setStatus('Baking and measuring the PNG…');
  document.querySelector<HTMLButtonElement>('[data-action="bake"]')!.disabled = true;
  await new Promise(requestAnimationFrame);
  try {
    let low = .08, high = 1, bestPlan: SheetPlan | null = null;
    for (let i = 0; i < 12; i += 1) {
      const scale = (low + high) / 2;
      const candidate = makeSheetPlan(result.length, frames[0].width, frames[0].height, maxTexture, settings.padding, scale, settings.powerOfTwo);
      if (candidate && candidate.width * candidate.height <= 67_108_864) { bestPlan = candidate; low = scale; } else high = scale;
    }
    if (!bestPlan) throw new Error('These frames cannot fit within the selected texture size, even at minimum scale. Reduce padding or use fewer frames.');
    let blob = await bakeSheet(frames, result, bestPlan);
    for (let attempt = 0; blob.size > settings.targetKiB * 1024 && attempt < 5; attempt += 1) {
      const nextScale = bestPlan.scale * Math.sqrt((settings.targetKiB * 1024) / blob.size) * .94;
      const candidate = makeSheetPlan(result.length, frames[0].width, frames[0].height, maxTexture, settings.padding, nextScale, settings.powerOfTwo);
      if (!candidate || candidate.scale < .08) break;
      bestPlan = candidate;
      blob = await bakeSheet(frames, result, bestPlan);
    }
    if (blob.size > settings.targetKiB * 1024) throw new Error(`The smallest safe bake is ${formatBytes(blob.size)}, above the ${settings.targetKiB} KiB budget. Raise the budget or reduce frames.`);
    const metadata = buildMetadata(cleanName(projectName), frames, result, bestPlan, settings.fps, blob.size);
    lastBake = { blob, plan: bestPlan, metadata };
    status = `Ready: ${bestPlan.width} × ${bestPlan.height}px, ${formatBytes(blob.size)}, ${Math.round(bestPlan.scale * 100)}% source scale.`;
    statusTone = 'success'; render();
  } catch (error) { setStatus(error instanceof Error ? error.message : 'The export failed. Try a smaller texture.', 'danger'); document.querySelector<HTMLButtonElement>('[data-action="bake"]')!.disabled = false; }
}

async function clearAll(): Promise<void> {
  if (!confirm(`Clear ${frames.length} source frame${frames.length === 1 ? '' : 's'} and the current recipe from this browser? Download a project backup first if you need it.`)) return;
  stopPlayback(); frames.forEach((frame) => URL.revokeObjectURL(frame.url)); frames = []; blocks = []; lastBake = null; settings = { ...DEFAULT_SETTINGS }; projectName = 'my-cycle'; status = ''; await clearProject(); render();
}

const blobToDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); });
async function downloadProject(): Promise<void> {
  setStatus('Packing your local project…');
  const project = projectForStorage();
  const packed = { ...project, frames: await Promise.all(project.frames.map(async (frame) => ({ ...frame, blob: undefined, data: await blobToDataUrl(frame.blob) }))) };
  downloadBlob(new Blob([JSON.stringify(packed)], { type: 'application/json' }), `${cleanName(projectName)}.cycleblocks.json`);
  setStatus('Project backup downloaded.', 'success');
}

async function restoreBackup(file?: File): Promise<void> {
  if (!file) return;
  try {
    const packed = JSON.parse(await file.text()) as Omit<PersistedProject, 'frames'> & { frames: Array<Omit<SourceFrame,'url'|'blob'> & { data: string }> };
    if (packed.version !== 1 || !Array.isArray(packed.frames) || !Array.isArray(packed.blocks)) throw new Error('That is not a Cycle Blocks v1 project.');
    const restored = await Promise.all(packed.frames.map(async (item) => { const blob = await (await fetch(item.data)).blob(); return { id: item.id, name: item.name, width: item.width, height: item.height, blob, url: URL.createObjectURL(blob) }; }));
    frames.forEach((frame) => URL.revokeObjectURL(frame.url)); frames = restored; blocks = packed.blocks.map((block) => normalizeBlock(block, frames.length)); settings = packed.settings; projectName = cleanName(packed.name); lastBake = null; currentFrame = 0; scheduleSave(); render(); setImportStatus(`Restored ${frames.length} frames from ${file.name}.`);
  } catch (error) { setImportStatus(error instanceof Error ? error.message : 'That project could not be restored.', true); }
}

async function restoreLicense(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const input = document.querySelector<HTMLInputElement>('#license-token')!;
  const region = document.querySelector<HTMLElement>('#license-status')!;
  if (!input.value.trim()) { region.textContent = 'Paste the license token from your receipt.'; region.dataset.tone = 'danger'; return; }
  storeLicense(input.value);
  region.textContent = 'Checking the license…';
  try { const result = await verifyLicense(true); if (!result.valid) throw new Error(`License not active (${result.reason.replace('_',' ')}).`); studio = true; licenseNotice = ''; render(); } catch (error) { studio = false; region.textContent = error instanceof Error ? error.message : 'Could not check that license.'; region.dataset.tone = 'danger'; }
}

async function restoreAutosave(): Promise<void> {
  try {
    const saved = await loadProject();
    if (!saved?.frames.length) return;
    frames = saved.frames.map((frame) => ({ ...frame, url: URL.createObjectURL(frame.blob) })); blocks = saved.blocks.map((block) => normalizeBlock(block, frames.length)); settings = saved.settings; projectName = saved.name; render(); setImportStatus(`Recovered ${frames.length} locally saved frames.`);
  } catch { setStatus('Local recovery was unavailable. You can still import PNGs.', 'warning'); }
}

let waitingWorker: ServiceWorker | null = null;
async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  const registration = await navigator.serviceWorker.register('/sw.js');
  const showUpdate = (worker: ServiceWorker): void => { waitingWorker = worker; document.querySelector<HTMLElement>('#update-toast')!.hidden = false; };
  if (registration.waiting) showUpdate(registration.waiting);
  registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', () => { if (registration.waiting && navigator.serviceWorker.controller) showUpdate(registration.waiting); }));
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (waitingWorker) location.reload(); });
}

async function applyUpdate(): Promise<void> { waitingWorker?.postMessage({ type: 'SKIP_WAITING' }); }

window.addEventListener('online', () => { document.body.classList.remove('is-offline'); });
window.addEventListener('offline', () => { document.body.classList.add('is-offline'); });
window.addEventListener('keydown', (event) => {
  if ((event.target as HTMLElement).matches('input, select, textarea, button')) return;
  if (event.code === 'Space') { event.preventDefault(); playing ? stopPlayback(true) : startPlayback(); }
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); stopPlayback(); currentFrame += event.key === 'ArrowRight' ? 1 : -1; updatePreview(); }
});

captureReturnedLicense(); studio = hasOptimisticUnlock(); render();
void restoreAutosave();
void verifyLicense().then((result) => { if (!result.valid && hasStoredLicense()) licenseNotice = 'License no longer active. You can restore another token or buy again.'; if (result.valid !== studio || licenseNotice) { studio = result.valid; if (!studio && settings.maxTexture > 2048) settings.maxTexture = 2048; render(); } }).catch(() => { /* cached access remains during network failure */ });
void registerServiceWorker();
