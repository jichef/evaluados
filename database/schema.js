const { getDb } = require('../config/database');

function initDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'teacher',
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      surname TEXT NOT NULL,
      course TEXT,
      group_name TEXT,
      notes TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#0d6efd',
      icon TEXT DEFAULT 'book',
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS learning_situations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      course TEXT,
      areas TEXT,
      period TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS objectives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      area TEXT,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS criteria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT,
      description TEXT NOT NULL,
      area TEXT,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      program_id INTEGER,
      duration INTEGER DEFAULT 30,
      materials TEXT,
      situation_id INTEGER,
      active INTEGER DEFAULT 1,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (program_id) REFERENCES programs(id),
      FOREIGN KEY (situation_id) REFERENCES learning_situations(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activity_objectives (
      activity_id INTEGER,
      objective_id INTEGER,
      PRIMARY KEY (activity_id, objective_id),
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
      FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_criteria (
      activity_id INTEGER,
      criterion_id INTEGER,
      PRIMARY KEY (activity_id, criterion_id),
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
      FOREIGN KEY (criterion_id) REFERENCES criteria(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      activity_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      program_id INTEGER NOT NULL,
      situation_id INTEGER,
      rating TEXT,
      observations TEXT,
      quick_comments_text TEXT,
      session_date DATE DEFAULT (date('now')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (activity_id) REFERENCES activities(id),
      FOREIGN KEY (teacher_id) REFERENCES users(id),
      FOREIGN KEY (program_id) REFERENCES programs(id)
    );

    CREATE TABLE IF NOT EXISTS session_criteria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      criterion_id INTEGER NOT NULL,
      rating TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions_log(id) ON DELETE CASCADE,
      FOREIGN KEY (criterion_id) REFERENCES criteria(id)
    );

    CREATE TABLE IF NOT EXISTS quick_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      category TEXT,
      program_id INTEGER,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      FOREIGN KEY (program_id) REFERENCES programs(id)
    );

    CREATE TABLE IF NOT EXISTS favorite_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS center_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS backup_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT,
      filepath TEXT,
      size INTEGER,
      type TEXT,
      drive_file_id TEXT,
      drive_url TEXT,
      status TEXT DEFAULT 'ok',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS saberes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT,
      description TEXT NOT NULL,
      area TEXT,
      bloque TEXT,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS saber_criteria (
      saber_id INTEGER NOT NULL,
      criterion_id INTEGER NOT NULL,
      PRIMARY KEY (saber_id, criterion_id),
      FOREIGN KEY (saber_id) REFERENCES saberes(id) ON DELETE CASCADE,
      FOREIGN KEY (criterion_id) REFERENCES criteria(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_saberes (
      activity_id INTEGER NOT NULL,
      saber_id INTEGER NOT NULL,
      PRIMARY KEY (activity_id, saber_id),
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
      FOREIGN KEY (saber_id) REFERENCES saberes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#0d6efd',
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS activity_tags (
      activity_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (activity_id, tag_id),
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_student ON sessions_log(student_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON sessions_log(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions_log(session_date);
    CREATE INDEX IF NOT EXISTS idx_activities_program ON activities(program_id);
  `);

  // Safe migrations – ignore if column already exists
  try { db.exec('ALTER TABLE activities ADD COLUMN levels TEXT NOT NULL DEFAULT ""'); } catch (_) {}
  try { db.exec("ALTER TABLE programs ADD COLUMN mode TEXT NOT NULL DEFAULT 'individual'"); } catch (_) {}
  try { db.exec("ALTER TABLE sessions_log ADD COLUMN group_course TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE sessions_log ADD COLUMN group_name TEXT"); } catch (_) {}

  // Migration: remove NOT NULL from sessions_log.student_id (required for group sessions)
  try {
    const colInfo = db.prepare('PRAGMA table_info(sessions_log)').all();
    const studentIdCol = colInfo.find(c => c.name === 'student_id');
    if (studentIdCol && studentIdCol.notnull === 1) {
      db.pragma('foreign_keys = OFF');
      db.exec(`
        CREATE TABLE sessions_log_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER,
          activity_id INTEGER NOT NULL,
          teacher_id INTEGER NOT NULL,
          program_id INTEGER NOT NULL,
          situation_id INTEGER,
          rating TEXT,
          observations TEXT,
          quick_comments_text TEXT,
          session_date DATE DEFAULT (date('now')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          group_course TEXT,
          group_name TEXT,
          FOREIGN KEY (student_id) REFERENCES students(id),
          FOREIGN KEY (activity_id) REFERENCES activities(id),
          FOREIGN KEY (teacher_id) REFERENCES users(id),
          FOREIGN KEY (program_id) REFERENCES programs(id)
        );
        INSERT INTO sessions_log_new
          SELECT id, student_id, activity_id, teacher_id, program_id, situation_id,
                 rating, observations, quick_comments_text, session_date, created_at,
                 group_course, group_name
          FROM sessions_log;
        DROP TABLE sessions_log;
        ALTER TABLE sessions_log_new RENAME TO sessions_log;
        CREATE INDEX IF NOT EXISTS idx_sessions_student ON sessions_log(student_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON sessions_log(teacher_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions_log(session_date);
      `);
      db.pragma('foreign_keys = ON');
      console.log('✓ Migración: sessions_log.student_id permite NULL (sesiones grupales)');
    }
  } catch (migErr) {
    console.error('Error en migración sessions_log:', migErr.message);
  }

  // Programaciones anuales
  db.exec(`
    CREATE TABLE IF NOT EXISTS programmings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      program_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      course TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (program_id) REFERENCES programs(id),
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS programming_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      programming_id INTEGER NOT NULL,
      activity_id INTEGER NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (programming_id) REFERENCES programmings(id) ON DELETE CASCADE,
      FOREIGN KEY (activity_id) REFERENCES activities(id)
    );
  `);

  console.log('✓ Base de datos inicializada');
}

module.exports = { initDatabase };
