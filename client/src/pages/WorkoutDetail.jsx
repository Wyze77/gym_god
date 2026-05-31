import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { Card, Button, Spinner, Modal, CategoryPill } from '../components/ui.jsx';
import { IconArrowLeft, IconTrash, IconClock, IconDumbbell } from '../components/icons.jsx';
import { formatDateTime, formatVolume, describeSet } from '../utils/format.js';

export default function WorkoutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get(`/workouts/${id}`)
      .then((d) => setWorkout(d.workout))
      .catch((err) => {
        toast.error('Could not load workout', err.message);
        navigate('/workouts');
      })
      .finally(() => setLoading(false));
  }, [id, navigate, toast]);

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/workouts/${id}`);
      toast.success('Workout deleted');
      navigate('/workouts');
    } catch (err) {
      toast.error('Could not delete', err.message);
      setDeleting(false);
    }
  };

  if (loading) return <Spinner page />;
  if (!workout) return null;

  const totalSets = workout.exercises.reduce((n, e) => n + e.sets.length, 0);

  return (
    <>
      <button className="btn btn-ghost btn-sm mb" onClick={() => navigate('/workouts')}>
        <IconArrowLeft width={16} height={16} /> Back to history
      </button>

      <div className="page-head">
        <div>
          <h1 className="page-title">{workout.title}</h1>
          <p className="page-sub">{formatDateTime(workout.performedAt)}</p>
        </div>
        <Button variant="danger" onClick={() => setConfirm(true)}>
          <IconTrash width={16} height={16} /> Delete
        </Button>
      </div>

      <div className="grid grid-stats mb">
        <Card><div className="stat-value" style={{ fontSize: 24 }}>{formatVolume(workout.volume)}</div><div className="stat-label">Total volume</div></Card>
        <Card><div className="stat-value" style={{ fontSize: 24 }}>{workout.exercises.length}</div><div className="stat-label">Exercises</div></Card>
        <Card><div className="stat-value" style={{ fontSize: 24 }}>{totalSets}</div><div className="stat-label">Sets</div></Card>
        {workout.durationMin ? (
          <Card><div className="stat-value" style={{ fontSize: 24 }}>{workout.durationMin}<span style={{ fontSize: 15 }}> min</span></div><div className="stat-label">Duration</div></Card>
        ) : null}
      </div>

      {workout.notes && (
        <Card className="mb"><div className="muted" style={{ fontSize: 14 }}>📝 {workout.notes}</div></Card>
      )}

      <div className="grid" style={{ gap: 14 }}>
        {workout.exercises.map((ex) => (
          <Card key={ex.workoutExerciseId}>
            <div className="card-head" style={{ marginBottom: 14 }}>
              <div className="flex center gap-sm">
                <div className="stat-icon" style={{ margin: 0, width: 34, height: 34, fontSize: 15 }}>
                  <IconDumbbell width={17} height={17} />
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{ex.name}</div>
                  <CategoryPill category={ex.category} />
                </div>
              </div>
              <span className="muted" style={{ fontSize: 13 }}>{ex.sets.length} sets</span>
            </div>
            <div className="grid" style={{ gap: 6 }}>
              {ex.sets.map((s) => (
                <div key={s.id} className="flex center gap-sm" style={{ fontSize: 14 }}>
                  <span className="chip" style={{ minWidth: 36, justifyContent: 'center' }}>{s.setNumber}</span>
                  <span style={{ fontWeight: 600 }}>{describeSet(s, ex.metricType)}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete this workout?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="danger" onClick={remove} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</Button>
          </>
        }
      >
        <p className="muted">This action can't be undone. Your stats and streak will update accordingly.</p>
      </Modal>
    </>
  );
}
