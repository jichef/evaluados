const express = require('express');
const { getDb } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.use(requireAuth);

// Session registration wizard
router.get('/new', (req, res) => {
  const db = getDb();
  const programs = db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY sort_order').all();

  // Last session for repeat functionality
  const lastSession = db.prepare(`
    SELECT sl.*, s.name || ' ' || s.surname AS student_name,
           a.name AS activity_name, p.name AS program_name
    FROM sessions_log sl
    JOIN students s ON sl.student_id = s.id
    JOIN activities a ON sl.activity_id = a.id
    JOIN programs p ON sl.program_id = p.id
    WHERE sl.teacher_id = ?
    ORDER BY sl.created_at DESC LIMIT 1
  `).get(req.session.user.id);

  const preStudent = req.query.student_id ? db.prepare('SELECT * FROM students WHERE id = ?').get(req.query.student_id) : null;

  res.render('sessions/new', {
    title: 'Registrar Sesión',
    programs,
    lastSession,
    preStudent,
  });
});

// Create session
router.post('/', (req, res) => {
  const db = getDb();
  const {
    student_id, activity_id, program_id, situation_id,
    rating, observations, quick_comments_text,
    criteria_ratings
  } = req.body;

  if (!student_id || !activity_id || !program_id) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const insert = db.prepare(`
    INSERT INTO sessions_log (student_id, activity_id, teacher_id, program_id, situation_id, rating, observations, quick_comments_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    student_id, activity_id, req.session.user.id,
    program_id, situation_id || null, rating || null,
    observations || null, quick_comments_text || null
  );

  const sessionId = result.lastInsertRowid;

  // Save criteria ratings
  if (criteria_ratings && typeof criteria_ratings === 'object') {
    const insertCrit = db.prepare('INSERT INTO session_criteria (session_id, criterion_id, rating) VALUES (?, ?, ?)');
    Object.entries(criteria_ratings).forEach(([criterionId, r]) => {
      if (r) insertCrit.run(sessionId, criterionId, r);
    });
  }

  if (req.headers['content-type']?.includes('application/json')) {
    return res.json({ ok: true, id: sessionId });
  }

  req.session.flash = { success: '¡Sesión registrada correctamente!' };
  res.redirect('/');
});

// Session history (all sessions for the current teacher)
router.get('/', (req, res) => {
  const db = getDb();
  const { page = 1, student_id, program_id, date_from, date_to } = req.query;
  const limit = 20;
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  const params = [];

  // Teachers see only their sessions; admins see all
  if (req.session.user.role !== 'admin') {
    where += ' AND sl.teacher_id = ?';
    params.push(req.session.user.id);
  }

  if (student_id) { where += ' AND sl.student_id = ?'; params.push(student_id); }
  if (program_id) { where += ' AND sl.program_id = ?'; params.push(program_id); }
  if (date_from) { where += ' AND sl.session_date >= ?'; params.push(date_from); }
  if (date_to) { where += ' AND sl.session_date <= ?'; params.push(date_to); }

  const sessions = db.prepare(`
    SELECT sl.*, s.name || ' ' || s.surname AS student_name, s.course, s.group_name,
           a.name AS activity_name, p.name AS program_name, p.color, u.name AS teacher_name
    FROM sessions_log sl
    JOIN students s ON sl.student_id = s.id
    JOIN activities a ON sl.activity_id = a.id
    JOIN programs p ON sl.program_id = p.id
    JOIN users u ON sl.teacher_id = u.id
    ${where}
    ORDER BY sl.session_date DESC, sl.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const total = db.prepare(`
    SELECT COUNT(*) AS c FROM sessions_log sl ${where}
  `).get(...params);

  const programs = db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY sort_order').all();
  const students = db.prepare('SELECT id, name, surname FROM students WHERE active = 1 ORDER BY surname').all();

  res.render('sessions/history', {
    title: 'Historial de Sesiones',
    sessions,
    programs,
    students,
    filters: { student_id, program_id, date_from, date_to },
    pagination: { page: +page, total: total.c, limit, pages: Math.ceil(total.c / limit) },
  });
});

// View single session
router.get('/:id', (req, res) => {
  const db = getDb();
  const session = db.prepare(`
    SELECT sl.*, s.name || ' ' || s.surname AS student_name, s.course, s.id AS student_id_val,
           a.name AS activity_name, a.description AS activity_desc,
           p.name AS program_name, p.color, u.name AS teacher_name,
           ls.title AS situation_title
    FROM sessions_log sl
    JOIN students s ON sl.student_id = s.id
    JOIN activities a ON sl.activity_id = a.id
    JOIN programs p ON sl.program_id = p.id
    JOIN users u ON sl.teacher_id = u.id
    LEFT JOIN learning_situations ls ON sl.situation_id = ls.id
    WHERE sl.id = ?
  `).get(req.params.id);

  if (!session) {
    req.session.flash = { error: 'Sesión no encontrada.' };
    return res.redirect('/sessions');
  }

  session.criteria_ratings = db.prepare(`
    SELECT sc.*, c.code, c.description, c.area
    FROM session_criteria sc
    JOIN criteria c ON sc.criterion_id = c.id
    WHERE sc.session_id = ?
  `).all(req.params.id);

  res.render('sessions/detail', { title: 'Detalle de Sesión', session });
});

// Delete session
router.post('/:id/delete', (req, res) => {
  const db = getDb();
  const session = db.prepare('SELECT * FROM sessions_log WHERE id = ?').get(req.params.id);

  if (!session) {
    req.session.flash = { error: 'Sesión no encontrada.' };
    return res.redirect('/sessions');
  }

  if (req.session.user.role !== 'admin' && session.teacher_id !== req.session.user.id) {
    req.session.flash = { error: 'No tienes permisos para eliminar esta sesión.' };
    return res.redirect('/sessions');
  }

  db.prepare('DELETE FROM sessions_log WHERE id = ?').run(req.params.id);
  req.session.flash = { success: 'Sesión eliminada.' };
  res.redirect('/sessions');
});

module.exports = router;
