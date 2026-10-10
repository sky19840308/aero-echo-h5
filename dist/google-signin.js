// Load Google's maintained sign-in button only when the account panel is opened.
let libraryPromise;
function library(locale) {
  if (globalThis.google?.accounts?.id) return Promise.resolve(globalThis.google.accounts.id);
  if (!libraryPromise) libraryPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client?hl=' + encodeURIComponent(locale === 'zh' ? 'zh-CN' : locale);
    script.async = true;
    const timer = setTimeout(() => reject(new Error('google-library-unavailable')), 15000);
    script.onload = () => { clearTimeout(timer); globalThis.google?.accounts?.id ? resolve(globalThis.google.accounts.id) : reject(new Error('google-library-unavailable')); };
    script.onerror = () => { clearTimeout(timer); reject(new Error('google-library-unavailable')); };
    document.head.appendChild(script);
  }).catch(error => { libraryPromise = null; throw error; });
  return libraryPromise;
}

export class GoogleSignIn {
  constructor(account, {text, onSuccess} = {}) {
    this.account = account; this.text = text || (key => key); this.onSuccess = onSuccess || (() => {});
    this.generation = 0; this.preparing = null; this.challenge = null; this.busy = false;
  }
  async prepare() {
    if (this.challenge?.expiresAt > Date.now() + 30000) return this.challenge;
    if (!this.preparing) this.preparing = this.account.request('/api/auth/google/challenge', {method: 'POST', body: {}})
      .then(value => (this.challenge = value)).finally(() => { this.preparing = null; });
    return this.preparing;
  }
  async mount(container, locale) {
    const generation = ++this.generation;
    if (!container || !this.account.enabled || this.account.user) return;
    const active = () => generation === this.generation && container.isConnected;
    container.textContent = this.text('googleLoading');
    try {
      const config = await this.account.request('/api/auth/config');
      if (!active()) return;
      if (!config.configured || !config.clientId) {
        container.textContent = this.text('googlePending');
        container.classList.add('google-pending'); return;
      }
      if (this.account.crossOrigin) {
        container.textContent = ''; container.classList.remove('google-pending');
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'primary'; button.textContent = this.text('signIn');
        button.addEventListener('click', () => this.startPopup(container, locale, active));
        container.appendChild(button);
        const note = document.createElement('p'); note.className = 'tiny-note'; note.textContent = this.text('googlePopupNote'); container.appendChild(note);
        return;
      }
      const [google, challenge] = await Promise.all([library(locale), this.prepare()]);
      if (!active()) return;
      container.textContent = ''; container.classList.remove('google-pending');
      google.initialize({client_id: config.clientId, nonce: challenge.nonce, auto_select: false, ux_mode: 'popup',
        callback: async result => {
          if (!active() || this.busy) return;
          this.busy = true; container.setAttribute('aria-busy', 'true');
          try {
            await this.account.request('/api/auth/google', {method: 'POST', body: {credential: result.credential, nonce: challenge.nonce}});
            this.challenge = null;
            await this.account.initialize(); await this.onSuccess();
          } catch {
            this.challenge = null;
            if (active()) container.textContent = this.text('googleError');
          } finally { this.busy = false; container.removeAttribute('aria-busy'); }
        }});
      google.renderButton(container, {type: 'standard', theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill',
        width: Math.max(180, Math.min(320, Math.floor(container.getBoundingClientRect().width))), locale: locale === 'zh' ? 'zh-CN' : locale});
    } catch { if (active()) container.textContent = this.text('googleError'); }
  }
  startPopup(container, locale, active) {
    if (this.busy) return;
    this.cancelPopup?.();
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const state = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const url = this.account.origin + '/google-signin#' + new URLSearchParams({state, lang: locale});
    const popup = globalThis.open(url, '_blank', 'popup=yes,width=480,height=720');
    if (!popup) { container.appendChild(document.createTextNode(this.text('googlePopupBlocked'))); return; }
    let exchanged = false;
    const cleanup = () => { clearTimeout(timer); globalThis.removeEventListener('message', receive); this.cancelPopup = null; };
    const receive = async event => {
      if (!active() || exchanged || event.origin !== this.account.origin || event.source !== popup || event.data?.type !== 'aero-google-handoff' || event.data.state !== state || !/^[A-Za-z0-9_-]{43}$/.test(event.data.code)) return;
      exchanged = true; cleanup(); this.busy = true; container.setAttribute('aria-busy', 'true');
      try {
        const session = await this.account.request('/api/auth/exchange', {method: 'POST', body: {state, code: event.data.code}});
        this.account.setSession(session);
        popup.close(); await this.account.initialize(); await this.onSuccess();
      } catch { if (active()) container.textContent = this.text('googleError'); }
      finally { this.busy = false; container.removeAttribute('aria-busy'); }
    };
    const timer = setTimeout(() => { cleanup(); if (active()) container.appendChild(document.createTextNode(this.text('googlePopupRetry'))); }, 5 * 60 * 1000);
    this.cancelPopup = () => { cleanup(); popup.close(); };
    globalThis.addEventListener('message', receive);
  }
  async signOut() {
    await this.account.request('/api/auth/signout', {method: 'POST', body: {}});
    this.cancelPopup?.(); this.account.clearSession();
    ++this.generation; this.challenge = null;
    globalThis.google?.accounts?.id?.disableAutoSelect();
    await this.account.initialize();
  }
}
