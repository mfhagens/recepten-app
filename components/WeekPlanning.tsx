'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { RecipeWithStats } from '@/lib/types';
import AddRecipeModal from './AddRecipeModal';
import RecipeModal from './RecipeModal';

const DAYS_NL = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
const MONTHS_NL = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
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

interface DayState {
  eaters: string[];
  recipe_id: number | null;
}

export default function WeekPlanning() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [recipes, setRecipes] = useState<RecipeWithStats[]>([]);
  const [plans, setPlans] = useState<Record<string, DayState>>({});
  const [loading, setLoading] = useState(true);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForDate, setAddForDate] = useState<Date | null>(null);
  const [weekCook, setWeekCook] = useState<string>('');
  const [guestInputs, setGuestInputs] = useState<Record<string, string>>({});
  const [guestOpenDay, setGuestOpenDay] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithStats | null>(null);
  const [pickerDurationFilter, setPickerDurationFilter] = useState<string>('');
  const guestInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-focus guest input when opened
  useEffect(() => {
    if (guestOpenDay) setTimeout(() => guestInputRef.current?.focus(), 50);
  }, [guestOpenDay]);

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

  function addGuest(date: Date, key: string) {
    const name = (guestInputs[key] ?? '').trim();
    if (!name) return;
    const day = getDay(date);
    if (!day.eaters.includes(name)) {
      saveDay(date, { eaters: [...day.eaters, name] });
    }
    setGuestInputs((prev) => ({ ...prev, [key]: '' }));
    setGuestOpenDay(null);
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
          onClick={() => setWeekStart((d) => addDays(d, 7))}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: '#7F776E' }}
        >
          Volgende week
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Kookweek */}
      <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl" style={{ backgroundColor: '#ECE6D8' }}>
        <span className="text-xs tracking-widest uppercase shrink-0" style={{ color: '#8B8175' }}>Kookweek van:</span>
        <div className="flex gap-2">
          {['Sara', 'Martijn', 'Job'].map((name) => (
            <button
              key={name}
              onClick={() => saveWeekCook(name)}
              className="px-3 py-1 text-sm rounded-xl font-medium transition-all"
              style={weekCook === name
                ? { backgroundColor: '#F7F4EE', color: '#163247', border: '1.5px solid #48656A' }
                : { backgroundColor: '#DDCFBA', color: '#5C5245', border: '1px solid transparent' }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-t-transparent rounded-full animate-spin" style={{ border: '2px solid #48656A' }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {weekDates.map((date) => {
            const key = fmt(date);
            const day = getDay(date);
            const isToday = key === today;
            const suggestions = getSuggestions(day.eaters);
            const planned = recipes.find((r) => r.id === day.recipe_id) ?? null;
            const isOpen = openDay === key;
            const guestEaters = day.eaters.filter((e) => !allLikers.includes(e));
            const isGuestOpen = guestOpenDay === key;

            return (
              <div
                key={key}
                className="flex flex-col"
                style={isToday
                  ? { backgroundColor: '#EEF2F1', border: '1.5px solid #48656A' }
                  : { backgroundColor: '#F7F4EE', border: '1px solid #D8D0C4' }}
              >
                {/* Day header */}
                <div className="px-3 py-2.5"
                  style={isToday
                    ? { backgroundColor: '#D9C7AF', borderBottom: '1px solid #C9B49A' }
                    : { backgroundColor: 'transparent', borderBottom: '1px solid #E5DED2' }}>
                  <p className="text-xs tracking-widest uppercase font-medium"
                    style={{ color: isToday ? '#163247' : '#A19588' }}>
                    {DAYS_NL[date.getDay()]}
                  </p>
                  <p className="font-[var(--font-playfair)] font-semibold text-lg leading-tight"
                    style={{ color: '#1E2430' }}>
                    {date.getDate()} {MONTHS_NL[date.getMonth()]}
                  </p>
                </div>

                <div className="p-3 flex flex-col gap-3 flex-1">
                  {/* Eaters */}
                  <div>
                    <p className="text-xs tracking-widest uppercase mb-1.5" style={{ color: '#8A8176' }}>Wie eet mee?</p>
                    <div className="flex flex-wrap gap-1 items-center">
                      {allLikers.map((liker) => (
                        <button
                          key={liker}
                          onClick={() => toggleEater(date, liker)}
                          className="px-3 py-1 text-xs rounded-xl font-medium transition-all"
                          style={day.eaters.includes(liker)
                            ? { backgroundColor: '#E8F0F0', color: '#26424B', border: '1.5px solid #5B7A82' }
                            : { backgroundColor: '#E5DED2', color: '#8A8176', border: '1px solid transparent' }}
                        >
                          {liker}
                        </button>
                      ))}
                      {/* Guest eaters */}
                      {guestEaters.map((guest) => (
                        <span
                          key={guest}
                          className="flex items-center gap-1 px-3 py-1 text-xs rounded-xl font-medium"
                          style={{ backgroundColor: '#E8F0F0', color: '#26424B', border: '1.5px solid #5B7A82' }}
                        >
                          {guest}
                          <button onClick={() => toggleEater(date, guest)} className="leading-none" style={{ color: '#5B7A82' }}>×</button>
                        </span>
                      ))}
                      {/* Guest toggle */}
                      {isGuestOpen ? (
                        <input
                          ref={guestInputRef}
                          type="text"
                          placeholder="Naam gast…"
                          value={guestInputs[key] ?? ''}
                          onChange={(e) => setGuestInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') addGuest(date, key);
                            if (e.key === 'Escape') setGuestOpenDay(null);
                          }}
                          onBlur={() => { if (!(guestInputs[key] ?? '').trim()) setGuestOpenDay(null); }}
                          className="w-24 text-xs rounded-xl px-2 py-1 focus:outline-none"
                          style={{ border: '1px solid #CFC5B8', backgroundColor: 'white', color: '#163247' }}
                        />
                      ) : (
                        <button
                          onClick={() => setGuestOpenDay(key)}
                          className="px-2 py-1 text-xs rounded-xl transition-all"
                          style={{ color: '#9A9186' }}
                          title="Gast toevoegen"
                        >
                          + gast
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Planned recipe */}
                  <div className="flex-1 flex flex-col gap-2">
                    {planned ? (
                      <div className="p-2.5" style={{ backgroundColor: '#FBF8F3', border: '1px solid #DDD5C8' }}>
                        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#A09588' }}>Diner</p>
                        <button
                          onClick={() => setSelectedRecipe(planned)}
                          className="font-[var(--font-playfair)] font-semibold text-sm leading-snug transition-colors text-left w-full"
                          style={{ color: '#1E2430' }}
                        >
                          {planned.name}
                        </button>
                        <button
                          onClick={() => setOpenDay(isOpen ? null : key)}
                          className="text-xs mt-1.5 underline"
                          style={{ color: '#8A8176' }}
                        >
                          Wijzigen
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setOpenDay(isOpen ? null : key)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{ backgroundColor: '#B8CFAF', color: '#27412D', borderRadius: '10px' }}
                      >
                        <span className="text-base leading-none">+</span> Kies diner
                      </button>
                    )}

                    {/* Recipe picker */}
                    {isOpen && (
                      <div className="flex flex-col gap-1.5">
                        {/* Duration filter */}
                        <div className="flex gap-1">
                          {['Snel', 'Normaal', 'Lang'].map((d) => (
                            <button
                              key={d}
                              onClick={() => setPickerDurationFilter(pickerDurationFilter === d ? '' : d)}
                              className="px-2 py-0.5 text-xs rounded-lg font-medium transition-all"
                              style={pickerDurationFilter === d
                                ? { backgroundColor: '#E8F0F0', color: '#26424B', border: '1.5px solid #48656A' }
                                : { backgroundColor: '#E5DED2', color: '#8A8176', border: '1px solid transparent' }}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                        {(() => {
                          const filtered = suggestions.filter(r => !pickerDurationFilter || r.duration === pickerDurationFilter);
                          if (filtered.length === 0) return (
                            <p className="text-xs italic" style={{ color: '#A09588' }}>Geen recepten gevonden.</p>
                          );
                          return (
                            <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: '252px' }}>
                              {filtered.map((r) => (
                                <button
                                  key={r.id}
                                  onClick={() => { saveDay(date, { recipe_id: r.id }); setOpenDay(null); }}
                                  className="w-full text-left px-3 py-2.5 text-sm transition-colors shrink-0"
                                  style={day.recipe_id === r.id
                                    ? { backgroundColor: '#E8F0F0', color: '#163247', border: '1px solid #5B7A82' }
                                    : { backgroundColor: 'white', color: '#48656A', border: '1px solid #D8D0C4' }}
                                >
                                  <span className="font-[var(--font-playfair)] font-semibold">{r.name}</span>
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                        <button
                          onClick={() => { setAddForDate(date); setShowAddModal(true); setOpenDay(null); }}
                          className="w-full text-left px-3 py-2.5 text-xs tracking-widest uppercase transition-colors"
                          style={{ border: '1px dashed #CFC5B8', color: '#A09588' }}
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

      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onUpdated={() => { load(); setSelectedRecipe(null); }}
          onDeleted={() => { load(); setSelectedRecipe(null); }}
          allLikers={allLikers}
        />
      )}
    </div>
  );
}
