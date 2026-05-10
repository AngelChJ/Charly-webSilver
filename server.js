import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pkg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'charly-super-secreto-2026';

// PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Middleware
app.use(cors());
app.use(express.json());

// Verificar conexión a BD
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Conectado a PostgreSQL'))
  .catch(err => console.error('❌ Error de conexión:', err.message));

// Middleware de autenticación
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Middleware solo coach
function coachOnly(req, res, next) {
  if (req.user.role !== 'coach' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No tienes permisos' });
  }
  next();
}

// === RUTAS ===

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = jwt.sign(
      { id: rows[0].id, email: rows[0].email, role: rows[0].role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: rows[0].id, name: rows[0].name, email: rows[0].email, role: rows[0].role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar atleta
app.post('/api/athletes', auth, coachOnly, async (req, res) => {
  try {
    const { email, password, name, planMonths, planType } = req.body;
    const hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password, role, plan_type) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, email, hash, 'athlete', planType || 'premium']
    );

    const userId = rows[0].id;
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (planMonths || 1));

    await pool.query('INSERT INTO subscriptions (user_id, end_date) VALUES ($1, $2)',
      [userId, endDate.toISOString().split('T')[0]]);

    res.json({ success: true, user_id: userId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Listar atletas
app.get('/api/athletes', auth, coachOnly, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT u.*, s.end_date as sub_end, s.is_active as sub_active
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id AND s.is_active = true
    WHERE u.role = 'athlete'
    ORDER BY u.name
  `);
  res.json(rows);
});

// Perfil
app.get('/api/profile', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, age, weight_kg, height_cm, gender, goal, plan_type FROM users WHERE id = $1',
    [req.user.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(rows[0]);
});

app.put('/api/profile', auth, async (req, res) => {
  const { weight_kg, goal, age, height_cm } = req.body;
  await pool.query(
    'UPDATE users SET weight_kg = COALESCE($1, weight_kg), goal = COALESCE($2, goal), age = COALESCE($3, age), height_cm = COALESCE($4, height_cm) WHERE id = $5',
    [weight_kg, goal, age, height_cm, req.user.id]
  );
  res.json({ success: true });
});

// Ejercicios
app.get('/api/exercises', auth, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT e.*, ef.name as focus_name FROM exercises e
    LEFT JOIN exercise_focus ef ON e.focus_id = ef.id
    ORDER BY e.name
  `);
  res.json(rows);
});

app.post('/api/exercises', auth, coachOnly, async (req, res) => {
  const { name, description, focus_id, video_url } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO exercises (name, description, focus_id, video_url) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, description, focus_id, video_url]
  );
  res.json({ success: true, id: rows[0].id });
});

app.put('/api/exercises/:id', auth, coachOnly, async (req, res) => {
  const { name, description, focus_id, video_url } = req.body;
  await pool.query(
    'UPDATE exercises SET name = $1, description = $2, focus_id = $3, video_url = $4 WHERE id = $5',
    [name, description, focus_id, video_url, req.params.id]
  );
  res.json({ success: true });
});

app.delete('/api/exercises/:id', auth, coachOnly, async (req, res) => {
  await pool.query('DELETE FROM exercises WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// Rutinas (Workout Plans)
app.get('/api/workout', auth, async (req, res) => {
  try {
    const { rows: plans } = await pool.query(
      'SELECT * FROM workout_plans WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    if (plans.length === 0) return res.json(null);

    const { rows: days } = await pool.query(
      'SELECT * FROM plan_days WHERE plan_id = $1 ORDER BY sort_order',
      [plans[0].id]
    );

    const daysWithExercises = await Promise.all(days.map(async (day) => {
      const { rows: exercises } = await pool.query(
        `SELECT pe.*, e.name, e.description, e.video_url, e.focus_id 
         FROM plan_exercises pe 
         JOIN exercises e ON pe.exercise_id = e.id 
         WHERE pe.day_id = $1 
         ORDER BY pe.sort_order`,
        [day.id]
      );
      return { ...day, exercises };
    }));

    res.json({ ...plans[0], days: daysWithExercises });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workout', auth, coachOnly, async (req, res) => {
  const { user_id, name, days } = req.body;

  try {
    await pool.query('UPDATE workout_plans SET is_active = false WHERE user_id = $1 AND is_active = true', [user_id]);

    const { rows: planRows } = await pool.query(
      'INSERT INTO workout_plans (user_id, name) VALUES ($1, $2) RETURNING id',
      [user_id, name]
    );
    const planId = planRows[0].id;

    for (const day of days) {
      const { rows: dayRows } = await pool.query(
        'INSERT INTO plan_days (plan_id, day_label, sort_order) VALUES ($1, $2, $3) RETURNING id',
        [planId, day.day_label, day.sort_order]
      );

      for (const ex of day.exercises) {
        await pool.query(
          'INSERT INTO plan_exercises (day_id, exercise_id, sets, reps, rest_seconds, sort_order) VALUES ($1, $2, $3, $4, $5, $6)',
          [dayRows[0].id, ex.exercise_id, ex.sets, ex.reps, ex.rest_seconds, ex.sort_order]
        );
      }
    }

    res.json({ success: true, plan_id: planId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sesiones
app.post('/api/sessions', auth, async (req, res) => {
  const { routine_name, exercises, total_volume, date } = req.body;
  await pool.query(
    'INSERT INTO workout_sessions (user_id, routine_name, exercises, total_volume, date) VALUES ($1, $2, $3, $4, $5)',
    [req.user.id, routine_name, JSON.stringify(exercises), total_volume, date || new Date().toISOString().split('T')[0]]
  );
  res.json({ success: true });
});

app.get('/api/sessions', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM workout_sessions WHERE user_id = $1 ORDER BY date DESC',
    [req.user.id]
  );
  res.json(rows);
});

// Suscripciones
app.post('/api/subscriptions', auth, coachOnly, async (req, res) => {
  const { user_id, end_date, plan_type } = req.body;
  await pool.query('UPDATE subscriptions SET is_active = false WHERE user_id = $1 AND is_active = true', [user_id]);
  await pool.query('INSERT INTO subscriptions (user_id, end_date) VALUES ($1, $2)', [user_id, end_date]);
  if (plan_type) {
    await pool.query('UPDATE users SET plan_type = $1 WHERE id = $2', [plan_type, user_id]);
  }
  res.json({ success: true });
});

// Servir frontend
app.use(express.static(join(__dirname, 'dist')));
app.get('/{*path}', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});