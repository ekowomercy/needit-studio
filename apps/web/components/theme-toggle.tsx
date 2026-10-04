'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('needit-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const next = stored ? stored === 'dark' : prefersDark;
    setDark(next);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);

  return (
    <label
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}
    >
      🌙
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        aria-label="Toggle theme"
        onClick={() => {
          const next = !dark;
          setDark(next);
          localStorage.setItem('needit-theme', next ? 'dark' : 'light');
        }}
        style={{
          position: 'relative',
          width: 44,
          height: 24,
          borderRadius: 999,
          border: 'none',
          background: dark ? 'var(--primary)' : 'var(--border-strong)',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            transition: 'transform 0.2s',
            transform: dark ? 'translateX(20px)' : 'none',
          }}
        />
      </button>
      ☀️
    </label>
  );
}