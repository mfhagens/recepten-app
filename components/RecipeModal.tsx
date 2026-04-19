'use client';
import { useState } from 'react';
import type { RecipeWithStats } from '@/lib/types';
import LikerInput from './LikerInput';

const FOOD_EMOJIS = [
  '🍝', '🥘', '🍲', '🥗', '🍜', '🍱', '🥙', '🌮',
  '🍛', '🥩', '🍗', '🥞', '🥪', '🫕', '🍕', '🥚',
  '🍤', '🥐', '🫔', '🧆',
];

type Tab = 'ingredienten' | 'bereiding' | 'log' | 'bewerken';

const TABS: { key: Tab; label: string }[] = [
  { key: 'ingredienten', label: 'Ingrediënten' },
  { key: 'bereiding', label: 'Bereiding' },
  { key: 'log', label: 'Log maaltijd' },
  { key: 'bewerken', label: 'Bewerken' },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

interface Props {
  recipe: RecipeWithStats;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
  allLikers: string[];
}

export default function RecipeModal({ recipe, onClose, onUpdated, onDeleted, allLikers }: Props) {
  const [tab, setTab] = useState<Tab>('ingredienten');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logNotes, setLogNotes] = useState('');
  const [logSaved, setLogSaved] = useState(false);
  const [editName, setEditName] = useState(recipe.name);
  const [editIngredients, setEditIngredients] = useState(recipe.ingredients);
  const [editInstructions, setEditInstructions] = useState(recipe.instructions);
  const [editTags, setEditTags] = useState(recipe.tags);
  const [editUrl, setEditUrl] = useState(recipe.url ?? '');
  const [editDuration, setEditDuration] = useState(recipe.duration ?? '');
  const [editLikers, setEditLikers] = useState(
    recipe.liked_by.split(',').map((s) => s.trim()).filter(Boolean)
  );
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const tags = recipe.tags.split(',').map((t) => t.trim()).filter(Boolean);
  const likers = recipe.liked_by.split(',').map((l) => l.trim()).filter(Boolean);
  const emoji = FOOD_EMOJIS[(recipe.id + recipe.name.length) % FOOD_EMOJIS.length];

  async function handleLogMeal() {
    await fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe_id: recipe.id, ate_on: logDate, notes: logNotes }),
    });
    setLogSaved(true);
    setLogNotes('');
    setTimeout(() => setLogSaved(false), 3000);
  }

  async function handleSaveEdit() {
    if (!editName.trim()) return;
    setSaving(true);
    await fetch(`/api/recipes/${recipe.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName.trim(),
        ingredients: editIngredients,
        instructions: editInstructions,
        tags: editTags,
        liked_by: editLikers.join(', '),
        url: editUrl,
        duration: editDuration,
      }),
    });
    setSaving(false);
    onUpdated();
  }

  async function handleDelete() {
    await fetch(`/api/recipes/${recipe.id}`, { method: 'DELETE' });
    onDeleted();
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <button
        className="flex-1 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Sluiten"
      />

      {/* Drawer */}
      <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl leading-none">
                {emoji}
              </span>
              <h2 className="text-xl font-[var(--font-playfair)] font-bold text-stone-900 leading-tight">
                {recipe.name}
              </h2>
            </div>
            <p className="text-sm text-stone-500">
              {recipe.mealCount === 0
                ? 'Nog nooit gegeten'
                : `${recipe.mealCount}× gegeten${recipe.lastEaten ? ` · laatste: ${formatDate(recipe.lastEaten)}` : ''}`}
            </p>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                    {t}
                  </span>
                ))}
              </div>
            )}
            {likers.length > 0 && (
              <p className="mt-1.5 text-xs text-stone-400">♥ {likers.join(', ')}</p>
            )}
            {recipe.duration && (
              <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-xl bg-[#C7EBF6] text-stone-700 border border-sky-200">
                {recipe.duration}
              </span>
            )}
            {recipe.url && (
              <a
                href={recipe.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-sm text-green-700 hover:text-green-800 font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Bekijk origineel recept
              </a>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 transition-colors mt-0.5 shrink-0 p-1"
            aria-label="Sluiten"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-stone-100 px-2 flex overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`py-3 px-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-5">
          {tab === 'ingredienten' && (
            <div className="text-stone-700 text-sm leading-relaxed">
              {recipe.ingredients ? (
                recipe.ingredients.split('\n').map((line, i) => (
                  <p key={i} className="mb-1.5">
                    {line.startsWith('-') ? line : line ? `• ${line}` : ''}
                  </p>
                ))
              ) : (
                <p className="text-stone-400">Geen ingrediënten ingevuld.</p>
              )}
            </div>
          )}

          {tab === 'bereiding' && (
            <div className="text-stone-700 text-sm leading-relaxed">
              {recipe.instructions ? (
                recipe.instructions.split('\n').map((line, i) => (
                  <p key={i} className="mb-2">{line}</p>
                ))
              ) : (
                <p className="text-stone-400">Geen bereiding ingevuld.</p>
              )}
            </div>
          )}

          {tab === 'log' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Datum</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Notitie <span className="text-stone-400 font-normal">(optioneel)</span>
                </label>
                <input
                  type="text"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="Bijv. met extra kaas..."
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              {logSaved && (
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Maaltijd gelogd!
                </div>
              )}
              <button
                onClick={handleLogMeal}
                className="w-full bg-stone-900 hover:bg-stone-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-all"
              >
                Maaltijd loggen
              </button>
            </div>
          )}

          {tab === 'bewerken' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Naam *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Ingrediënten</label>
                <textarea
                  value={editIngredients}
                  onChange={(e) => setEditIngredients(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Bereiding</label>
                <textarea
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Tags <span className="text-stone-400 font-normal">(komma-gescheiden)</span>
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="pasta, snel, kids"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Link naar recept <span className="text-stone-400 font-normal">(optioneel)</span>
                </label>
                <input
                  type="url"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://www.jumbo.com/recept/..."
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Bereidingstijd</label>
                <div className="flex gap-2">
                  {['Snel', 'Normaal', 'Lang'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setEditDuration(editDuration === d ? '' : d)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        editDuration === d
                          ? 'bg-[#C7EBF6] text-stone-800 border-2 border-sky-600'
                          : 'bg-[#E8D9C6] text-stone-900 hover:bg-[#D9C9B4]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Lekker voor</label>
                <LikerInput value={editLikers} onChange={setEditLikers} suggestions={allLikers} />
              </div>
              <button
                onClick={handleSaveEdit}
                disabled={!editName.trim() || saving}
                className="w-full bg-stone-900 hover:bg-stone-700 disabled:bg-stone-300 text-white rounded-xl py-2.5 text-sm font-semibold transition-all"
              >
                {saving ? 'Opslaan…' : 'Wijzigingen opslaan'}
              </button>
            </div>
          )}
        </div>

        {/* Delete */}
        <div className="px-6 py-4 border-t border-stone-100">
          {confirmDelete ? (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-stone-600">Zeker weten?</span>
              <button
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Ja, verwijder
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-stone-500 hover:text-stone-700"
              >
                Annuleer
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Recept verwijderen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
