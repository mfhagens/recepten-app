'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const USERS = ['Sara', 'Job', 'Martijn', 'Karlijn'];

export default function LoginPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !password) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password, rememberMe }),
    });
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? 'Er ging iets mis');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-sky-700 py-10 text-center">
        <h1 className="font-serif font-bold text-white tracking-tight" style={{ fontSize: '2.5rem' }}>
          Recepten
        </h1>
        <p className="text-sky-200 text-xs tracking-[0.25em] uppercase mt-1">Hagens.org</p>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-bold text-stone-900 mb-8 text-center">Inloggen</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Wie ben jij?</label>
              <div className="flex flex-wrap gap-2">
                {USERS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setName(u)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      name === u
                        ? 'bg-[#C7EBF6] text-stone-800 border-2 border-sky-600'
                        : 'bg-[#E8D9C6] text-stone-900 hover:bg-[#D9C9B4]'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Wachtwoord</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Wachtwoord"
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-sky-600"
              />
              <span className="text-sm text-stone-600">Onthoud mij (30 dagen)</span>
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={!name || !password || loading}
              className="w-full py-3 rounded-xl bg-sky-700 hover:bg-sky-800 disabled:bg-stone-300 text-white text-sm font-semibold transition-all"
            >
              {loading ? 'Inloggen…' : 'Inloggen'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
