'use client';

import { useState } from 'react';
import { Button, Chip } from '@needit/ui';
import { api } from '@/lib/api';
import type { Intent } from '@needit/shared';
import type { RefineNeedResponse } from '@/lib/types';

interface RefinementBarProps {
  needId: string;
  intent: Intent;
  onRefined: (result: RefineNeedResponse) => void;
}

function suggestCheaper(intent: Intent): string | null {
  const budget = intent.budget;
  if (!budget) return null;
  const next = Math.max(1000, Math.round((budget.amount * 0.8) / 100) * 100);
  return `under ${next / 100}`;
}

export function RefinementBar({ needId, intent, onRefined }: RefinementBarProps) {
  const [text, setText] = useState('');
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply(payload: { text?: string; budget?: string; location?: string }, note?: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await api<RefineNeedResponse>(`/needs/${needId}`, {
        method: 'PATCH',
        body: payload,
      });
      onRefined(res);
      setText('');
      if (note) setCity('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not refine');
    } finally {
      setBusy(false);
    }
  }

  const cheaper = suggestCheaper(intent);

  return (
    <div className="refine card">
      <div className="refine-row">
        <input
          className="input"
          aria-label="Refine your search"
          placeholder="Refine: e.g. cheaper, only in Lagos, available tomorrow"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && text.trim()) void apply({ text: text.trim() });
          }}
        />
        <Button disabled={busy || !text.trim()} onClick={() => void apply({ text: text.trim() })}>
          Refine
        </Button>
      </div>

      <div className="refine-chips">
        {cheaper ? (
          <Chip disabled={busy} onClick={() => void apply({ budget: cheaper })}>
            Cheaper
          </Chip>
        ) : null}
        <span className="refine-city">
          <input
            className="input"
            aria-label="Filter by city"
            placeholder="City (e.g. Lagos)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && city.trim()) void apply({ location: city.trim() }, 'city');
            }}
          />
          <Button
            variant="secondary"
            disabled={busy || !city.trim()}
            onClick={() => void apply({ location: city.trim() }, 'city')}
          >
            In city
          </Button>
        </span>
      </div>

      {error ? <p className="error-msg">{error}</p> : null}
    </div>
  );
}
