const express = require('express');
const { getDb } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.use(requireAuth);

// List
router.get('/', (req, res) => {
  const db = getDb();
  const programmings = db.prepare(`
    SELECT pg.*, p.name AS program_name, p.color, p.icon,
           COUNT(pa.id) AS activity_count
    FROM programmings pg
    JOIN programs p ON pg.program_id = p.id
    LEFT JOIN programming_activities pa ON pg.id = pa.programming_id
    WHERE pg.teacher_id = ?
    GROUP BY pg.id
    ORDER BY p.sort_order, pg.name
  `).all(req.session.user.id);

  const programs = db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY sort_order').all();
  res.render('programmings/index', { title: 'Programaciones', programmings, programs });
});

// Create
router.post('/', (req, res) => {
  const db = getDb();
  const { name, description, program_id, course } = req.body;
  if (!name || !program_id) {
    req.session.flash = { error: 'Nombre y programa son obligatorios.' };
    return res.redirect('/programmings');
  }
  const result = db.prepare(`
    INSERT INTO programmings (name, description, program_id, teacher_id, course)
    VALUES (?, ?, ?, ?, ?)
  `).run(name.trim(), description || null, program_id, req.session.user.id, course || null);
  res.redirect(`/programmings/${result.lastInsertRowid}`);
});

// Show / edit
router.get('/:id', (req, res) => {
  const db = getDb();
  const programming = db.prepare(`
    SELECT pg.*, p.name AS program_name, p.color
    FROM programmings pg
    JOIN programs p ON pg.program_id = p.id
    WHERE pg.id = ? AND pg.teacher_id = ?
  `).get(req.params.id, req.session.user.id);

  if (!programming) {
    req.session.flash = { error: 'Programación no encontrada.' };
    return res.redirect('/programmings');
  }

  const activities = db.prepare(`
    SELECT pa.id AS pa_id, pa.sort_order, a.id, a.name, a.duration
    FROM programming_activities pa
    JOIN activities a ON pa.activity_id = a.id
    WHERE pa.programming_id = ?
    ORDER BY pa.sort_order, pa.id
  `).all(programming.id);

  const bankActivities = db.prepare(`
    SELECT id, name, duration FROM activities
    WHERE program_id = ? AND active = 1
    ORDER BY name
  `).all(programming.program_id);

  const programs = db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY sort_order').all();

  res.render('programmings/show', {
    title: `Programación: ${programming.name}`,
    programming,
    activities,
    bankActivities,
    programs,
  });
});

// Update metadata
router.post('/:id', (req, res) => {
  const db = getDb();
  const { name, description, program_id, course, active } = req.body;
  const pg = db.prepare('SELECT * FROM programmings WHERE id = ? AND teacher_id = ?').get(req.params.id, req.session.user.id);
  if (!pg) { req.session.flash = { error: 'No encontrada.' }; return res.redirect('/programmings'); }
  db.prepare(`UPDATE programmings SET name=?, description=?, program_id=?, course=?, active=? WHERE id=?`)
    .run(name, description || null, program_id, course || null, active ? 1 : 0, req.params.id);
  req.session.flash = { success: 'Programación actualizada.' };
  res.redirect(`/programmings/${req.params.id}`);
});

// Add activity to sequence
router.post('/:id/activities', (req, res) => {
  const db = getDb();
  const pg = db.prepare('SELECT * FROM programmings WHERE id = ? AND teacher_id = ?').get(req.params.id, req.session.user.id);
  if (!pg) { req.session.flash = { error: 'No autorizado' }; return res.redirect('/programmings'); }

  const { activity_id } = req.body;
  if (!activity_id) return res.redirect(`/programmings/${req.params.id}`);

  const max = db.prepare('SELECT MAX(sort_order) AS m FROM programming_activities WHERE programming_id = ?').get(req.params.id);
  const sort_order = (max?.m ?? -1) + 1;
  db.prepare('INSERT INTO programming_activities (programming_id, activity_id, sort_order) VALUES (?, ?, ?)').run(req.params.id, activity_id, sort_order);
  res.redirect(`/programmings/${req.params.id}`);
});

// Move activity up or down
router.post('/:id/activities/:paId/move', (req, res) => {
  const db = getDb();
  const { direction } = req.body;
  const pg = db.prepare('SELECT * FROM programmings WHERE id = ? AND teacher_id = ?').get(req.params.id, req.session.user.id);
  if (!pg) { req.session.flash = { error: 'No autorizado' }; return res.redirect('/programmings'); }

  const items = db.prepare(
    'SELECT id FROM programming_activities WHERE programming_id = ? ORDER BY sort_order, id'
  ).all(req.params.id);

  const idx = items.findIndex(i => i.id === parseInt(req.params.paId));
  if (idx < 0) return res.redirect(`/programmings/${req.params.id}`);

  if (direction === 'up' && idx > 0) {
    [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
  } else if (direction === 'down' && idx < items.length - 1) {
    [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
  }

  const upd = db.prepare('UPDATE programming_activities SET sort_order = ? WHERE id = ?');
  db.transaction(() => { items.forEach((item, i) => upd.run(i, item.id)); })();
  res.redirect(`/programmings/${req.params.id}`);
});

// Remove activity from sequence
router.post('/:id/activities/:paId/remove', (req, res) => {
  const db = getDb();
  const pg = db.prepare('SELECT * FROM programmings WHERE id = ? AND teacher_id = ?').get(req.params.id, req.session.user.id);
  if (!pg) { req.session.flash = { error: 'No autorizado' }; return res.redirect('/programmings'); }
  db.prepare('DELETE FROM programming_activities WHERE id = ? AND programming_id = ?').run(req.params.paId, req.params.id);
  res.redirect(`/programmings/${req.params.id}`);
});

// Delete programming
router.post('/:id/delete', (req, res) => {
  const db = getDb();
  const pg = db.prepare('SELECT * FROM programmings WHERE id = ? AND teacher_id = ?').get(req.params.id, req.session.user.id);
  if (!pg) { req.session.flash = { error: 'No encontrada.' }; return res.redirect('/programmings'); }
  db.prepare('DELETE FROM programmings WHERE id = ?').run(req.params.id);
  req.session.flash = { success: 'Programación eliminada.' };
  res.redirect('/programmings');
});

module.exports = router;
