'use client';
import { useState } from 'react';

interface Props {
  onAddClick: () => void;
  activeTab: 'recepten' | 'planning';
  onTabChange: (tab: 'recepten' | 'planning') => void;
}

export default function Header({ onAddClick, activeTab, onTabChange }: Props) {
  const [showExport, setShowExport] = useState(false);

  function exportCSV(table: string) {
    window.location.href = `/api/export?table=${table}`;
    setShowExport(false);
  }

  return (
    <header className="bg-sky-700 border-b-2 border-sky-700">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-3 flex items-center justify-between gap-4">
        {/* Spacer left */}
        <div className="w-32 hidden sm:block" />

        {/* Masthead title */}
        <div className="flex-1 text-center">
          <h1 className="font-[var(--font-playfair)] font-bold text-white tracking-tight leading-none"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            Recepten
          </h1>
          <p className="text-xs tracking-[0.25em] uppercase text-sky-200 mt-1">Hagens.org</p>
        </div>

        {/* Add button */}
        <div className="w-32 flex justify-end">
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 bg-[#E8D9C6] hover:bg-[#D9C9B4] text-stone-900 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Nieuw</span>
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="border-t border-sky-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
          <div className="flex gap-0">
            {(['planning', 'recepten'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`py-3 px-5 text-xs tracking-widest uppercase font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-white text-white'
                    : 'border-transparent text-sky-200 hover:text-white'
                }`}
              >
                {tab === 'recepten' ? 'Recepten' : 'Weekplanning'}
              </button>
            ))}
          </div>

          {/* Export — right side of tab bar */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowExport((v) => !v)}
              className="text-xs tracking-widest uppercase text-sky-200 hover:text-white transition-colors flex items-center gap-1 py-3"
            >
              Exporteer
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showExport && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExport(false)} />
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-stone-200 shadow-lg z-50 overflow-hidden">
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
        </div>
      </div>
    </header>
  );
}
