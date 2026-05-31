import bcrypt from 'bcryptjs';
import { query } from '../../db/pool.js';
import ApiError from '../../utils/ApiError.js';
import { signToken } from '../../utils/token.js';

/** Shape the public user object (never leak the password hash). */
function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    fitnessGoal: row.fitness_goal,
    xp: row.xp,
    level: row.level,
    createdAt: row.created_at,
  };
}

export async function register({ name, email, password, fitnessGoal }) {
  const existing = await query('SELECT id FROM users WHERE email = :email', { email });
  if (existing.length) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (name, email, password_hash, fitness_goal)
     VALUES (:name, :email, :hash, :goal)`,
    { name, email, hash: passwordHash, goal: fitnessGoal || 'stay_fit' }
  );

  const [user] = await query('SELECT * FROM users WHERE id = :id', { id: result.insertId });
  const token = signToken(user);
  return { user: publicUser(user), token };
}

export async function login({ email, password }) {
  const [user] = await query('SELECT * FROM users WHERE email = :email', { email });
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = signToken(user);
  return { user: publicUser(user), token };
}

export async function getById(id) {
  const [user] = await query('SELECT * FROM users WHERE id = :id', { id });
  if (!user) throw ApiError.notFound('User not found');
  return publicUser(user);
}
