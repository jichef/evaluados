const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const { getDb } = require('../config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(requireAuth);

// List students
router.get('/', (req, res) => {
  const db = getDb();
  const { q, course, group } = req.query;
  let where = 'WHERE active = 1';
  const params = [];
  if (q) { where += ' AND (name LIKE ? OR surname LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  if (course) { where += ' AND course = ?'; params.push(course); }
  if (group) { where += ' AND group_name = ?'; params.push(group); }

  const students = db.prepare(`SELECT * FROM students ${where} ORDER BY surname, name`).all(...params);
  const courses = db.prepare('SELECT DISTINCT course FROM students WHERE active = 1 AND course IS NOT NULL ORDER BY course').all();
  const groups = db.prepare('SELECT DISTINCT group_name FROM students WHERE active = 1 AND group_name IS NOT NULL ORDER BY group_name').all();

  res.render('students/index', {
    title: 'Alumnado',
    students,
    courses,
    groups,
    filters: { q, course, group },
  });
});

// New student form
router.get('/new', requireAdmin, (req, res) => {
  res.render('students/form', { title: 'Nuevo Alumno', student: null });
});

// Create student
router.post('/', requireAdmin, (req, res) => {
  const db = getDb();
  const { name, surname, course, group_name, notes } = req.body;
  if (!name || !surname) {
    return res.render('students/form', {
      title: 'Nuevo Alumno',
      student: req.body,
      error: 'Nombre y apellidos son obligatorios.'
    });
  }
  db.prepare('INSERT INTO students (name, surname, course, group_name, notes) VALUES (?, ?, ?, ?, ?)').run(name, surname, course, group_name, notes);
  req.session.flash = { success: 'Alumno/a creado correctamente.' };
  res.redirect('/students');
});

// Show student profile + history
router.get('/:id', (req, res) => {
  const db = getDb();
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) {
    req.session.flash = { error: 'Alumno no encontrado.' };
    return res.redirect('/students');
  }

  const { program_id, date_from, date_to } = req.query;
  let where = 'WHERE sl.student_id = ?';
  const params = [req.params.id];
  if (program_id) { where += ' AND sl.program_id = ?'; params.push(program_id); }
  if (date_from) { where += ' AND sl.session_date >= ?'; params.push(date_from); }
  if (date_to) { where += ' AND sl.session_date <= ?'; params.push(date_to); }

  const sessions = db.prepare(`
    SELECT sl.*, a.name AS activity_name, p.name AS program_name, p.color,
           u.name AS teacher_name, ls.title AS situation_title
    FROM sessions_log sl
    JOIN activities a ON sl.activity_id = a.id
    JOIN programs p ON sl.program_id = p.id
    JOIN users u ON sl.teacher_id = u.id
    LEFT JOIN learning_situations ls ON sl.situation_id = ls.id
    ${where}
    ORDER BY sl.session_date DESC, sl.created_at DESC
  `).all(...params);

  const stats = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN rating = 'conseguido' THEN 1 ELSE 0 END) AS conseguido,
      SUM(CASE WHEN rating = 'en_proceso' THEN 1 ELSE 0 END) AS en_proceso,
      SUM(CASE WHEN rating = 'necesita_apoyo' THEN 1 ELSE 0 END) AS necesita_apoyo
    FROM sessions_log sl ${where}
  `).get(...params);

  const programBreakdown = db.prepare(`
    SELECT p.name, p.color, COUNT(*) AS count
    FROM sessions_log sl
    JOIN programs p ON sl.program_id = p.id
    ${where}
    GROUP BY p.id ORDER BY count DESC
  `).all(...params);

  const programs = db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY sort_order').all();

  res.render('students/show', {
    title: `${student.name} ${student.surname}`,
    student,
    sessions,
    stats: stats || {},
    programBreakdown,
    programs,
    filters: { program_id, date_from, date_to },
  });
});

// Edit form
router.get('/:id/edit', requireAdmin, (req, res) => {
  const db = getDb();
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) {
    req.session.flash = { error: 'Alumno no encontrado.' };
    return res.redirect('/students');
  }
  res.render('students/form', { title: 'Editar Alumno', student });
});

// Update
router.post('/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const { name, surname, course, group_name, notes, active } = req.body;
  db.prepare('UPDATE students SET name=?, surname=?, course=?, group_name=?, notes=?, active=? WHERE id=?').run(
    name, surname, course, group_name, notes, active === 'on' ? 1 : 0, req.params.id
  );
  req.session.flash = { success: 'Alumno/a actualizado correctamente.' };
  res.redirect(`/students/${req.params.id}`);
});

// Import form
router.get('/import/excel', requireAdmin, (req, res) => {
  res.render('students/import', { title: 'Importar Alumnado', preview: null });
});

// Import preview + process
router.post('/import/excel', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.render('students/import', { title: 'Importar Alumnado', preview: null, error: 'Selecciona un archivo Excel.' });
  }

  try {
    const workbook = xlsx.read(req.file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    if (!rows.length) {
      return res.render('students/import', { title: 'Importar Alumnado', preview: null, error: 'El archivo está vacío.' });
    }

    const db = getDb();
    const preview = rows.slice(0, 20).map(row => ({
      name: row['Nombre'] || row['name'] || '',
      surname: row['Apellidos'] || row['surname'] || '',
      course: row['Curso'] || row['course'] || '',
      group_name: row['Grupo'] || row['group_name'] || '',
    }));

    if (req.body.confirm === '1') {
      const stmt = db.prepare('INSERT INTO students (name, surname, course, group_name) VALUES (?, ?, ?, ?)');
      let inserted = 0, skipped = 0;

      const insertMany = db.transaction((rows) => {
        for (const row of rows) {
          const name = row['Nombre'] || row['name'] || '';
          const surname = row['Apellidos'] || row['surname'] || '';
          if (!name || !surname) { skipped++; continue; }
          const exists = db.prepare('SELECT id FROM students WHERE name = ? AND surname = ?').get(name, surname);
          if (exists) { skipped++; continue; }
          stmt.run(name, surname, row['Curso'] || row['course'] || '', row['Grupo'] || row['group_name'] || '');
          inserted++;
        }
      });
      insertMany(rows);

      req.session.flash = { success: `Importación completada: ${inserted} alumnos añadidos, ${skipped} omitidos.` };
      return res.redirect('/students');
    }

    res.render('students/import', { title: 'Importar Alumnado', preview, totalRows: rows.length, fileData: req.file.buffer.toString('base64') });

  } catch (err) {
    res.render('students/import', { title: 'Importar Alumnado', preview: null, error: 'Error al procesar el archivo: ' + err.message });
  }
});

module.exports = router;
