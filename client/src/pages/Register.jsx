import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Field } from '../components/ui.jsx';
import { FITNESS_GOALS } from '../utils/format.js';
import { IconDumbbell } from '../components/icons.jsx';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', fitnessGoal: 'build_muscle' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setBusy(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        fitnessGoal: form.fitnessGoal,
      });
      navigate('/');
    } catch (err) {
      if (err.details) {
        const map = {};
        err.details.forEach((d) => { map[d.field] = d.message; });
        setErrors(map);
      }
      toast.error('Registration failed', err.message);
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
          <h1 style={{ fontSize: 28, lineHeight: 1.2, marginBottom: 12 }}>
            Create an account
          </h1>
          <p className="muted" style={{ maxWidth: 360 }}>
            Set up an account to start logging workouts and tracking your
            progress over time.
          </p>
        </div>
        <div className="faint" style={{ fontSize: 13 }}>© {new Date().getFullYear()} FitSync</div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Register</h2>
          <p className="muted mb">Fill in your details to create an account.</p>

          <form onSubmit={submit}>
            <Field label="Name" error={errors.name}>
              <input className="input" required value={form.name} onChange={set('name')} placeholder="Your name" />
            </Field>
            <Field label="Email" error={errors.email}>
              <input className="input" type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" />
            </Field>
            <Field label="Password" error={errors.password}>
              <input className="input" type="password" required value={form.password} onChange={set('password')} placeholder="At least 6 characters" />
            </Field>
            <Field label="Main goal">
              <select className="select" value={form.fitnessGoal} onChange={set('fitnessGoal')}>
                {FITNESS_GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </Field>
            <Button type="submit" block disabled={busy}>
              {busy ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="muted mt-lg" style={{ textAlign: 'center', fontSize: 14 }}>
            Already have an account? <Link to="/login" className="text-brand" style={{ fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
