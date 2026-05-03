'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import RecipeCard from '@/components/RecipeCard';
import RecipeModal from '@/components/RecipeModal';
import AddRecipeModal from '@/components/AddRecipeModal';
import WeekPlanning from '@/components/WeekPlanning';
import BoodschappenList from '@/components/BoodschappenList';
import type { RecipeWithStats } from '@/lib/types';

export default function Home() {
  const [recipes, setRecipes] = useState<RecipeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [likerFilters, setLikerFilters] = useState<string[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'recepten' | 'planning' | 'boodschappen'>('planning');
  const [shoppingWeek, setShoppingWeek] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetch('/api/photos/backfill', { method: 'POST' });
  }, []);

  const fetchRecipes = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (likerFilters.length > 0) params.set('likers', likerFilters.join(','));
    const res = await fetch(`/api/recipes?${params}`);
    const data = await res.json();
    setRecipes(data);
    setLoading(false);
  }, [search, likerFilters]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => fetchRecipes(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchRecipes, search, likerFilters]);

  const allLikers = Array.from(
    new Set(
      recipes
        .flatMap((r) => r.liked_by.split(',').map((s) => s.trim()))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, 'nl'));

  function toggleLiker(liker: string) {
    setLikerFilters((prev) =>
      prev.includes(liker) ? prev.filter((l) => l !== liker) : [...prev, liker]
    );
  }

  function handleUpdated() {
    fetchRecipes();
    setSelectedRecipe(null);
  }

  function handleDeleted() {
    fetchRecipes();
    setSelectedRecipe(null);
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#F7F4EE' }}>
      <Header
        onAddClick={() => setShowAddModal(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Weekplanning tab */}
      {activeTab === 'planning' && (
        <WeekPlanning
          onGoToShopping={(week) => { setShoppingWeek(week); setActiveTab('boodschappen'); }}
        />
      )}

      {/* Boodschappenlijst tab */}
      {activeTab === 'boodschappen' && (
        <BoodschappenList key={shoppingWeek?.toISOString()} initialWeek={shoppingWeek} />
      )}

      {/* Search & Filter bar */}
      {activeTab === 'recepten' && <>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-4">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Zoek op naam, ingrediënt of tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm tracking-wide focus:outline-none focus:ring-1"
              style={{ border: '1px solid #CFC5B8', backgroundColor: 'white', color: '#163247' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Liker filter chips */}
          {allLikers.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs tracking-widest uppercase mr-1" style={{ color: '#8A8176' }}>Voor:</span>
              {allLikers.map((liker) => {
                const active = likerFilters.includes(liker);
                return (
                  <button
                    key={liker}
                    onClick={() => toggleLiker(liker)}
                    className="px-4 py-1.5 text-sm rounded-xl font-medium transition-all"
                    style={active
                      ? { backgroundColor: '#E8F0F0', color: '#26424B', border: '1.5px solid #48656A' }
                      : { backgroundColor: '#E5DED2', color: '#8A8176', border: '1px solid transparent' }}
                  >
                    {active ? '✓ ' : ''}{liker}
                  </button>
                );
              })}
              {likerFilters.length > 0 && (
                <button
                  onClick={() => setLikerFilters([])}
                  className="text-xs underline tracking-wide"
                  style={{ color: '#8A8176' }}
                >
                  wis filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results info + add button */}
        {!loading && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs tracking-widest uppercase text-stone-400">
              {recipes.length === 0
                ? (search || likerFilters.length > 0 ? 'Geen recepten gevonden' : 'Nog geen recepten')
                : `${recipes.length} recept${recipes.length !== 1 ? 'en' : ''}${search || likerFilters.length > 0 ? ' gevonden' : ''}`}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium transition-all"
              style={{ backgroundColor: '#B8CFAF', color: '#27412D', borderRadius: '10px' }}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nieuw recept
            </button>
          </div>
        )}
      </div>

      {/* Recipe grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-16">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-6xl mb-6">🍽️</span>
            <h3 className="font-[var(--font-playfair)] text-2xl font-bold text-stone-800 mb-2">
              {search || likerFilters.length > 0 ? 'Geen recepten gevonden' : 'Nog geen recepten'}
            </h3>
            <p className="text-xs tracking-widest uppercase text-stone-400">
              {search || likerFilters.length > 0
                ? 'Probeer een andere zoekterm of selectie.'
                : 'Voeg je eerste recept toe via de knop rechtsboven.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => setSelectedRecipe(recipe)}
              />
            ))}
          </div>
        )}
      </div>
      </>}

      {/* Modals */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
          allLikers={allLikers}
        />
      )}

      {showAddModal && (
        <AddRecipeModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => { fetchRecipes(); setShowAddModal(false); }}
          allLikers={allLikers}
        />
      )}
    </main>
  );
}
