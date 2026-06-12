const express = require('express');
const { getDb } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const multer = require('multer');
const ExcelJS = require('exceljs');
const router = express.Router();

router.use(requireAuth);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── Template definitions ──────────────────────────────────
const TEMPLATES = {
  alumnos: {
    title: '📋 Importación de Alumnado',
    filename: 'Plantilla_Alumnos.xlsx',
    headerColor: '1A7340',
    lightColor: 'EAF7EF',
    columns: [
      { header: 'Nombre',    width: 18, note: 'Nombre del alumno/a (obligatorio)', required: true },
      { header: 'Apellidos', width: 26, note: 'Apellidos completos (obligatorio)', required: true },
      { header: 'Curso',     width: 12, note: 'Ej: 1º EP, 3º EP, 1º ESO…' },
      { header: 'Grupo',     width: 10, note: 'Ej: A, B, C' },
      { header: 'Notas',     width: 35, note: 'Observaciones opcionales (NEAE, etc.)' },
    ],
    examples: [
      ['María',   'García López',    '3º EP', 'A', ''],
      ['Carlos',  'Martínez Ruiz',   '3º EP', 'B', 'NEAE'],
      ['Ana',     'Fernández Sanz',  '4º EP', 'A', 'Incorporación tardía'],
      ['Lucía',   'Pérez Morales',   '5º EP', 'A', ''],
      ['Marcos',  'Domínguez Alba',  '6º EP', 'B', ''],
    ],
  },
  actividades: {
    title: '🎯 Importación de Actividades',
    filename: 'Plantilla_Actividades.xlsx',
    headerColor: '084298',
    lightColor: 'EBF2FF',
    columns: [
      { header: 'Nombre',         width: 32, note: 'Nombre de la actividad (obligatorio)', required: true },
      { header: 'Programa',       width: 20, note: 'Debe coincidir exactamente con el nombre del programa', required: true },
      { header: 'Descripción',    width: 42, note: 'Descripción breve de la actividad' },
      { header: 'Duración (min)', width: 16, note: 'Número en minutos. Por defecto: 30' },
      { header: 'Materiales',     width: 28, note: 'Materiales necesarios (opcional)' },
      { header: 'Niveles',        width: 28, note: 'Separados por coma. Vacío = todos los niveles. Ej: 3º EP,4º EP' },
    ],
    examples: [
      ['Comprensión lectora 1',   'Plan Lector',         'Lectura y comprensión de texto narrativo',     30, 'Ficha impresa',  '3º EP,4º EP'],
      ['Cálculo mental básico',   'Razonamiento Lógico', 'Operaciones básicas de cálculo mental',         20, '',              '1º EP,2º EP'],
      ['Escritura creativa',      'Plan Lector',         'Redacción libre sobre un tema propuesto',       45, 'Cuaderno',      '5º EP,6º EP'],
      ['Problemas de lógica',     'Razonamiento Lógico', 'Resolución de problemas con enunciado verbal',  30, 'Ficha',         '4º EP,5º EP,6º EP'],
      ['Lectura en voz alta',     'Plan Lector',         'Lectura expresiva de un fragmento literario',   20, 'Libro de aula', ''],
    ],
  },
  programas: {
    title: '📚 Importación de Programas',
    filename: 'Plantilla_Programas.xlsx',
    headerColor: '4A2080',
    lightColor: 'F3EEFF',
    columns: [
      { header: 'Nombre',      width: 26, note: 'Nombre del programa (obligatorio)', required: true },
      { header: 'Descripción', width: 42, note: 'Descripción del programa' },
      { header: 'Color',       width: 14, note: 'Hexadecimal. Ej: #0d6efd  (azul por defecto)' },
      { header: 'Icono',       width: 18, note: 'Icono Bootstrap Icons. Ej: book, star, calculator' },
      { header: 'Modo',        width: 14, note: 'individual  o  grupal  (individual por defecto)' },
    ],
    examples: [
      ['Plan Lector',          'Programa de fomento de la lectura',           '#0d6efd', 'book',         'individual'],
      ['Razonamiento Lógico',  'Desarrollo del pensamiento matemático',        '#198754', 'calculator',   'grupal'],
      ['Hábitos de Estudio',   'Técnicas de organización y estudio',           '#fd7e14', 'journal-check','individual'],
      ['Inteligencia Emocional','Gestión emocional y habilidades sociales',    '#6f42c1', 'heart',        'individual'],
      ['Oratoria',             'Expresión oral y argumentación',               '#dc3545', 'mic',          'grupal'],
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────
function styleHeader(cell, hexColor) {
  cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + hexColor } };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.border = {
    right:  { style: 'thin', color: { argb: 'FFFFFFFF' } },
    left:   { style: 'thin', color: { argb: 'FFFFFFFF' } },
    bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
  };
}

function styleNote(cell) {
  cell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF555555' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
  cell.alignment = { vertical: 'middle', wrapText: true };
}

function styleData(cell, even) {
  cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF2C2C2C' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: even ? 'FFFFFFFF' : 'FFFAFAFA' } };
  cell.alignment = { vertical: 'middle' };
}

// ── Download template ─────────────────────────────────────
router.get('/template/:type', async (req, res) => {
  const tpl = TEMPLATES[req.params.type];
  if (!tpl) return res.status(404).send('Tipo no válido');

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Seguimiento Educativo';
  const ws = wb.addWorksheet('Datos', { views: [{ state: 'frozen', ySplit: 3 }] });

  const ncols = tpl.columns.length;

  // Row 1: title (merged)
  ws.mergeCells(1, 1, 1, ncols);
  const titleCell = ws.getCell('A1');
  titleCell.value = tpl.title;
  titleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF' + tpl.headerColor } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + tpl.lightColor } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(1).height = 30;

  // Row 2: column headers
  tpl.columns.forEach((col, i) => {
    const cell = ws.getCell(2, i + 1);
    cell.value = col.header + (col.required ? ' *' : '');
    styleHeader(cell, tpl.headerColor);
    ws.getColumn(i + 1).width = col.width;
  });
  ws.getRow(2).height = 22;

  // Row 3: notes/instructions
  tpl.columns.forEach((col, i) => {
    const cell = ws.getCell(3, i + 1);
    cell.value = col.note;
    styleNote(cell);
  });
  ws.getRow(3).height = 32;

  // Rows 4+: example data
  tpl.examples.forEach((row, ri) => {
    row.forEach((val, ci) => {
      const cell = ws.getCell(4 + ri, ci + 1);
      cell.value = val;
      styleData(cell, ri % 2 === 0);
    });
    ws.getRow(4 + ri).height = 18;
  });

  // Add instructions sheet
  const wsHelp = wb.addWorksheet('Instrucciones');
  wsHelp.getColumn(1).width = 80;
  const helpRows = [
    '─── INSTRUCCIONES DE USO ───',
    '',
    '1. Rellena la hoja "Datos" a partir de la fila 4 (las filas 1-3 son cabecera y no se importan).',
    '2. Las columnas marcadas con * son obligatorias.',
    '3. No elimines ni renombres las columnas de cabecera (fila 2).',
    '4. Puedes añadir tantas filas como necesites.',
    '5. Las filas completamente vacías se ignorarán.',
    '',
    '─── NOTAS POR COLUMNA ───',
    '',
    ...tpl.columns.map(c => `• ${c.header}${c.required ? ' (obligatorio)' : ''}: ${c.note}`),
  ];
  helpRows.forEach((text, i) => {
    const cell = wsHelp.getCell(i + 1, 1);
    cell.value = text;
    if (text.startsWith('───')) {
      cell.font = { bold: true, size: 12, color: { argb: 'FF' + tpl.headerColor } };
    } else if (text.startsWith('•')) {
      cell.font = { size: 11 };
    } else {
      cell.font = { size: 11, color: { argb: 'FF555555' } };
    }
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(tpl.filename)}"`);
  await wb.xlsx.write(res);
  res.end();
});

// ── Import page ───────────────────────────────────────────
router.get('/', (req, res) => {
  res.render('import/index', { title: 'Importar datos', TEMPLATES });
});

// ── Process upload ────────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res) => {
  const { type } = req.body;
  const tpl = TEMPLATES[type];
  if (!tpl || !req.file) {
    req.session.flash = { error: 'Tipo o fichero no válido.' };
    return res.redirect('/import');
  }

  const db = getDb();
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(req.file.buffer);
  } catch {
    req.session.flash = { error: 'El fichero no es un Excel válido (.xlsx).' };
    return res.redirect('/import');
  }
  const ws = wb.worksheets[0];

  // Find header row: first row containing the first required header
  const firstHeader = tpl.columns[0].header.toLowerCase();
  let headerRow = -1;
  ws.eachRow((row, rowNum) => {
    if (headerRow !== -1) return;
    const vals = row.values.map(v => (v == null ? '' : String(v).replace(' *', '').trim().toLowerCase()));
    if (vals.includes(firstHeader)) headerRow = rowNum;
  });

  if (headerRow === -1) {
    req.session.flash = { error: 'No se encontró la cabecera. Asegúrate de usar la plantilla modelo.' };
    return res.redirect('/import');
  }

  // Map header name → column index
  const colMap = {};
  ws.getRow(headerRow).eachCell((cell, colNum) => {
    const key = String(cell.value || '').replace(' *', '').trim().toLowerCase();
    colMap[key] = colNum;
  });

  const getVal = (row, header) => {
    const idx = colMap[header.toLowerCase()];
    if (!idx) return null;
    const v = row.getCell(idx).value;
    if (v == null) return null;
    if (typeof v === 'object' && v.richText) return v.richText.map(r => r.text).join('').trim() || null;
    if (typeof v === 'object' && v.result != null) return String(v.result).trim() || null;
    return String(v).trim() || null;
  };

  let inserted = 0, skipped = 0, errorList = [];

  if (type === 'alumnos') {
    const stmt = db.prepare('INSERT INTO students (name, surname, course, group_name, notes) VALUES (?, ?, ?, ?, ?)');
    for (let r = headerRow + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const nombre = getVal(row, 'Nombre');
      const apellidos = getVal(row, 'Apellidos');
      if (!nombre && !apellidos) continue;
      if (!nombre || !apellidos) { skipped++; errorList.push(`Fila ${r}: Nombre y Apellidos son obligatorios`); continue; }
      try { stmt.run(nombre, apellidos, getVal(row, 'Curso'), getVal(row, 'Grupo'), getVal(row, 'Notas')); inserted++; }
      catch (e) { skipped++; errorList.push(`Fila ${r}: ${e.message}`); }
    }

  } else if (type === 'actividades') {
    const programs = db.prepare('SELECT id, name FROM programs').all();
    const progMap = {};
    programs.forEach(p => { progMap[p.name.trim().toLowerCase()] = p.id; });

    const stmt = db.prepare(`INSERT INTO activities (name, program_id, description, duration, materials, levels, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    for (let r = headerRow + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const nombre = getVal(row, 'Nombre');
      if (!nombre) continue;
      const progName = getVal(row, 'Programa');
      const progId = progName ? progMap[progName.trim().toLowerCase()] : null;
      if (!progId) { skipped++; errorList.push(`Fila ${r}: programa "${progName}" no encontrado en el sistema`); continue; }
      const dur = parseInt(getVal(row, 'Duración (min)') || '30') || 30;
      try { stmt.run(nombre, progId, getVal(row, 'Descripción'), dur, getVal(row, 'Materiales'), getVal(row, 'Niveles'), req.session.user.id); inserted++; }
      catch (e) { skipped++; errorList.push(`Fila ${r}: ${e.message}`); }
    }

  } else if (type === 'programas') {
    const stmt = db.prepare('INSERT OR IGNORE INTO programs (name, description, color, icon, mode) VALUES (?, ?, ?, ?, ?)');
    for (let r = headerRow + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const nombre = getVal(row, 'Nombre');
      if (!nombre) continue;
      const modo = getVal(row, 'Modo') || 'individual';
      try { stmt.run(nombre, getVal(row, 'Descripción'), getVal(row, 'Color') || '#0d6efd', getVal(row, 'Icono') || 'book', ['individual','grupal'].includes(modo) ? modo : 'individual'); inserted++; }
      catch (e) { skipped++; errorList.push(`Fila ${r}: ${e.message}`); }
    }
  }

  const msgs = [`✅ ${inserted} registro${inserted !== 1 ? 's' : ''} importado${inserted !== 1 ? 's' : ''} correctamente.`];
  if (skipped) msgs.push(`⚠️ ${skipped} fila${skipped !== 1 ? 's' : ''} omitida${skipped !== 1 ? 's' : ''}.`);
  req.session.flash = {
    success: msgs.join(' '),
    ...(errorList.length ? { error: errorList.slice(0, 8).join('<br>') + (errorList.length > 8 ? `<br>… y ${errorList.length - 8} más.` : '') } : {}),
  };
  res.redirect('/import');
});

module.exports = router;
