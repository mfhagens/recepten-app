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
    (s) =>
      s.toLowerCase().includes(input.toLowerCase()) &&
      !value.some((v) => v.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="relative">
      <div className="min-h-[42px] w-full rounded-lg border border-stone-200 px-3 py-2 flex flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent bg-white cursor-text">
        {value.map((liker) => (
          <span
            key={liker}
            className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-100 rounded-full px-2 py-0.5"
          >
            {liker}
            <button
              type="button"
              onClick={() => removeLiker(liker)}
              className="text-green-400 hover:text-green-800 font-bold leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? 'Naam toevoegen…' : ''}
          className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
        />
      </div>
      {input && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 border border-stone-200 rounded-lg bg-white shadow-lg z-10 overflow-hidden">
          {filtered.slice(0, 5).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addLiker(s)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 text-stone-700"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-stone-400 mt-1">Druk op Enter of komma om toe te voegen</p>
    </div>
  );
}
