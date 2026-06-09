const express = require('express');
const { getDb } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.use(requireAuth);

// Report selector
router.get('/', (req, res) => {
  const db = getDb();
  const students = db.prepare('SELECT id, name, surname, course, group_name FROM students WHERE active = 1 ORDER BY surname, name').all();
  const programs = db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY sort_order').all();
  const groups = db.prepare("SELECT DISTINCT course, group_name FROM students WHERE active=1 ORDER BY course, group_name").all();
  res.render('reports/index', { title: 'Informes', students, programs, groups });
});

// Individual student report
router.get('/student/:id', (req, res) => {
  const db = getDb();
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) {
    req.session.flash = { error: 'Alumno no encontrado.' };
    return res.redirect('/reports');
  }

  const { date_from, date_to, program_id } = req.query;
  let where = 'WHERE sl.student_id = ?';
  const params = [req.params.id];
  if (program_id) { where += ' AND sl.program_id = ?'; params.push(program_id); }
  if (date_from) { where += ' AND sl.session_date >= ?'; params.push(date_from); }
  if (date_to) { where += ' AND sl.session_date <= ?'; params.push(date_to); }

  const sessions = db.prepare(`
    SELECT sl.*, a.name AS activity_name, a.description AS activity_desc,
           p.name AS program_name, p.color,
           u.name AS teacher_name,
           ls.title AS situation_title
    FROM sessions_log sl
    JOIN activities a ON sl.activity_id = a.id
    JOIN programs p ON sl.program_id = p.id
    JOIN users u ON sl.teacher_id = u.id
    LEFT JOIN learning_situations ls ON sl.situation_id = ls.id
    ${where}
    ORDER BY sl.session_date ASC, sl.created_at ASC
  `).all(...params);

  // Criteria evolution
  const criteriaEvolution = db.prepare(`
    SELECT c.code, c.description, c.area,
           COUNT(sc.id) AS times_worked,
           SUM(CASE WHEN sc.rating = 'conseguido' THEN 1 ELSE 0 END) AS conseguido,
           SUM(CASE WHEN sc.rating = 'en_proceso' THEN 1 ELSE 0 END) AS en_proceso,
           SUM(CASE WHEN sc.rating = 'necesita_apoyo' THEN 1 ELSE 0 END) AS necesita_apoyo,
           MAX(sc.rating) AS last_rating
    FROM session_criteria sc
    JOIN criteria c ON sc.criterion_id = c.id
    JOIN sessions_log sl ON sc.session_id = sl.id
    ${where.replace('WHERE sl.', 'WHERE sl.')}
    GROUP BY c.id ORDER BY c.area, c.code
  `).all(...params);

  // Program breakdown
  const programBreakdown = db.prepare(`
    SELECT p.name, p.color, COUNT(*) AS count,
           SUM(CASE WHEN sl.rating = 'conseguido' THEN 1 ELSE 0 END) AS conseguido,
           SUM(CASE WHEN sl.rating = 'en_proceso' THEN 1 ELSE 0 END) AS en_proceso,
           SUM(CASE WHEN sl.rating = 'necesita_apoyo' THEN 1 ELSE 0 END) AS necesita_apoyo
    FROM sessions_log sl
    JOIN programs p ON sl.program_id = p.id
    ${where}
    GROUP BY p.id ORDER BY count DESC
  `).all(...params);

  // Teachers involved
  const teachers = db.prepare(`
    SELECT DISTINCT u.name FROM sessions_log sl
    JOIN users u ON sl.teacher_id = u.id
    ${where}
  `).all(...params);

  // Auto-generate observations
  const strengths = [];
  const improvements = [];

  if (sessions.length > 0) {
    const totalR = sessions.filter(s => s.rating).length;
    const conseguidos = sessions.filter(s => s.rating === 'conseguido').length;
    const ratio = totalR > 0 ? conseguidos / totalR : 0;

    if (ratio >= 0.6) strengths.push('El alumno/a muestra un nivel de logro positivo en las actividades trabajadas.');
    if (ratio < 0.3) improvements.push('El alumno/a precisa continuar trabajando para consolidar los aprendizajes propuestos.');

    const commentTexts = sessions.map(s => s.observations).filter(Boolean).join(' ');
    if (commentTexts.includes('autonomía') || commentTexts.includes('autonomia') || commentTexts.includes('autónomo')) {
      strengths.push('Muestra avances en su nivel de autonomía durante las sesiones.');
    }
    if (commentTexts.includes('participa activamente')) {
      strengths.push('Participa activamente en las actividades propuestas.');
    }
    if (commentTexts.includes('necesita apoyo') || commentTexts.includes('supervisión')) {
      improvements.push('Continúa necesitando apoyos puntuales para la realización de determinadas tareas.');
    }
    if (sessions.length >= 5) {
      const recent = sessions.slice(-3);
      const recentConseguidos = recent.filter(s => s.rating === 'conseguido').length;
      if (recentConseguidos >= 2) strengths.push('Se observa una evolución positiva en las últimas sesiones trabajadas.');
    }
  }

  if (!strengths.length) strengths.push('El alumno/a ha participado en las actividades propuestas dentro del programa.');
  if (!improvements.length && sessions.length > 0) improvements.push('Se recomienda continuar con el seguimiento para consolidar los aprendizajes iniciados.');

  const programs = db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY sort_order').all();
  const centerSettings = {};
  db.prepare('SELECT * FROM center_settings').all().forEach(r => { centerSettings[r.key] = r.value; });

  res.render('reports/student', {
    title: `Informe: ${student.name} ${student.surname}`,
    student,
    sessions,
    criteriaEvolution,
    programBreakdown,
    teachers: teachers.map(t => t.name),
    strengths,
    improvements,
    filters: { date_from, date_to, program_id },
    programs,
    centerSettings,
    print: req.query.print === '1',
  });
});

// Group report
router.get('/group', (req, res) => {
  const db = getDb();
  const { course, group_name, program_id, date_from, date_to } = req.query;

  if (!course && !group_name) {
    return res.redirect('/reports');
  }

  let studentWhere = 'WHERE s.active = 1';
  const studentParams = [];
  if (course) { studentWhere += ' AND s.course = ?'; studentParams.push(course); }
  if (group_name) { studentWhere += ' AND s.group_name = ?'; studentParams.push(group_name); }

  const students = db.prepare(`SELECT * FROM students ${studentWhere} ORDER BY s.surname, s.name`).all(...studentParams);

  const rows = students.map(student => {
    let where = 'WHERE sl.student_id = ?';
    const params = [student.id];
    if (program_id) { where += ' AND sl.program_id = ?'; params.push(program_id); }
    if (date_from) { where += ' AND sl.session_date >= ?'; params.push(date_from); }
    if (date_to) { where += ' AND sl.session_date <= ?'; params.push(date_to); }

    const stats = db.prepare(`
      SELECT COUNT(*) AS total,
        SUM(CASE WHEN rating = 'conseguido' THEN 1 ELSE 0 END) AS conseguido,
        SUM(CASE WHEN rating = 'en_proceso' THEN 1 ELSE 0 END) AS en_proceso,
        SUM(CASE WHEN rating = 'necesita_apoyo' THEN 1 ELSE 0 END) AS necesita_apoyo
      FROM sessions_log sl ${where}
    `).get(...params);

    return { student, stats };
  });

  const programs = db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY sort_order').all();
  const centerSettings = {};
  db.prepare('SELECT * FROM center_settings').all().forEach(r => { centerSettings[r.key] = r.value; });

  res.render('reports/group', {
    title: `Informe Grupal – ${course || ''} ${group_name || ''}`,
    rows,
    course, group_name,
    filters: { program_id, date_from, date_to },
    programs,
    centerSettings,
    print: req.query.print === '1',
  });
});

module.exports = router;
