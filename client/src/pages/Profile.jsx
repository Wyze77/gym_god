import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, Button, Field, Spinner } from '../components/ui.jsx';
import { FITNESS_GOALS } from '../utils/format.js';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    name: user?.name || '',
    heightCm: user?.heightCm || '',
    weightKg: user?.weightKg || '',
    fitnessGoal: user?.fitnessGoal || 'stay_fit',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [metric, setMetric] = useState({ weightKg: '', bodyFatPct: '' });
  const [metrics, setMetrics] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [savingMetric, setSavingMetric] = useState(false);

  useEffect(() => {
    api.get('/users/me/metrics')
      .then((d) => setMetrics(d.metrics))
      .catch(() => {})
      .finally(() => setLoadingMetrics(false));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = {
        name: form.name.trim(),
        fitnessGoal: form.fitnessGoal,
      };
      if (form.heightCm !== '') payload.heightCm = Number(form.heightCm);
      if (form.weightKg !== '') payload.weightKg = Number(form.weightKg);
      const { user: updated } = await api.patch('/users/me', payload);
      updateUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Could not update profile', err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const logWeight = async (e) => {
    e.preventDefault();
    if (!metric.weightKg) return;
    setSavingMetric(true);
    try {
      const payload = { weightKg: Number(metric.weightKg) };
      if (metric.bodyFatPct !== '') payload.bodyFatPct = Number(metric.bodyFatPct);
      const { metric: saved } = await api.post('/users/me/metrics', payload);
      setMetrics((list) => {
        const others = list.filter((m) => m.recordedOn !== saved.recordedOn);
        return [...others, saved].sort((a, b) => a.recordedOn.localeCompare(b.recordedOn));
      });
      updateUser({ weightKg: saved.weightKg });
      setForm((f) => ({ ...f, weightKg: saved.weightKg }));
      setMetric({ weightKg: '', bodyFatPct: '' });
      toast.success('Weight logged', 'Your body-weight chart is updated.');
    } catch (err) {
      toast.error('Could not log weight', err.message);
    } finally {
      setSavingMetric(false);
    }
  };

  const recent = [...metrics].reverse().slice(0, 6);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-sub">Manage your details and track your body weight.</p>
        </div>
      </div>

      <div className="grid grid-2">
        <Card>
          <div className="card-title mb">Account details</div>
          <form onSubmit={saveProfile}>
            <Field label="Name">
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Email">
              <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
            </Field>
            <div className="form-row">
              <Field label="Height (cm)">
                <input className="input" type="number" min="50" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} placeholder="178" />
              </Field>
              <Field label="Weight (kg)">
                <input className="input" type="number" min="20" step="0.1" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} placeholder="75" />
              </Field>
            </div>
            <Field label="Primary goal">
              <select className="select" value={form.fitnessGoal} onChange={(e) => setForm({ ...form, fitnessGoal: e.target.value })}>
                {FITNESS_GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </Field>
            <Button type="submit" disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save changes'}</Button>
          </form>
        </Card>

        <div className="grid" style={{ gap: 18, alignContent: 'start' }}>
          <Card>
            <div className="card-title mb">Log body weight</div>
            <form onSubmit={logWeight}>
              <div className="form-row">
                <Field label="Weight (kg)">
                  <input className="input" type="number" min="20" step="0.1" required value={metric.weightKg} onChange={(e) => setMetric({ ...metric, weightKg: e.target.value })} placeholder="79.5" />
                </Field>
                <Field label="Body fat % (optional)">
                  <input className="input" type="number" min="1" step="0.1" value={metric.bodyFatPct} onChange={(e) => setMetric({ ...metric, bodyFatPct: e.target.value })} placeholder="18" />
                </Field>
              </div>
              <Button type="submit" variant="accent" disabled={savingMetric}>{savingMetric ? 'Saving…' : "Log today's weight"}</Button>
            </form>
          </Card>

          <Card pad={false}>
            <div className="card-pad card-title" style={{ paddingBottom: 0 }}>Recent measurements</div>
            {loadingMetrics ? (
              <div style={{ padding: 24, display: 'grid', placeItems: 'center' }}><Spinner /></div>
            ) : recent.length === 0 ? (
              <p className="muted card-pad" style={{ fontSize: 13.5 }}>No measurements yet. Log your first above.</p>
            ) : (
              <div className="divide">
                {recent.map((m) => (
                  <div className="list-row" key={m.recordedOn}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{Number(m.weightKg)} kg</div>
                      {m.bodyFatPct && <div className="muted" style={{ fontSize: 12.5 }}>{Number(m.bodyFatPct)}% body fat</div>}
                    </div>
                    <span className="muted" style={{ fontSize: 13 }}>{m.recordedOn}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Button variant="ghost" onClick={logout}>Log out</Button>
        </div>
      </div>
    </>
  );
}
