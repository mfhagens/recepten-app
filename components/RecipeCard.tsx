'use client';
import type { RecipeWithStats } from '@/lib/types';

const CARD_COLORS = [
  '#E8E0D4', '#DDE5DC', '#EAE0D0', '#E2DDE8',
  '#D8E4DE', '#E5DDD4', '#DCE4E2', '#E4DDD5',
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
      className="w-full text-left group cursor-pointer overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300"
      style={{ backgroundColor: '#F7F4EE', border: '1px solid #CFC5B8' }}
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
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: cardColor }}>
            <span
              className="text-5xl group-hover:scale-110 transition-transform duration-300 select-none"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.10))' }}
            >
              {emoji}
            </span>
          </div>
        )}
        {recipe.url && (
          <div className="absolute top-2 right-2 rounded-full p-1" style={{ backgroundColor: 'rgba(247,244,238,0.85)' }}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#48656A' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h2 className="font-[var(--font-playfair)] font-semibold leading-tight flex-1 transition-colors"
            style={{ fontSize: '1.15rem', color: '#163247' }}>
          {recipe.name}
        </h2>

        <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid #E5DED2' }}>
          <span className="text-xs truncate" style={{ color: '#8A8176' }}>
            {likers.length > 0 ? `♥ ${likers.join(', ')}` : ''}
          </span>
          <span className="text-xs shrink-0 ml-2 tabular-nums" style={{ color: '#8A8176' }}>
            {recipe.mealCount > 0 ? `${recipe.mealCount}×` : ''}
          </span>
        </div>
      </div>
    </button>
  );
}
