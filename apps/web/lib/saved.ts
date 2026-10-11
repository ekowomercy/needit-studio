'use client';

import { useSyncExternalStore } from 'react';

const KEY = 'needit.saved';
const EVENT = 'needit:saved-changed';

export type SavedKind = 'listing' | 'provider';

export interface SavedItem {
  id: string;
  kind: SavedKind;
  title: string;
  subtitle: string;
  priceKobo: number | null;
  href: string;
  savedAt: string;
}

function read(): SavedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: SavedItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

let cached: SavedItem[] = [];
let cachedRaw: string | null = null;

function getSnapshot(): SavedItem[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = read();
  }
  return cached;
}

const EMPTY: SavedItem[] = [];

export function useSavedItems(): SavedItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export function isSaved(id: string): boolean {
  return getSnapshot().some((item) => item.id === id);
}

export function toggleSaved(item: Omit<SavedItem, 'savedAt'>): boolean {
  const items = read();
  const exists = items.find((i) => i.id === item.id);
  if (exists) {
    write(items.filter((i) => i.id !== item.id));
    return false;
  }
  write([{ ...item, savedAt: new Date().toISOString() }, ...items]);
  return true;
}

export function removeSaved(id: string): void {
  write(read().filter((i) => i.id !== id));
}
