'use client';
import { useState, useEffect, useCallback } from 'react';

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

interface ShoppingItem {
  text: string;
  checked: boolean;
  recipeName: string;
}

interface Props {
  initialWeek?: Date;
}

export default function BoodschappenList({ initialWeek }: Props) {
  const [weekStart, setWeekStart] = useState(() => initialWeek ?? getWeekStart(new Date()));
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekLabel = `${weekDates[0].getDate()} ${MONTHS_NL[weekDates[0].getMonth()]} – ${weekDates[6].getDate()} ${MONTHS_NL[weekDates[6].getMonth()]} ${weekDates[6].getFullYear()}`;

  const load = useCallback(async () => {
    setLoading(true);
    const [planRes, recRes] = await Promise.all([
      fetch(`/api/plan?week=${fmt(weekStart)}`),
      fetch('/api/recipes'),
    ]);
    const plans: { date: string; recipe_id: number | null }[] = await planRes.json();
    const allRecipes: { id: number; name: string; ingredients: string }[] = await recRes.json();

    const seen = new Set<number>();
    const recipeIds = plans.map(p => p.recipe_id).filter((id): id is number => id != null && !seen.has(id) && !!seen.add(id));
    const newItems: ShoppingItem[] = [];

    for (const id of recipeIds) {
      const recipe = allRecipes.find(r => r.id === id);
      if (!recipe) continue;
      const lines = recipe.ingredients.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        newItems.push({ text: line, checked: false, recipeName: recipe.name });
      }
    }

    setItems(newItems);
    setLoading(false);
  }, [weekStart]);

  useEffect(() => { load(); }, [load]);

  function toggle(idx: number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item));
  }

  const grouped = items.reduce<Record<string, { text: string; checked: boolean; idx: number }[]>>(
    (acc, item, idx) => {
      if (!acc[item.recipeName]) acc[item.recipeName] = [];
      acc[item.recipeName].push({ text: item.text, checked: item.checked, idx });
      return acc;
    }, {}
  );

  const checkedCount = items.filter(i => i.checked).length;

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
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">🛒</span>
          <p className="text-sm tracking-wide" style={{ color: '#8A8176' }}>Geen recepten gepland voor deze week.</p>
        </div>
      ) : (
        <>
          {/* Progress */}
          <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid #E5DED2' }}>
            <p className="text-xs tracking-widest uppercase" style={{ color: '#8A8176' }}>
              {checkedCount} / {items.length} in huis
            </p>
            {checkedCount > 0 && (
              <button
                onClick={() => setItems(prev => prev.map(i => ({ ...i, checked: false })))}
                className="text-xs underline tracking-wide"
                style={{ color: '#8A8176' }}
              >
                wis selectie
              </button>
            )}
          </div>

          {/* Grouped by recipe */}
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
                        onChange={() => toggle(idx)}
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
        </>
      )}
    </div>
  );
}
