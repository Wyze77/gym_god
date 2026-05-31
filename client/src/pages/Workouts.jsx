import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { Card, Button, Spinner, EmptyState } from '../components/ui.jsx';
import { IconPlus, IconDumbbell, IconClock } from '../components/icons.jsx';
import { formatVolume, relativeDay } from '../utils/format.js';

const PAGE = 20;

export default function Workouts() {
  const toast = useToast();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = (offset = 0) => {
    const setter = offset === 0 ? setLoading : setLoadingMore;
    setter(true);
    api.get(`/workouts?limit=${PAGE}&offset=${offset}`)
      .then((d) => {
        setWorkouts((prev) => (offset === 0 ? d.workouts : [...prev, ...d.workouts]));
        setTotal(d.total);
      })
      .catch((err) => toast.error('Could not load workouts', err.message))
      .finally(() => setter(false));
  };

  useEffect(() => { load(0); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Spinner page />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Workout history</h1>
          <p className="page-sub">{total} workout{total === 1 ? '' : 's'} logged so far. Tap one for details.</p>
        </div>
        <Button onClick={() => navigate('/log')}><IconPlus width={18} height={18} /> Log workout</Button>
      </div>

      {workouts.length === 0 ? (
        <Card>
          <EmptyState
            emoji="🏋️"
            title="No workouts yet"
            message="Your logged sessions will appear here. Start your first one!"
            action={<Button onClick={() => navigate('/log')}><IconPlus width={18} height={18} /> Log a workout</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-2">
          {workouts.map((w) => (
            <Link to={`/workouts/${w.id}`} key={w.id}>
              <Card style={{ cursor: 'pointer' }}>
                <div className="flex between center mb">
                  <div className="flex center gap-sm">
                    <div className="stat-icon" style={{ margin: 0, width: 38, height: 38, fontSize: 16 }}>
                      <IconDumbbell width={18} height={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{w.title}</div>
                      <div className="muted" style={{ fontSize: 12.5 }}>{relativeDay(w.performedAt)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontWeight: 700 }}>{formatVolume(w.volume)}</div>
                    <div className="faint" style={{ fontSize: 12 }}>volume</div>
                  </div>
                </div>
                <div className="flex gap wrap" style={{ fontSize: 13 }}>
                  <span className="chip">{w.exerciseCount} exercises</span>
                  <span className="chip">{w.setCount} sets</span>
                  {w.durationMin ? (
                    <span className="chip"><IconClock width={13} height={13} /> {w.durationMin} min</span>
                  ) : null}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {workouts.length < total && (
        <div className="flex center" style={{ justifyContent: 'center', marginTop: 22 }}>
          <Button variant="ghost" onClick={() => load(workouts.length)} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </>
  );
}
