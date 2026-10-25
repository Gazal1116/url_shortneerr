import ShortenForm from '../components/ShortenForm';

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-noise opacity-60" />
      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6">
        <p className="animate-rise font-mono text-xs uppercase tracking-[0.2em] text-sea">
          Fast redirects · Real click analytics
        </p>
        <h1 className="animate-rise-delay mt-3 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-6xl">
          Shortly
        </h1>
        <p className="animate-rise-delay mt-4 max-w-xl text-lg text-ink/65">
          Turn long URLs into short codes, protect them with passwords, and see
          every click — device, browser, referrer, and country.
        </p>

        <div className="animate-rise-delay-2 mt-10 max-w-2xl">
          <ShortenForm />
        </div>

        <ul className="animate-rise-delay-2 mt-14 grid gap-6 text-sm text-ink/60 sm:grid-cols-3">
          <li>
            <span className="block font-semibold text-ink">Indexed lookup</span>
            Unique short-code index keeps the redirect path O(1)-ish.
          </li>
          <li>
            <span className="block font-semibold text-ink">Async analytics</span>
            Clicks are logged after the 302 so latency stays low.
          </li>
          <li>
            <span className="block font-semibold text-ink">Abuse guards</span>
            Rate limits, SSRF blocking, and destination validation.
          </li>
        </ul>
      </section>
    </main>
  );
}
