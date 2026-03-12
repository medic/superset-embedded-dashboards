'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import type { County } from '@/lib/config';

interface CountySelectorProps {
  counties: County[];
  value: string;
  onChange: (domain: string) => void;
  id?: string;
}

/**
 * A searchable dropdown for selecting a county. Filters by name as the user types,
 * supports keyboard navigation (ArrowUp/Down, Enter, Escape), and closes on outside click.
 *
 * @example
 * ```tsx
 * <CountySelector
 *   counties={[{ name: "Nairobi", domain: "nairobi.echis.go.ke" }]}
 *   value={selectedCounty}
 *   onChange={setSelectedCounty}
 * />
 * ```
 */
export default function CountySelector({ counties, value, onChange, id }: CountySelectorProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedCounty = counties.find((c) => c.domain === value);

  const filtered = query
    ? counties.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : counties;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (selectedCounty) setQuery(selectedCounty.name);
        else setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCounty]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  function selectCounty(county: County) {
    onChange(county.domain);
    setQuery(county.name);
    setIsOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[highlightedIndex]) selectCounty(filtered[highlightedIndex]);
        break;
      case 'Escape':
        setIsOpen(false);
        if (selectedCounty) setQuery(selectedCounty.name);
        else setQuery('');
        break;
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="county-listbox"
          aria-required="true"
          aria-activedescendant={isOpen && filtered[highlightedIndex] ? `county-${filtered[highlightedIndex].domain}` : undefined}
          value={isOpen ? query : (selectedCounty?.name || query)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            if (value) onChange('');
          }}
          onFocus={() => {
            setIsOpen(true);
            setQuery(selectedCounty?.name || '');
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search for your county..."
          className="block w-full rounded-lg border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 pr-10 text-slate-800 placeholder:text-slate-300 transition-all duration-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:bg-white focus:outline-none"
        />
        <svg
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </div>

      {isOpen && filtered.length > 0 && (
        <ul
          id="county-listbox"
          ref={listRef}
          role="listbox"
          className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-stone-200 bg-white shadow-lg shadow-stone-200/40"
        >
          {filtered.map((county, index) => (
            <li
              key={county.domain}
              id={`county-${county.domain}`}
              role="option"
              aria-selected={county.domain === value}
              className={`px-3.5 py-2 text-sm cursor-pointer transition-colors ${
                index === highlightedIndex
                  ? 'bg-slate-100 text-slate-800'
                  : 'text-slate-600 hover:bg-stone-50'
              } ${county.domain === value ? 'font-medium' : ''}`}
              onMouseEnter={() => setHighlightedIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                selectCounty(county);
              }}
            >
              {county.name}
            </li>
          ))}
        </ul>
      )}

      {isOpen && filtered.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-stone-200 bg-white shadow-lg shadow-stone-200/40 px-3.5 py-3 text-sm text-slate-400">
          No counties found
        </div>
      )}
    </div>
  );
}
