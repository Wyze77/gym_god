import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { Card, Spinner, EmptyState } from '../components/ui.jsx';
import { IconChart } from '../components/icons.jsx';
import { formatNumber, formatVolume, formatDate } from '../utils/format.js';

const PIE_COLORS = ['#6366f1', '#22d3a8', '#f59e0b', '#ef4444', '#8b5cf6', '#38bdf8', '#ec4899', '#84cc16'];
const axisTick = { fill: '#6b7488', fontSize: 11 };
const tooltipStyle = { background: '#232838', border: '1px solid #2b3145', borderRadius: 10, fontSize: 13 };

function ChartCard({ title, hint, children }) {
  return (
    <Card>
      <div className="card-head">
        <div className="card-title">{title}</div>
        {hint && <span className="card-hint">{hint}</span>}
      </div>
      {children}
    </Card>
  );
}

export default function Progress() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/progress')
      .then(setData)
      .catch((err) => toast.error('Could not load progress', err.message))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <Spinner page />;
  if (!data) return null;

  const { summary, volumeTrend, weeklyFrequency, muscleSplit, personalRecords, bodyMetrics } = data;
  const hasData = summary.totalWorkouts > 0;

  const volumeData = volumeTrend.map((d) => ({ date: formatDate(d.date), volume: Number(d.volume) }));
  const freqData = weeklyFrequency.map((d) => ({ week: formatDate(d.weekStart), workouts: Number(d.workouts) }));
  const muscleData = muscleSplit.map((m) => ({ name: m.muscleGroup, value: Number(m.sets) }));
  const weightData = bodyMetrics.map((m) => ({ date: formatDate(m.recordedOn), weight: Number(m.weightKg) }));

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Progress</h1>
          <p className="page-sub">Charts and records based on your logged workouts.</p>
        </div>
      </div>

      {!hasData ? (
        <Card>
          <EmptyState icon={<IconChart width={22} height={22} />} title="No data yet" message="Log a few workouts and your charts will appear here." />
        </Card>
      ) : (
        <>
          <div className="grid grid-stats mb">
            <Card><div className="stat-value" style={{ fontSize: 24 }}>{formatVolume(summary.totalVolume)}</div><div className="stat-label">Lifetime volume</div></Card>
            <Card><div className="stat-value" style={{ fontSize: 24 }}>{summary.totalSets}</div><div className="stat-label">Total sets</div></Card>
            <Card><div className="stat-value" style={{ fontSize: 24 }}>{summary.distinctExercises}</div><div className="stat-label">Distinct exercises</div></Card>
            <Card><div className="stat-value" style={{ fontSize: 24 }}>{summary.longestStreak}<span style={{ fontSize: 15 }}> days</span></div><div className="stat-label">Longest streak</div></Card>
          </div>

          <div className="grid grid-2">
            <ChartCard title="Training volume" hint="last 30 days">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={volumeData} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2b3145" vertical={false} />
                  <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} width={50} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${formatNumber(v)} kg`, 'Volume']} />
                  <Area type="monotone" dataKey="volume" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#vol)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Workout frequency" hint="last 8 weeks">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={freqData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2b3145" vertical={false} />
                  <XAxis dataKey="week" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99,102,241,0.08)' }} formatter={(v) => [v, 'Workouts']} />
                  <Bar dataKey="workouts" fill="#22d3a8" radius={[6, 6, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {muscleData.length > 0 && (
              <ChartCard title="Muscle focus" hint="sets, last 30 days">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={muscleData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={86} paddingAngle={3}>
                      {muscleData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v} sets`, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-sm wrap mt" style={{ justifyContent: 'center' }}>
                  {muscleData.slice(0, 6).map((m, i) => (
                    <span key={m.name} className="chip" style={{ textTransform: 'capitalize' }}>
                      <span style={{ width: 9, height: 9, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length], display: 'inline-block' }} />
                      {m.name}
                    </span>
                  ))}
                </div>
              </ChartCard>
            )}

            {weightData.length > 0 && (
              <ChartCard title="Body weight" hint="kg over time">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={weightData} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2b3145" vertical={false} />
                    <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} domain={['dataMin - 1', 'dataMax + 1']} width={40} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, 'Weight']} />
                    <Line type="monotone" dataKey="weight" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          {personalRecords.length > 0 && (
            <Card className="mt-lg" pad={false}>
              <div className="card-pad card-head" style={{ marginBottom: 0 }}>
                <div className="card-title">Personal records</div>
                <span className="card-hint">best across all sessions</span>
              </div>
              <div className="divide">
                {personalRecords.map((pr) => (
                  <div className="list-row" key={pr.exerciseId}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{pr.exerciseName}</div>
                      <div className="muted" style={{ fontSize: 12.5 }}>
                        {pr.maxWeight ? `Top weight ${Number(pr.maxWeight)} kg` :
                         pr.maxDistance ? `Best distance ${(pr.maxDistance / 1000).toFixed(2)} km` :
                         pr.maxDuration ? `Best time ${pr.maxDuration}s` :
                         `Most reps ${pr.maxReps}`}
                      </div>
                    </div>
                    {pr.estimatedOneRm ? (
                      <div className="text-right">
                        <div style={{ fontWeight: 700 }} className="text-accent">{Number(pr.estimatedOneRm)} kg</div>
                        <div className="faint" style={{ fontSize: 11.5 }}>est. 1RM</div>
                      </div>
                    ) : (
                      <div className="text-right">
                        <div style={{ fontWeight: 700 }} className="text-accent">{pr.maxReps ?? '-'}</div>
                        <div className="faint" style={{ fontSize: 11.5 }}>best reps</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </>
  );
}
