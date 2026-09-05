import './styles.css';

const page = document.body.dataset.legal;
const privacy = `
  <h1>Privacy</h1><p><strong>Effective September 5, 2026.</strong></p>
  <h2>Your artwork stays on your device</h2><p>Cycle Blocks processes PNGs, recipes, previews, and exports in your browser.</p><p>Your current project is stored in IndexedDB so it can survive a refresh.</p><p>Cycle Blocks does not upload or receive your artwork.</p>
  <h2>License checks</h2><p>If you restore Studio, the license token is stored in localStorage.</p><p>The app checks that token with <code>api.sociobot.in</code> once, then caches the result for one day.</p><p>Replacing the token starts a new check.</p><p>Sociobot/Dodo handles checkout information.</p>
  <h2>No tracking</h2><p>The app has no analytics, advertising cookies, third-party fonts, or behavior profiles.</p><p>The service worker caches app files for offline use.</p><p>Clear this site's browser storage to remove saved projects and license state.</p>
  <h2>Questions</h2><p>Contact <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>`;
const terms = `
  <h1>Terms</h1><p><strong>Effective September 5, 2026.</strong></p>
  <h2>Using Cycle Blocks</h2><p>Use Cycle Blocks only with artwork you own or have permission to use.</p><p>You keep all rights to your source art and exports.</p><p>Do not use the service to break the law or others' rights.</p>
  <h2>Free and Studio tools</h2><p>The free tier exports up to 60 baked frames and 2048 px.</p><p>Studio costs $12 once and supports 120 frames and 8192 px on compatible devices.</p><p>Sociobot/Dodo handles payment and refund requests.</p><p>A refunded or revoked license stops Studio exports.</p>
  <h2>Availability and warranty</h2><p>The software is provided “as is” without warranties.</p><p>Browser canvas and memory limits vary. Inspect exports in your target engine.</p><p>We may update the app or these terms. We will not claim ownership of your work.</p>
  <h2>Liability</h2><p>Where law allows, Sociobot is not liable for indirect or consequential loss.</p><p>Keep project backups because browser settings can remove local data.</p>`;

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <a class="skip-link" href="#main">Skip to main content</a>
  <header class="site-header"><a class="brand" href="/"><img src="/icons/icon.svg" width="38" height="38" alt=""><span>Cycle Blocks</span></a><nav class="site-nav" aria-label="Main navigation"><a href="/demo/">Demo</a><a href="/privacy/">Privacy</a></nav><a class="button" href="/">Open editor</a></header>
  <main id="main" class="legal">${page === 'terms' ? terms : privacy}</main>
  <footer class="site-footer"><p>Build offset sprite loops from PNG frames.</p><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav><p>Built by Param Factory · Version 1.1.0</p></footer>`;
