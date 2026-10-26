import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#0b3d2e', '#1f7a8c', '#7cffb2', '#e85d4c', '#1a2b42', '#5b8def'];

export default function Analytics() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: res } = await api.get(`/urls/${id}/analytics`, {
          params: {
            from: from || undefined,
            to: to || undefined,
          },
        });
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load analytics');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, id, from, to]);

  if (authLoading) {
    return <p className="p-8 text-center text-ink/50">Loading…</p>;
  }
  if (!user) return <Navigate to="/login" replace />;

  const analytics = data?.analytics;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link to="/dashboard" className="text-sm text-sea hover:underline">
        ← Back to dashboard
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          {data?.url && (
            <p className="mt-1 font-mono text-sm text-ink/55">
              /{data.url.code} · {analytics?.totalClicks ?? 0} clicks in range
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-ink/10 bg-white px-3 py-2"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-ink/10 bg-white px-3 py-2"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">
          {error}
        </p>
      )}

      {!data && !error && (
        <p className="mt-10 text-center text-ink/45">Loading analytics…</p>
      )}

      {analytics && (
        <div className="mt-8 space-y-8">
          <section className="rounded-2xl border border-ink/8 bg-white/80 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink/45">
              Clicks over time
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.clicksOverTime}>
                  <defs>
                    <linearGradient id="fillSea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1f7a8c" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#1f7a8c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0a162814" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#1f7a8c"
                    fill="url(#fillSea)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Devices">
              <PieBlock data={analytics.devices} />
            </ChartCard>
            <ChartCard title="Browsers">
              <PieBlock data={analytics.browsers} />
            </ChartCard>
            <ChartCard title="Top referrers">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.topReferrers.map((r) => ({
                      ...r,
                      label: shorten(r.referrer, 28),
                    }))}
                    layout="vertical"
                    margin={{ left: 8, right: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#0a162814" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={100}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0b3d2e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <ChartCard title="Countries">
              <ul className="max-h-56 space-y-2 overflow-y-auto text-sm">
                {analytics.countries.length === 0 && (
                  <li className="text-ink/45">No geo data yet</li>
                )}
                {analytics.countries.map((c) => (
                  <li
                    key={c.country}
                    className="flex items-center justify-between gap-3 border-b border-ink/5 pb-2"
                  >
                    <span>{c.country}</span>
                    <span className="font-mono text-ink/55">{c.count}</span>
                  </li>
                ))}
              </ul>
            </ChartCard>
          </div>
        </div>
      )}
    </main>
  );
}

function ChartCard({ title, children }) {
  return (
    <section className="rounded-2xl border border-ink/8 bg-white/80 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink/45">
        {title}
      </h2>
      {children}
    </section>
  );
}

function PieBlock({ data }) {
  if (!data?.length) {
    return <p className="py-10 text-center text-sm text-ink/45">No data yet</p>;
  }
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            innerRadius={48}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function shorten(str, n) {
  if (!str) return 'direct';
  return str.length > n ? `${str.slice(0, n)}…` : str;
}
