const bcrypt = require('bcryptjs');
const { getDb } = require('../config/database');

function seedDatabase() {
  const db = getDb();

  // Admin user
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@colegio.es');
  if (!existingAdmin) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`).run(
      'Administrador', 'admin@colegio.es', hash, 'admin'
    );
    console.log('✓ Usuario admin creado (admin@colegio.es / admin123)');
  }

  // Programs
  const existingPrograms = db.prepare('SELECT COUNT(*) as c FROM programs').get();
  if (existingPrograms.c === 0) {
    const programs = [
      { name: 'Apoyo', description: 'Apoyo educativo individualizado', color: '#198754', icon: 'person-check', sort_order: 1 },
      { name: 'Refuerzo Educativo', description: 'Refuerzo de contenidos curriculares', color: '#0d6efd', icon: 'journal-bookmark', sort_order: 2 },
      { name: 'Razonamiento Lógico-Matemático', description: 'Desarrollo del pensamiento lógico y matemático', color: '#fd7e14', icon: 'calculator', sort_order: 3 },
      { name: 'Plan Lector', description: 'Fomento de la lectura y comprensión lectora', color: '#6f42c1', icon: 'book-open', sort_order: 4 },
    ];
    const stmt = db.prepare('INSERT INTO programs (name, description, color, icon, sort_order) VALUES (?, ?, ?, ?, ?)');
    programs.forEach(p => stmt.run(p.name, p.description, p.color, p.icon, p.sort_order));
    console.log('✓ Programas creados');
  }

  // Quick comments (general)
  const existingComments = db.prepare('SELECT COUNT(*) as c FROM quick_comments').get();
  if (existingComments.c === 0) {
    const comments = [
      // Participación
      { text: 'Participa activamente en las actividades propuestas.', category: 'participacion', program_id: null },
      { text: 'Participa cuando recibe apoyo adicional.', category: 'participacion', program_id: null },
      { text: 'Presenta dificultades para implicarse en la tarea.', category: 'participacion', program_id: null },
      // Autonomía
      { text: 'Realiza las actividades con autonomía.', category: 'autonomia', program_id: null },
      { text: 'Requiere ayuda puntual para completar las tareas.', category: 'autonomia', program_id: null },
      { text: 'Necesita supervisión continuada durante las sesiones.', category: 'autonomia', program_id: null },
      // Atención
      { text: 'Mantiene la atención durante gran parte de la sesión.', category: 'atencion', program_id: null },
      { text: 'Presenta distracciones ocasionales que afectan al rendimiento.', category: 'atencion', program_id: null },
      { text: 'Tiene dificultades para sostener la atención en las tareas.', category: 'atencion', program_id: null },
      // Aprendizaje
      { text: 'Muestra una evolución positiva respecto a sesiones anteriores.', category: 'aprendizaje', program_id: null },
      { text: 'Mantiene un nivel similar al previamente observado.', category: 'aprendizaje', program_id: null },
      { text: 'Precisa continuar reforzando los contenidos trabajados.', category: 'aprendizaje', program_id: null },
      // Estrategias
      { text: 'Aplica estrategias previamente enseñadas de forma adecuada.', category: 'estrategias', program_id: null },
      { text: 'Necesita recordatorios para utilizar las estrategias trabajadas.', category: 'estrategias', program_id: null },
      { text: 'Aún no generaliza los aprendizajes adquiridos.', category: 'estrategias', program_id: null },
    ];

    // Program-specific comments (added after programs are inserted)
    const programs = db.prepare('SELECT id, name FROM programs').all();
    const apoyo = programs.find(p => p.name === 'Apoyo');
    const refuerzo = programs.find(p => p.name === 'Refuerzo Educativo');
    const logico = programs.find(p => p.name === 'Razonamiento Lógico-Matemático');
    const lector = programs.find(p => p.name === 'Plan Lector');

    if (apoyo) {
      comments.push(
        { text: 'Se beneficia de las adaptaciones y apoyos proporcionados.', category: 'programa', program_id: apoyo.id },
        { text: 'Precisa apoyos continuados para acceder al currículo.', category: 'programa', program_id: apoyo.id },
        { text: 'Muestra avances progresivos en su nivel de autonomía.', category: 'programa', program_id: apoyo.id }
      );
    }
    if (refuerzo) {
      comments.push(
        { text: 'Consolida progresivamente los aprendizajes previos.', category: 'programa', program_id: refuerzo.id },
        { text: 'Necesita reforzar contenidos básicos del nivel.', category: 'programa', program_id: refuerzo.id },
        { text: 'Generaliza progresivamente los aprendizajes al aula ordinaria.', category: 'programa', program_id: refuerzo.id }
      );
    }
    if (logico) {
      comments.push(
        { text: 'Utiliza diferentes estrategias de resolución de problemas.', category: 'programa', program_id: logico.id },
        { text: 'Requiere guía para seleccionar el procedimiento adecuado.', category: 'programa', program_id: logico.id },
        { text: 'Explica el proceso de resolución seguido con claridad.', category: 'programa', program_id: logico.id }
      );
    }
    if (lector) {
      comments.push(
        { text: 'Mejora progresivamente su fluidez y velocidad lectora.', category: 'programa', program_id: lector.id },
        { text: 'Comprende la información explícita de los textos.', category: 'programa', program_id: lector.id },
        { text: 'Necesita apoyo para realizar inferencias y comprensión profunda.', category: 'programa', program_id: lector.id }
      );
    }

    const stmt = db.prepare('INSERT INTO quick_comments (text, category, program_id) VALUES (?, ?, ?)');
    comments.forEach(c => stmt.run(c.text, c.category, c.program_id));
    console.log('✓ Comentarios rápidos creados');
  }

  // Center settings
  const existingSettings = db.prepare('SELECT COUNT(*) as c FROM center_settings').get();
  if (existingSettings.c === 0) {
    const settings = [
      ['center_name', 'Colegio de Educación Primaria'],
      ['school_year', '2024-2025'],
      ['logo_path', ''],
      ['footer_text', ''],
      ['backup_retention_days', '30'],
      ['backup_time', '02:00'],
      ['drive_enabled', '0'],
    ];
    const stmt = db.prepare('INSERT INTO center_settings (key, value) VALUES (?, ?)');
    settings.forEach(s => stmt.run(s[0], s[1]));
  }

  // Sample activities
  const existingActivities = db.prepare('SELECT COUNT(*) as c FROM activities').get();
  if (existingActivities.c === 0) {
    const programs = db.prepare('SELECT id, name FROM programs').all();
    const apoyo = programs.find(p => p.name === 'Apoyo');
    const refuerzo = programs.find(p => p.name === 'Refuerzo Educativo');
    const logico = programs.find(p => p.name === 'Razonamiento Lógico-Matemático');
    const lector = programs.find(p => p.name === 'Plan Lector');

    const activities = [];
    if (apoyo) activities.push(
      { name: 'Adaptación de contenidos de Lengua', description: 'Adaptación curricular de contenidos de Lengua Castellana', program_id: apoyo.id, duration: 45 },
      { name: 'Adaptación de contenidos de Matemáticas', description: 'Adaptación curricular de contenidos matemáticos', program_id: apoyo.id, duration: 45 },
      { name: 'Trabajo con materiales manipulativos', description: 'Uso de materiales concretos para facilitar el aprendizaje', program_id: apoyo.id, duration: 30 }
    );
    if (refuerzo) activities.push(
      { name: 'Refuerzo de lectoescritura', description: 'Consolidación de la lectura y escritura', program_id: refuerzo.id, duration: 30 },
      { name: 'Refuerzo de operaciones básicas', description: 'Práctica de suma, resta, multiplicación y división', program_id: refuerzo.id, duration: 30 },
      { name: 'Resolución de problemas matemáticos', description: 'Práctica de resolución de problemas del nivel', program_id: refuerzo.id, duration: 45 }
    );
    if (logico) activities.push(
      { name: 'Puzzles y rompecabezas lógicos', description: 'Actividades de razonamiento espacial y lógico', program_id: logico.id, duration: 30 },
      { name: 'Secuencias y patrones', description: 'Identificación y creación de patrones numéricos y visuales', program_id: logico.id, duration: 30 },
      { name: 'Juegos de estrategia', description: 'Juegos que desarrollan el pensamiento estratégico', program_id: logico.id, duration: 45 }
    );
    if (lector) activities.push(
      { name: 'Lectura en voz alta', description: 'Práctica de lectura oral con seguimiento de fluidez', program_id: lector.id, duration: 20 },
      { name: 'Comprensión lectora - preguntas', description: 'Respuesta a preguntas sobre el texto leído', program_id: lector.id, duration: 30 },
      { name: 'Resumen y síntesis de textos', description: 'Elaboración de resúmenes del texto trabajado', program_id: lector.id, duration: 30 }
    );

    const stmt = db.prepare('INSERT INTO activities (name, description, program_id, duration) VALUES (?, ?, ?, ?)');
    activities.forEach(a => stmt.run(a.name, a.description, a.program_id, a.duration));
    console.log('✓ Actividades de ejemplo creadas');
  }

  // Sample students
  const existingStudents = db.prepare('SELECT COUNT(*) as c FROM students').get();
  if (existingStudents.c === 0) {
    const students = [
      { name: 'Ana', surname: 'García Martínez', course: '3º', group_name: 'A' },
      { name: 'Carlos', surname: 'López Sánchez', course: '3º', group_name: 'A' },
      { name: 'María', surname: 'Fernández Ruiz', course: '4º', group_name: 'B' },
      { name: 'Pablo', surname: 'Martínez Torres', course: '4º', group_name: 'B' },
      { name: 'Lucía', surname: 'González Díaz', course: '5º', group_name: 'A' },
    ];
    const stmt = db.prepare('INSERT INTO students (name, surname, course, group_name) VALUES (?, ?, ?, ?)');
    students.forEach(s => stmt.run(s.name, s.surname, s.course, s.group_name));
    console.log('✓ Alumnado de ejemplo creado');
  }
}

module.exports = { seedDatabase };
