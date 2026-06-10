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
  const { program_id, q, level, tag_id } = req.query;
  let where = 'WHERE a.active = 1';
  const params = [];
  if (program_id) { where += ' AND a.program_id = ?'; params.push(program_id); }
  if (q) { where += ' AND (a.name LIKE ? OR a.description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  if (level) {
    where += " AND (a.levels = '' OR (',' || a.levels || ',') LIKE ?)";
    params.push(`%,${level},%`);
  }
  if (tag_id) {
    where += ' AND a.id IN (SELECT activity_id FROM activity_tags WHERE tag_id = ?)';
    params.push(tag_id);
  }

  const activities = db.prepare(`
    SELECT a.*, p.name AS program_name, p.color AS color, p.icon,
           ls.title AS situation_title,
           GROUP_CONCAT(t.name, '|||') AS tag_names,
           GROUP_CONCAT(t.color, '|||') AS tag_colors,
           GROUP_CONCAT(t.id, '|||') AS tag_ids
    FROM activities a
    JOIN programs p ON a.program_id = p.id
    LEFT JOIN learning_situations ls ON a.situation_id = ls.id
    LEFT JOIN activity_tags at2 ON a.id = at2.activity_id
    LEFT JOIN tags t ON at2.tag_id = t.id AND t.active = 1
    ${where}
    GROUP BY a.id
    ORDER BY p.sort_order, a.name
  `).all(...params);

  const programs = db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY sort_order').all();
  const allTags = db.prepare('SELECT * FROM tags WHERE active = 1 ORDER BY name').all();

  res.render('activities/index', {
    title: 'Actividades',
    activities,
    programs,
    allTags,
    educationLevels: EDUCATION_LEVELS,
    filters: { program_id, q, level, tag_id },
  });
});

router.get('/new', (req, res) => {
  const db = getDb();
  const programs = db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY sort_order').all();
  const situations = db.prepare('SELECT * FROM learning_situations WHERE active = 1 ORDER BY title').all();
  const saberes = db.prepare('SELECT * FROM saberes WHERE active = 1 ORDER BY area, bloque, code').all();
  const criteria = db.prepare('SELECT * FROM criteria WHERE active = 1 ORDER BY code, description').all();
  const tags = db.prepare('SELECT * FROM tags WHERE active = 1 ORDER BY name').all();
  const saberCriteriaLinks = db.prepare('SELECT saber_id, criterion_id FROM saber_criteria').all();
  const availableLevels = EDUCATION_LEVELS;
  res.render('activities/form', {
    title: 'Nueva Actividad',
    activity: null,
    programs, situations, saberes, criteria, tags, saberCriteriaLinks, availableLevels,
    selectedSaberes: [], selectedCriteria: [], selectedLevels: [], selectedTags: [],
  });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, description, program_id, duration, materials, situation_id, criteria } = req.body;
  const saberesRaw = req.body.saberes;
  const levelsRaw = req.body.levels;
  const levelsStr = levelsRaw ? (Array.isArray(levelsRaw) ? levelsRaw : [levelsRaw]).join(',') : '';
  const tagsRaw = req.body.tags;

  if (!name || !program_id) {
    const programs = db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY sort_order').all();
    const situations = db.prepare('SELECT * FROM learning_situations WHERE active = 1 ORDER BY title').all();
    const allSaberes = db.prepare('SELECT * FROM saberes WHERE active = 1 ORDER BY area, bloque, code').all();
    const allCriteria = db.prepare('SELECT * FROM criteria WHERE active = 1 ORDER BY code, description').all();
    const tags = db.prepare('SELECT * FROM tags WHERE active = 1 ORDER BY name').all();
    const saberCriteriaLinks = db.prepare('SELECT saber_id, criterion_id FROM saber_criteria').all();
    const selectedLevels = Array.isArray(levelsRaw) ? levelsRaw : (levelsRaw ? [levelsRaw] : []);
    const selectedTags = tagsRaw ? (Array.isArray(tagsRaw) ? tagsRaw.map(Number) : [Number(tagsRaw)]) : [];
    const selectedSaberes = saberesRaw ? (Array.isArray(saberesRaw) ? saberesRaw.map(Number) : [Number(saberesRaw)]) : [];
    return res.render('activities/form', {
      title: 'Nueva Actividad',
      activity: req.body,
      programs, situations, saberes: allSaberes, criteria: allCriteria, tags, saberCriteriaLinks,
      availableLevels: EDUCATION_LEVELS, selectedSaberes, selectedCriteria: [], selectedLevels, selectedTags,
      error: 'Nombre y programa son obligatorios.'
    });
  }

  const result = db.prepare(`
    INSERT INTO activities (name, description, program_id, duration, materials, situation_id, levels, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, description, program_id, duration || 30, materials, situation_id || null, levelsStr, req.session.user.id);

  const actId = result.lastInsertRowid;

  if (saberesRaw) {
    const list = Array.isArray(saberesRaw) ? saberesRaw : [saberesRaw];
    const stmt = db.prepare('INSERT OR IGNORE INTO activity_saberes (activity_id, saber_id) VALUES (?, ?)');
    list.forEach(sid => stmt.run(actId, sid));
  }
  if (criteria) {
    const critList = Array.isArray(criteria) ? criteria : [criteria];
    const stmt = db.prepare('INSERT OR IGNORE INTO activity_criteria (activity_id, criterion_id) VALUES (?, ?)');
    critList.forEach(cid => stmt.run(actId, cid));
  }
  if (tagsRaw) {
    const tagList = Array.isArray(tagsRaw) ? tagsRaw : [tagsRaw];
    const stmt = db.prepare('INSERT OR IGNORE INTO activity_tags (activity_id, tag_id) VALUES (?, ?)');
    tagList.forEach(tid => stmt.run(actId, tid));
  }

  req.session.flash = { success: 'Actividad creada correctamente.' };
  res.redirect('/activities');
});

router.get('/:id/edit', (req, res) => {
  const db = getDb();
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  if (!activity) { req.session.flash = { error: 'Actividad no encontrada.' }; return res.redirect('/activities'); }

  const programs = db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY sort_order').all();
  const situations = db.prepare('SELECT * FROM learning_situations WHERE active = 1 ORDER BY title').all();
  const saberes = db.prepare('SELECT * FROM saberes WHERE active = 1 ORDER BY area, bloque, code').all();
  const criteria = db.prepare('SELECT * FROM criteria WHERE active = 1 ORDER BY code, description').all();
  const tags = db.prepare('SELECT * FROM tags WHERE active = 1 ORDER BY name').all();
  const saberCriteriaLinks = db.prepare('SELECT saber_id, criterion_id FROM saber_criteria').all();
  const selectedSaberes = db.prepare('SELECT saber_id FROM activity_saberes WHERE activity_id = ?').all(req.params.id).map(r => r.saber_id);
  const selectedCriteria = db.prepare('SELECT criterion_id FROM activity_criteria WHERE activity_id = ?').all(req.params.id).map(r => r.criterion_id);
  const selectedTags = db.prepare('SELECT tag_id FROM activity_tags WHERE activity_id = ?').all(req.params.id).map(r => r.tag_id);
  const availableLevels = EDUCATION_LEVELS;
  const selectedLevels = activity.levels ? activity.levels.split(',').filter(Boolean) : [];

  res.render('activities/form', {
    title: 'Editar Actividad', activity, programs, situations, saberes, criteria, tags,
    saberCriteriaLinks, selectedSaberes, selectedCriteria, availableLevels, selectedLevels, selectedTags
  });
});

router.post('/:id', (req, res) => {
  const db = getDb();
  const { name, description, program_id, duration, materials, situation_id, active, criteria } = req.body;
  const saberesRaw = req.body.saberes;
  const levelsRaw = req.body.levels;
  const levelsStr = levelsRaw ? (Array.isArray(levelsRaw) ? levelsRaw : [levelsRaw]).join(',') : '';
  const tagsRaw = req.body.tags;

  db.prepare(`
    UPDATE activities SET name=?, description=?, program_id=?, duration=?, materials=?, situation_id=?, levels=?, active=?
    WHERE id=?
  `).run(name, description, program_id, duration || 30, materials, situation_id || null, levelsStr, active === 'on' ? 1 : 0, req.params.id);

  db.prepare('DELETE FROM activity_saberes WHERE activity_id = ?').run(req.params.id);
  db.prepare('DELETE FROM activity_criteria WHERE activity_id = ?').run(req.params.id);
  db.prepare('DELETE FROM activity_tags WHERE activity_id = ?').run(req.params.id);

  if (saberesRaw) {
    const list = Array.isArray(saberesRaw) ? saberesRaw : [saberesRaw];
    const stmt = db.prepare('INSERT OR IGNORE INTO activity_saberes (activity_id, saber_id) VALUES (?, ?)');
    list.forEach(sid => stmt.run(req.params.id, sid));
  }
  if (criteria) {
    const list = Array.isArray(criteria) ? criteria : [criteria];
    const stmt = db.prepare('INSERT OR IGNORE INTO activity_criteria (activity_id, criterion_id) VALUES (?, ?)');
    list.forEach(cid => stmt.run(req.params.id, cid));
  }
  if (tagsRaw) {
    const list = Array.isArray(tagsRaw) ? tagsRaw : [tagsRaw];
    const stmt = db.prepare('INSERT OR IGNORE INTO activity_tags (activity_id, tag_id) VALUES (?, ?)');
    list.forEach(tid => stmt.run(req.params.id, tid));
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
