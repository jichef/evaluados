const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { getDb } = require('../config/database');
const { importLomloeCriteria } = require('../database/lomloe-criteria');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

const logoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/uploads')),
    filename: (req, file, cb) => cb(null, 'logo' + path.extname(file.originalname))
  }),
  fileFilter: (req, file, cb) => cb(null, /image/.test(file.mimetype)),
  limits: { fileSize: 2 * 1024 * 1024 }
});

router.use(requireAdmin);

// Admin dashboard
router.get('/', (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT COUNT(*) AS c FROM users WHERE active = 1').get();
  const students = db.prepare('SELECT COUNT(*) AS c FROM students WHERE active = 1').get();
  const sessions = db.prepare('SELECT COUNT(*) AS c FROM sessions_log').get();
  const activities = db.prepare('SELECT COUNT(*) AS c FROM activities WHERE active = 1').get();
  const lastBackup = db.prepare('SELECT * FROM backup_log ORDER BY created_at DESC LIMIT 1').get();
  res.render('admin/index', {
    title: 'Administración',
    stats: { users: users.c, students: students.c, sessions: sessions.c, activities: activities.c },
    lastBackup
  });
});

// ─── Users ───────────────────────────────────────────
router.get('/users', (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, name, email, role, active, created_at FROM users ORDER BY name').all();
  res.render('admin/users', { title: 'Usuarios', users });
});

router.get('/users/new', (req, res) => {
  res.render('admin/user-form', { title: 'Nuevo Usuario', user: null });
});

router.post('/users', (req, res) => {
  const db = getDb();
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.render('admin/user-form', { title: 'Nuevo Usuario', user: req.body, error: 'Todos los campos son obligatorios.' });
  }
  const hash = bcrypt.hashSync(password, 10);
  try {
    db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name, email, hash, role || 'teacher');
    req.session.flash = { success: 'Usuario creado correctamente.' };
    res.redirect('/admin/users');
  } catch (e) {
    res.render('admin/user-form', { title: 'Nuevo Usuario', user: req.body, error: 'El correo ya está en uso.' });
  }
});

router.get('/users/:id/edit', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, role, active FROM users WHERE id = ?').get(req.params.id);
  if (!user) { req.session.flash = { error: 'Usuario no encontrado.' }; return res.redirect('/admin/users'); }
  res.render('admin/user-form', { title: 'Editar Usuario', user });
});

router.post('/users/:id', (req, res) => {
  const db = getDb();
  const { name, email, password, role, active } = req.body;
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET name=?, email=?, password=?, role=?, active=? WHERE id=?').run(name, email, hash, role, active === 'on' ? 1 : 0, req.params.id);
  } else {
    db.prepare('UPDATE users SET name=?, email=?, role=?, active=? WHERE id=?').run(name, email, role, active === 'on' ? 1 : 0, req.params.id);
  }
  req.session.flash = { success: 'Usuario actualizado.' };
  res.redirect('/admin/users');
});

// ─── Programs ─────────────────────────────────────────
router.get('/programs', (req, res) => {
  const db = getDb();
  const programs = db.prepare('SELECT * FROM programs ORDER BY sort_order').all();
  res.render('admin/programs', { title: 'Programas', programs });
});

router.post('/programs', (req, res) => {
  const db = getDb();
  const { name, description, color, icon } = req.body;
  db.prepare('INSERT INTO programs (name, description, color, icon) VALUES (?, ?, ?, ?)').run(name, description, color || '#0d6efd', icon || 'book');
  req.session.flash = { success: 'Programa creado.' };
  res.redirect('/admin/programs');
});

router.post('/programs/:id', (req, res) => {
  const db = getDb();
  const { name, description, color, icon, active } = req.body;
  db.prepare('UPDATE programs SET name=?, description=?, color=?, icon=?, active=? WHERE id=?').run(
    name, description, color, icon, active === 'on' ? 1 : 0, req.params.id
  );
  req.session.flash = { success: 'Programa actualizado.' };
  res.redirect('/admin/programs');
});

// ─── Quick Comments ────────────────────────────────────
router.get('/comments', (req, res) => {
  const db = getDb();
  const comments = db.prepare(`
    SELECT qc.*, p.name AS program_name FROM quick_comments qc
    LEFT JOIN programs p ON qc.program_id = p.id
    WHERE qc.active = 1 ORDER BY qc.program_id NULLS FIRST, qc.category, qc.sort_order, qc.id
  `).all();
  const programs = db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY sort_order').all();
  res.render('admin/comments', { title: 'Comentarios Rápidos', comments, programs });
});

router.post('/comments', (req, res) => {
  const db = getDb();
  const { text, category, program_id } = req.body;
  db.prepare('INSERT INTO quick_comments (text, category, program_id) VALUES (?, ?, ?)').run(text, category, program_id || null);
  req.session.flash = { success: 'Comentario añadido.' };
  res.redirect('/admin/comments');
});

router.post('/comments/:id/delete', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE quick_comments SET active = 0 WHERE id = ?').run(req.params.id);
  req.session.flash = { success: 'Comentario eliminado.' };
  res.redirect('/admin/comments');
});

// ─── Criteria ─────────────────────────────────────────
router.get('/criteria', (req, res) => {
  const db = getDb();
  const criteria = db.prepare('SELECT * FROM criteria WHERE active = 1 ORDER BY area, code').all();
  res.render('admin/criteria', { title: 'Criterios de Evaluación', criteria });
});

router.post('/criteria', (req, res) => {
  const db = getDb();
  const { code, description, area } = req.body;
  if (!description) {
    req.session.flash = { error: 'La descripción del criterio es obligatoria.' };
    return res.redirect(303, '/admin/criteria');
  }
  db.prepare('INSERT INTO criteria (code, description, area) VALUES (?, ?, ?)').run(code, description, area);
  req.session.flash = { success: 'Criterio creado.' };
  res.redirect(303, '/admin/criteria');
});

router.post('/criteria/:id/delete', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE criteria SET active = 0 WHERE id = ?').run(req.params.id);
  req.session.flash = { success: 'Criterio desactivado.' };
  res.redirect('/admin/criteria');
});

router.post('/criteria/import-lomloe', (req, res) => {
  try {
    const result = importLomloeCriteria();
    req.session.flash = { success: `Criterios LOMLOE importados: ${result.inserted} nuevos añadidos, ${result.skipped} ya existían.` };
  } catch (err) {
    req.session.flash = { error: 'Error al importar criterios: ' + err.message };
  }
  res.redirect(303, '/admin/criteria');
});

// ─── Objectives ───────────────────────────────────────
router.get('/objectives', (req, res) => {
  const db = getDb();
  const objectives = db.prepare('SELECT * FROM objectives WHERE active = 1 ORDER BY area, description').all();
  res.render('admin/objectives', { title: 'Objetivos', objectives });
});

router.post('/objectives', (req, res) => {
  const db = getDb();
  const { description, area } = req.body;
  db.prepare('INSERT INTO objectives (description, area) VALUES (?, ?)').run(description, area);
  req.session.flash = { success: 'Objetivo creado.' };
  res.redirect('/admin/objectives');
});

router.post('/objectives/:id/delete', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE objectives SET active = 0 WHERE id = ?').run(req.params.id);
  res.redirect('/admin/objectives');
});

// ─── Learning Situations ──────────────────────────────
router.get('/situations', (req, res) => {
  const db = getDb();
  const situations = db.prepare('SELECT * FROM learning_situations WHERE active = 1 ORDER BY title').all();
  res.render('admin/situations', { title: 'Situaciones de Aprendizaje', situations });
});

router.post('/situations', (req, res) => {
  const db = getDb();
  const { title, description, course, areas, period } = req.body;
  db.prepare('INSERT INTO learning_situations (title, description, course, areas, period) VALUES (?, ?, ?, ?, ?)').run(title, description, course, areas, period);
  req.session.flash = { success: 'Situación de aprendizaje creada.' };
  res.redirect('/admin/situations');
});

router.post('/situations/:id/delete', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE learning_situations SET active = 0 WHERE id = ?').run(req.params.id);
  res.redirect('/admin/situations');
});

// ─── Settings ─────────────────────────────────────────
router.get('/settings', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM center_settings').all();
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  res.render('admin/settings', { title: 'Configuración del Centro', settings });
});

router.post('/settings', logoUpload.single('logo'), (req, res) => {
  const db = getDb();
  const { center_name, school_year, footer_text, backup_retention_days, backup_time } = req.body;
  const stmt = db.prepare('INSERT OR REPLACE INTO center_settings (key, value) VALUES (?, ?)');
  stmt.run('center_name', center_name || '');
  stmt.run('school_year', school_year || '');
  stmt.run('footer_text', footer_text || '');
  stmt.run('backup_retention_days', backup_retention_days || '30');
  stmt.run('backup_time', backup_time || '02:00');

  if (req.file) {
    stmt.run('logo_path', '/uploads/' + req.file.filename);
  }

  req.session.flash = { success: 'Configuración guardada correctamente.' };
  res.redirect('/admin/settings');
});

module.exports = router;
