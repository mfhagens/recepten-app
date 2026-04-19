'use client';
import { useState, useEffect, useCallback } from 'react';
import type { RecipeWithStats } from '@/lib/types';

const DAYS_NL = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const MONTHS_NL = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmt(date: Date): string {
  return date.toISOString().split('T')[0];
}

interface DayState {
  eaters: string[];
  recipe_id: number | null;
}

export default function WeekPlanning() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [recipes, setRecipes] = useState<RecipeWithStats[]>([]);
  const [plans, setPlans] = useState<Record<string, DayState>>({});
  const [loading, setLoading] = useState(true);
  const [openDay, setOpenDay] = useState<string | null>(null);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const load = useCallback(async () => {
    setLoading(true);
    const [recRes, planRes] = await Promise.all([
      fetch('/api/recipes'),
      fetch(`/api/plan?week=${fmt(weekStart)}`),
    ]);
    setRecipes(await recRes.json());
    const planData: { date: string; eaters: string; recipe_id: number | null }[] = await planRes.json();
    const map: Record<string, DayState> = {};
    for (const p of planData) {
      map[p.date] = {
        eaters: p.eaters ? p.eaters.split(',').map((s) => s.trim()).filter(Boolean) : [],
        recipe_id: p.recipe_id,
      };
    }
    setPlans(map);
    setLoading(false);
  }, [weekStart]);

  useEffect(() => { load(); }, [load]);

  const allLikers = Array.from(
    new Set(recipes.flatMap((r) => r.liked_by.split(',').map((s) => s.trim()).filter(Boolean)))
  ).sort();

  function getDay(date: Date): DayState {
    return plans[fmt(date)] ?? { eaters: [], recipe_id: null };
  }

  async function saveDay(date: Date, updates: Partial<DayState>) {
    const key = fmt(date);
    const current = getDay(date);
    const updated = { ...current, ...updates };
    setPlans((prev) => ({ ...prev, [key]: updated }));
    await fetch(`/api/plan/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eaters: updated.eaters.join(', '), recipe_id: updated.recipe_id }),
    });
  }

  function toggleEater(date: Date, name: string) {
    const day = getDay(date);
    const eaters = day.eaters.includes(name)
      ? day.eaters.filter((e) => e !== name)
      : [...day.eaters, name];
    saveDay(date, { eaters });
  }

  function getSuggestions(eaters: string[]): RecipeWithStats[] {
    if (eaters.length === 0) return recipes;
    return recipes.filter((r) =>
      eaters.every((e) =>
        r.liked_by.split(',').map((s) => s.trim().toLowerCase()).includes(e.toLowerCase())
      )
    );
  }

  const today = fmt(new Date());
  const weekLabel = `${weekDates[0].getDate()} ${MONTHS_NL[weekDates[0].getMonth()]} – ${weekDates[6].getDate()} ${MONTHS_NL[weekDates[6].getMonth()]} ${weekDates[6].getFullYear()}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setWeekStart((d) => addDays(d, -7))}
          className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Vorige week
        </button>
        <div className="text-center">
          <h2 className="font-[var(--font-playfair)] font-bold text-stone-900">{weekLabel}</h2>
          <button
            onClick={() => setWeekStart(getMonday(new Date()))}
            className="text-xs tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors"
          >
            Naar deze week
          </button>
        </div>
        <button
          onClick={() => setWeekStart((d) => addDays(d, 7))}
          className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          Volgende week
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {weekDates.map((date, i) => {
            const key = fmt(date);
            const day = getDay(date);
            const isToday = key === today;
            const suggestions = getSuggestions(day.eaters);
            const planned = recipes.find((r) => r.id === day.recipe_id) ?? null;
            const isOpen = openDay === key;

            return (
              <div
                key={key}
                className={`bg-white flex flex-col border-2 ${isToday ? 'border-stone-900' : 'border-stone-200'}`}
              >
                {/* Day header */}
                <div className={`px-3 py-2.5 ${isToday ? 'bg-stone-900' : 'bg-stone-50 border-b border-stone-200'}`}>
                  <p className={`text-xs tracking-widest uppercase font-medium ${isToday ? 'text-stone-400' : 'text-stone-400'}`}>
                    {DAYS_NL[i]}
                  </p>
                  <p className={`font-[var(--font-playfair)] font-bold text-lg leading-tight ${isToday ? 'text-white' : 'text-stone-900'}`}>
                    {date.getDate()} {MONTHS_NL[date.getMonth()]}
                  </p>
                </div>

                <div className="p-3 flex flex-col gap-3 flex-1">
                  {/* Eaters */}
                  <div>
                    <p className="text-xs tracking-widest uppercase text-stone-400 mb-1.5">Wie eet mee?</p>
                    {allLikers.length === 0 ? (
                      <p className="text-xs text-stone-400">Voeg eerst personen toe aan recepten.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {allLikers.map((liker) => (
                          <button
                            key={liker}
                            onClick={() => toggleEater(date, liker)}
                            className={`px-2 py-0.5 text-xs border transition-colors ${
                              day.eaters.includes(liker)
                                ? 'bg-stone-900 text-white border-stone-900'
                                : 'text-stone-500 border-stone-300 hover:border-stone-700 hover:text-stone-700'
                            }`}
                          >
                            {liker}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Planned recipe */}
                  <div className="flex-1 flex flex-col gap-2">
                    {planned ? (
                      <div className="bg-stone-50 border border-stone-200 p-2.5">
                        <p className="text-xs tracking-widest uppercase text-stone-400 mb-1">Diner</p>
                        <p className="font-[var(--font-playfair)] font-bold text-sm text-stone-900 leading-snug">
                          {planned.name}
                        </p>
                        <button
                          onClick={() => setOpenDay(isOpen ? null : key)}
                          className="text-xs text-stone-400 hover:text-stone-700 mt-1.5 underline"
                        >
                          Wijzigen
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setOpenDay(isOpen ? null : key)}
                        className="w-full border-2 border-dashed border-stone-200 text-stone-400 hover:border-stone-500 hover:text-stone-600 transition-colors py-4 text-xs tracking-widest uppercase"
                      >
                        + Kies diner
                      </button>
                    )}

                    {/* Recipe picker */}
                    {isOpen && (
                      <div className="border border-stone-200 bg-white shadow-lg max-h-52 overflow-y-auto">
                        <div className="px-3 py-2 border-b border-stone-100 bg-stone-50 sticky top-0">
                          <p className="text-xs tracking-widest uppercase text-stone-500">
                            {day.eaters.length > 0
                              ? `${suggestions.length} suggesties voor ${day.eaters.join(', ')}`
                              : `Alle ${suggestions.length} recepten`}
                          </p>
                        </div>
                        {suggestions.length === 0 ? (
                          <p className="px-3 py-3 text-xs text-stone-400">
                            Geen recepten die iedereen lekker vindt. Pas de selectie aan.
                          </p>
                        ) : (
                          suggestions.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => {
                                saveDay(date, { recipe_id: r.id });
                                setOpenDay(null);
                              }}
                              className={`w-full text-left px-3 py-2.5 text-sm border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors ${
                                day.recipe_id === r.id ? 'font-bold text-stone-900 bg-stone-50' : 'text-stone-700'
                              }`}
                            >
                              {r.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
