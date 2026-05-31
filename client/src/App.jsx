import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { Spinner } from './components/ui.jsx';
import AppLayout from './components/AppLayout.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LogWorkout from './pages/LogWorkout.jsx';
import Workouts from './pages/Workouts.jsx';
import WorkoutDetail from './pages/WorkoutDetail.jsx';
import Exercises from './pages/Exercises.jsx';
import Progress from './pages/Progress.jsx';
import Goals from './pages/Goals.jsx';
import Achievements from './pages/Achievements.jsx';
import Profile from './pages/Profile.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner page />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <AppLayout>{children}</AppLayout>;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner page />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/log" element={<Protected><LogWorkout /></Protected>} />
      <Route path="/workouts" element={<Protected><Workouts /></Protected>} />
      <Route path="/workouts/:id" element={<Protected><WorkoutDetail /></Protected>} />
      <Route path="/exercises" element={<Protected><Exercises /></Protected>} />
      <Route path="/progress" element={<Protected><Progress /></Protected>} />
      <Route path="/goals" element={<Protected><Goals /></Protected>} />
      <Route path="/achievements" element={<Protected><Achievements /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
