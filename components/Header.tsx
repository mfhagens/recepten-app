'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  onAddClick: () => void;
  activeTab: 'recepten' | 'planning';
  onTabChange: (tab: 'recepten' | 'planning') => void;
}

export default function Header({ onAddClick, activeTab, onTabChange }: Props) {
  const [showExport, setShowExport] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setCurrentUser(d.name ?? null));
  }, []);

  function exportCSV(table: string) {
    window.location.href = `/api/export?table=${table}`;
    setShowExport(false);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <header style={{ backgroundColor: '#0D5E86', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-3 flex items-center justify-between gap-4">
        {/* Left: current user */}
        <div className="w-32 hidden sm:flex items-center">
          {currentUser && (
            <span className="text-xs tracking-wide" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {currentUser}
            </span>
          )}
        </div>

        {/* Masthead title */}
        <div className="flex-1 text-center">
          <h1 className="font-[var(--font-playfair)] font-bold text-white tracking-tight leading-none"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            Recepten
          </h1>
          <p className="text-xs tracking-[0.25em] uppercase mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Hagens.org
          </p>
        </div>

        {/* Right: Nieuw button */}
        <div className="w-32 flex justify-end">
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium transition-all"
            style={{ backgroundColor: '#D9C7AF', color: '#163247', borderRadius: '18px' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#D1B99D')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#D9C7AF')}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Nieuw</span>
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
          <div className="flex gap-0">
            {(['planning', 'recepten'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className="py-3 px-5 text-xs tracking-widest uppercase font-medium border-b-2 transition-colors"
                style={{
                  color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.65)',
                  borderBottomColor: activeTab === tab ? 'white' : 'transparent',
                }}
              >
                {tab === 'recepten' ? 'Recepten' : 'Weekplanning'}
              </button>
            ))}
          </div>

          {/* Right side: Export + Uitloggen */}
          <div className="flex items-center gap-5">
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowExport((v) => !v)}
                className="text-xs tracking-widest uppercase flex items-center gap-1 py-3 transition-colors"
                style={{ color: 'rgba(255,255,255,0.65)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
              >
                Exporteer
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showExport && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExport(false)} />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border shadow-lg z-50 overflow-hidden" style={{ borderColor: '#CFC5B8' }}>
                    <button onClick={() => exportCSV('recipes')} className="w-full text-left px-4 py-2.5 text-sm transition-colors" style={{ color: '#163247' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F7F4EE')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}>
                      Recepten (CSV)
                    </button>
                    <div style={{ borderTop: '1px solid #EDE8E2' }} />
                    <button onClick={() => exportCSV('meals')} className="w-full text-left px-4 py-2.5 text-sm transition-colors" style={{ color: '#163247' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F7F4EE')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}>
                      Maaltijden (CSV)
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="text-xs tracking-widest uppercase py-3 transition-colors"
              style={{ color: 'rgba(255,255,255,0.65)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
            >
              Uitloggen
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
