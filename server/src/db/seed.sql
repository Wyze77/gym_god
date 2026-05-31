-- Reference data: exercise library and badge definitions.
-- Demo user and sample workouts are inserted by seed.js (requires bcrypt).

-- ---------------------------------------------------------------------
-- Exercise library
-- ---------------------------------------------------------------------
INSERT INTO exercises (name, category, muscle_group, equipment, metric_type, description) VALUES
('Barbell Bench Press',   'strength', 'chest',      'barbell',   'reps_weight', 'Compound press building chest, shoulders and triceps.'),
('Incline Dumbbell Press','strength', 'chest',      'dumbbell',  'reps_weight', 'Targets the upper chest on an inclined bench.'),
('Push-up',               'strength', 'chest',      'bodyweight','reps',        'Classic bodyweight pressing movement.'),
('Barbell Back Squat',    'strength', 'legs',       'barbell',   'reps_weight', 'Compound lower-body movement targeting quads, hamstrings, and glutes.'),
('Goblet Squat',          'strength', 'legs',       'dumbbell',  'reps_weight', 'Beginner-friendly squat holding a single weight.'),
('Romanian Deadlift',     'strength', 'legs',       'barbell',   'reps_weight', 'Hip-hinge targeting hamstrings and glutes.'),
('Walking Lunge',         'strength', 'legs',       'dumbbell',  'reps_weight', 'Unilateral leg builder improving balance.'),
('Deadlift',              'strength', 'back',       'barbell',   'reps_weight', 'Full posterior-chain compound lift.'),
('Bent-over Row',         'strength', 'back',       'barbell',   'reps_weight', 'Horizontal pull for a thicker back.'),
('Lat Pulldown',          'strength', 'back',       'machine',   'reps_weight', 'Vertical pull targeting the lats.'),
('Pull-up',               'strength', 'back',       'bodyweight','reps',        'Bodyweight vertical pull.'),
('Overhead Press',        'strength', 'shoulders',  'barbell',   'reps_weight', 'Standing press for shoulder strength.'),
('Lateral Raise',         'strength', 'shoulders',  'dumbbell',  'reps_weight', 'Isolation for the side delts.'),
('Barbell Curl',          'strength', 'arms',       'barbell',   'reps_weight', 'Biceps isolation movement.'),
('Triceps Pushdown',      'strength', 'arms',       'machine',   'reps_weight', 'Cable isolation for triceps.'),
('Dumbbell Curl',         'strength', 'arms',       'dumbbell',  'reps_weight', 'Alternating biceps curl.'),
('Leg Press',             'strength', 'legs',       'machine',   'reps_weight', 'Machine-based quad and glute builder.'),
('Plank',                 'core',     'core',       'bodyweight','duration',    'Isometric core stability hold.'),
('Hanging Leg Raise',     'core',     'core',       'bodyweight','reps',        'Lower-ab focused hanging movement.'),
('Crunch',                'core',     'core',       'bodyweight','reps',        'Basic abdominal crunch.'),
('Russian Twist',         'core',     'core',       'bodyweight','reps',        'Rotational core exercise.'),
('Running',               'cardio',   'full_body',  'none',      'distance',    'Outdoor or treadmill running.'),
('Cycling',               'cardio',   'legs',       'machine',   'distance',    'Stationary or road cycling.'),
('Rowing Machine',        'cardio',   'full_body',  'machine',   'distance',    'Full-body cardio on the rower.'),
('Jump Rope',             'cardio',   'full_body',  'none',      'duration',    'High-intensity conditioning.'),
('Burpees',               'cardio',   'full_body',  'bodyweight','reps',        'Explosive full-body conditioning.'),
('Elliptical',            'cardio',   'full_body',  'machine',   'duration',    'Low-impact steady-state cardio.'),
('Cat-Cow Stretch',       'mobility', 'back',       'none',      'duration',    'Spinal mobility flow.'),
('Hip Flexor Stretch',    'mobility', 'legs',       'none',      'duration',    'Opens tight hip flexors.'),
('Shoulder Dislocates',   'mobility', 'shoulders',  'none',      'reps',        'Banded shoulder mobility drill.');

-- ---------------------------------------------------------------------
-- Badge definitions
-- ---------------------------------------------------------------------
INSERT INTO badges (code, name, description, tier, criteria_type, criteria_value) VALUES
('first_workout',   'First Step',       'Log your very first workout.',              'bronze', 'total_workouts',     1),
('ten_workouts',    'Getting Serious',  'Complete 10 workouts.',                     'silver', 'total_workouts',     10),
('fifty_workouts',  'Iron Will',        'Complete 50 workouts.',                     'gold',   'total_workouts',     50),
('streak_3',        'On a Roll',        'Reach a 3-day workout streak.',             'bronze', 'streak_days',        3),
('streak_7',        'Week Warrior',     'Reach a 7-day workout streak.',             'silver', 'streak_days',        7),
('streak_30',       'Unstoppable',      'Reach a 30-day workout streak.',            'gold',   'streak_days',        30),
('volume_5000',     'Heavy Lifter',     'Move 5,000 kg of total volume.',            'bronze', 'total_volume',       5000),
('volume_50000',    'Powerhouse',       'Move 50,000 kg of total volume.',           'gold',   'total_volume',       50000),
('explorer_10',     'Explorer',         'Try 10 different exercises.',               'silver', 'distinct_exercises', 10),
('level_5',         'Rising Star',      'Reach level 5.',                            'silver', 'level',              5);
