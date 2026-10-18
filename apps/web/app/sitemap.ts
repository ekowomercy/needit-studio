import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { API_URL } from '@/lib/api';

export const revalidate = 3600;

type Paged<T> = { items?: T[] };

async function fetchItems<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Paged<T>;
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, providers] = await Promise.all([
    fetchItems<{ id: string; createdAt?: string }>('/listings?status=active&pageSize=50'),
    fetchItems<{ userId: string }>('/providers?pageSize=50'),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/sell`, changeFrequency: 'weekly', priority: 0.8 },
  ];

  const listingRoutes: MetadataRoute.Sitemap = listings.map((l) => ({
    url: `${SITE_URL}/listings/${l.id}`,
    changeFrequency: 'weekly',
    priority: 0.6,
    lastModified: l.createdAt ? new Date(l.createdAt) : undefined,
  }));

  const providerRoutes: MetadataRoute.Sitemap = providers.map((p) => ({
    url: `${SITE_URL}/providers/${p.userId}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...listingRoutes, ...providerRoutes];
}
