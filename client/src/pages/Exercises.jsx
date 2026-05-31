import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { Card, Button, Field, Modal, Spinner, EmptyState, CategoryPill } from '../components/ui.jsx';
import { IconSearch, IconPlus, IconDumbbell } from '../components/icons.jsx';

const CATEGORIES = ['all', 'strength', 'cardio', 'core', 'mobility'];
const METRIC_OPTIONS = [
  { value: 'reps_weight', label: 'Reps & weight' },
  { value: 'reps', label: 'Reps only' },
  { value: 'duration', label: 'Duration (time)' },
  { value: 'distance', label: 'Distance' },
];

export default function Exercises() {
  const toast = useToast();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '', category: 'strength', muscleGroup: '', equipment: '', metricType: 'reps_weight', description: '',
  });

  const load = () => {
    setLoading(true);
    api.get('/exercises')
      .then((d) => setExercises(d.exercises))
      .catch((err) => toast.error('Could not load exercises', err.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(
    () => exercises.filter((e) => {
      if (cat !== 'all' && e.category !== cat) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
    [exercises, cat, search]
  );

  const createCustom = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/exercises', {
        ...form,
        muscleGroup: form.muscleGroup.trim() || 'full_body',
        equipment: form.equipment.trim() || 'bodyweight',
      });
      toast.success('Custom exercise added', `${form.name} is now in your library.`);
      setModal(false);
      setForm({ name: '', category: 'strength', muscleGroup: '', equipment: '', metricType: 'reps_weight', description: '' });
      load();
    } catch (err) {
      toast.error('Could not add exercise', err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Exercises</h1>
          <p className="page-sub">Browse {exercises.length} exercises or add your own.</p>
        </div>
        <Button onClick={() => setModal(true)}><IconPlus width={18} height={18} /> Custom exercise</Button>
      </div>

      <Card className="mb">
        <div className="flex center gap-sm mb" style={{ background: 'var(--bg)', borderRadius: 11, padding: '0 12px', border: '1px solid var(--border)' }}>
          <IconSearch width={18} height={18} className="muted" />
          <input
            className="input" style={{ border: 'none', background: 'transparent', padding: '11px 0' }}
            placeholder="Search exercises..." value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-sm wrap">
          {CATEGORIES.map((c) => (
            <button key={c} className={`chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)} style={{ cursor: 'pointer', textTransform: 'capitalize' }}>
              {c}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <Spinner page />
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon={<IconSearch width={22} height={22} />} title="No exercises found" message="Try a different search term or category." /></Card>
      ) : (
        <div className="grid grid-2">
          {filtered.map((ex) => (
            <Card key={ex.id}>
              <div className="flex between center mb">
                <div className="flex center gap-sm">
                  <div className="stat-icon" style={{ margin: 0, width: 36, height: 36, fontSize: 15 }}>
                    <IconDumbbell width={17} height={17} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{ex.name} {ex.isCustom && <span className="text-accent" style={{ fontSize: 12 }}>· custom</span>}</div>
                    <div className="muted" style={{ fontSize: 12.5, textTransform: 'capitalize' }}>{ex.muscleGroup} · {ex.equipment}</div>
                  </div>
                </div>
                <CategoryPill category={ex.category} />
              </div>
              {ex.description && <p className="muted" style={{ fontSize: 13.5 }}>{ex.description}</p>}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Add a custom exercise"
      >
        <form onSubmit={createCustom}>
          <Field label="Name">
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cable Fly" />
          </Field>
          <div className="form-row">
            <Field label="Category">
              <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.filter((c) => c !== 'all').map((c) => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
              </select>
            </Field>
            <Field label="Tracking type">
              <select className="select" value={form.metricType} onChange={(e) => setForm({ ...form, metricType: e.target.value })}>
                {METRIC_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="form-row">
            <Field label="Muscle group">
              <input className="input" value={form.muscleGroup} onChange={(e) => setForm({ ...form, muscleGroup: e.target.value })} placeholder="chest" />
            </Field>
            <Field label="Equipment">
              <input className="input" value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} placeholder="cable" />
            </Field>
          </div>
          <Field label="Description (optional)">
            <textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short note or cue (optional)" />
          </Field>
          <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Adding...' : 'Add exercise'}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
