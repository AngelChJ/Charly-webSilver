import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pkg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 8080;

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET no está configurado. El servidor no puede iniciar.');
  process.exit(1);
}

const isDev = process.env.NODE_ENV === 'development';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// ==========================================
// MIDDLEWARE DE SEGURIDAD
// ==========================================

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[SECURITY] Intento de acceso desde origen no permitido: ${origin}`);
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Demasiadas peticiones. Intenta de nuevo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    console.warn(`[SECURITY] Rate limit alcanzado en /login - IP: ${req.ip}`);
    res.status(429).json({ error: 'Demasiados intentos. Intenta en 15 minutos.' });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados registros. Intenta en 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// CONEXIÓN A BD
// ==========================================
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Conectado a PostgreSQL'))
  .catch(err => console.error('❌ Error de conexión:', err.message));

// ==========================================
// MIDDLEWARE DE AUTENTICACIÓN (con caché)
// ==========================================
const userRoleCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    console.warn(`[SECURITY] Intento de acceso sin token - IP: ${req.ip}`);
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);

    const cached = userRoleCache.get(payload.id);
    if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
      req.user = { id: payload.id, email: payload.email, role: cached.role };
      return next();
    }

    const { rows } = await pool.query('SELECT id, role FROM users WHERE id = $1', [payload.id]);
    if (rows.length === 0) {
      userRoleCache.delete(payload.id);
      console.warn(`[SECURITY] Token de usuario eliminado - ID: ${payload.id}`);
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    userRoleCache.set(payload.id, { role: rows[0].role, ts: Date.now() });
    req.user = { id: payload.id, email: payload.email, role: rows[0].role };
    next();
  } catch (err) {
    console.warn(`[SECURITY] Token inválido - IP: ${req.ip}`);
    res.status(401).json({ error: 'Token inválido' });
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of userRoleCache.entries()) {
    if (now - val.ts > CACHE_TTL_MS) userRoleCache.delete(key);
  }
}, 60 * 60 * 1000);

function coachOnly(req, res, next) {
  if (req.user.role !== 'coach' && req.user.role !== 'admin') {
    console.warn(`[SECURITY] Acceso denegado a coach - User ID: ${req.user.id}, Role: ${req.user.role}`);
    return res.status(403).json({ error: 'No tienes permisos' });
  }
  next();
}

// ==========================================
// HELPERS
// ==========================================
function validateString(val, maxLen = 255) {
  return typeof val === 'string' && val.trim().length > 0 && val.length <= maxLen;
}

function validatePassword(password) {
  const regex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  return regex.test(password);
}

function safeError(err) {
  return isDev ? err.message : 'Error interno del servidor';
}

// ==========================================
// RUTAS
// ==========================================

// Login
app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      console.warn(`[SECURITY] Login fallido (no existe): ${email} - IP: ${req.ip}`);
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) {
      console.warn(`[SECURITY] Login fallido (contraseña): ${email} - IP: ${req.ip}`);
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: rows[0].id, email: rows[0].email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log(`[AUTH] Login exitoso: ${email} - ID: ${rows[0].id}`);
    res.json({
      token,
      user: { id: rows[0].id, name: rows[0].name, email: rows[0].email, role: rows[0].role },
    });
  } catch (err) {
    console.error('Error en login:', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

// Logout
app.post('/api/logout', auth, (req, res) => {
  console.log(`[AUTH] Logout: ${req.user.email}`);
  res.json({ success: true });
});

// Registrar atleta
app.post('/api/athletes', registerLimiter, auth, coachOnly, async (req, res) => {
  try {
    const { email, password, name, planMonths, planType } = req.body;

    if (!validateString(name, 100)) return res.status(400).json({ error: 'Nombre inválido' });
    if (!validateString(email, 255)) return res.status(400).json({ error: 'Email inválido' });
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, una letra y un número.' });
    }

    const hash = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password, role, plan_type) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name.trim(), email.toLowerCase().trim(), hash, 'athlete', planType || 'premium']
    );

    const userId = rows[0].id;
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (planMonths || 1));

    await pool.query('INSERT INTO subscriptions (user_id, end_date) VALUES ($1, $2)',
      [userId, endDate.toISOString().split('T')[0]]);

    console.log(`[AUDIT] Atleta creado por coach ${req.user.email}: ${name} (${email})`);
    res.json({ success: true, user_id: userId });
  } catch (err) {
    console.error('Error al crear atleta:', err.message);
    res.status(400).json({ error: safeError(err) });
  }
});

// Listar atletas
app.get('/api/athletes', auth, coachOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.*, s.end_date as sub_end, s.is_active as sub_active
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id AND s.is_active = true
      WHERE u.role = 'athlete'
      ORDER BY u.name
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error en GET /api/athletes:', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

// Perfil
app.get('/api/profile', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, age, weight_kg, height_cm, gender, goal, plan_type FROM users WHERE id = $1',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error en GET /api/profile:', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

app.put('/api/profile', auth, async (req, res) => {
  try {
    const { weight_kg, goal, age, height_cm } = req.body;
    await pool.query(
      'UPDATE users SET weight_kg = COALESCE($1, weight_kg), goal = COALESCE($2, goal), age = COALESCE($3, age), height_cm = COALESCE($4, height_cm) WHERE id = $5',
      [weight_kg, goal, age, height_cm, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error en PUT /api/profile:', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

// Cambiar contraseña
app.put('/api/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres, una letra y un número.' });
    }

    const { rows } = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.user.id]);

    console.log(`[AUDIT] Contraseña cambiada para user_id: ${req.user.id}`);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error en change-password:', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

// Ejercicios
app.get('/api/exercises', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT e.*, ef.name as focus_name FROM exercises e
      LEFT JOIN exercise_focus ef ON e.focus_id = ef.id
      ORDER BY e.name
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error en GET /api/exercises:', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

app.post('/api/exercises', auth, coachOnly, async (req, res) => {
  try {
    const { name, description, focus_id, video_url } = req.body;
    if (!validateString(name, 200)) return res.status(400).json({ error: 'Nombre inválido' });
    if (description && description.length > 500) return res.status(400).json({ error: 'Descripción demasiado larga' });
    if (video_url && !/^https?:\/\/.+/.test(video_url)) return res.status(400).json({ error: 'URL de video inválida' });

    const { rows } = await pool.query(
      'INSERT INTO exercises (name, description, focus_id, video_url) VALUES ($1, $2, $3, $4) RETURNING id',
      [name.trim(), description?.trim(), focus_id, video_url]
    );
    res.json({ success: true, id: rows[0].id });
  } catch (err) {
    console.error('Error en POST /api/exercises:', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

app.put('/api/exercises/:id', auth, coachOnly, async (req, res) => {
  try {
    const { name, description, focus_id, video_url } = req.body;
    if (!validateString(name, 200)) return res.status(400).json({ error: 'Nombre inválido' });

    await pool.query(
      'UPDATE exercises SET name = $1, description = $2, focus_id = $3, video_url = $4 WHERE id = $5',
      [name.trim(), description?.trim(), focus_id, video_url, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error en PUT /api/exercises:', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

app.delete('/api/exercises/:id', auth, coachOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM exercises WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error en DELETE /api/exercises:', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

// Rutinas
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
    console.error('Error en GET /api/workout:', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

app.post('/api/workout', auth, coachOnly, async (req, res) => {
  try {
    const { user_id, name, days } = req.body;
    if (!validateString(name, 200)) return res.status(400).json({ error: 'Nombre del plan inválido' });

    const { rows: targetUser } = await pool.query(
      'SELECT id, role FROM users WHERE id = $1',
      [user_id]
    );
    if (targetUser.length === 0 || targetUser[0].role !== 'athlete') {
      return res.status(400).json({ error: 'Usuario no encontrado o no es atleta' });
    }

    if (!Array.isArray(days) || days.length > 14) {
      return res.status(400).json({ error: 'El plan no puede tener más de 14 días' });
    }

    for (const day of days) {
      if (!validateString(day.day_label, 100) || !Array.isArray(day.exercises)) {
        return res.status(400).json({ error: 'Estructura de días inválida' });
      }
    }

    await pool.query('UPDATE workout_plans SET is_active = false WHERE user_id = $1 AND is_active = true', [user_id]);

    const { rows: planRows } = await pool.query(
      'INSERT INTO workout_plans (user_id, name) VALUES ($1, $2) RETURNING id',
      [user_id, name.trim()]
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
    console.error('Error en POST /api/workout:', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

app.get('/api/workout/:userId', auth, coachOnly, async (req, res) => {
  try {
    const { rows: plans } = await pool.query(
      'SELECT * FROM workout_plans WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
      [req.params.userId]
    );
    if (plans.length === 0) return res.json(null);

    const { rows: days } = await pool.query(
      'SELECT * FROM plan_days WHERE plan_id = $1 ORDER BY sort_order',
      [plans[0].id]
    );

    const daysWithExercises = await Promise.all(days.map(async (day) => {
      const { rows: exercises } = await pool.query(
        `SELECT pe.*, e.name FROM plan_exercises pe 
         JOIN exercises e ON pe.exercise_id = e.id 
         WHERE pe.day_id = $1 ORDER BY pe.sort_order`,
        [day.id]
      );
      return { ...day, exercises };
    }));

    res.json({ ...plans[0], days: daysWithExercises });
  } catch (err) {
    console.error('Error en GET /api/workout/:userId:', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

// Sesiones
app.post('/api/sessions', auth, async (req, res) => {
  try {
    const { routine_name, exercises, total_volume, date } = req.body;
    if (!validateString(routine_name, 200)) return res.status(400).json({ error: 'Nombre de rutina inválido' });

    if (!Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ error: 'Formato de ejercicios inválido' });
    }

    await pool.query(
      'INSERT INTO workout_sessions (user_id, routine_name, exercises, total_volume, date) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, routine_name.trim(), JSON.stringify(exercises), total_volume, date || new Date().toISOString().split('T')[0]]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error en POST /api/sessions:', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

app.get('/api/sessions', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM workout_sessions WHERE user_id = $1 ORDER BY date DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error en GET /api/sessions:', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

// Suscripciones
app.post('/api/subscriptions', auth, coachOnly, async (req, res) => {
  try {
    const { user_id, end_date, plan_type } = req.body;
    if (!end_date) return res.status(400).json({ error: 'Fecha de vencimiento requerida' });

    const { rows: targetUser } = await pool.query(
      'SELECT id, role FROM users WHERE id = $1',
      [user_id]
    );
    if (targetUser.length === 0 || targetUser[0].role !== 'athlete') {
      return res.status(400).json({ error: 'Usuario no encontrado o no es atleta' });
    }

    await pool.query('UPDATE subscriptions SET is_active = false WHERE user_id = $1 AND is_active = true', [user_id]);
    await pool.query('INSERT INTO subscriptions (user_id, end_date) VALUES ($1, $2)', [user_id, end_date]);
    if (plan_type) {
      await pool.query('UPDATE users SET plan_type = $1 WHERE id = $2', [plan_type, user_id]);
    }

    console.log(`[AUDIT] Suscripción actualizada por coach ${req.user.email}: user_id=${user_id}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Error en POST /api/subscriptions:', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

// ==========================================
// RECUPERACIÓN DE CONTRASEÑA
// ==========================================

app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const { rows } = await pool.query('SELECT id, name FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.json({ message: 'Si el email existe, recibirás un enlace de recuperación.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query('UPDATE password_resets SET used = true WHERE user_id = $1 AND used = false', [rows[0].id]);
    await pool.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [rows[0].id, token, expiresAt]
    );

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"Charly Coach" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Recuperación de contraseña - Charly Coach',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #BCC6CC; background: #080808; padding: 20px; text-align: center;">CHARLY COACH</h2>
          <div style="padding: 20px; background: #0a0a0a; color: #e8e8e8;">
            <p>Hola <strong>${rows[0].name}</strong>,</p>
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(180deg, #BCC6CC, #808080); color: #000; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">RESTABLECER CONTRASEÑA</a>
            </div>
            <p style="font-size: 12px; color: #666;">Este enlace expira en 15 minutos.</p>
          </div>
        </div>
      `,
    });

    console.log(`[AUTH] Recuperación solicitada: ${email}`);
    res.json({ message: 'Si el email existe, recibirás un enlace de recuperación.' });
  } catch (err) {
    console.error('[ERROR] forgot-password:', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

app.get('/api/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token requerido' });

    const { rows } = await pool.query(
      'SELECT id FROM password_resets WHERE token = $1 AND used = false AND expires_at > NOW()',
      [token]
    );

    res.json({ valid: rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token y contraseña requeridos' });
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, una letra y un número.' });
    }

    const { rows } = await pool.query(
      'SELECT id, user_id FROM password_resets WHERE token = $1 AND used = false AND expires_at > NOW()',
      [token]
    );
    if (rows.length === 0) return res.status(400).json({ error: 'Token inválido o expirado' });

    const hash = await bcrypt.hash(password, 12);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, rows[0].user_id]);
    await pool.query('UPDATE password_resets SET used = true WHERE id = $1', [rows[0].id]);

    console.log(`[AUTH] Contraseña restablecida para user_id: ${rows[0].user_id}`);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error en reset-password:', err.message);
    res.status(500).json({ error: safeError(err) });
  }
});

// ==========================================
// CRON JOBS
// ==========================================
cron.schedule('0 0 * * *', async () => {
  try {
    const { rows } = await pool.query(
      "UPDATE subscriptions SET is_active = false WHERE end_date < CURRENT_DATE AND is_active = true RETURNING user_id"
    );
    if (rows.length > 0) {
      console.log(`🔔 ${rows.length} suscripciones vencidas desactivadas:`, rows.map(r => r.user_id));
    }
  } catch (err) {
    console.error('❌ Error en cron (vencidas):', err.message);
  }
});

cron.schedule('0 8 * * *', async () => {
  try {
    const { rows } = await pool.query(
      `SELECT u.name, u.email, s.end_date 
       FROM subscriptions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.is_active = true 
       AND s.end_date = CURRENT_DATE + INTERVAL '7 days'`
    );
    if (rows.length > 0) {
      console.log(`⚠️ ${rows.length} suscripciones por vencer en 7 días:`);
      rows.forEach(r => console.log(`   - ${r.name} (${r.email}): ${r.end_date}`));
    }
  } catch (err) {
    console.error('❌ Error en cron (aviso):', err.message);
  }
});

console.log('⏰ Cron jobs iniciados');
console.log('🛡️ Security middleware activo: Helmet, CORS, Rate Limiting, Auth Cache');

// Servir frontend
app.use(express.static(join(__dirname, 'dist')));
app.get('/{*path}', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});