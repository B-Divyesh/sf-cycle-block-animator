import './styles.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <a class="skip-link" href="#main">Skip to main content</a>
  <header class="site-header"><a class="brand" href="/"><img src="/icons/icon.svg" width="38" height="38" alt=""><span>Cycle Blocks</span></a><nav class="site-nav" aria-label="Main navigation"><a href="/demo/">Demo</a><a href="/privacy/">Privacy</a></nav><a class="button" href="/">Open editor</a></header>
  <main id="main" class="legal not-found"><p class="eyebrow">404</p><h1>This page does not exist</h1><p>The address may be wrong, or the page may have moved.</p><div class="button-row"><a class="button button--primary" href="/">Open the editor</a><a class="button" href="/demo/">Try sample data</a></div></main>
  <footer class="site-footer"><p>Build offset sprite loops from PNG frames.</p><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav><p>Built by Param Factory · Version 1.1.0</p></footer>`;
