const express = require('express');
const { getDb } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.use(requireAuth);

// Student search
router.get('/students', (req, res) => {
  const db = getDb();
  const q = req.query.q || '';
  const students = db.prepare(`
    SELECT id, name, surname, course, group_name
    FROM students
    WHERE active = 1 AND (name LIKE ? OR surname LIKE ? OR course LIKE ?)
    ORDER BY surname, name
    LIMIT 20
  `).all(`%${q}%`, `%${q}%`, `%${q}%`);
  res.json(students);
});

// Activities by program
router.get('/activities', (req, res) => {
  const db = getDb();
  const { program_id } = req.query;
  let query = `
    SELECT a.*, p.name AS program_name, p.color,
           ls.title AS situation_title
    FROM activities a
    JOIN programs p ON a.program_id = p.id
    LEFT JOIN learning_situations ls ON a.situation_id = ls.id
    WHERE a.active = 1
  `;
  const params = [];
  if (program_id) {
    query += ' AND a.program_id = ?';
    params.push(program_id);
  }
  query += ' ORDER BY a.name';
  res.json(db.prepare(query).all(...params));
});

// Activity detail (with objectives and criteria)
router.get('/activities/:id', (req, res) => {
  const db = getDb();
  const activity = db.prepare(`
    SELECT a.*, p.name AS program_name, p.color,
           ls.title AS situation_title, ls.description AS situation_description
    FROM activities a
    JOIN programs p ON a.program_id = p.id
    LEFT JOIN learning_situations ls ON a.situation_id = ls.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!activity) return res.status(404).json({ error: 'Not found' });

  activity.saberes = db.prepare(`
    SELECT s.* FROM saberes s
    JOIN activity_saberes as2 ON s.id = as2.saber_id
    WHERE as2.activity_id = ?
    ORDER BY s.area, s.bloque, s.code
  `).all(req.params.id);

  activity.criteria = db.prepare(`
    SELECT c.* FROM criteria c
    JOIN activity_criteria ac ON c.id = ac.criterion_id
    WHERE ac.activity_id = ?
  `).all(req.params.id);

  res.json(activity);
});

// Quick comments (general + program-specific)
router.get('/comments', (req, res) => {
  const db = getDb();
  const { program_id } = req.query;
  const comments = db.prepare(`
    SELECT qc.*, p.name AS program_name
    FROM quick_comments qc
    LEFT JOIN programs p ON qc.program_id = p.id
    WHERE qc.active = 1
      AND (qc.program_id IS NULL ${program_id ? 'OR qc.program_id = ?' : ''})
    ORDER BY qc.program_id NULLS FIRST, qc.category, qc.sort_order, qc.id
  `).all(...(program_id ? [program_id] : []));
  res.json(comments);
});

// Favorite comments for current user
router.get('/favorites', (req, res) => {
  const db = getDb();
  const favs = db.prepare(`
    SELECT * FROM favorite_comments WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.session.user.id);
  res.json(favs);
});

router.post('/favorites', (req, res) => {
  const db = getDb();
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });
  const result = db.prepare('INSERT INTO favorite_comments (user_id, text) VALUES (?, ?)').run(req.session.user.id, text);
  res.json({ id: result.lastInsertRowid, text });
});

router.delete('/favorites/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM favorite_comments WHERE id = ? AND user_id = ?').run(req.params.id, req.session.user.id);
  res.json({ ok: true });
});

// Recent sessions for a student (for context)
router.get('/students/:id/recent', (req, res) => {
  const db = getDb();
  const sessions = db.prepare(`
    SELECT sl.id, sl.session_date, sl.rating, sl.observations,
           a.name AS activity_name, p.name AS program_name, p.color
    FROM sessions_log sl
    JOIN activities a ON sl.activity_id = a.id
    JOIN programs p ON sl.program_id = p.id
    WHERE sl.student_id = ?
    ORDER BY sl.session_date DESC, sl.created_at DESC
    LIMIT 5
  `).all(req.params.id);
  res.json(sessions);
});

// Programs list
router.get('/programs', (req, res) => {
  const db = getDb();
  const programs = db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY sort_order').all();
  res.json(programs);
});

// Tags
router.get('/tags', (req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT * FROM tags WHERE active = 1 ORDER BY name').all());
});

router.post('/tags', (req, res) => {
  const db = getDb();
  const { name, color } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });
  try {
    const result = db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)').run(name.trim(), color || '#0d6efd');
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid);
    res.json(tag);
  } catch (e) {
    res.status(409).json({ error: 'Ya existe una etiqueta con ese nombre.' });
  }
});

module.exports = router;
