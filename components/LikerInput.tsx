'use client';
import { useState, KeyboardEvent } from 'react';

interface Props {
  value: string[];
  onChange: (likers: string[]) => void;
  suggestions: string[];
}

export default function LikerInput({ value, onChange, suggestions }: Props) {
  const [input, setInput] = useState('');

  function addLiker(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...value, trimmed]);
    setInput('');
  }

  function removeLiker(name: string) {
    onChange(value.filter((v) => v !== name));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addLiker(input.replace(/,$/, ''));
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  const filtered = suggestions.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())
  );

  const filteredByInput = input
    ? filtered.filter((s) => s.toLowerCase().includes(input.toLowerCase()))
    : filtered;

  return (
    <div>
      {/* Selected likers as pills */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((liker) => (
            <span
              key={liker}
              className="flex items-center gap-1.5 text-sm bg-stone-900 text-white rounded-xl px-4 py-1.5"
            >
              {liker}
              <button
                type="button"
                onClick={() => removeLiker(liker)}
                className="text-stone-400 hover:text-white leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Clickable suggestions */}
      {filteredByInput.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {filteredByInput.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addLiker(s)}
              className="px-4 py-1.5 text-sm rounded-xl font-medium bg-[#E8D9C6] text-stone-900 hover:bg-[#D9C9B4] transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Text input for custom names */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Of typ een nieuwe naam…"
        className="w-full border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
      />
      <p className="text-xs text-stone-400 mt-1 ml-1">Druk op Enter of komma om toe te voegen</p>
    </div>
  );
}
