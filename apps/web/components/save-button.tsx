'use client';

import { useState } from 'react';
import { toggleSaved, useSavedItems, type SavedItem } from '@/lib/saved';

interface SaveButtonProps {
  item: Omit<SavedItem, 'savedAt'>;
  size?: 'sm' | 'md';
  label?: boolean;
}

export function SaveButton({ item, size = 'sm', label = true }: SaveButtonProps) {
  const saved = useSavedItems();
  const isSaved = saved.some((s) => s.id === item.id);
  const [pulse, setPulse] = useState(false);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleSaved(item);
    setPulse(true);
    window.setTimeout(() => setPulse(false), 300);
  }

  return (
    <button
      type="button"
      className={`btn btn-ghost btn-${size} save-btn${isSaved ? ' is-saved' : ''}${pulse ? ' save-pulse' : ''}`}
      aria-pressed={isSaved}
      aria-label={isSaved ? 'Remove from saved' : 'Save'}
      onClick={onClick}
    >
      <span aria-hidden="true">{isSaved ? '\u2665' : '\u2661'}</span>
      {label ? <span>{isSaved ? 'Saved' : 'Save'}</span> : null}
    </button>
  );
}
