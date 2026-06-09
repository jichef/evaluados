const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { DB_PATH, getDb } = require('../config/database');

const BACKUP_DIR = path.join(__dirname, '../data/backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function createBackup(type = 'manual') {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup_${type}_${timestamp}.zip`;
    const filepath = path.join(BACKUP_DIR, filename);

    const output = fs.createWriteStream(filepath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const size = archive.pointer();
      const db = getDb();
      db.prepare(`
        INSERT INTO backup_log (filename, filepath, size, type, status) VALUES (?, ?, ?, ?, ?)
      `).run(filename, filepath, size, type, 'ok');

      // Clean old backups
      cleanOldBackups();

      resolve(filepath);
    });

    archive.on('error', reject);
    archive.pipe(output);
    archive.file(DB_PATH, { name: path.basename(DB_PATH) });
    archive.finalize();
  });
}

function cleanOldBackups() {
  try {
    const db = getDb();
    const retentionRow = db.prepare("SELECT value FROM center_settings WHERE key = 'backup_retention_days'").get();
    const days = parseInt(retentionRow?.value || '30');
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const old = db.prepare("SELECT * FROM backup_log WHERE created_at < ? AND type != 'manual'").all(cutoff.toISOString());
    old.forEach(b => {
      if (b.filepath && fs.existsSync(b.filepath)) {
        fs.unlinkSync(b.filepath);
      }
      db.prepare('DELETE FROM backup_log WHERE id = ?').run(b.id);
    });
  } catch (e) {
    console.error('Error cleaning backups:', e.message);
  }
}

async function restoreBackup(zipPath) {
  const AdmZip = require('adm-zip');
  const zip = new AdmZip(zipPath);
  const dbEntry = zip.getEntry(path.basename(DB_PATH));
  if (!dbEntry) throw new Error('Archivo de base de datos no encontrado en el zip.');

  // Create a backup of current DB before restoring
  const backupOfCurrent = DB_PATH + '.bak.' + Date.now();
  fs.copyFileSync(DB_PATH, backupOfCurrent);

  zip.extractEntryTo(dbEntry, path.dirname(DB_PATH), false, true);
}

module.exports = { createBackup, restoreBackup, cleanOldBackups };
