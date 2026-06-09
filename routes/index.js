const express = require('express');
const { getDb } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const todaySessions = db.prepare(`
    SELECT sl.*, s.name || ' ' || s.surname AS student_name, a.name AS activity_name, p.name AS program_name, p.color
    FROM sessions_log sl
    JOIN students s ON sl.student_id = s.id
    JOIN activities a ON sl.activity_id = a.id
    JOIN programs p ON sl.program_id = p.id
    WHERE sl.session_date = ? AND sl.teacher_id = ?
    ORDER BY sl.created_at DESC
  `).all(today, req.session.user.id);

  const stats = db.prepare(`
    SELECT
      COUNT(DISTINCT student_id) AS students_count,
      COUNT(*) AS sessions_count
    FROM sessions_log
    WHERE session_date = ? AND teacher_id = ?
  `).get(today, req.session.user.id);

  const weekStats = db.prepare(`
    SELECT COUNT(*) AS count FROM sessions_log
    WHERE session_date >= date('now', '-7 days') AND teacher_id = ?
  `).get(req.session.user.id);

  const recentStudents = db.prepare(`
    SELECT DISTINCT s.id, s.name, s.surname, s.course, s.group_name,
           MAX(sl.session_date) AS last_session
    FROM sessions_log sl
    JOIN students s ON sl.student_id = s.id
    WHERE sl.teacher_id = ?
    GROUP BY s.id
    ORDER BY last_session DESC
    LIMIT 5
  `).all(req.session.user.id);

  const centerName = db.prepare("SELECT value FROM center_settings WHERE key = 'center_name'").get();
  const schoolYear = db.prepare("SELECT value FROM center_settings WHERE key = 'school_year'").get();

  res.render('dashboard', {
    title: 'Inicio',
    todaySessions,
    stats: stats || { students_count: 0, sessions_count: 0 },
    weekStats: weekStats || { count: 0 },
    recentStudents,
    centerName: centerName?.value || 'Centro Educativo',
    schoolYear: schoolYear?.value || '2024-2025',
  });
});

module.exports = router;
