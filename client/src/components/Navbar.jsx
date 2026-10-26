import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/8 bg-mist/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-leaf text-mint shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 12h5M12 12h5M11 8l4 4-4 4"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-tight text-ink">
            Shortly
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          {user ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 transition ${
                    isActive
                      ? 'bg-ink text-white'
                      : 'text-ink/70 hover:bg-ink/5 hover:text-ink'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg px-3 py-1.5 text-ink/70 transition hover:bg-ink/5 hover:text-ink"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-ink/70 transition hover:bg-ink/5"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-leaf px-3 py-1.5 font-medium text-mint transition hover:brightness-110"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
