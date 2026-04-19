'use client';
import { useState } from 'react';

interface Props {
  onAddClick: () => void;
}

export default function Header({ onAddClick }: Props) {
  const [showExport, setShowExport] = useState(false);

  function exportCSV(table: string) {
    window.location.href = `/api/export?table=${table}`;
    setShowExport(false);
  }

  return (
    <header className="bg-stone-900 border-b-2 border-stone-900">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-3 flex items-center justify-between gap-4">
        {/* Export */}
        <div className="relative hidden sm:block w-32">
          <button
            onClick={() => setShowExport((v) => !v)}
            className="text-xs tracking-widest uppercase text-stone-400 hover:text-white transition-colors flex items-center gap-1"
          >
            Exporteer
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showExport && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowExport(false)} />
              <div className="absolute left-0 top-full mt-2 w-44 bg-white border border-stone-200 shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => exportCSV('recipes')}
                  className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                >
                  Recepten (CSV)
                </button>
                <div className="border-t border-stone-100" />
                <button
                  onClick={() => exportCSV('meals')}
                  className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                >
                  Maaltijden (CSV)
                </button>
              </div>
            </>
          )}
        </div>

        {/* Masthead title */}
        <div className="flex-1 text-center">
          <h1 className="font-[var(--font-playfair)] font-bold text-white tracking-tight leading-none"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            Recepten
          </h1>
          <p className="text-xs tracking-[0.25em] uppercase text-stone-400 mt-1">Hagens.org</p>
        </div>

        {/* Add button */}
        <div className="w-32 flex justify-end">
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 bg-white hover:bg-stone-100 text-stone-900 px-4 py-2 text-sm font-medium tracking-wide transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Nieuw</span>
          </button>
        </div>
      </div>

      {/* Thin decorative line */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-4">
        <div className="border-t border-stone-700" />
      </div>
    </header>
  );
}
