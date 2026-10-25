import { useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { SHORT_BASE } from '../api';

export default function Unlock() {
  const { code } = useParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post(`/urls/${code}/verify`, { password });
      if (data.redirectPath) {
        window.location.href = `${SHORT_BASE}${data.redirectPath}`;
      } else if (data.longUrl) {
        window.location.href = data.longUrl;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not unlock link');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Password required</h1>
      <p className="mt-2 text-ink/60">
        This short link is protected. Enter the password to continue.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-ink/60">Password</span>
          <input
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-sea/30"
          />
        </label>
        {error && (
          <p className="rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-leaf py-3 font-semibold text-mint disabled:opacity-60"
        >
          {loading ? 'Checking…' : 'Continue'}
        </button>
      </form>
    </main>
  );
}
