// Small, reusable presentational components shared across pages.
import { useEffect } from 'react';

export function Spinner({ page }) {
  if (page) {
    return (
      <div className="spinner-page">
        <div className="spinner" />
      </div>
    );
  }
  return <div className="spinner" />;
}

export function Card({ children, className = '', pad = true, ...rest }) {
  return (
    <div className={`card ${pad ? 'card-pad' : ''} ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function StatCard({ icon, value, label, sub, accent }) {
  return (
    <div className="stat">
      <div className="stat-icon" style={accent ? { background: 'var(--accent-soft)' } : undefined}>
        {icon}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export function ProgressBar({ value }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="progress">
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Button({ variant = 'primary', size, block, children, className = '', ...rest }) {
  const variants = {
    primary: 'btn',
    ghost: 'btn btn-ghost',
    accent: 'btn btn-accent',
    danger: 'btn btn-danger',
  };
  return (
    <button
      className={`${variants[variant]} ${size === 'sm' ? 'btn-sm' : ''} ${block ? 'btn-block' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Field({ label, error, children }) {
  return (
    <div className="field">
      {label && <label className="label">{label}</label>}
      {children}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="empty">
      {icon && <div className="empty-icon">{icon}</div>}
      <h3>{title}</h3>
      {message && <p className="muted mt" style={{ maxWidth: 380, margin: '8px auto 0' }}>{message}</p>}
      {action && <div className="mt-lg">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        {title && <h3 style={{ marginBottom: 16 }}>{title}</h3>}
        {children}
        {footer && <div className="flex gap-sm" style={{ justifyContent: 'flex-end', marginTop: 20 }}>{footer}</div>}
      </div>
    </div>
  );
}

export function CategoryPill({ category }) {
  return <span className={`pill ${category}`}>{category}</span>;
}
