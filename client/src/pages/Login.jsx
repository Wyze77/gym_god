import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Field } from '../components/ui.jsx';
import { IconBolt, IconChart, IconTrophy, IconDumbbell } from '../components/icons.jsx';

const FEATURES = [
  { icon: <IconBolt width={18} height={18} />, title: 'Log in seconds', text: 'Fast, beginner-friendly workout logging.' },
  { icon: <IconChart width={18} height={18} />, title: 'See your progress', text: 'Clear charts for volume, weight and PRs.' },
  { icon: <IconTrophy width={18} height={18} />, title: 'Stay motivated', text: 'Streaks, XP, levels and achievement badges.' },
];

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'demo@fitsync.app', password: 'demo1234' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate('/');
    } catch (err) {
      toast.error('Login failed', err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <div className="brand">
          <div className="brand-mark"><IconDumbbell width={22} height={22} stroke="#fff" /></div>
          <div className="brand-name">Fit<span>Sync</span></div>
        </div>
        <div>
          <h1 style={{ fontSize: 34, lineHeight: 1.15, marginBottom: 12 }}>
            Track. Progress.<br />Repeat.
          </h1>
          <p className="muted" style={{ maxWidth: 360, marginBottom: 30 }}>
            Your personal fitness companion — log workouts effortlessly and watch
            yourself get stronger every week.
          </p>
          {FEATURES.map((f) => (
            <div className="auth-feature" key={f.title}>
              <div className="fi">{f.icon}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{f.title}</div>
                <div className="muted" style={{ fontSize: 13.5 }}>{f.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="faint" style={{ fontSize: 13 }}>© {new Date().getFullYear()} FitSync</div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <h2 style={{ fontSize: 24, marginBottom: 6 }}>Welcome back</h2>
          <p className="muted mb">Log in to continue your fitness journey.</p>

          <form onSubmit={submit}>
            <Field label="Email">
              <input
                className="input" type="email" autoComplete="email" required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password">
              <input
                className="input" type="password" autoComplete="current-password" required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </Field>
            <Button type="submit" block disabled={busy}>
              {busy ? 'Logging in…' : 'Log in'}
            </Button>
          </form>

          <p className="muted mt-lg" style={{ textAlign: 'center', fontSize: 14 }}>
            New to FitSync? <Link to="/register" className="text-brand" style={{ fontWeight: 600 }}>Create an account</Link>
          </p>

          <div className="card card-pad mt-lg" style={{ background: 'var(--surface)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>🎬 Demo account</div>
            <div className="muted" style={{ fontSize: 13 }}>
              demo@fitsync.app · demo1234 (pre-filled — just click Log in)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
