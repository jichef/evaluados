const express = require('express');
const { getDb } = require('../config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.use(requireAuth);

const EDUCATION_LEVELS = [
  { stage: 'Infantil', levels: ['3 años', '4 años', '5 años'] },
  { stage: 'Primaria (EP)', levels: ['1º EP', '2º EP', '3º EP', '4º EP', '5º EP', '6º EP'] },
  { stage: 'Secundaria (ESO)', levels: ['1º ESO', '2º ESO', '3º ESO', '4º ESO'] },
];

router.get('/', (req, res) => {
  const db = getDb();
  const { program_id, q, level } = req.query;
  let where = 'WHERE a.active = 1';
  const params = [];
  if (program_id) { where += ' AND a.program_id = ?'; params.push(program_id); }
  if (q) { where += ' AND (a.name LIKE ? OR a.description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  if (level) {
    // Match activities with no level (all levels) or containing this level
    where += " AND (a.levels = '' OR (',' || a.levels || ',') LIKE ?)";
    params.push(`%,${level},%`);
  }

  const activities = db.prepare(`
    SELECT a.*, p.name AS program_name, p.color, p.icon,
           ls.title AS situation_title
    FROM activities a
    JOIN programs p ON a.program_id = p.id
    LEFT JOIN learning_situations ls ON a.situation_id = ls.id
    ${where}
    ORDER BY p.sort_order, a.name
  `).all(...params);

  const programs = db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY sort_order').all();

  res.render('activities/index', {
    title: 'Actividades',
    activities,
    programs,
    educationLevels: EDUCATION_LEVELS,
    filters: { program_id, q, level },
  });
});

router.get('/new', requireAdmin, (req, res) => {
  const db = getDb();
  const programs = db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY sort_order').all();
  const situations = db.prepare('SELECT * FROM learning_situations WHERE active = 1 ORDER BY title').all();
  const objectives = db.prepare('SELECT * FROM objectives WHERE active = 1 ORDER BY description').all();
  const criteria = db.prepare('SELECT * FROM criteria WHERE active = 1 ORDER BY code, description').all();
  const availableLevels = EDUCATION_LEVELS;
  res.render('activities/form', {
    title: 'Nueva Actividad',
    activity: null,
    programs, situations, objectives, criteria, availableLevels,
    selectedObjectives: [], selectedCriteria: [], selectedLevels: [],
  });
});

router.post('/', requireAdmin, (req, res) => {
  const db = getDb();
  const { name, description, program_id, duration, materials, situation_id, objectives, criteria } = req.body;
  const levelsRaw = req.body.levels;
  const levelsStr = levelsRaw ? (Array.isArray(levelsRaw) ? levelsRaw : [levelsRaw]).join(',') : '';

  if (!name || !program_id) {
    const programs = db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY sort_order').all();
    const situations = db.prepare('SELECT * FROM learning_situations WHERE active = 1 ORDER BY title').all();
    const allObjectives = db.prepare('SELECT * FROM objectives WHERE active = 1 ORDER BY description').all();
    const allCriteria = db.prepare('SELECT * FROM criteria WHERE active = 1 ORDER BY code, description').all();
    const selectedLevels = Array.isArray(levelsRaw) ? levelsRaw : (levelsRaw ? [levelsRaw] : []);
    return res.render('activities/form', {
      title: 'Nueva Actividad',
      activity: req.body,
      programs, situations, objectives: allObjectives, criteria: allCriteria,
      availableLevels: EDUCATION_LEVELS, selectedObjectives: [], selectedCriteria: [], selectedLevels,
      error: 'Nombre y programa son obligatorios.'
    });
  }

  const result = db.prepare(`
    INSERT INTO activities (name, description, program_id, duration, materials, situation_id, levels, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, description, program_id, duration || 30, materials, situation_id || null, levelsStr, req.session.user.id);

  const actId = result.lastInsertRowid;

  if (objectives) {
    const objList = Array.isArray(objectives) ? objectives : [objectives];
    const stmt = db.prepare('INSERT OR IGNORE INTO activity_objectives (activity_id, objective_id) VALUES (?, ?)');
    objList.forEach(oid => stmt.run(actId, oid));
  }
  if (criteria) {
    const critList = Array.isArray(criteria) ? criteria : [criteria];
    const stmt = db.prepare('INSERT OR IGNORE INTO activity_criteria (activity_id, criterion_id) VALUES (?, ?)');
    critList.forEach(cid => stmt.run(actId, cid));
  }

  req.session.flash = { success: 'Actividad creada correctamente.' };
  res.redirect('/activities');
});

router.get('/:id/edit', requireAdmin, (req, res) => {
  const db = getDb();
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  if (!activity) { req.session.flash = { error: 'Actividad no encontrada.' }; return res.redirect('/activities'); }

  const programs = db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY sort_order').all();
  const situations = db.prepare('SELECT * FROM learning_situations WHERE active = 1 ORDER BY title').all();
  const objectives = db.prepare('SELECT * FROM objectives WHERE active = 1 ORDER BY description').all();
  const criteria = db.prepare('SELECT * FROM criteria WHERE active = 1 ORDER BY code, description').all();
  const selectedObjectives = db.prepare('SELECT objective_id FROM activity_objectives WHERE activity_id = ?').all(req.params.id).map(r => r.objective_id);
  const selectedCriteria = db.prepare('SELECT criterion_id FROM activity_criteria WHERE activity_id = ?').all(req.params.id).map(r => r.criterion_id);
  const availableLevels = EDUCATION_LEVELS;
  const selectedLevels = activity.levels ? activity.levels.split(',').filter(Boolean) : [];

  res.render('activities/form', {
    title: 'Editar Actividad', activity, programs, situations, objectives, criteria,
    selectedObjectives, selectedCriteria, availableLevels, selectedLevels
  });
});

router.post('/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const { name, description, program_id, duration, materials, situation_id, active, objectives, criteria } = req.body;
  const levelsRaw = req.body.levels;
  const levelsStr = levelsRaw ? (Array.isArray(levelsRaw) ? levelsRaw : [levelsRaw]).join(',') : '';

  db.prepare(`
    UPDATE activities SET name=?, description=?, program_id=?, duration=?, materials=?, situation_id=?, levels=?, active=?
    WHERE id=?
  `).run(name, description, program_id, duration || 30, materials, situation_id || null, levelsStr, active === 'on' ? 1 : 0, req.params.id);

  db.prepare('DELETE FROM activity_objectives WHERE activity_id = ?').run(req.params.id);
  db.prepare('DELETE FROM activity_criteria WHERE activity_id = ?').run(req.params.id);

  if (objectives) {
    const list = Array.isArray(objectives) ? objectives : [objectives];
    const stmt = db.prepare('INSERT OR IGNORE INTO activity_objectives (activity_id, objective_id) VALUES (?, ?)');
    list.forEach(oid => stmt.run(req.params.id, oid));
  }
  if (criteria) {
    const list = Array.isArray(criteria) ? criteria : [criteria];
    const stmt = db.prepare('INSERT OR IGNORE INTO activity_criteria (activity_id, criterion_id) VALUES (?, ?)');
    list.forEach(cid => stmt.run(req.params.id, cid));
  }

  req.session.flash = { success: 'Actividad actualizada.' };
  res.redirect('/activities');
});

router.post('/:id/delete', requireAdmin, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE activities SET active = 0 WHERE id = ?').run(req.params.id);
  req.session.flash = { success: 'Actividad desactivada.' };
  res.redirect('/activities');
});

module.exports = router;
