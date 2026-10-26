import { useRef, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ShortLink from './ShortLink';
import { slugFromUrl } from '../utils/slugFromUrl';

const empty = {
  longUrl: '',
  customAlias: '',
  title: '',
  expiresAt: '',
  password: '',
  clickLimit: '',
  oneTimeUse: false,
};

export default function ShortenForm({ onCreated }) {
  const { user } = useAuth();
  const [form, setForm] = useState(empty);
  const [advanced, setAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const aliasEdited = useRef(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function onLongUrlChange(value) {
    const suggested = slugFromUrl(value);
    setForm((f) => ({
      ...f,
      longUrl: value,
      // Auto-fill alias from the link unless the user typed their own
      customAlias: aliasEdited.current ? f.customAlias : suggested,
    }));
  }

  function onAliasChange(value) {
    aliasEdited.current = true;
    update(
      'customAlias',
      value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const payload = {
        longUrl: form.longUrl.trim(),
        customAlias: form.customAlias.trim() || undefined,
        title: form.title.trim() || undefined,
        expiresAt: form.expiresAt || undefined,
        password: form.password || undefined,
        clickLimit: form.clickLimit ? Number(form.clickLimit) : undefined,
        oneTimeUse: form.oneTimeUse,
      };

      const { data } = await api.post('/urls', payload);
      setResult(data.url);
      setForm(empty);
      aliasEdited.current = false;
      onCreated?.(data.url);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to shorten URL';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!result?.shortUrl) return;
    await navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            required
            placeholder="Paste a long URL…"
            value={form.longUrl}
            onChange={(e) => onLongUrlChange(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-ink/10 bg-white px-4 py-3 text-ink shadow-sm outline-none ring-sea/30 transition placeholder:text-ink/35 focus:ring-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-leaf px-6 py-3 font-semibold text-mint shadow-sm transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? 'Shortening…' : 'Shorten'}
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex flex-col gap-2 rounded-xl border border-ink/8 bg-white/60 px-3 py-2.5 sm:flex-row sm:items-center">
            <span className="shrink-0 font-mono text-sm text-ink/40">
              localhost:5001/s/
            </span>
            <input
              value={form.customAlias}
              onChange={(e) => onAliasChange(e.target.value)}
              placeholder="name-from-your-link"
              className="min-w-0 flex-1 border-0 bg-transparent py-1 font-mono text-sm text-ink outline-none placeholder:text-ink/30"
              maxLength={32}
            />
          </div>
          <p className="px-1 text-xs text-ink/45">
            Name is suggested from the URL (site + path). Edit it anytime.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAdvanced((v) => !v)}
          className="text-sm font-medium text-sea hover:underline"
        >
          {advanced ? 'Hide options' : 'Expiry, password, click limit…'}
        </button>

        {advanced && (
          <div className="animate-rise grid gap-3 rounded-xl border border-ink/8 bg-white/70 p-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-ink/60">Title</span>
              <input
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="Campaign name"
                className="w-full rounded-lg border border-ink/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-sea/30"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-ink/60">Expires at</span>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => update('expiresAt', e.target.value)}
                className="w-full rounded-lg border border-ink/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-sea/30"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-ink/60">Click limit</span>
              <input
                type="number"
                min="1"
                value={form.clickLimit}
                onChange={(e) => update('clickLimit', e.target.value)}
                placeholder="Unlimited"
                className="w-full rounded-lg border border-ink/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-sea/30"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-ink/60">Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border border-ink/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-sea/30"
              />
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.oneTimeUse}
                onChange={(e) => update('oneTimeUse', e.target.checked)}
                className="size-4 accent-leaf"
              />
              <span className="text-ink/70">One-time use link</span>
            </label>
            {!user && (
              <p className="sm:col-span-2 text-xs text-ink/50">
                Anonymous links work, but signing in saves them to your dashboard.
              </p>
            )}
          </div>
        )}
      </form>

      {error && (
        <p className="mt-3 rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">
          {error}
        </p>
      )}

      {result && (
        <div className="animate-rise mt-4 flex flex-col gap-3 rounded-xl border border-mint/40 bg-leaf p-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-mint/80">
              Short link ready
            </p>
            <div className="mt-1 truncate [&_a]:text-mint">
              <ShortLink url={result} className="text-base" />
            </div>
          </div>
          <button
            type="button"
            onClick={copyLink}
            className="shrink-0 rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-leaf"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}
