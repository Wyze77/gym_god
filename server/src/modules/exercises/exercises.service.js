import { query } from '../../db/pool.js';
import ApiError from '../../utils/ApiError.js';

function mapExercise(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    muscleGroup: row.muscle_group,
    equipment: row.equipment,
    metricType: row.metric_type,
    description: row.description,
    isCustom: row.created_by != null,
  };
}

/**
 * List exercises visible to a user: the shared library plus their own
 * custom exercises. Supports filtering by category, muscle group and search.
 */
export async function list(userId, filters = {}) {
  const conditions = ['(created_by IS NULL OR created_by = :userId)'];
  const params = { userId };

  if (filters.category) {
    conditions.push('category = :category');
    params.category = filters.category;
  }
  if (filters.muscleGroup) {
    conditions.push('muscle_group = :muscleGroup');
    params.muscleGroup = filters.muscleGroup;
  }
  if (filters.search) {
    conditions.push('name LIKE :search');
    params.search = `%${filters.search}%`;
  }

  const rows = await query(
    `SELECT * FROM exercises
     WHERE ${conditions.join(' AND ')}
     ORDER BY category, name`,
    params
  );
  return rows.map(mapExercise);
}

export async function getById(userId, id) {
  const [row] = await query(
    `SELECT * FROM exercises
     WHERE id = :id AND (created_by IS NULL OR created_by = :userId)`,
    { id, userId }
  );
  if (!row) throw ApiError.notFound('Exercise not found');
  return mapExercise(row);
}

export async function create(userId, data) {
  const result = await query(
    `INSERT INTO exercises (name, category, muscle_group, equipment, metric_type, description, created_by)
     VALUES (:name, :category, :muscleGroup, :equipment, :metricType, :description, :userId)`,
    {
      name: data.name,
      category: data.category,
      muscleGroup: data.muscleGroup,
      equipment: data.equipment,
      metricType: data.metricType,
      description: data.description ?? null,
      userId,
    }
  );
  return getById(userId, result.insertId);
}
