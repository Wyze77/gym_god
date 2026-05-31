import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, Button, Field, Modal, EmptyState, CategoryPill, Spinner } from '../components/ui.jsx';
import { IconPlus, IconTrash, IconSearch, IconCheck, IconDumbbell } from '../components/icons.jsx';

const CATEGORIES = ['all', 'strength', 'cardio', 'core', 'mobility'];

// Default empty set per metric type.
const emptySet = () => ({ reps: '', weightKg: '', durationSec: '', distanceM: '' });

function localNow() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// Inputs shown for a single set depend on the exercise metric type.
function SetInputs({ metricType, set, onChange }) {
  const upd = (key) => (e) => onChange({ ...set, [key]: e.target.value });
  const cell = { flex: 1 };
  if (metricType === 'reps_weight') {
    return (
      <>
        <input className="input" style={cell} type="number" min="0" placeholder="Reps" value={set.reps} onChange={upd('reps')} />
        <input className="input" style={cell} type="number" min="0" step="0.5" placeholder="kg" value={set.weightKg} onChange={upd('weightKg')} />
      </>
    );
  }
  if (metricType === 'reps') {
    return <input className="input" style={cell} type="number" min="0" placeholder="Reps" value={set.reps} onChange={upd('reps')} />;
  }
  if (metricType === 'duration') {
    return <input className="input" style={cell} type="number" min="0" placeholder="Seconds" value={set.durationSec} onChange={upd('durationSec')} />;
  }
  // distance
  return (
    <>
      <input className="input" style={cell} type="number" min="0" placeholder="Meters" value={set.distanceM} onChange={upd('distanceM')} />
      <input className="input" style={cell} type="number" min="0" placeholder="Seconds" value={set.durationSec} onChange={upd('durationSec')} />
    </>
  );
}

export default function LogWorkout() {
  const navigate = useNavigate();
  const toast = useToast();
  const { updateUser } = useAuth();

  const [library, setLibrary] = useState([]);
  const [loadingLib, setLoadingLib] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState('Workout');
  const [performedAt, setPerformedAt] = useState(localNow());
  const [durationMin, setDurationMin] = useState('');
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    api.get('/exercises')
      .then((d) => setLibrary(d.exercises))
      .catch((err) => toast.error('Could not load exercises', err.message))
      .finally(() => setLoadingLib(false));
  }, [toast]);

  const filtered = useMemo(() => {
    return library.filter((e) => {
      if (cat !== 'all' && e.category !== cat) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [library, cat, search]);

  const addExercise = (ex) => {
    setEntries((list) => [
      ...list,
      { exerciseId: ex.id, name: ex.name, category: ex.category, metricType: ex.metricType, sets: [emptySet()] },
    ]);
    setPickerOpen(false);
    setSearch('');
  };

  const removeExercise = (idx) => setEntries((list) => list.filter((_, i) => i !== idx));

  const addSet = (idx) =>
    setEntries((list) => list.map((e, i) => (i === idx ? { ...e, sets: [...e.sets, emptySet()] } : e)));

  const removeSet = (ei, si) =>
    setEntries((list) =>
      list.map((e, i) => (i === ei ? { ...e, sets: e.sets.filter((_, j) => j !== si) } : e))
    );

  const updateSet = (ei, si, next) =>
    setEntries((list) =>
      list.map((e, i) => (i === ei ? { ...e, sets: e.sets.map((s, j) => (j === si ? next : s)) } : e))
    );

  const repeatLast = async () => {
    try {
      const { workout } = await api.get('/workouts/last');
      if (!workout) return toast.info('Nothing to repeat', 'Log a workout first.');
      setTitle(workout.title);
      setEntries(
        workout.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
          category: ex.category,
          metricType: ex.metricType,
          sets: ex.sets.map((s) => ({
            reps: s.reps ?? '',
            weightKg: s.weightKg ?? '',
            durationSec: s.durationSec ?? '',
            distanceM: s.distanceM ?? '',
          })),
        }))
      );
      toast.success('Loaded your last workout', 'Adjust the values and save.');
    } catch (err) {
      toast.error('Could not load last workout', err.message);
    }
  };

  // Convert form sets into API payload, dropping empty fields.
  const buildPayload = () => ({
    title: title.trim() || 'Workout',
    performedAt,
    durationMin: durationMin ? Number(durationMin) : undefined,
    exercises: entries.map((e) => ({
      exerciseId: e.exerciseId,
      sets: e.sets.map((s) => {
        const set = {};
        if (s.reps !== '') set.reps = Number(s.reps);
        if (s.weightKg !== '') set.weightKg = Number(s.weightKg);
        if (s.durationSec !== '') set.durationSec = Number(s.durationSec);
        if (s.distanceM !== '') set.distanceM = Number(s.distanceM);
        return set;
      }),
    })),
  });

  const submit = async () => {
    if (entries.length === 0) return toast.error('Add at least one exercise');
    setBusy(true);
    try {
      const { workout, feedback } = await api.post('/workouts', buildPayload());
      toast.success('Workout saved', `${workout.exercises.length} exercises, ${workout.volume.toLocaleString()} kg total volume.`);
      if (feedback.leveledUp) {
        setTimeout(() => toast.info(`Reached level ${feedback.level}`), 400);
      }
      feedback.newBadges?.forEach((b, i) =>
        setTimeout(() => toast.info(`Badge earned: ${b.name}`, b.description), 700 + i * 500)
      );
      updateUser({ level: feedback.level });
      navigate(`/workouts/${workout.id}`);
    } catch (err) {
      toast.error('Could not save workout', err.message);
    } finally {
      setBusy(false);
    }
  };

  const totalSets = entries.reduce((n, e) => n + e.sets.length, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Log a workout</h1>
          <p className="page-sub">Add the exercises and sets you completed.</p>
        </div>
        <Button variant="ghost" onClick={repeatLast}>Repeat last workout</Button>
      </div>

      <Card className="mb">
        <div className="form-row">
          <Field label="Workout name">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Push Day" />
          </Field>
          <Field label="Date & time">
            <input className="input" type="datetime-local" value={performedAt} onChange={(e) => setPerformedAt(e.target.value)} />
          </Field>
          <Field label="Duration (min)">
            <input className="input" type="number" min="0" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} placeholder="45" />
          </Field>
        </div>
      </Card>

      {entries.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconPlus width={22} height={22} />}
            title="No exercises added"
            message="Add exercises from the library to build your session."
            action={<Button onClick={() => setPickerOpen(true)}><IconPlus width={18} height={18} /> Add exercise</Button>}
          />
        </Card>
      ) : (
        <div className="grid" style={{ gap: 14 }}>
          {entries.map((e, ei) => (
            <Card key={ei}>
              <div className="card-head" style={{ marginBottom: 14 }}>
                <div className="flex center gap-sm">
                  <div className="stat-icon" style={{ margin: 0, width: 34, height: 34, fontSize: 15 }}>
                    <IconDumbbell width={17} height={17} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{e.name}</div>
                    <CategoryPill category={e.category} />
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => removeExercise(ei)}>
                  <IconTrash width={15} height={15} />
                </button>
              </div>

              <div className="grid" style={{ gap: 8 }}>
                {e.sets.map((s, si) => (
                  <div className="flex center gap-sm" key={si}>
                    <span className="chip" style={{ minWidth: 38, justifyContent: 'center' }}>{si + 1}</span>
                    <SetInputs metricType={e.metricType} set={s} onChange={(next) => updateSet(ei, si, next)} />
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => removeSet(ei, si)}
                      disabled={e.sets.length === 1}
                      title="Remove set"
                    >
                      <IconTrash width={15} height={15} />
                    </button>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="mt" onClick={() => addSet(ei)}>
                <IconPlus width={15} height={15} /> Add set
              </Button>
            </Card>
          ))}

          <Button variant="ghost" onClick={() => setPickerOpen(true)}>
            <IconPlus width={18} height={18} /> Add another exercise
          </Button>
        </div>
      )}

      {/* Sticky save bar */}
      {entries.length > 0 && (
        <Card className="mt-lg flex between center" style={{ position: 'sticky', bottom: 16 }}>
          <div className="muted" style={{ fontSize: 14 }}>
            <strong style={{ color: 'var(--text)' }}>{entries.length}</strong> exercises ·{' '}
            <strong style={{ color: 'var(--text)' }}>{totalSets}</strong> sets
          </div>
          <Button variant="accent" onClick={submit} disabled={busy}>
            <IconCheck width={18} height={18} /> {busy ? 'Saving...' : 'Save workout'}
          </Button>
        </Card>
      )}

      {/* Exercise picker modal */}
      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Add exercise">
        <div className="flex center gap-sm mb" style={{ background: 'var(--bg)', borderRadius: 11, padding: '0 12px', border: '1px solid var(--border)' }}>
          <IconSearch width={18} height={18} className="muted" />
          <input
            className="input" style={{ border: 'none', background: 'transparent', padding: '11px 0' }}
            placeholder="Search exercises..." value={search} autoFocus
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-sm wrap mb">
          {CATEGORIES.map((c) => (
            <button key={c} className={`chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)} style={{ cursor: 'pointer', textTransform: 'capitalize' }}>
              {c}
            </button>
          ))}
        </div>

        <div style={{ maxHeight: 340, overflowY: 'auto', margin: '0 -6px' }}>
          {loadingLib ? (
            <div style={{ padding: 30, display: 'grid', placeItems: 'center' }}><Spinner /></div>
          ) : filtered.length === 0 ? (
            <p className="muted" style={{ textAlign: 'center', padding: 24 }}>No exercises match your search.</p>
          ) : (
            filtered.map((ex) => (
              <button
                key={ex.id}
                className="list-row"
                style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none' }}
                onClick={() => addExercise(ex)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{ex.name}</div>
                  <div className="muted" style={{ fontSize: 12.5, textTransform: 'capitalize' }}>{ex.muscleGroup} · {ex.equipment}</div>
                </div>
                <CategoryPill category={ex.category} />
                <IconPlus width={18} height={18} className="text-brand" />
              </button>
            ))
          )}
        </div>
      </Modal>
    </>
  );
}
