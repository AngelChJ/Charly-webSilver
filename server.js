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

// Crear tablas
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'athlete',
        age INTEGER,
        weight_kg NUMERIC(5,1),
        height_cm NUMERIC(5,1),
        gender TEXT,
        goal TEXT DEFAULT 'muscle_gain',
        plan_type TEXT DEFAULT 'premium',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        start_date DATE DEFAULT CURRENT_DATE,
        end_date DATE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS exercise_focus (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS exercises (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        focus_id INTEGER REFERENCES exercise_focus(id),
        video_url TEXT
      );

      CREATE TABLE IF NOT EXISTS workout_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        routine_name TEXT NOT NULL,
        date DATE DEFAULT CURRENT_DATE,
        exercises JSONB NOT NULL,
        total_volume NUMERIC DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Datos iniciales
    const { rows: focuses } = await pool.query('SELECT COUNT(*) as count FROM exercise_focus');
    if (parseInt(focuses[0].count) === 0) {
      await pool.query(`
        INSERT INTO exercise_focus (name) VALUES 
        ('Pecho'), ('Espalda'), ('Pierna'), ('Bíceps'), ('Tríceps'), ('Hombro'), ('Abdominales'), ('Cardio');
        
        INSERT INTO exercises (name, description, focus_id) VALUES 
        ('Press de Banca', 'Acostado en banco plano, baja la barra al pecho y empuja hacia arriba.', 1),
        ('Press Inclinado', 'Banco a 45°, empuja las mancuernas desde los hombros.', 1),
        ('Aperturas con Mancuernas', 'Acostado en banco plano, abre los brazos y junta las mancuernas.', 1),
        ('Peso Muerto', 'Barra en el suelo, espalda recta, levanta hasta la cadera.', 2),
        ('Dominadas', 'Agarre prono, tira hasta que la barbilla pase la barra.', 2),
        ('Remo con Barra', 'Inclinado, jala la barra hacia el abdomen.', 2),
        ('Sentadilla', 'Barra sobre hombros, baja hasta muslos paralelos al suelo.', 3),
        ('Prensa de Pierna', 'Empuja la plataforma hasta extender rodillas.', 3),
        ('Zancadas', 'Paso adelante, baja rodilla trasera sin tocar el suelo.', 3),
        ('Curl con Barra', 'De pie, flexiona los codos llevando la barra a los hombros.', 4),
        ('Martillos', 'De pie, flexiona codos con mancuernas en posición neutra.', 4),
        ('Extensión de Tríceps', 'Empuja la cuerda hacia abajo extendiendo codos.', 5),
        ('Press Militar', 'Empuja la barra desde los hombros hacia arriba.', 6),
        ('Elevaciones Laterales', 'Eleva mancuernas lateralmente hasta altura de hombros.', 6);
      `);
    }

    // Crear coach por defecto si no existe
    const { rows: coach } = await pool.query('SELECT id FROM users WHERE email = $1', ['angelchj@test.com']);
    if (coach.length === 0) {
      const hash = await bcrypt.hash('123456', 10);
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
        ['Angel Charly', 'angelchj@test.com', hash, 'coach']
      );
    }

    console.log('✅ Base de datos inicializada');
  } catch (err) {
    console.error('❌ Error al inicializar BD:', err.message);
  }
}

initDB();

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
      user: {
        id: rows[0].id,
        name: rows[0].name,
        email: rows[0].email,
        role: rows[0].role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar atleta (coach)
app.post('/api/athletes', auth, async (req, res) => {
  if (req.user.role !== 'coach' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No tienes permisos' });
  }

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

    await pool.query(
      'INSERT INTO subscriptions (user_id, end_date) VALUES ($1, $2)',
      [userId, endDate.toISOString().split('T')[0]]
    );

    res.json({ success: true, user_id: userId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Listar atletas (coach)
app.get('/api/athletes', auth, async (req, res) => {
  if (req.user.role !== 'coach' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No tienes permisos' });
  }

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

app.post('/api/exercises', auth, async (req, res) => {
  if (req.user.role !== 'coach' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No tienes permisos' });
  }
  const { name, description, focus_id, video_url } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO exercises (name, description, focus_id, video_url) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, description, focus_id, video_url]
  );
  res.json({ success: true, id: rows[0].id });
});

app.put('/api/exercises/:id', auth, async (req, res) => {
  if (req.user.role !== 'coach' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No tienes permisos' });
  }
  const { name, description, focus_id, video_url } = req.body;
  await pool.query(
    'UPDATE exercises SET name = $1, description = $2, focus_id = $3, video_url = $4 WHERE id = $5',
    [name, description, focus_id, video_url, req.params.id]
  );
  res.json({ success: true });
});

app.delete('/api/exercises/:id', auth, async (req, res) => {
  if (req.user.role !== 'coach' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No tienes permisos' });
  }
  await pool.query('DELETE FROM exercises WHERE id = $1', [req.params.id]);
  res.json({ success: true });
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
app.post('/api/subscriptions', auth, async (req, res) => {
  if (req.user.role !== 'coach' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No tienes permisos' });
  }
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