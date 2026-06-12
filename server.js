require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const fs = require('fs');

const { initDatabase } = require('./database/schema');
const { seedDatabase } = require('./database/seeds');
const { getDb } = require('./config/database');
const scheduler = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure data dir
['data', 'data/backups', 'public/uploads'].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session store
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: './data' }),
  secret: process.env.SESSION_SECRET || 'edu-seguimiento-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 10 * 60 * 60 * 1000 } // 10 hours
}));

// Locals middleware
app.use((req, res, next) => {
  res.locals.flash = req.session.flash || {};
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
  delete req.session.flash;

  // Load center settings into locals
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM center_settings').all();
    res.locals.centerSettings = {};
    rows.forEach(r => { res.locals.centerSettings[r.key] = r.value; });
  } catch (e) {
    res.locals.centerSettings = {};
  }
  next();
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/', require('./routes/index'));
app.use('/api', require('./routes/api'));
app.use('/sessions', require('./routes/sessions'));
app.use('/students', require('./routes/students'));
app.use('/activities', require('./routes/activities'));
app.use('/admin', require('./routes/admin'));
app.use('/reports', require('./routes/reports'));
app.use('/admin/backups', require('./routes/backups'));
app.use('/programmings', require('./routes/programmings'));
app.use('/import', require('./routes/import'));

// 404
app.use((req, res) => {
  res.status(404).render('error', { title: 'Página no encontrada', message: 'La página que buscas no existe.', code: 404 });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { title: 'Error del servidor', message: err.message, code: 500 });
});

// Start
initDatabase();
seedDatabase();
scheduler.init();

app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║   Sistema de Seguimiento Educativo     ║`);
  console.log(`╠════════════════════════════════════════╣`);
  console.log(`║  URL:      http://localhost:${PORT}         ║`);
  console.log(`║  Usuario:  admin@colegio.es            ║`);
  console.log(`║  Clave:    admin123                    ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
});
