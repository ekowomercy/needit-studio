'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Chip } from '@needit/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';
import type { CreateNeedResponse } from '@/lib/types';

export const DEFAULT_EXAMPLES = [
  'I need a plumber tomorrow.',
  'I need a used fridge under 150k.',
  'I need someone to design a flyer.',
  'I need a maths tutor for my child.',
];

interface NeedFormProps {
  examples?: string[];
  initialText?: string;
  autoFocus?: boolean;
  onBusyChange?: (busy: boolean) => void;
}

export function NeedForm({
  examples = DEFAULT_EXAMPLES,
  initialText = '',
  autoFocus = false,
  onBusyChange,
}: NeedFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [text, setText] = useState(initialText);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setBusyState(next: boolean) {
    setBusy(next);
    onBusyChange?.(next);
  }

  async function submit(raw: string) {
    const value = raw.trim();
    if (!value) return;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent('/')}`);
      return;
    }
    setError(null);
    setBusyState(true);
    try {
      const res = await api<CreateNeedResponse>('/needs', {
        method: 'POST',
        body: { rawText: value },
      });
      router.push(`/needs/${res.need.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusyState(false);
    }
  }

  return (
    <div>
      <form
        className="need-form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(text);
        }}
      >
        <input
          className="input need-form-input"
          aria-label="What do you need?"
          placeholder="Tell us what you need..."
          value={text}
          autoFocus={autoFocus}
          onChange={(e) => setText(e.target.value)}
        />
        <Button type="submit" size="lg" disabled={busy || !text.trim()}>
          {busy ? 'Finding...' : 'Find it'}
        </Button>
      </form>
      {error ? <p className="error-msg" style={{ marginTop: 8 }}>{error}</p> : null}
      <div className="need-form-examples">
        <span className="text-caption">Try an example:</span>
        {examples.map((example) => (
          <Chip key={example} onClick={() => setText(example)}>
            {example}
          </Chip>
        ))}
      </div>
    </div>
  );
}
