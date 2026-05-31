import { query } from '../../db/pool.js';
import ApiError from '../../utils/ApiError.js';

export async function updateProfile(userId, data) {
  const fields = [];
  const params = { id: userId };

  const map = {
    name: 'name',
    heightCm: 'height_cm',
    weightKg: 'weight_kg',
    fitnessGoal: 'fitness_goal',
  };

  for (const [key, column] of Object.entries(map)) {
    if (data[key] !== undefined) {
      fields.push(`${column} = :${key}`);
      params[key] = data[key];
    }
  }

  if (!fields.length) throw ApiError.badRequest('No valid fields to update');

  await query(`UPDATE users SET ${fields.join(', ')} WHERE id = :id`, params);

  const [user] = await query('SELECT * FROM users WHERE id = :id', { id: userId });
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    heightCm: user.height_cm,
    weightKg: user.weight_kg,
    fitnessGoal: user.fitness_goal,
    xp: user.xp,
    level: user.level,
  };
}

export async function listBodyMetrics(userId) {
  return query(
    `SELECT id, recorded_on AS recordedOn, weight_kg AS weightKg,
            body_fat_pct AS bodyFatPct, notes
     FROM body_metrics
     WHERE user_id = :userId
     ORDER BY recorded_on ASC`,
    { userId }
  );
}

export async function addBodyMetric(userId, data) {
  const recordedOn = data.recordedOn || new Date().toISOString().slice(0, 10);

  // Upsert: one record per day per user.
  await query(
    `INSERT INTO body_metrics (user_id, recorded_on, weight_kg, body_fat_pct, notes)
     VALUES (:userId, :recordedOn, :weightKg, :bodyFatPct, :notes)
     ON DUPLICATE KEY UPDATE
       weight_kg = VALUES(weight_kg),
       body_fat_pct = VALUES(body_fat_pct),
       notes = VALUES(notes)`,
    {
      userId,
      recordedOn,
      weightKg: data.weightKg,
      bodyFatPct: data.bodyFatPct ?? null,
      notes: data.notes ?? null,
    }
  );

  // Keep the user's current weight in sync with the latest metric.
  await query('UPDATE users SET weight_kg = :w WHERE id = :id', {
    w: data.weightKg,
    id: userId,
  });

  const [row] = await query(
    `SELECT id, recorded_on AS recordedOn, weight_kg AS weightKg,
            body_fat_pct AS bodyFatPct, notes
     FROM body_metrics WHERE user_id = :userId AND recorded_on = :recordedOn`,
    { userId, recordedOn }
  );
  return row;
}
