'use client';
import { useState } from 'react';
import LikerInput from './LikerInput';

interface Props {
  onClose: () => void;
  onAdded: () => void;
  allLikers: string[];
}

export default function AddRecipeModal({ onClose, onAdded, allLikers }: Props) {
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [tags, setTags] = useState('');
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [likers, setLikers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        ingredients,
        instructions,
        tags,
        url,
        liked_by: likers.join(', '),
        duration,
      }),
    });
    setSaving(false);
    onAdded();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <button className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
          <h2 className="text-lg font-[var(--font-playfair)] font-bold text-stone-900">
            Nieuw recept
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Naam <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              placeholder="Bijv. Spaghetti Bolognese"
              className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Ingrediënten
              <span className="text-stone-400 font-normal ml-1">(één per regel)</span>
            </label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={5}
              placeholder="500g gehakt&#10;1 ui&#10;2 teentjes knoflook&#10;..."
              className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Bereiding</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={5}
              placeholder="Beschrijf de stappen..."
              className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Tags
              <span className="text-stone-400 font-normal ml-1">(komma-gescheiden)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="pasta, snel, kids, vegetarisch"
              className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Link naar recept <span className="text-stone-400 font-normal">(optioneel)</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.jumbo.com/recept/..."
              className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Bereidingstijd</label>
            <div className="flex gap-2">
              {['Snel', 'Normaal', 'Lang'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(duration === d ? '' : d)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    duration === d
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
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Lekker voor</label>
            <LikerInput value={likers} onChange={setLikers} suggestions={allLikers} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#E8D9C6] text-stone-900 hover:bg-[#D9C9B4] transition-all"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="flex-1 py-3 rounded-xl bg-stone-900 hover:bg-stone-700 disabled:bg-stone-300 text-white text-sm font-semibold transition-all"
            >
              {saving ? 'Opslaan…' : 'Recept opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
