import React from 'react';
import { Search, X } from 'lucide-react';
import { BUSINESS_TYPES, type BusinessTypeKey } from '../../types/domain';

interface FeedFilterControlsProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  categoryFilter: 'all' | BusinessTypeKey;
  onCategoryChange: (val: 'all' | BusinessTypeKey) => void;
  placeholder?: string;
}

export const FeedFilterControls: React.FC<FeedFilterControlsProps> = ({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  placeholder = 'Mahsulot yoki do‘kon qidirish…',
}) => (
  <div className="space-y-3">
    <div className="relative">
      <Search
        className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--dx-muted)' }}
      />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 rounded-2xl border text-sm focus:outline-none"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          aria-label="Qidiruvni tozalash"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>

    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      <button
        type="button"
        onClick={() => onCategoryChange('all')}
        className="px-3.5 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap cursor-pointer"
        style={{
          backgroundColor: categoryFilter === 'all' ? 'var(--dx-primary)' : 'var(--dx-surface)',
          color: categoryFilter === 'all' ? 'var(--dx-on-primary)' : 'var(--dx-text)',
          borderColor: categoryFilter === 'all' ? 'var(--dx-primary)' : 'var(--dx-border)',
        }}
      >
        Barchasi
      </button>
      {BUSINESS_TYPES.map((bt) => {
        const active = categoryFilter === bt.storedValue;
        return (
          <button
            key={bt.storedValue}
            type="button"
            onClick={() => onCategoryChange(bt.storedValue)}
            className="px-3.5 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap cursor-pointer"
            style={{
              backgroundColor: active ? 'var(--dx-primary)' : 'var(--dx-surface)',
              color: active ? 'var(--dx-on-primary)' : 'var(--dx-text)',
              borderColor: active ? 'var(--dx-primary)' : 'var(--dx-border)',
            }}
          >
            {bt.icon} {bt.labelUz}
          </button>
        );
      })}
    </div>
  </div>
);
