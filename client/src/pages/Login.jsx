import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-ink/60">Log in to manage your short links.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-ink/60">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-sea/30"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/60">Password</span>
          <input
            type="password"
            required
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
          {loading ? 'Signing in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/55">
        No account?{' '}
        <Link to="/register" className="font-medium text-sea hover:underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
