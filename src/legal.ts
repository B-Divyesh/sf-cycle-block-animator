import './styles.css';

const page = document.body.dataset.legal;
const privacy = `
  <p class="eyebrow">The plain-language edition</p><h1>Privacy</h1><p><strong>Effective August 28, 2026.</strong></p>
  <h2>Your artwork stays on your device</h2><p>Cycle Blocks processes imported PNGs, project recipes, previews, and sprite-sheet exports entirely in your browser. The app stores your current project in your browser's IndexedDB so it can survive a refresh. We do not upload or receive your artwork.</p>
  <h2>License checks</h2><p>If you buy or restore Studio, your license token is stored in localStorage. The app sends that token to the Sociobot billing API at <code>api.sociobot.in</code> no more than once per day to check whether it is active. Sociobot/Dodo is the merchant of record and processes checkout information; Cycle Blocks never sees card details.</p>
  <h2>No tracking</h2><p>There are no analytics SDKs, advertising cookies, third-party fonts, or behavioral profiles. Service-worker caches retain the app files for offline use. Clear this site's storage in your browser to remove locally saved projects and license state.</p>
  <h2>Questions</h2><p>Contact <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>`;
const terms = `
  <p class="eyebrow">The plain-language edition</p><h1>Terms</h1><p><strong>Effective August 28, 2026.</strong></p>
  <h2>Using Cycle Blocks</h2><p>You may use Cycle Blocks to process artwork you own or have permission to use. You retain all rights to your source art and exports. Do not use the service to violate law or others' rights.</p>
  <h2>Free and Studio tools</h2><p>The free tier can export sprite sheets up to 60 baked frames and 2048 px. Studio is a $12 one-time purchase that unlocks exports up to 120 frames and 8192 px on supported devices. Accessibility, project backup, and local storage are never gated. Sociobot/Dodo is the merchant of record and handles payment and refunds. A refunded or revoked license stops unlocking Studio features.</p>
  <h2>Availability and warranty</h2><p>The software is provided “as is” without warranties. Browser canvas and memory limits vary, so inspect exports in your target engine. We may update the app or these terms, but will not claim ownership of your work.</p>
  <h2>Liability</h2><p>To the extent allowed by law, Sociobot is not liable for indirect or consequential loss. Keep your own project backups; local browser data can be removed by browser settings.</p>`;

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <a class="skip-link" href="#legal">Skip to content</a>
  <header class="site-header"><a class="brand" href="/"><img src="/icons/icon.svg" width="38" height="38" alt=""><span>Cycle Blocks</span></a><a class="button" href="/">Open workspace</a></header>
  <main id="legal" class="legal">${page === 'terms' ? terms : privacy}</main>
  <footer class="site-footer"><p>Built for local-first animation work.</p><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav></footer>`;
