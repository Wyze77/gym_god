import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, StatCard, ProgressBar, Button, Spinner, EmptyState } from '../components/ui.jsx';
import { IconFlame, IconDumbbell, IconBolt, IconClock, IconPlus, IconTrophy } from '../components/icons.jsx';
import { formatVolume, relativeDay, formatNumber } from '../utils/format.js';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/dashboard')
      .then(setData)
      .catch((err) => toast.error('Could not load dashboard', err.message))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <Spinner page />;
  if (!data) return null;

  const { summary, level, recentWorkouts, volumeTrend, badges } = data;
  const xpPct = level.xpForNextLevel ? (level.xpIntoLevel / level.xpForNextLevel) * 100 : 100;
  const chartData = volumeTrend.map((d) => ({ date: d.date.slice(5), volume: Number(d.volume) }));

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-sub">Here's your fitness snapshot. Keep the momentum going!</p>
        </div>
        <Button onClick={() => navigate('/log')}><IconPlus width={18} height={18} /> Log workout</Button>
      </div>

      {/* Stat row */}
      <div className="grid grid-stats mb">
        <StatCard
          icon={<IconFlame width={20} height={20} />}
          value={<span>{summary.currentStreak} <span style={{ fontSize: 16 }}>days</span></span>}
          label="Current streak"
          sub={summary.currentStreak > 0 ? "🔥 Don't break the chain!" : 'Start one today'}
        />
        <StatCard
          icon={<IconDumbbell width={20} height={20} />}
          value={summary.totalWorkouts}
          label="Total workouts"
          sub={`${summary.thisWeek} this week`}
        />
        <StatCard
          icon={<IconBolt width={20} height={20} />}
          value={formatVolume(summary.totalVolume)}
          label="Total volume lifted"
          accent
        />
        <StatCard
          icon={<IconTrophy width={20} height={20} />}
          value={`${badges.earnedCount}/${badges.total}`}
          label="Badges earned"
          sub={badges.next ? `Next: ${badges.next.name}` : 'All unlocked! 🏆'}
        />
      </div>

      <div className="grid grid-2">
        {/* Level / XP card */}
        <Card>
          <div className="card-head">
            <div className="card-title">Your level</div>
            <span className="chip active">Level {level.level}</span>
          </div>
          <div className="flex between center" style={{ marginBottom: 8 }}>
            <span className="muted" style={{ fontSize: 13 }}>{formatNumber(level.xp)} XP total</span>
            <span className="muted" style={{ fontSize: 13 }}>
              {formatNumber(level.xpIntoLevel)} / {formatNumber(level.xpForNextLevel)} to L{level.level + 1}
            </span>
          </div>
          <ProgressBar value={xpPct} />
          <p className="muted mt" style={{ fontSize: 13 }}>
            Earn XP every time you log a workout. Bigger sessions = more XP.
          </p>
        </Card>

        {/* Volume trend mini chart */}
        <Card>
          <div className="card-head">
            <div className="card-title">Volume — last 14 days</div>
            <Link to="/progress" className="card-hint text-brand">View all →</Link>
          </div>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={chartData} margin={{ top: 5, right: 6, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#6b7488', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7488', fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  contentStyle={{ background: '#232838', border: '1px solid #2b3145', borderRadius: 10, fontSize: 13 }}
                  labelStyle={{ color: '#9aa3b8' }}
                  formatter={(v) => [`${formatNumber(v)} kg`, 'Volume']}
                />
                <Area type="monotone" dataKey="volume" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#volFill)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="muted" style={{ fontSize: 13, padding: '30px 0', textAlign: 'center' }}>
              Log workouts to see your trend.
            </p>
          )}
        </Card>
      </div>

      {/* Recent workouts */}
      <Card className="mt-lg" pad={false}>
        <div className="card-pad card-head" style={{ marginBottom: 0 }}>
          <div className="card-title">Recent workouts</div>
          <Link to="/workouts" className="card-hint text-brand">See history →</Link>
        </div>
        <div className="divide">
          {recentWorkouts.length === 0 ? (
            <EmptyState
              emoji="🏋️"
              title="No workouts yet"
              message="Log your first session and start building your streak."
              action={<Button onClick={() => navigate('/log')}><IconPlus width={18} height={18} /> Log a workout</Button>}
            />
          ) : (
            recentWorkouts.map((w) => (
              <Link to={`/workouts/${w.id}`} key={w.id} className="list-row">
                <div className="stat-icon" style={{ margin: 0, width: 38, height: 38, fontSize: 16 }}>
                  <IconDumbbell width={18} height={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{w.title}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {relativeDay(w.performedAt)} · {w.exerciseCount} exercises · {w.setCount} sets
                  </div>
                </div>
                <div className="text-right">
                  <div style={{ fontWeight: 700 }}>{formatVolume(w.volume)}</div>
                  {w.durationMin ? (
                    <div className="faint flex center gap-sm" style={{ fontSize: 12, justifyContent: 'flex-end' }}>
                      <IconClock width={12} height={12} /> {w.durationMin} min
                    </div>
                  ) : null}
                </div>
              </Link>
            ))
          )}
        </div>
      </Card>

      {/* Recently earned badges */}
      {badges.recent.length > 0 && (
        <Card className="mt-lg">
          <div className="card-head">
            <div className="card-title">Recently earned</div>
            <Link to="/achievements" className="card-hint text-brand">All achievements →</Link>
          </div>
          <div className="flex gap wrap">
            {badges.recent.map((b) => (
              <div key={b.code} className="chip active" style={{ padding: '8px 14px', fontSize: 13.5 }}>
                <span style={{ fontSize: 17 }}>{b.icon}</span> {b.name}
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
