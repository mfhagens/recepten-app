'use client';
import type { RecipeWithStats } from '@/lib/types';

const CARD_COLORS = [
  '#BAE6FD', '#BBF7D0', '#FEF08A', '#FBCFE8',
  '#99F6E4', '#DDD6FE', '#FED7AA', '#FECDD3',
];

const FOOD_EMOJIS = [
  '🍝', '🥘', '🍲', '🥗', '🍜', '🍱', '🥙', '🌮',
  '🍛', '🥩', '🍗', '🥞', '🥪', '🫕', '🍕', '🥚',
  '🍤', '🥐', '🫔', '🧆',
];

interface Props {
  recipe: RecipeWithStats;
  onClick: () => void;
}

export default function RecipeCard({ recipe, onClick }: Props) {
  const likers = recipe.liked_by.split(',').map((l) => l.trim()).filter(Boolean);
  const cardColor = CARD_COLORS[recipe.id % CARD_COLORS.length];
  const emoji = FOOD_EMOJIS[(recipe.id + recipe.name.length) % FOOD_EMOJIS.length];

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white group cursor-pointer overflow-hidden flex flex-col hover:shadow-2xl transition-shadow duration-300 border border-stone-200"
    >
      {/* Photo or color block */}
      <div className="relative overflow-hidden" style={{ height: '160px' }}>
        {recipe.photo_url ? (
          <img
            src={recipe.photo_url}
            alt={recipe.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: cardColor }}
          >
            <span
              className="text-5xl group-hover:scale-110 transition-transform duration-300 select-none"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }}
            >
              {emoji}
            </span>
          </div>
        )}
        {recipe.url && (
          <div className="absolute top-2 right-2 bg-white/80 rounded-full p-1">
            <svg className="w-3 h-3 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h2 className="font-[var(--font-playfair)] font-bold text-stone-900 leading-tight group-hover:text-stone-600 transition-colors flex-1"
            style={{ fontSize: '1.15rem' }}>
          {recipe.name}
        </h2>

        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
          <span className="text-xs text-stone-400 truncate">
            {likers.length > 0 ? `♥ ${likers.join(', ')}` : ''}
          </span>
          <span className="text-xs text-stone-400 shrink-0 ml-2 tabular-nums">
            {recipe.mealCount > 0 ? `${recipe.mealCount}×` : ''}
          </span>
        </div>
      </div>
    </button>
  );
}
