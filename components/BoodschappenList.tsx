'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const MONTHS_NL = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

function getWeekStart(date: Date): Date {
  const d = new Date(date.toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' }) + 'T00:00:00');
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmt(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });
}

interface RecipeItem {
  text: string;
  checked: boolean;
  recipeName: string;
}

interface ExtraItem {
  id: number;
  text: string;
  checked: boolean;
}

interface Props {
  initialWeek?: Date;
}

export default function BoodschappenList({ initialWeek }: Props) {
  const [weekStart, setWeekStart] = useState(() => initialWeek ?? getWeekStart(new Date()));
  const [items, setItems] = useState<RecipeItem[]>([]);
  const [extras, setExtras] = useState<ExtraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekLabel = `${weekDates[0].getDate()} ${MONTHS_NL[weekDates[0].getMonth()]} – ${weekDates[6].getDate()} ${MONTHS_NL[weekDates[6].getMonth()]} ${weekDates[6].getFullYear()}`;
  const weekKey = fmt(weekStart);

  const load = useCallback(async () => {
    setLoading(true);
    const [planRes, recRes, extrasRes] = await Promise.all([
      fetch(`/api/plan?week=${weekKey}`),
      fetch('/api/recipes'),
      fetch(`/api/shopping/${weekKey}`),
    ]);
    const plans: { date: string; recipe_id: number | null }[] = await planRes.json();
    const allRecipes: { id: number; name: string; ingredients: string }[] = await recRes.json();
    const extrasData: ExtraItem[] = await extrasRes.json();

    const seen = new Set<number>();
    const recipeIds = plans.map(p => p.recipe_id).filter((id): id is number => id != null && !seen.has(id) && !!seen.add(id));
    const newItems: RecipeItem[] = [];

    for (const id of recipeIds) {
      const recipe = allRecipes.find(r => r.id === id);
      if (!recipe) continue;
      const lines = recipe.ingredients.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        newItems.push({ text: line, checked: false, recipeName: recipe.name });
      }
    }

    setItems(newItems);
    setExtras(extrasData);
    setLoading(false);
  }, [weekKey]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch('/api/tasks/connected').then(r => r.json()).then(d => setGoogleConnected(d.connected));
  }, []);

  // Handle redirect back from Google OAuth
  useEffect(() => {
    if (searchParams?.get('google') === 'connected') {
      setGoogleConnected(true);
      router.replace('/');
    }
  }, [searchParams, router]);

  function toggleRecipeItem(idx: number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item));
  }

  async function toggleExtra(extra: ExtraItem) {
    const updated = { ...extra, checked: !extra.checked };
    setExtras(prev => prev.map(e => e.id === extra.id ? updated : e));
    await fetch(`/api/shopping/${weekKey}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: extra.id, checked: updated.checked }),
    });
  }

  async function addExtra() {
    const text = newItem.trim();
    if (!text) return;
    setNewItem('');
    const res = await fetch(`/api/shopping/${weekKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const created: ExtraItem = await res.json();
    setExtras(prev => [...prev, created]);
    inputRef.current?.focus();
  }

  async function deleteExtra(id: number) {
    setExtras(prev => prev.filter(e => e.id !== id));
    await fetch(`/api/shopping/${weekKey}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  }

  const [copied, setCopied] = useState(false);

  async function exportToTasks() {
    setExporting(true);
    setExportDone(false);
    const groups = [
      ...Object.entries(grouped).map(([name, recipeItems]) => ({
        name,
        items: recipeItems.filter(i => !i.checked).map(i => i.text),
      })).filter(g => g.items.length > 0),
      ...(extras.filter(e => !e.checked).length > 0
        ? [{ name: 'Overig', items: extras.filter(e => !e.checked).map(e => e.text) }]
        : []),
    ];
    const res = await fetch('/api/tasks/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekLabel, groups }),
    });
    setExporting(false);
    if (res.ok) {
      setExportDone(true);
      setTimeout(() => setExportDone(false), 4000);
    }
  }

  function copyList() {
    const lines: string[] = [];
    Object.entries(grouped).forEach(([recipeName, recipeItems]) => {
      lines.push(`— ${recipeName} —`);
      recipeItems.forEach(i => lines.push(i.text));
      lines.push('');
    });
    if (extras.length > 0) {
      lines.push('— Overig —');
      extras.forEach(e => lines.push(e.text));
    }
    navigator.clipboard.writeText(lines.join('\n').trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const grouped = items.reduce<Record<string, { text: string; checked: boolean; idx: number }[]>>(
    (acc, item, idx) => {
      if (!acc[item.recipeName]) acc[item.recipeName] = [];
      acc[item.recipeName].push({ text: item.text, checked: item.checked, idx });
      return acc;
    }, {}
  );

  const checkedRecipe = items.filter(i => i.checked).length;
  const checkedExtra = extras.filter(e => e.checked).length;
  const totalChecked = checkedRecipe + checkedExtra;
  const totalItems = items.length + extras.length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setWeekStart(d => addDays(d, -7))}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: '#7F776E' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Vorige week
        </button>
        <div className="text-center">
          <h2 className="font-[var(--font-playfair)] font-semibold" style={{ color: '#1F2430' }}>{weekLabel}</h2>
          <button
            onClick={() => setWeekStart(getWeekStart(new Date()))}
            className="text-xs tracking-widest uppercase transition-colors"
            style={{ color: '#A09588' }}
          >
            Naar deze week
          </button>
        </div>
        <button
          onClick={() => setWeekStart(d => addDays(d, 7))}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: '#7F776E' }}
        >
          Volgende week
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-t-transparent rounded-full animate-spin" style={{ border: '2px solid #48656A' }} />
        </div>
      ) : (
        <>
          {/* Progress (only when there's something) */}
          {totalItems > 0 && (
            <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid #E5DED2' }}>
              <p className="text-xs tracking-widest uppercase" style={{ color: '#8A8176' }}>
                {totalChecked} / {totalItems} in huis
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {checkedRecipe > 0 && (
                  <button
                    onClick={() => setItems(prev => prev.map(i => ({ ...i, checked: false })))}
                    className="text-xs underline tracking-wide"
                    style={{ color: '#8A8176' }}
                  >
                    wis selectie
                  </button>
                )}
                {/* Copy button */}
                <button
                  onClick={copyList}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all"
                  style={{ backgroundColor: copied ? '#D9EDD4' : '#E5DED2', color: copied ? '#27412D' : '#48656A', borderRadius: '8px' }}
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Gekopieerd
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Kopieer lijst
                    </>
                  )}
                </button>
                {/* Google Tasks button */}
                {googleConnected === false && (
                  <a
                    href="/api/auth/google"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all"
                    style={{ backgroundColor: '#E8EEF8', color: '#3B5998', borderRadius: '8px' }}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Verbind Google Tasks
                  </a>
                )}
                {googleConnected === true && (
                  <button
                    onClick={exportToTasks}
                    disabled={exporting}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-60"
                    style={{ backgroundColor: exportDone ? '#D9EDD4' : '#E8EEF8', color: exportDone ? '#27412D' : '#3B5998', borderRadius: '8px' }}
                  >
                    {exportDone ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Toegevoegd!
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        {exporting ? 'Bezig…' : 'Google Tasks'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recipe items grouped */}
          {items.length === 0 && extras.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-5xl mb-4">🛒</span>
              <p className="text-sm tracking-wide" style={{ color: '#8A8176' }}>Geen recepten gepland voor deze week.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-7">
              {Object.entries(grouped).map(([recipeName, recipeItems]) => (
                <div key={recipeName}>
                  <h3
                    className="font-[var(--font-playfair)] font-semibold text-base mb-2.5 pb-1.5"
                    style={{ color: '#163247', borderBottom: '1px solid #E5DED2' }}
                  >
                    {recipeName}
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    {recipeItems.map(({ text, checked, idx }) => (
                      <label key={idx} className="flex items-start gap-3 cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRecipeItem(idx)}
                          className="mt-0.5 shrink-0"
                          style={{ accentColor: '#48656A' }}
                        />
                        <span
                          className="text-sm leading-relaxed"
                          style={{
                            color: checked ? '#B0A89E' : '#163247',
                            textDecoration: checked ? 'line-through' : 'none',
                          }}
                        >
                          {text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Manual extras section */}
          <div className="mt-8">
            <h3
              className="font-[var(--font-playfair)] font-semibold text-base mb-2.5 pb-1.5"
              style={{ color: '#163247', borderBottom: '1px solid #E5DED2' }}
            >
              Overig
            </h3>

            {extras.length > 0 && (
              <div className="flex flex-col gap-1.5 mb-3">
                {extras.map(extra => (
                  <div key={extra.id} className="flex items-start gap-3 py-0.5 group">
                    <input
                      type="checkbox"
                      checked={extra.checked}
                      onChange={() => toggleExtra(extra)}
                      className="mt-0.5 shrink-0"
                      style={{ accentColor: '#48656A' }}
                    />
                    <span
                      className="text-sm leading-relaxed flex-1"
                      style={{
                        color: extra.checked ? '#B0A89E' : '#163247',
                        textDecoration: extra.checked ? 'line-through' : 'none',
                      }}
                    >
                      {extra.text}
                    </span>
                    <button
                      onClick={() => deleteExtra(extra.id)}
                      className="text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      style={{ color: '#C0796A' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add input */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Boodschap toevoegen…"
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addExtra(); }}
                className="flex-1 text-sm px-3 py-2 focus:outline-none focus:ring-1"
                style={{ border: '1px solid #CFC5B8', backgroundColor: 'white', color: '#163247', focusRingColor: '#48656A' } as React.CSSProperties}
              />
              <button
                onClick={addExtra}
                disabled={!newItem.trim()}
                className="px-4 py-2 text-sm font-medium transition-all disabled:opacity-40"
                style={{ backgroundColor: '#B8CFAF', color: '#27412D', borderRadius: '8px' }}
              >
                + Voeg toe
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
