'use client';
import { useState, useEffect, useCallback } from 'react';
import type { RecipeWithStats } from '@/lib/types';
import AddRecipeModal from './AddRecipeModal';

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForDate, setAddForDate] = useState<Date | null>(null);
  const [weekCook, setWeekCook] = useState<string>('');

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const load = useCallback(async () => {
    setLoading(true);
    const [recRes, planRes, cookRes] = await Promise.all([
      fetch('/api/recipes'),
      fetch(`/api/plan?week=${fmt(weekStart)}`),
      fetch(`/api/weekcook/${fmt(weekStart)}`),
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
    const cookData = await cookRes.json();
    setWeekCook(cookData.cook ?? '');
    setLoading(false);
  }, [weekStart]);

  async function saveWeekCook(name: string) {
    const cook = weekCook === name ? '' : name;
    setWeekCook(cook);
    await fetch(`/api/weekcook/${fmt(weekStart)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cook }),
    });
  }

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

      {/* Kookweek */}
      <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl" style={{ backgroundColor: '#FEFCE8' }}>
        <span className="text-xs tracking-widest uppercase text-stone-500 shrink-0">Kookweek van:</span>
        <div className="flex gap-2">
          {['Sara', 'Martijn', 'Job'].map((name) => (
            <button
              key={name}
              onClick={() => saveWeekCook(name)}
              className={`px-3 py-1 text-sm rounded-xl font-medium transition-all ${
                weekCook === name
                  ? 'bg-stone-900 text-white'
                  : 'bg-[#E8D9C6] text-stone-900 hover:bg-[#D9C9B4]'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
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
                            className={`px-3 py-1 text-xs rounded-xl font-medium transition-all ${
                              day.eaters.includes(liker)
                                ? 'bg-stone-900 text-white'
                                : 'bg-[#E8D9C6] text-stone-900 hover:bg-[#D9C9B4]'
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C5E8BA] hover:bg-[#B0D9A3] transition-colors text-green-800 text-xs font-medium"
                      >
                        <span className="text-base leading-none">+</span> Kies diner
                      </button>
                    )}

                    {/* Recipe picker */}
                    {isOpen && (
                      <div className="flex flex-col gap-1.5">
                        <p className="text-xs tracking-widest uppercase text-stone-400">
                          {day.eaters.length > 0 ? 'Suggesties' : 'Alle recepten'}
                        </p>
                        {suggestions.length === 0 && (
                          <p className="text-xs text-stone-400 italic">
                            Geen recepten die iedereen lekker vindt.
                          </p>
                        )}
                        {suggestions.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => { saveDay(date, { recipe_id: r.id }); setOpenDay(null); }}
                            className={`w-full text-left px-3 py-2.5 text-sm border transition-colors ${
                              day.recipe_id === r.id
                                ? 'bg-stone-900 text-white border-stone-900'
                                : 'bg-white border-stone-200 text-stone-700 hover:border-stone-900 hover:bg-stone-50'
                            }`}
                          >
                            <span className="font-[var(--font-playfair)] font-bold">{r.name}</span>
                          </button>
                        ))}
                        <button
                          onClick={() => { setAddForDate(date); setShowAddModal(true); setOpenDay(null); }}
                          className="w-full text-left px-3 py-2.5 text-xs tracking-widest uppercase border border-dashed border-stone-300 text-stone-400 hover:border-stone-700 hover:text-stone-700 transition-colors"
                        >
                          + Nieuw recept toevoegen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showAddModal && (
        <AddRecipeModal
          onClose={() => { setShowAddModal(false); setAddForDate(null); }}
          onAdded={async () => {
            setShowAddModal(false);
            await load();
            // Auto-select the newly added recipe (last in list) for the planned date
            if (addForDate) {
              const res = await fetch('/api/recipes');
              const all: RecipeWithStats[] = await res.json();
              const newest = all[all.length - 1];
              if (newest) saveDay(addForDate, { recipe_id: newest.id });
            }
            setAddForDate(null);
          }}
          allLikers={allLikers}
        />
      )}
    </div>
  );
}
