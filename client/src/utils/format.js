// Display helpers used across pages.

export function formatDate(value, opts = {}) {
  if (!value) return '';
  const date = new Date(value.replace ? value.replace(' ', 'T') : value);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(opts.year ? { year: 'numeric' } : {}),
  });
}

export function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value.replace ? value.replace(' ', 'T') : value);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function relativeDay(value) {
  if (!value) return '';
  const date = new Date(value.replace ? value.replace(' ', 'T') : value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((today - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return formatDate(value);
}

export function formatNumber(n) {
  const num = Number(n) || 0;
  return num.toLocaleString();
}

export function formatVolume(kg) {
  const n = Number(kg) || 0;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}t`;
  return `${Math.round(n)} kg`;
}

export function formatDuration(seconds) {
  const s = Number(seconds) || 0;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m === 0) return `${rem}s`;
  return `${m}m ${rem ? `${rem}s` : ''}`.trim();
}

export function formatDistance(meters) {
  const m = Number(meters) || 0;
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${m} m`;
}

export const GOAL_LABELS = {
  workouts_per_week: 'Workouts / week',
  target_weight: 'Target weight',
  total_volume: 'Total volume',
  streak_days: 'Streak',
};

export const FITNESS_GOALS = [
  { value: 'lose_weight', label: 'Lose weight' },
  { value: 'build_muscle', label: 'Build muscle' },
  { value: 'gain_strength', label: 'Gain strength' },
  { value: 'improve_endurance', label: 'Improve endurance' },
  { value: 'stay_fit', label: 'Stay fit' },
];

// Describe a single set based on its exercise metric type.
export function describeSet(set, metricType) {
  switch (metricType) {
    case 'reps_weight':
      return `${set.reps ?? 0} × ${Number(set.weightKg) || 0} kg`;
    case 'reps':
      return `${set.reps ?? 0} reps`;
    case 'duration':
      return formatDuration(set.durationSec);
    case 'distance':
      return `${formatDistance(set.distanceM)}${set.durationSec ? ` · ${formatDuration(set.durationSec)}` : ''}`;
    default:
      return '';
  }
}
