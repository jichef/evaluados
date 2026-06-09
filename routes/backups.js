const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const { getDb } = require('../config/database');
const backup = require('../services/backup');
const router = express.Router();

router.use(requireAdmin);

router.get('/', (req, res) => {
  const db = getDb();
  const logs = db.prepare('SELECT * FROM backup_log ORDER BY created_at DESC LIMIT 30').all();
  const settings = {};
  db.prepare('SELECT * FROM center_settings').all().forEach(r => { settings[r.key] = r.value; });
  res.render('admin/backups', { title: 'Copias de Seguridad', logs, settings });
});

router.post('/create', async (req, res) => {
  try {
    const filePath = await backup.createBackup('manual');
    req.session.flash = { success: `Copia de seguridad creada: ${require('path').basename(filePath)}` };
  } catch (err) {
    req.session.flash = { error: 'Error al crear la copia: ' + err.message };
  }
  res.redirect('/admin/backups');
});

router.post('/restore/:id', async (req, res) => {
  const db = getDb();
  const log = db.prepare('SELECT * FROM backup_log WHERE id = ?').get(req.params.id);
  if (!log || !log.filepath) {
    req.session.flash = { error: 'Copia de seguridad no encontrada.' };
    return res.redirect('/admin/backups');
  }
  try {
    await backup.restoreBackup(log.filepath);
    req.session.flash = { success: 'Copia restaurada. Por favor, reinicia el servidor.' };
  } catch (err) {
    req.session.flash = { error: 'Error al restaurar: ' + err.message };
  }
  res.redirect('/admin/backups');
});

router.get('/download/:id', (req, res) => {
  const db = getDb();
  const log = db.prepare('SELECT * FROM backup_log WHERE id = ?').get(req.params.id);
  if (!log || !log.filepath) {
    req.session.flash = { error: 'Archivo no encontrado.' };
    return res.redirect('/admin/backups');
  }
  res.download(log.filepath, log.filename);
});

module.exports = router;
