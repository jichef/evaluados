'use strict';
const { getDb } = require('../config/database');

const db = getDb();

// ── 1. Asociar criterios y saberes a actividades ─────────────────────────────

const activityLinks = [
  // Actividad 1 – Adaptación de contenidos de Lengua
  {
    id: 1,
    criteria: [1, 2, 5, 6, 9, 10],        // LCL.1.1, LCL.1.2, LCL.2.1, LCL.2.2, LCL.3.1, LCL.3.2
    saberes:  [1, 2, 6, 7, 12, 13],        // LCL-A.1, LCL-A.2, LCL-B.1, LCL-B.2, LCL-C.1, LCL-C.2
  },
  // Actividad 2 – Adaptación de contenidos de Matemáticas
  {
    id: 2,
    criteria: [28, 29, 34, 35, 38, 39],    // MAT.1.1, MAT.1.2, MAT.2.1, MAT.2.2, MAT.3.1, MAT.3.2
    saberes:  [19, 20, 26, 27, 30, 31],    // MAT-A.1, MAT-A.2, MAT-B.1, MAT-B.2, MAT-C.1, MAT-C.2
  },
  // Actividad 3 – Trabajo con materiales manipulativos
  {
    id: 3,
    criteria: [34, 35, 36, 38],            // MAT.2.1–MAT.2.3, MAT.3.1
    saberes:  [26, 27, 28, 30],
  },
  // Actividad 4 – Refuerzo de lectoescritura
  {
    id: 4,
    criteria: [1, 2, 3, 5, 6, 7],         // LCL.1.1–LCL.1.3, LCL.2.1–LCL.2.3
    saberes:  [1, 2, 3, 6, 7, 8],
  },
  // Actividad 5 – Refuerzo de operaciones básicas
  {
    id: 5,
    criteria: [28, 29, 30, 31],            // MAT.1.1–MAT.1.4
    saberes:  [19, 20, 21, 22],
  },
  // Actividad 6 – Resolución de problemas matemáticos
  {
    id: 6,
    criteria: [38, 39, 40, 43, 44],        // MAT.3.1–MAT.3.3, MAT.4.1–MAT.4.2
    saberes:  [30, 31, 32, 36, 37],
  },
  // Actividad 7 – Puzzles y rompecabezas lógicos
  {
    id: 7,
    criteria: [43, 44, 47, 48],            // MAT.4.1–MAT.4.2, MAT.5.1–MAT.5.2
    saberes:  [36, 37, 40, 41],
  },
  // Actividad 8 – Secuencias y patrones
  {
    id: 8,
    criteria: [34, 35, 38, 39],            // MAT.2.1–MAT.2.2, MAT.3.1–MAT.3.2
    saberes:  [26, 27, 30, 31],
  },
  // Actividad 9 – Juegos de estrategia
  {
    id: 9,
    criteria: [43, 44, 47, 48, 51, 52],   // MAT.4.1–MAT.4.2, MAT.5.1–MAT.5.2, MAT.6.1–MAT.6.2
    saberes:  [36, 37, 40, 41, 43, 44],
  },
  // Actividad 10 – Lectura en voz alta
  {
    id: 10,
    criteria: [1, 3, 5],                   // LCL.1.1, LCL.1.3, LCL.2.1
    saberes:  [1, 3, 6],
  },
  // Actividad 11 – Comprensión lectora - preguntas
  {
    id: 11,
    criteria: [2, 4, 7, 8, 9],            // LCL.1.2, LCL.1.4, LCL.2.3, LCL.2.4, LCL.3.1
    saberes:  [2, 4, 8, 9, 12],
  },
  // Actividad 12 – Resumen y síntesis de textos
  {
    id: 12,
    criteria: [4, 7, 8, 9, 10],           // LCL.1.4, LCL.2.3, LCL.2.4, LCL.3.1, LCL.3.2
    saberes:  [4, 8, 9, 13, 14],
  },
];

const insAC = db.prepare('INSERT OR IGNORE INTO activity_criteria (activity_id, criterion_id) VALUES (?,?)');
const insAS = db.prepare('INSERT OR IGNORE INTO activity_saberes  (activity_id, saber_id)    VALUES (?,?)');

db.transaction(() => {
  for (const act of activityLinks) {
    for (const cid of act.criteria) insAC.run(act.id, cid);
    for (const sid of act.saberes)  insAS.run(act.id, sid);
  }
})();

console.log('✓ Criterios y saberes asociados a actividades');

// ── 2. Eliminar sesiones de ejemplo previas y regenerar ───────────────────────
db.prepare('DELETE FROM session_criteria').run();
db.prepare('DELETE FROM sessions_log').run();
console.log('✓ Sesiones anteriores eliminadas');

// teacher_id=1, programs: 1=Apoyo,2=Refuerzo,3=RazonLóg,4=PlanLector
// students: 1=Ana, 2=Carlos, 3=María, 4=Pablo, 5=Lucía
const ratings = ['conseguido', 'en_proceso', 'necesita_apoyo'];

const sessionData = [
  // Ana García (1) — Plan Lector
  { student_id:1, activity_id:10, program_id:4, date:'2026-02-10', rating:'en_proceso',      obs:'Lee con entonación adecuada pero pierde el ritmo en textos largos.' },
  { student_id:1, activity_id:11, program_id:4, date:'2026-02-24', rating:'necesita_apoyo',  obs:'Dificultad para identificar la idea principal del texto.' },
  { student_id:1, activity_id:12, program_id:4, date:'2026-03-10', rating:'en_proceso',      obs:'Mejora en la identificación de ideas secundarias.' },
  { student_id:1, activity_id:10, program_id:4, date:'2026-03-24', rating:'en_proceso',      obs:'Avance progresivo en la fluidez lectora.' },
  { student_id:1, activity_id:11, program_id:4, date:'2026-04-07', rating:'en_proceso',      obs:'Ya localiza la idea principal con ayuda de preguntas guía.' },
  { student_id:1, activity_id:12, program_id:4, date:'2026-04-28', rating:'conseguido',      obs:'Elabora resúmenes con estructura clara.' },
  { student_id:1, activity_id:10, program_id:4, date:'2026-05-12', rating:'conseguido',      obs:'Lectura fluida y expresiva. Gran progreso.' },
  { student_id:1, activity_id:11, program_id:4, date:'2026-05-26', rating:'conseguido',      obs:'Responde preguntas inferenciales de forma autónoma.' },

  // Carlos López (2) — Refuerzo + Razonamiento
  { student_id:2, activity_id:5,  program_id:2, date:'2026-02-10', rating:'necesita_apoyo',  obs:'Comete errores frecuentes en sumas y restas con llevadas.' },
  { student_id:2, activity_id:3,  program_id:2, date:'2026-02-24', rating:'necesita_apoyo',  obs:'Necesita supervisión constante para completar la tarea.' },
  { student_id:2, activity_id:7,  program_id:3, date:'2026-03-10', rating:'necesita_apoyo',  obs:'Le cuesta mantener la atención en la actividad.' },
  { student_id:2, activity_id:5,  program_id:2, date:'2026-03-24', rating:'en_proceso',      obs:'Mejora en sumas; persisten errores en restas.' },
  { student_id:2, activity_id:8,  program_id:3, date:'2026-04-07', rating:'en_proceso',      obs:'Identifica algunos patrones numéricos simples.' },
  { student_id:2, activity_id:7,  program_id:3, date:'2026-04-28', rating:'en_proceso',      obs:'Completa puzzles con ayuda puntual.' },
  { student_id:2, activity_id:5,  program_id:2, date:'2026-05-12', rating:'en_proceso',      obs:'Opera con más seguridad; necesita refuerzo en multiplicación.' },
  { student_id:2, activity_id:9,  program_id:3, date:'2026-05-26', rating:'en_proceso',      obs:'Usa estrategias básicas en juegos de estrategia.' },

  // María Fernández (3) — Apoyo + Lengua
  { student_id:3, activity_id:1,  program_id:1, date:'2026-02-10', rating:'necesita_apoyo',  obs:'Requiere adaptación significativa de los contenidos.' },
  { student_id:3, activity_id:4,  program_id:4, date:'2026-02-24', rating:'necesita_apoyo',  obs:'Confunde grafías similares (b/d, p/q).' },
  { student_id:3, activity_id:1,  program_id:1, date:'2026-03-10', rating:'necesita_apoyo',  obs:'Avanza muy despacio; necesita apoyo individualizado.' },
  { student_id:3, activity_id:4,  program_id:4, date:'2026-03-24', rating:'en_proceso',      obs:'Reduce confusión de grafías con el apoyo visual.' },
  { student_id:3, activity_id:10, program_id:4, date:'2026-04-07', rating:'en_proceso',      obs:'Lee sílabas directas con soltura; dificultad con trabadas.' },
  { student_id:3, activity_id:1,  program_id:1, date:'2026-04-28', rating:'en_proceso',      obs:'Comprende textos breves con apoyo de imágenes.' },
  { student_id:3, activity_id:4,  program_id:4, date:'2026-05-12', rating:'en_proceso',      obs:'Escribe frases simples con supervisión.' },
  { student_id:3, activity_id:10, program_id:4, date:'2026-05-26', rating:'en_proceso',      obs:'Progreso sostenido en lectura. Buena actitud.' },

  // Pablo Martínez (4) — Razonamiento + Plan Lector
  { student_id:4, activity_id:12, program_id:4, date:'2026-02-10', rating:'en_proceso',      obs:'Estructura el resumen pero omite ideas relevantes.' },
  { student_id:4, activity_id:7,  program_id:3, date:'2026-02-24', rating:'conseguido',      obs:'Resuelve puzzles complejos de forma autónoma.' },
  { student_id:4, activity_id:9,  program_id:3, date:'2026-03-10', rating:'conseguido',      obs:'Aplica estrategias de anticipación en juegos.' },
  { student_id:4, activity_id:12, program_id:4, date:'2026-03-24', rating:'conseguido',      obs:'Resumen bien estructurado e ideas completas.' },
  { student_id:4, activity_id:6,  program_id:3, date:'2026-04-07', rating:'conseguido',      obs:'Resuelve problemas de varios pasos con seguridad.' },
  { student_id:4, activity_id:11, program_id:4, date:'2026-04-28', rating:'conseguido',      obs:'Excelente comprensión inferencial.' },
  { student_id:4, activity_id:9,  program_id:3, date:'2026-05-12', rating:'conseguido',      obs:'Destaca en razonamiento estratégico.' },
  { student_id:4, activity_id:6,  program_id:3, date:'2026-05-26', rating:'conseguido',      obs:'Gran autonomía en resolución de problemas.' },

  // Lucía González (5) — Refuerzo + Razonamiento
  { student_id:5, activity_id:2,  program_id:1, date:'2026-02-10', rating:'en_proceso',      obs:'Aplica procedimientos con ayuda visual.' },
  { student_id:5, activity_id:8,  program_id:3, date:'2026-02-24', rating:'en_proceso',      obs:'Identifica patrones con pistas.' },
  { student_id:5, activity_id:2,  program_id:1, date:'2026-03-10', rating:'en_proceso',      obs:'Mejora en cálculo; necesita apoyo en resolución.' },
  { student_id:5, activity_id:6,  program_id:3, date:'2026-03-24', rating:'en_proceso',      obs:'Comprende el enunciado pero le cuesta el planteamiento.' },
  { student_id:5, activity_id:8,  program_id:3, date:'2026-04-07', rating:'conseguido',      obs:'Completa secuencias numéricas sin apoyo.' },
  { student_id:5, activity_id:2,  program_id:1, date:'2026-04-28', rating:'conseguido',      obs:'Opera correctamente con números naturales.' },
  { student_id:5, activity_id:6,  program_id:3, date:'2026-05-12', rating:'conseguido',      obs:'Plantea y resuelve problemas de forma autónoma.' },
  { student_id:5, activity_id:9,  program_id:3, date:'2026-05-26', rating:'conseguido',      obs:'Muy buena evolución este trimestre.' },
];

const insSL = db.prepare(`
  INSERT INTO sessions_log (student_id, activity_id, teacher_id, program_id, rating, observations, session_date)
  VALUES (?,?,?,?,?,?,?)
`);
const insSC = db.prepare(`
  INSERT INTO session_criteria (session_id, criterion_id, rating) VALUES (?,?,?)
`);

// Build activity→criteria map for quick lookup
const actCritMap = {};
activityLinks.forEach(a => { actCritMap[a.id] = a.criteria; });

// rating distribution per session (same rating for all criteria, small variation)
function variedRating(baseRating, i) {
  const order = ['necesita_apoyo','en_proceso','conseguido'];
  const base = order.indexOf(baseRating);
  const delta = (i % 3 === 1) ? -1 : (i % 3 === 2) ? 1 : 0;
  return order[Math.max(0, Math.min(2, base + delta))];
}

db.transaction(() => {
  for (const s of sessionData) {
    const res = insSL.run(s.student_id, s.activity_id, 1, s.program_id, s.rating, s.obs, s.date);
    const sesId = res.lastInsertRowid;
    const crits = actCritMap[s.activity_id] || [];
    crits.forEach((cid, i) => {
      insSC.run(sesId, cid, variedRating(s.rating, i));
    });
  }
})();

console.log(`✓ ${sessionData.length} sesiones creadas con session_criteria`);

// Summary
const totSL = db.prepare('SELECT COUNT(*) as n FROM sessions_log').get().n;
const totSC = db.prepare('SELECT COUNT(*) as n FROM session_criteria').get().n;
const totAC = db.prepare('SELECT COUNT(*) as n FROM activity_criteria').get().n;
const totAS = db.prepare('SELECT COUNT(*) as n FROM activity_saberes').get().n;
console.log(`\nResumen:`);
console.log(`  activity_criteria: ${totAC}`);
console.log(`  activity_saberes:  ${totAS}`);
console.log(`  sessions_log:      ${totSL}`);
console.log(`  session_criteria:  ${totSC}`);
