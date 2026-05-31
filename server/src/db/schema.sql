-- =====================================================================
-- FitSync MySQL schema
-- A clean, normalized schema for a fitness tracking MVP.
-- Safe to re-run: drops and recreates all tables.
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS user_badges;
DROP TABLE IF EXISTS badges;
DROP TABLE IF EXISTS workout_sets;
DROP TABLE IF EXISTS workout_exercises;
DROP TABLE IF EXISTS workouts;
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS body_metrics;
DROP TABLE IF EXISTS exercises;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(80)  NOT NULL,
  email           VARCHAR(160) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  height_cm       DECIMAL(5,1) NULL,
  weight_kg       DECIMAL(5,1) NULL,
  fitness_goal    ENUM('lose_weight','build_muscle','stay_fit','gain_strength','improve_endurance') NOT NULL DEFAULT 'stay_fit',
  xp              INT NOT NULL DEFAULT 0,
  level           INT NOT NULL DEFAULT 1,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Exercises (shared library + optional user-created custom exercises)
-- metric_type drives which set fields are relevant in the UI:
--   reps_weight -> reps + weight_kg   (e.g. bench press)
--   reps        -> reps only          (e.g. push-ups)
--   duration    -> duration_sec       (e.g. plank)
--   distance    -> distance_m + duration_sec (e.g. running)
-- ---------------------------------------------------------------------
CREATE TABLE exercises (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(120) NOT NULL,
  category     ENUM('strength','cardio','core','mobility') NOT NULL DEFAULT 'strength',
  muscle_group VARCHAR(60)  NOT NULL DEFAULT 'full_body',
  equipment    VARCHAR(60)  NOT NULL DEFAULT 'bodyweight',
  metric_type  ENUM('reps_weight','reps','duration','distance') NOT NULL DEFAULT 'reps_weight',
  description  VARCHAR(500) NULL,
  created_by   INT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_exercise_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_exercise_category (category),
  INDEX idx_exercise_muscle (muscle_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Workouts (a logged training session)
-- ---------------------------------------------------------------------
CREATE TABLE workouts (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  title        VARCHAR(120) NOT NULL DEFAULT 'Workout',
  notes        VARCHAR(500) NULL,
  performed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  duration_min INT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_workout_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_workout_user_date (user_id, performed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Workout exercises (an exercise within a workout, ordered)
-- ---------------------------------------------------------------------
CREATE TABLE workout_exercises (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  workout_id  INT NOT NULL,
  exercise_id INT NOT NULL,
  position    INT NOT NULL DEFAULT 0,
  notes       VARCHAR(255) NULL,
  CONSTRAINT fk_we_workout  FOREIGN KEY (workout_id)  REFERENCES workouts(id)  ON DELETE CASCADE,
  CONSTRAINT fk_we_exercise FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
  INDEX idx_we_workout (workout_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Workout sets (individual sets for a workout exercise)
-- ---------------------------------------------------------------------
CREATE TABLE workout_sets (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  workout_exercise_id INT NOT NULL,
  set_number          INT NOT NULL DEFAULT 1,
  reps                INT NULL,
  weight_kg           DECIMAL(6,2) NULL,
  duration_sec        INT NULL,
  distance_m          INT NULL,
  completed           BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_set_we FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE,
  INDEX idx_set_we (workout_exercise_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Goals
-- ---------------------------------------------------------------------
CREATE TABLE goals (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  type          ENUM('workouts_per_week','target_weight','total_volume','streak_days') NOT NULL,
  title         VARCHAR(120) NOT NULL,
  target_value  DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit          VARCHAR(20) NOT NULL DEFAULT '',
  status        ENUM('active','completed','archived') NOT NULL DEFAULT 'active',
  due_date      DATE NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_goal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_goal_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Body metrics (weight / body-fat tracking over time)
-- ---------------------------------------------------------------------
CREATE TABLE body_metrics (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  recorded_on  DATE NOT NULL,
  weight_kg    DECIMAL(5,1) NULL,
  body_fat_pct DECIMAL(4,1) NULL,
  notes        VARCHAR(255) NULL,
  CONSTRAINT fk_metric_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_metric_user_day (user_id, recorded_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Badges (achievement definitions) + user_badges (earned records)
-- criteria_type is evaluated by the gamification service:
--   total_workouts, streak_days, total_volume, distinct_exercises, level
-- ---------------------------------------------------------------------
CREATE TABLE badges (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(60) NOT NULL UNIQUE,
  name          VARCHAR(80) NOT NULL,
  description   VARCHAR(255) NOT NULL,
  tier          ENUM('bronze','silver','gold') NOT NULL DEFAULT 'bronze',
  criteria_type ENUM('total_workouts','streak_days','total_volume','distinct_exercises','level') NOT NULL,
  criteria_value INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_badges (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT NOT NULL,
  badge_id  INT NOT NULL,
  earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ub_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_ub_badge FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_badge (user_id, badge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
