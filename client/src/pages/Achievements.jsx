import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { Card, Spinner, ProgressBar } from '../components/ui.jsx';
import { formatDate } from '../utils/format.js';

const TIER_LABEL = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold' };

export default function Achievements() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/gamification/badges')
      .then(setData)
      .catch((err) => toast.error('Could not load achievements', err.message))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <Spinner page />;
  if (!data) return null;

  const { badges, earnedCount, total } = data;
  const pct = total ? (earnedCount / total) * 100 : 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Achievements</h1>
          <p className="page-sub">Unlock badges by staying consistent and hitting milestones.</p>
        </div>
      </div>

      <Card className="mb">
        <div className="flex between center mb">
          <div className="card-title">🏆 {earnedCount} of {total} unlocked</div>
          <span className="muted" style={{ fontSize: 13 }}>{Math.round(pct)}% complete</span>
        </div>
        <ProgressBar value={pct} />
      </Card>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        {badges.map((b) => (
          <div key={b.id} className={`badge-tile ${b.tier} ${b.earned ? '' : 'locked'}`}>
            <div className="badge-emoji">{b.earned ? b.icon : '🔒'}</div>
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>{b.name}</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 4, minHeight: 32 }}>{b.description}</div>
            <div className="chip mt" style={{ fontSize: 11 }}>{TIER_LABEL[b.tier]}</div>
            {b.earned && b.earnedAt && (
              <div className="text-accent" style={{ fontSize: 11.5, marginTop: 8, fontWeight: 600 }}>
                Earned {formatDate(b.earnedAt, { year: true })}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
