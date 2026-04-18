'use client';
import type { RecipeWithStats } from '@/lib/types';

const ACCENT_COLORS = [
  '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6',
  '#f97316', '#ef4444', '#06b6d4', '#ec4899',
];

const FOOD_EMOJIS = [
  '🍝', '🥘', '🍲', '🥗', '🍜', '🍱', '🥙', '🌮',
  '🍛', '🥩', '🍗', '🥞', '🥪', '🫕', '🍕', '🥚',
  '🍤', '🥐', '🫔', '🧆',
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

interface Props {
  recipe: RecipeWithStats;
  onClick: () => void;
}

export default function RecipeCard({ recipe, onClick }: Props) {
  const tags = recipe.tags.split(',').map((t) => t.trim()).filter(Boolean);
  const likers = recipe.liked_by.split(',').map((l) => l.trim()).filter(Boolean);
  const accentColor = ACCENT_COLORS[recipe.id % ACCENT_COLORS.length];
  const emoji = FOOD_EMOJIS[(recipe.id + recipe.name.length) % FOOD_EMOJIS.length];

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-150 overflow-hidden group border border-stone-100 flex flex-col"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      {/* Top */}
      <div className="px-4 pt-4 pb-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-3xl leading-none">{emoji}</span>
          {recipe.mealCount > 0 && (
            <span className="text-xs text-stone-400 mt-0.5 tabular-nums shrink-0">
              {recipe.mealCount}×
            </span>
          )}
        </div>
        <h2 className="mt-2.5 text-base font-[var(--font-playfair)] font-bold text-stone-900 group-hover:text-green-700 transition-colors leading-snug">
          {recipe.name}
        </h2>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium border border-green-100"
              >
                {tag}
              </span>
            ))}
            {tags.length > 4 && (
              <span className="text-xs text-stone-400">+{tags.length - 4}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 mt-2 flex items-center justify-between border-t border-stone-50 pt-2.5">
        <span className="text-xs text-stone-400 truncate">
          {likers.length > 0 ? `♥ ${likers.join(', ')}` : ''}
        </span>
        {recipe.lastEaten && (
          <span className="text-xs text-stone-400 shrink-0 ml-2">
            {formatDate(recipe.lastEaten)}
          </span>
        )}
      </div>
    </button>
  );
}
