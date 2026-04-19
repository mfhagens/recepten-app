'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import RecipeCard from '@/components/RecipeCard';
import RecipeModal from '@/components/RecipeModal';
import AddRecipeModal from '@/components/AddRecipeModal';
import type { RecipeWithStats } from '@/lib/types';

export default function Home() {
  const [recipes, setRecipes] = useState<RecipeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [likerFilters, setLikerFilters] = useState<string[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

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
    <main className="min-h-screen bg-[#f8f7f4]">
      <Header onAddClick={() => setShowAddModal(true)} />

      {/* Search & Filter bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none"
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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
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
              {allLikers.map((liker) => {
                const active = likerFilters.includes(liker);
                return (
                  <button
                    key={liker}
                    onClick={() => toggleLiker(liker)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      active
                        ? 'bg-green-700 text-white border-green-700'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-green-400 hover:text-green-700'
                    }`}
                  >
                    {active ? '✓ ' : ''}{liker}
                  </button>
                );
              })}
              {likerFilters.length > 0 && (
                <button
                  onClick={() => setLikerFilters([])}
                  className="text-xs text-stone-400 hover:text-stone-600 underline"
                >
                  wis filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results info */}
        {!loading && (
          <p className="mt-3 text-xs text-stone-400">
            {recipes.length === 0
              ? (search || likerFilters.length > 0 ? 'Geen recepten gevonden' : 'Nog geen recepten')
              : `${recipes.length} recept${recipes.length !== 1 ? 'en' : ''}${search || likerFilters.length > 0 ? ' gevonden' : ''}`}
          </p>
        )}
      </div>

      {/* Recipe grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-6xl mb-4">🍽️</span>
            <h3 className="text-xl font-[var(--font-playfair)] font-bold text-stone-800 mb-2">
              {search || likerFilters.length > 0 ? 'Geen recepten gevonden' : 'Nog geen recepten'}
            </h3>
            <p className="text-stone-500 text-sm">
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
          onAdded={() => {
            fetchRecipes();
            setShowAddModal(false);
          }}
          allLikers={allLikers}
        />
      )}
    </main>
  );
}
