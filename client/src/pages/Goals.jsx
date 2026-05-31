import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { Card, Button, Field, Modal, Spinner, EmptyState, ProgressBar } from '../components/ui.jsx';
import { IconPlus, IconTarget, IconTrash } from '../components/icons.jsx';
import { formatNumber, GOAL_LABELS } from '../utils/format.js';

const TYPES = [
  { value: 'workouts_per_week', label: 'Workouts per week', unit: 'workouts', placeholder: '4' },
  { value: 'streak_days', label: 'Reach a streak', unit: 'days', placeholder: '7' },
  { value: 'total_volume', label: 'Total volume lifted', unit: 'kg', placeholder: '100000' },
  { value: 'target_weight', label: 'Target body weight', unit: 'kg', placeholder: '75' },
];

export default function Goals() {
  const toast = useToast();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ type: 'workouts_per_week', title: '', targetValue: '' });

  const load = () => {
    setLoading(true);
    api.get('/goals')
      .then((d) => setGoals(d.goals))
      .catch((err) => toast.error('Could not load goals', err.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/goals', {
        type: form.type,
        title: form.title.trim() || TYPES.find((t) => t.value === form.type).label,
        targetValue: Number(form.targetValue),
      });
      toast.success('Goal created');
      setModal(false);
      setForm({ type: 'workouts_per_week', title: '', targetValue: '' });
      load();
    } catch (err) {
      toast.error('Could not create goal', err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/goals/${id}`);
      setGoals((g) => g.filter((x) => x.id !== id));
      toast.success('Goal removed');
    } catch (err) {
      toast.error('Could not remove goal', err.message);
    }
  };

  const activeType = TYPES.find((t) => t.value === form.type);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Goals</h1>
          <p className="page-sub">Set targets that update automatically from your workouts.</p>
        </div>
        <Button onClick={() => setModal(true)}><IconPlus width={18} height={18} /> New goal</Button>
      </div>

      {loading ? (
        <Spinner page />
      ) : goals.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconTarget width={22} height={22} />}
            title="No goals yet"
            message="Create a goal and it will be tracked from your logged workouts."
            action={<Button onClick={() => setModal(true)}><IconPlus width={18} height={18} /> Create a goal</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-2">
          {goals.map((g) => {
            const done = g.progressPct >= 100;
            return (
              <Card key={g.id}>
                <div className="flex between center mb">
                  <div className="flex center gap-sm">
                    <div className="stat-icon" style={{ margin: 0, width: 36, height: 36, fontSize: 15, background: done ? 'var(--accent-soft)' : undefined }}>
                      <IconTarget width={18} height={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{g.title}</div>
                      <div className="muted" style={{ fontSize: 12.5 }}>{GOAL_LABELS[g.type]}</div>
                    </div>
                  </div>
                  <button className="btn btn-danger btn-icon btn-sm" onClick={() => remove(g.id)} title="Delete goal">
                    <IconTrash width={15} height={15} />
                  </button>
                </div>

                <div className="flex between center" style={{ marginBottom: 7 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>
                    {formatNumber(g.currentValue)} <span className="muted" style={{ fontWeight: 400 }}>/ {formatNumber(g.targetValue)} {g.unit}</span>
                  </span>
                  <span className={done ? 'text-accent' : 'muted'} style={{ fontWeight: 700, fontSize: 14 }}>
                    {g.progressPct}%
                  </span>
                </div>
                <ProgressBar value={g.progressPct} />
                {done && <div className="text-accent mt" style={{ fontSize: 13, fontWeight: 600 }}>Goal reached</div>}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Create a goal">
        <form onSubmit={create}>
          <Field label="Goal type">
            <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Title">
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={activeType.label} />
          </Field>
          <Field label={`Target (${activeType.unit})`}>
            <input className="input" type="number" min="0" step="any" required value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} placeholder={activeType.placeholder} />
          </Field>
          <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Creating...' : 'Create goal'}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
