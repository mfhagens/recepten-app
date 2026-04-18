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
    <header className="bg-white border-b border-stone-100 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍴</span>
          <div>
            <h1 className="text-xl font-[var(--font-playfair)] font-bold text-stone-900">
              Recepten
            </h1>
            <p className="text-xs text-stone-400 hidden sm:block">Hagens.org</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Export dropdown */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowExport((v) => !v)}
              className="text-xs text-stone-400 hover:text-stone-700 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors flex items-center gap-1"
            >
              Exporteer
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showExport && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowExport(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-stone-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <button
                    onClick={() => exportCSV('recipes')}
                    className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Recepten (CSV)
                  </button>
                  <div className="border-t border-stone-100" />
                  <button
                    onClick={() => exportCSV('meals')}
                    className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Maaltijden (CSV)
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={onAddClick}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Nieuw recept</span>
            <span className="sm:hidden">Nieuw</span>
          </button>
        </div>
      </div>
    </header>
  );
}
