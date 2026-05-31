// Standalone API smoke test (run against a live server on :4000).
const BASE = 'http://localhost:4000/api';
let pass = 0, fail = 0;
const ok = (cond, label) => { (cond ? pass++ : fail++); console.log(`${cond ? '✓' : '✗'} ${label}`); };

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => ({}));
  return { status: res.status, data };
}

const r = await call('GET', '/health');
ok(r.status === 200 && r.data.status === 'ok', `health -> ${r.status}`);

const login = await call('POST', '/auth/login', { email: 'demo@fitsync.app', password: 'demo1234' });
ok(login.status === 200 && login.data.token, `login demo -> ${login.status}`);
const token = login.data.token;

const reg = await call('POST', '/auth/register', { name: 'Test User', email: `t${Date.now()}@fitsync.app`, password: 'secret123', fitnessGoal: 'lose_weight' });
ok(reg.status === 201 && reg.data.token, `register -> ${reg.status}`);

const badLogin = await call('POST', '/auth/login', { email: 'demo@fitsync.app', password: 'wrong' });
ok(badLogin.status === 401, `wrong password -> ${badLogin.status} (expect 401)`);

const dash = await call('GET', '/stats/dashboard', null, token);
ok(dash.status === 200 && dash.data.summary.totalWorkouts > 0, `dashboard workouts=${dash.data.summary?.totalWorkouts} streak=${dash.data.summary?.currentStreak}`);

const ex = await call('GET', '/exercises', null, token);
ok(ex.status === 200 && ex.data.exercises.length === 30, `exercises -> ${ex.data.exercises?.length} (expect 30)`);

const exId = ex.data.exercises[0].id;
const create = await call('POST', '/workouts', {
  title: 'Smoke Test Workout', durationMin: 40,
  exercises: [{ exerciseId: exId, sets: [{ reps: 10, weightKg: 60 }, { reps: 8, weightKg: 65 }] }],
}, token);
ok(create.status === 201 && create.data.feedback.xpGained > 0,
  `create workout -> ${create.status} vol=${create.data.workout?.volume} +${create.data.feedback?.xpGained}XP newBadges=${create.data.feedback?.newBadges?.length}`);

const detail = await call('GET', `/workouts/${create.data.workout.id}`, null, token);
ok(detail.status === 200 && detail.data.workout.exercises.length === 1, `workout detail -> ${detail.status}`);

const goals = await call('GET', '/goals', null, token);
ok(goals.status === 200 && goals.data.goals.length >= 1, `goals -> ${goals.data.goals?.length}`);
goals.data.goals.forEach((g) => console.log(`    • ${g.title}: ${g.currentValue}/${g.targetValue} ${g.unit} (${g.progressPct}%)`));

const newGoal = await call('POST', '/goals', { type: 'streak_days', title: 'Hit 5-day streak', targetValue: 5 }, token);
ok(newGoal.status === 201, `create goal -> ${newGoal.status}`);

const badges = await call('GET', '/gamification/badges', null, token);
ok(badges.status === 200 && badges.data.total === 10, `badges -> ${badges.data.earnedCount}/${badges.data.total}`);

const prog = await call('GET', '/stats/progress', null, token);
ok(prog.status === 200, `progress: vol=${prog.data.volumeTrend?.length} freq=${prog.data.weeklyFrequency?.length} muscle=${prog.data.muscleSplit?.length} PR=${prog.data.personalRecords?.length} body=${prog.data.bodyMetrics?.length}`);

const metric = await call('POST', '/users/me/metrics', { weightKg: 78.9, bodyFatPct: 17.5 }, token);
ok(metric.status === 201, `log body metric -> ${metric.status}`);

const badWorkout = await call('POST', '/workouts', { title: 'bad', exercises: [] }, token);
ok(badWorkout.status === 400, `empty workout -> ${badWorkout.status} (expect 400)`);

const noAuth = await call('GET', '/stats/dashboard');
ok(noAuth.status === 401, `no-auth dashboard -> ${noAuth.status} (expect 401)`);

console.log(`\n${fail === 0 ? '🎉 ALL PASSED' : '❌ SOME FAILED'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
