'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Chip } from '@needit/ui';
import { useAuth } from '@/components/auth-provider';
import { NeedForm } from '@/components/need-form';
import { api } from '@/lib/api';
import type { Category, PopularNeed } from '@/lib/types';

const CATEGORY_PHRASES: Record<string, string> = {
  'home-services': 'I need a plumber tomorrow',
  'used-items': 'I need a used fridge under 150k',
  services: 'I need a cleaner tomorrow',
  product: 'I need a used washing machine under 150k',
};

function phraseFor(tag: string, sample?: string): string {
  if (CATEGORY_PHRASES[tag]) return CATEGORY_PHRASES[tag]!;
  if (sample) return sample;
  return `I need ${tag.replace(/[-_]/g, ' ')}`;
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const [popular, setPopular] = useState<PopularNeed[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seed, setSeed] = useState('');

  useEffect(() => {
    api<PopularNeed[]>('/needs/popular')
      .then(setPopular)
      .catch(() => setPopular([]));
    api<Category[]>('/categories')
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  return (
    <main className="page">
      <section className="hero">
        <h1 className="text-display">What do you need?</h1>
        <p className="text-body-lg" style={{ margin: 0, opacity: 0.92 }}>
          Tell us naturally — we&apos;ll find the people, products &amp; services near you.
        </p>
        {!loading && !user ? (
          <div className="hero-cta">
            <Link href="/login?signup=1" className="btn btn-primary">
              Sign up — it&apos;s free
            </Link>
            <Link href="/login" className="btn btn-ghost">
              Sign in
            </Link>
          </div>
        ) : null}
        <NeedForm key={seed} initialText={seed} />
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="text-title-md" style={{ margin: 0 }}>
            Popular needs
          </h2>
        </div>
        <div className="row-wrap">
          {popular.length > 0 ? (
            popular.map((item) => (
              <Chip
                key={item.tag}
                variant="category"
                onClick={() => setSeed(phraseFor(item.tag, item.sample))}
              >
                {item.tag.replace(/[-_]/g, ' ')} · {item.count}
              </Chip>
            ))
          ) : (
            <span className="text-body-sm">
              Be the first — type a need above and we&apos;ll match you instantly.
            </span>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="text-title-md" style={{ margin: 0 }}>
            Browse categories
          </h2>
        </div>
        <div className="row-wrap">
          {categories.map((category) => (
            <Chip key={category.id} onClick={() => setSeed(phraseFor(category.slug))}>
              {category.icon ? `${category.icon} ` : ''}
              {category.name}
            </Chip>
          ))}
          {categories.length === 0 ? (
            <span className="text-body-sm">Categories load from the catalog once seeded.</span>
          ) : null}
        </div>
      </section>

      <section className="section">
        <div className="grid-cards">
          <div className="card">
            <h3 className="text-title-sm" style={{ marginTop: 0 }}>
              1. Describe your need
            </h3>
            <p className="text-body-sm">
              Type it like you&apos;d tell a friend: &quot;I need a plumber tomorrow&quot; or &quot;a
              used fridge under 150k&quot;.
            </p>
          </div>
          <div className="card">
            <h3 className="text-title-sm" style={{ marginTop: 0 }}>
              2. We understand &amp; match
            </h3>
            <p className="text-body-sm">
              We parse your need and rank nearby providers, products and services by fit.
            </p>
          </div>
          <div className="card">
            <h3 className="text-title-sm" style={{ marginTop: 0 }}>
              3. Refine &amp; connect
            </h3>
            <p className="text-body-sm">
              Refine conversationally and reach out — your request stays active until you&apos;re
              sorted.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
