// Load Google's maintained sign-in button only when the account panel is opened.
let libraryPromise;
const LOGIN_STATE_KEY = 'aero-echo.google-return-state';
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
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
        button.addEventListener('click', () => this.startRedirect(container, locale));
        container.appendChild(button);
        const note = document.createElement('p'); note.className = 'tiny-note'; note.textContent = this.text(this.returnError || 'googlePopupNote'); container.appendChild(note);
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
  startRedirect(container, locale) {
    if (this.busy) return;
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const state = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    try {
      const pending = JSON.stringify({state, createdAt: Date.now()});
      this.account.sessionStorage?.setItem(LOGIN_STATE_KEY, pending);
      if (this.account.sessionStorage?.getItem(LOGIN_STATE_KEY) !== pending) throw new Error('storage-unavailable');
      // Navigate the current tab: mobile/in-app browsers need not retain window.opener.
      const url = this.account.origin + '/google-signin?' + new URLSearchParams({mode: 'redirect', state, lang: locale});
      globalThis.location.assign(url);
    } catch { container.textContent = this.text('googleStorageError'); }
  }
  async completeRedirect() {
    if (!this.account.crossOrigin) return {attempted: false};
    const params = new URLSearchParams(globalThis.location?.hash?.slice(1) || '');
    if (!params.has('aero_login')) return {attempted: false};
    const state = params.get('state'), code = params.get('code');
    // Remove the one-use handoff before any account/asset work. Never expose the bearer in a URL.
    for (const key of ['aero_login', 'state', 'code']) params.delete(key);
    const rest = params.toString();
    globalThis.history.replaceState(globalThis.history.state, '', globalThis.location.pathname + globalThis.location.search + (rest ? '#' + rest : ''));
    try {
      const pending = JSON.parse(this.account.sessionStorage?.getItem(LOGIN_STATE_KEY) || 'null');
      this.account.sessionStorage?.removeItem(LOGIN_STATE_KEY);
      if (!TOKEN.test(state || '') || !TOKEN.test(code || '') || pending?.state !== state || !Number.isFinite(pending.createdAt) || pending.createdAt > Date.now() || Date.now() - pending.createdAt > 10 * 60 * 1000) {
        this.returnError = 'googleReturnExpired'; return {attempted: true, error: this.returnError};
      }
      const session = await this.account.request('/api/auth/exchange', {method: 'POST', body: {state, code}});
      this.account.setSession(session); this.returnError = null;
      return {attempted: true, authenticated: true};
    } catch (error) {
      this.returnError = error.status === 401 ? 'googleReturnExpired' : 'googleError';
      return {attempted: true, error: this.returnError};
    }
  }
  async signOut() {
    await this.account.request('/api/auth/signout', {method: 'POST', body: {}});
    this.account.clearSession();
    try { this.account.sessionStorage?.removeItem(LOGIN_STATE_KEY); } catch {}
    ++this.generation; this.challenge = null;
    globalThis.google?.accounts?.id?.disableAutoSelect();
    await this.account.initialize();
  }
}
