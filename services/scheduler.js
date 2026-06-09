const cron = require('node-cron');
const { createBackup } = require('./backup');
const { getDb } = require('../config/database');

function init() {
  // Daily backup at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[Scheduler] Iniciando copia de seguridad diaria...');
    try {
      const file = await createBackup('daily');
      console.log(`[Scheduler] Copia diaria creada: ${file}`);
    } catch (err) {
      console.error('[Scheduler] Error en copia diaria:', err.message);
    }
  });

  // Weekly backup on Sunday at 3:00 AM
  cron.schedule('0 3 * * 0', async () => {
    console.log('[Scheduler] Iniciando copia de seguridad semanal...');
    try {
      const file = await createBackup('weekly');
      console.log(`[Scheduler] Copia semanal creada: ${file}`);
    } catch (err) {
      console.error('[Scheduler] Error en copia semanal:', err.message);
    }
  });

  console.log('✓ Tareas programadas configuradas (backup diario 02:00, semanal domingos 03:00)');
}

module.exports = { init };
