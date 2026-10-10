import {createProfile, normalizeProfile, STORAGE} from './profile.js?v=18';

const copy = value => JSON.parse(JSON.stringify(value));
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const revision = value => Number.isInteger(value) && value >= 0 ? value : 0;
export const GITHUB_ORIGIN = 'https://sky19840308.github.io';
export const SITE_ORIGIN = 'https://aero-echo-sky.spy-liver.chatgpt.site';
const SESSION_KEY = 'aero-echo.google-session';
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
export class AccountError extends Error {
  constructor(status, data) { super(data?.error || `http-${status}`); this.status = status; this.data = data; this.code = data?.error; }
}

export class Account {
  constructor({fetcher = globalThis.fetch?.bind(globalThis), storage, sessionStorage, origin, enabled, onChange, onProfile, onIssue} = {}) {
    let browserStorage; try { browserStorage = globalThis.localStorage; } catch { browserStorage = null; }
    let browserSession; try { browserSession = globalThis.sessionStorage; } catch { browserSession = null; }
    this.fetcher = fetcher; this.storage = storage ?? browserStorage;
    this.frontendOrigin = new URL(origin ?? globalThis.location?.origin ?? 'http://localhost').origin;
    this.crossOrigin = this.frontendOrigin === GITHUB_ORIGIN;
    this.origin = this.crossOrigin ? SITE_ORIGIN : this.frontendOrigin;
    this.enabled = enabled ?? (this.crossOrigin || new URL(this.origin).hostname.endsWith('.chatgpt.site'));
    this.sessionStorage = sessionStorage ?? browserSession;
    this.accessToken = null; this.expiresAt = 0;
    if (this.crossOrigin) {
      try { const saved = JSON.parse(this.sessionStorage?.getItem(SESSION_KEY) || 'null');
        if (TOKEN.test(saved?.accessToken) && saved.expiresAt > Date.now()) { this.accessToken = saved.accessToken; this.expiresAt = saved.expiresAt; }
      } catch {}
    }
    this.onChange = onChange ?? (() => {}); this.onProfile = onProfile ?? (() => {}); this.onIssue = onIssue ?? (() => {});
    this.user = null; this.status = this.enabled ? 'loading' : 'disabled'; this.revision = 0;
    this.profile = createProfile(); this.conflict = null; this.epoch = 0;
    this.pending = null; this.timer = null; this.inflight = null;
  }
  get key() { return this.user ? `aero-echo.h5.account.${encodeURIComponent(this.user.id)}` : null; }
  get personalKey() { return this.key; }
  get backupKey() { return this.key ? `${this.key}.previous` : null; }
  setSession(value) {
    if (!this.crossOrigin || !TOKEN.test(value?.accessToken) || !(value.expiresAt > Date.now())) throw new AccountError(400, {error: 'invalid-session'});
    ++this.epoch; this._clearPending(); this.accessToken = value.accessToken; this.expiresAt = value.expiresAt;
    try { this.sessionStorage?.setItem(SESSION_KEY, JSON.stringify({accessToken: this.accessToken, expiresAt: this.expiresAt})); } catch {}
  }
  clearSession() {
    this.accessToken = null; this.expiresAt = 0;
    try { this.sessionStorage?.removeItem(SESSION_KEY); } catch {}
  }
  _read(key) { try { return JSON.parse(this.storage?.getItem(key) ?? 'null'); } catch { return null; } }
  _write(key, value) { if (!key) return; try { this.storage?.setItem(key, JSON.stringify(value)); } catch (error) { this.onIssue(error, {kind: 'local-storage'}); } }
  _cache(profile = this.profile, dirty = !!this.pending) {
    if (!this.key) return;
    this._write(this.key, profile); this._write(`${this.key}.sync`, {revision: this.revision, dirty, updatedAt: Date.now()});
  }
  _changed() { this.onChange(this); }
  _profile(profile, source) { this.profile = normalizeProfile(profile); this.onProfile(copy(this.profile), {source, userId: this.user?.id ?? null}); }
  _clearPending() { if (this.timer) clearTimeout(this.timer); this.timer = null; this.pending = null; }
  _guest(source = 'guest') {
    ++this.epoch; this._clearPending(); this.user = null; this.revision = 0; this.conflict = null;
    this.status = this.enabled ? 'guest' : 'disabled';
    this._profile(this._read(STORAGE) || createProfile(), source); this._changed();
  }
  _identityChanged(user) {
    ++this.epoch; this._clearPending(); this.conflict = null;
    this.user = object(user) && typeof user.id === 'string' ? {id: user.id, name: user.name || 'Pilot'} : null;
    this.revision = 0; this.status = this.user ? 'loading' : 'guest';
    const backup = this.key ? this._read(this.key) : this._read(STORAGE);
    this._profile(backup || createProfile(), 'identity-changed'); this._changed();
    this.onIssue(new AccountError(419, {error: 'account-changed', user}), {kind: 'identity-changed'});
    if (this.user) Promise.resolve().then(() => this.initialize()).catch(() => {});
  }
  async request(path, {method = 'GET', body, signal, accountId, headers: extraHeaders} = {}) {
    if (!this.fetcher || !this.enabled) throw new AccountError(503, {error: 'cloud-unavailable'});
    const url = new URL(path, `${this.origin}/`);
    if (url.origin !== this.origin || !url.pathname.startsWith('/api/')) throw new AccountError(400, {error: 'invalid-api-path'});
    const headers = new Headers(extraHeaders), mutation = !['GET', 'HEAD'].includes(method.toUpperCase());
    if (body !== undefined) headers.set('Content-Type', 'application/json');
    if (mutation) {
      const id = accountId ?? this.user?.id;
      if (id) headers.set('X-Aero-Account', id);
    }
    if (this.crossOrigin && this.accessToken) {
      if (this.expiresAt <= Date.now()) this.clearSession();
      else headers.set('Authorization', 'Bearer ' + this.accessToken);
    }
    const currentEpoch = this.epoch;
    const response = await this.fetcher(url.href, {method, headers, credentials: this.crossOrigin ? 'omit' : 'same-origin', cache: 'no-store', signal, ...(body !== undefined ? {body: JSON.stringify(body)} : {})});
    let data; try { data = await response.json(); } catch { data = {error: 'invalid-server-response'}; }
    if (!response.ok) {
      if (currentEpoch === this.epoch && response.status === 419) this._identityChanged(data.user);
      else if (currentEpoch === this.epoch && response.status === 401) { this.clearSession(); if (this.user) this._guest('identity-changed'); }
      throw new AccountError(response.status, data);
    }
    return data;
  }
  async initialize() {
    if (!this.enabled) { this._guest(); return this; }
    const epoch = ++this.epoch;
    this._clearPending(); this.status = 'loading'; this._changed();
    try {
      const data = await this.request('/api/me');
      if (epoch !== this.epoch) return this;
      if (!data.authenticated || !object(data.user) || typeof data.user.id !== 'string') { this._guest(); return this; }
      this.user = {id: data.user.id, name: data.user.name || 'Pilot'};
      this.revision = revision(data.revision); this.conflict = null;
      const key = this.key, local = this._read(key), meta = this._read(`${key}.sync`);
      if (local && meta?.dirty && revision(meta.revision) !== this.revision) {
        this._conflict(local, data.save || createProfile(), this.revision);
      } else if (local && meta?.dirty) {
        this.status = 'pending'; this._profile(local, 'account-backup');
        this.pending = {profile: copy(this.profile), userId: this.user.id, epoch}; this._cache(this.profile, true); this._schedule(); this._changed();
      } else {
        this.status = 'synced'; this._profile(data.save || createProfile(), 'cloud'); this._cache(this.profile, false); this._changed();
      }
    } catch (error) {
      if (epoch !== this.epoch) return this;
      if (error.status === 401) { this._guest(); return this; }
      if (error.status === 503 && object(error.data?.user) && typeof error.data.user.id === 'string') {
        this.user = {id: error.data.user.id, name: error.data.user.name || 'Pilot'};
      }
      if (this.user) {
        const local = this._read(this.key), meta = this._read(`${this.key}.sync`);
        this.revision = revision(meta?.revision); this.status = 'offline';
        this._profile(local || createProfile(), 'offline-account');
      } else {
        this.status = 'offline'; this._profile(this._read(STORAGE) || createProfile(), 'guest');
      }
      this._changed(); this.onIssue(error, {kind: 'offline'});
    }
    return this;
  }
  _schedule() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.timer = null; this.flush().catch(() => {}); }, 700);
    this.timer?.unref?.();
  }
  save(profile) {
    if (!this.user) return false;
    this.profile = normalizeProfile(profile);
    if (this.conflict) {
      this.conflict.local = copy(this.profile); this._write(`${this.key}.previous`, this.conflict.local);
      this._changed(); return false;
    }
    this.pending = {profile: copy(this.profile), userId: this.user.id, epoch: this.epoch};
    this._cache(this.profile, true);
    if (this.status !== 'offline') this.status = 'pending';
    this._schedule(); this._changed(); return true;
  }
  _conflict(local, remote, remoteRevision) {
    this._clearPending(); this.revision = revision(remoteRevision);
    this.conflict = {local: normalizeProfile(local), remote: normalizeProfile(remote), revision: this.revision};
    this._write(`${this.key}.previous`, this.conflict.local);
    this.status = 'conflict'; this._profile(this.conflict.remote, 'cloud-conflict'); this._cache(this.profile, false); this._changed();
    this.onIssue(new AccountError(409, {error: 'save-conflict', revision: this.revision}), {kind: 'conflict'});
  }
  async resolveConflict(side) {
    if (!this.conflict || !['cloud', 'local'].includes(side)) return false;
    const selected = copy(side === 'local' ? this.conflict.local : this.conflict.remote);
    this.conflict = null; this.status = 'synced'; this._profile(selected, side === 'local' ? 'account-backup' : 'cloud');
    this._cache(this.profile, false); this._changed();
    if (side === 'local') { this.save(selected); return this.flush(); }
    return true;
  }
  async flush() {
    if (this.timer) clearTimeout(this.timer); this.timer = null;
    if (this.inflight) return this.inflight;
    if (!this.pending || !this.user || this.conflict) return false;
    const run = async () => {
      let saved = false;
      while (this.pending && this.user && !this.conflict) {
        const entry = this.pending; this.pending = null;
        if (entry.epoch !== this.epoch || entry.userId !== this.user.id) continue;
        this.status = 'saving'; this._changed();
        try {
          const data = await this.request('/api/save', {method: 'PUT', accountId: entry.userId, body: {save: entry.profile, revision: this.revision}});
          if (entry.epoch !== this.epoch || entry.userId !== this.user?.id) continue;
          this.revision = revision(data.revision); saved = true;
          // A newer local edit may have arrived while the first save was in flight.
          this._cache(this.profile, !!this.pending); this.status = this.pending ? 'pending' : 'synced'; this._changed();
        } catch (error) {
          if (entry.epoch !== this.epoch || entry.userId !== this.user?.id) continue;
          if (error.status === 409) this._conflict(this.pending?.profile || entry.profile, error.data?.save || createProfile(), error.data?.revision);
          else {
            this.pending ||= entry; this.status = 'offline'; this._cache(this.pending.profile, true);
            this._changed(); this.onIssue(error, {kind: 'offline'});
          }
          break;
        }
      }
      return saved;
    };
    this.inflight = run();
    try { return await this.inflight; } finally { this.inflight = null; }
  }
  async nickname(name) {
    const epoch = this.epoch, data = await this.request('/api/nickname', {method: 'POST', body: {name}});
    if (epoch !== this.epoch || data.user?.id !== this.user?.id) return false;
    this.user = {...this.user, name: data.user.name}; this._changed(); return true;
  }
}
