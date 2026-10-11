'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { EmptyState, Skeleton } from '@needit/ui';
import { useAuth } from '@/components/auth-provider';
import { RefinementBar } from '@/components/refinement-bar';
import { ResultCard } from '@/components/result-card';
import { api, ApiError } from '@/lib/api';
import { formatNaira } from '@needit/shared';
import type { Intent } from '@needit/shared';
import type { MatchResult, NeedRequest, RefineNeedResponse } from '@/lib/types';

function IntentSummary({ intent }: { intent: Intent }) {
  const chips: string[] = [];
  chips.push(intent.resultType);
  if (intent.categoryTag) chips.push(intent.categoryTag.replace(/[-_]/g, ' '));
  if (intent.condition) chips.push(intent.condition);
  if (intent.budget) {
    chips.push(
      `${intent.budget.operator === '<=' ? 'under' : '~'} ${formatNaira(intent.budget.amount)}`,
    );
  }
  if (intent.location?.text) chips.push(`in ${intent.location.text}`);
  if (intent.timing?.date) chips.push(intent.timing.date);

  return (
    <div className="intent-summary">
      <span className="text-overline">Your need</span>
      <div className="text-title-sm">&ldquo;{intent.need}&rdquo;</div>
      <div className="intent-chips">
        {chips.map((chip, i) => (
          <span key={`${chip}-${i}`} className="result-reason">
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const needId = params.id;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [need, setNeed] = useState<NeedRequest | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [needData, results] = await Promise.all([
        api<NeedRequest>(`/needs/${needId}`),
        api<MatchResult>(`/needs/${needId}/results`),
      ]);
      setNeed(needData);
      setResult(results);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(`/needs/${needId}`)}`);
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not load results');
    } finally {
      setLoading(false);
    }
  }, [needId, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(`/needs/${needId}`)}`);
      return;
    }
    void load();
  }, [authLoading, user, load, router, needId]);

  function onRefined(res: RefineNeedResponse) {
    setNeed(res.need);
    setResult(res.matches);
  }

  return (
    <main className="page">
      <div className="section-head">
        <h1 className="text-title-lg" style={{ margin: 0 }}>
          Results
        </h1>
        <Link href="/" className="text-body-sm">
          New search
        </Link>
      </div>

      {error ? <p className="error-msg">{error}</p> : null}

      {loading ? (
        <div className="grid-cards">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card stack">
              <Skeleton style={{ height: 16, width: '60%' }} />
              <Skeleton style={{ height: 14, width: '90%' }} />
              <Skeleton style={{ height: 14, width: '40%' }} />
            </div>
          ))}
        </div>
      ) : result ? (
        <div className="results-layout">
          <IntentSummary intent={result.intent} />

          <RefinementBar needId={needId} intent={result.intent} onRefined={onRefined} />

          <div className="section-head" style={{ marginBottom: 0 }}>
            <span className="text-body-sm">
              {result.total} match{result.total === 1 ? '' : 'es'}
            </span>
          </div>

          {result.matches.length > 0 ? (
            <div className="grid-cards">
              {result.matches.map((match) => (
                <ResultCard key={match.listing.id} match={match} needId={needId} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="&#128269;"
              title="No match yet"
              description="Your request stays active. We'll notify you the moment someone can help — or refine your search above."
              action={
                need?.rawText ? (
                  <span className="text-caption">Original: &ldquo;{need.rawText}&rdquo;</span>
                ) : undefined
              }
            />
          )}
        </div>
      ) : null}
    </main>
  );
}
