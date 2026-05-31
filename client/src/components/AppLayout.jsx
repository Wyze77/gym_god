import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  IconDashboard, IconPlus, IconList, IconLibrary, IconChart,
  IconTarget, IconTrophy, IconUser, IconLogout, IconDumbbell,
} from './icons.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/log', label: 'Log Workout', icon: IconPlus },
  { to: '/workouts', label: 'Workouts', icon: IconList },
  { to: '/exercises', label: 'Exercises', icon: IconLibrary },
  { to: '/progress', label: 'Progress', icon: IconChart },
  { to: '/goals', label: 'Goals', icon: IconTarget },
  { to: '/achievements', label: 'Achievements', icon: IconTrophy },
  { to: '/profile', label: 'Profile', icon: IconUser },
];

// Condensed nav for the mobile bottom bar.
const MOBILE_NAV = NAV.filter((n) =>
  ['/', '/log', '/workouts', '/progress', '/profile'].includes(n.to)
);

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'U';
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><IconDumbbell width={22} height={22} stroke="#fff" /></div>
          <div className="brand-name">Fit<span>Sync</span></div>
        </div>

        <nav className="nav">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="nav-link">
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-chip">
            <div className="avatar">{initials(user?.name)}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <div className="faint" style={{ fontSize: 12 }}>Level {user?.level || 1}</div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Log out" aria-label="Log out">
              <IconLogout width={17} height={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <div className="content">{children}</div>
      </div>

      <nav className="mobile-nav">
        {MOBILE_NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
