import { useCallback, useEffect, useState } from 'react';
import { /* Link, */ Navigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ShortenForm from '../components/ShortenForm';
// import QrModal from '../components/QrModal';
import ShortLink from '../components/ShortLink';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [urls, setUrls] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  // const [qrUrl, setQrUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/urls', {
          params: { page, search: search || undefined, limit: 10 },
        });
        setUrls(data.urls);
        setPagination(data.pagination);
        setSelected([]);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load links');
      } finally {
        setLoading(false);
      }
    },
    [search]
  );

  useEffect(() => {
    if (user) load(1);
  }, [user, load]);

  if (authLoading) {
    return <p className="p-8 text-center text-ink/50">Loading…</p>;
  }
  if (!user) return <Navigate to="/login" replace />;

  function toggleSelect(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    if (selected.length === urls.length) setSelected([]);
    else setSelected(urls.map((u) => u.id));
  }

  async function bulk(action) {
    if (!selected.length) return;
    await api.post('/urls/bulk', { ids: selected, action });
    await load(pagination.page);
  }

  // Enable / Disable — uncomment when needed
  // async function toggleActive(url) {
  //   await api.patch(`/urls/${url.id}`, { isActive: !url.isActive });
  //   await load(pagination.page);
  // }

  async function remove(url) {
    if (!confirm(`Delete ${url.code}?`)) return;
    await api.delete(`/urls/${url.id}`);
    await load(pagination.page);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your links</h1>
          <p className="mt-1 text-ink/55">
            Hi {user.name} — {pagination.total} saved link
            {pagination.total === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-ink/8 bg-white/70 p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/45">
          Create new
        </h2>
        <ShortenForm onCreated={() => load(1)} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(1)}
          placeholder="Search code, title, or URL…"
          className="min-w-[200px] flex-1 rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sea/30"
        />
        <button
          type="button"
          onClick={() => load(1)}
          className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white"
        >
          Search
        </button>
        {selected.length > 0 && (
          <div className="flex gap-2 text-sm">
            {/* Enable / Disable bulk — uncomment when needed
            <button
              type="button"
              onClick={() => bulk('disable')}
              className="rounded-lg border border-ink/10 px-3 py-2"
            >
              Disable
            </button>
            <button
              type="button"
              onClick={() => bulk('enable')}
              className="rounded-lg border border-ink/10 px-3 py-2"
            >
              Enable
            </button>
            */}
            <button
              type="button"
              onClick={() => bulk('delete')}
              className="rounded-lg bg-coral/10 px-3 py-2 text-coral"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">
          {error}
        </p>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/8 bg-white/80">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-ink/8 text-xs uppercase tracking-wide text-ink/45">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={urls.length > 0 && selected.length === urls.length}
                  onChange={toggleAll}
                  className="accent-leaf"
                />
              </th>
              <th className="px-4 py-3">Short link</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Clicks</th>
              {/* Enable / Disable status column — uncomment when needed
              <th className="px-4 py-3">Status</th>
              */}
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink/45">
                  Loading…
                </td>
              </tr>
            ) : urls.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink/45">
                  No links yet. Create one above.
                </td>
              </tr>
            ) : (
              urls.map((url) => (
                <tr key={url.id} className="border-t border-ink/5">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(url.id)}
                      onChange={() => toggleSelect(url.id)}
                      className="accent-leaf"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <ShortLink url={url} />
                    {url.title && (
                      <p className="text-xs text-ink/45">{url.title}</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {url.hasPassword && (
                        <span className="rounded bg-ink/5 px-1.5 py-0.5 text-[10px] uppercase">
                          password
                        </span>
                      )}
                      {url.oneTimeUse && (
                        <span className="rounded bg-ink/5 px-1.5 py-0.5 text-[10px] uppercase">
                          one-time
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-ink/65">
                    {url.longUrl}
                  </td>
                  <td className="px-4 py-3 font-medium">{url.clicks}</td>
                  {/* Enable / Disable status — uncomment when needed
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        url.isActive
                          ? 'bg-mint/30 text-leaf'
                          : 'bg-ink/5 text-ink/45'
                      }`}
                    >
                      {url.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {/* Analytics — uncomment when needed
                      <Link
                        to={`/analytics/${url.id}`}
                        className="text-sea hover:underline"
                      >
                        Analytics
                      </Link>
                      */}
                      {/* QR code — uncomment when needed
                      <button
                        type="button"
                        onClick={() => setQrUrl(url)}
                        className="text-ink/60 hover:underline"
                      >
                        QR
                      </button>
                      */}
                      {/* Enable / Disable — uncomment when needed
                      <button
                        type="button"
                        onClick={() => toggleActive(url)}
                        className="text-ink/60 hover:underline"
                      >
                        {url.isActive ? 'Disable' : 'Enable'}
                      </button>
                      */}
                      <button
                        type="button"
                        onClick={() => remove(url)}
                        className="text-coral hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => load(pagination.page - 1)}
            className="rounded-lg border border-ink/10 px-3 py-1.5 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-ink/50">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.pages}
            onClick={() => load(pagination.page + 1)}
            className="rounded-lg border border-ink/10 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* QR code modal — uncomment when needed
      <QrModal url={qrUrl} onClose={() => setQrUrl(null)} />
      */}
    </main>
  );
}
