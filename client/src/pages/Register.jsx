import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Create account</h1>
      <p className="mt-2 text-ink/60">Save links and unlock the analytics dashboard.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-ink/60">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-sea/30"
          />
        </label>
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
            minLength={6}
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
          {loading ? 'Creating…' : 'Sign up'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/55">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-sea hover:underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
