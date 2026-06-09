/**
 * Criterios de evaluación LOMLOE – Educación Primaria
 * Real Decreto 157/2022, de 1 de marzo
 *
 * Uso: node database/lomloe-criteria.js
 */

const { getDb } = require('../config/database');

const CRITERIA = [
  // ──────────────────────────────────────────────────────────────────
  // LENGUA CASTELLANA Y LITERATURA
  // ──────────────────────────────────────────────────────────────────
  // CE.LCL.1 – Comprensión e interpretación de textos orales
  { code: 'LCL.1.1', area: 'Lengua Castellana y Literatura', description: 'Comprende el sentido global e identifica las ideas principales y secundarias de textos orales sencillos de distintos ámbitos.' },
  { code: 'LCL.1.2', area: 'Lengua Castellana y Literatura', description: 'Reconoce la intención comunicativa y el tema de textos orales cotidianos, identificando los elementos básicos de la situación comunicativa.' },
  { code: 'LCL.1.3', area: 'Lengua Castellana y Literatura', description: 'Selecciona y aplica estrategias de escucha activa: atención, anticipación, retención de información relevante y reformulación.' },
  { code: 'LCL.1.4', area: 'Lengua Castellana y Literatura', description: 'Valora la lengua oral como instrumento de aprendizaje y comunicación, reconociendo su importancia en la vida cotidiana.' },

  // CE.LCL.2 – Producción de textos orales
  { code: 'LCL.2.1', area: 'Lengua Castellana y Literatura', description: 'Produce textos orales breves y coherentes, adaptados al contexto y a la intención comunicativa, con pronunciación y entonación adecuadas.' },
  { code: 'LCL.2.2', area: 'Lengua Castellana y Literatura', description: 'Utiliza recursos no verbales y paraverbales (gestos, postura, volumen, ritmo) para acompañar y enriquecer los textos orales.' },
  { code: 'LCL.2.3', area: 'Lengua Castellana y Literatura', description: 'Planifica y revisa sus producciones orales ajustando el discurso al tema, al propósito y al destinatario.' },
  { code: 'LCL.2.4', area: 'Lengua Castellana y Literatura', description: 'Participa activamente en intercambios comunicativos respetando las normas básicas de la comunicación oral: turno de palabra, escucha y respeto.' },

  // CE.LCL.3 – Comprensión e interpretación de textos escritos
  { code: 'LCL.3.1', area: 'Lengua Castellana y Literatura', description: 'Lee con fluidez y entonación textos de uso cotidiano, ajustando el ritmo a la comprensión del contenido.' },
  { code: 'LCL.3.2', area: 'Lengua Castellana y Literatura', description: 'Comprende el sentido global y localiza informaciones explícitas e implícitas en textos escritos de distinta tipología.' },
  { code: 'LCL.3.3', area: 'Lengua Castellana y Literatura', description: 'Aplica estrategias de comprensión lectora: antes, durante y después de la lectura (anticipación, inferencia, relación con conocimientos previos, resumen).' },
  { code: 'LCL.3.4', area: 'Lengua Castellana y Literatura', description: 'Reflexiona críticamente sobre el contenido de los textos leídos, expresando su opinión personal de forma argumentada.' },

  // CE.LCL.4 – Producción de textos escritos
  { code: 'LCL.4.1', area: 'Lengua Castellana y Literatura', description: 'Planifica y produce textos escritos sencillos de distintas tipologías, con coherencia, cohesión y adecuación al contexto comunicativo.' },
  { code: 'LCL.4.2', area: 'Lengua Castellana y Literatura', description: 'Aplica las normas ortográficas y gramaticales básicas en sus producciones escritas y las utiliza para revisar y mejorar los textos.' },
  { code: 'LCL.4.3', area: 'Lengua Castellana y Literatura', description: 'Revisa y mejora sus textos escritos con autonomía progresiva, cuidando la presentación y el orden.' },
  { code: 'LCL.4.4', area: 'Lengua Castellana y Literatura', description: 'Utiliza herramientas digitales básicas para la producción, revisión y presentación de textos escritos.' },

  // CE.LCL.5 – Educación literaria
  { code: 'LCL.5.1', area: 'Lengua Castellana y Literatura', description: 'Lee con autonomía obras literarias adecuadas a su edad e intereses, mostrando comprensión e implicación lectora.' },
  { code: 'LCL.5.2', area: 'Lengua Castellana y Literatura', description: 'Comparte experiencias de lectura y expresa sus gustos e impresiones sobre las obras leídas.' },
  { code: 'LCL.5.3', area: 'Lengua Castellana y Literatura', description: 'Reconoce los géneros literarios básicos (narración, poesía, teatro) e identifica algunos de sus elementos formales.' },
  { code: 'LCL.5.4', area: 'Lengua Castellana y Literatura', description: 'Crea textos de intención literaria sencillos, siguiendo modelos, con imaginación y cuidado por la forma.' },

  // CE.LCL.6 – Reflexión sobre la lengua y sus usos
  { code: 'LCL.6.1', area: 'Lengua Castellana y Literatura', description: 'Reconoce las clases de palabras, sus formas y funciones básicas en el contexto de la frase.' },
  { code: 'LCL.6.2', area: 'Lengua Castellana y Literatura', description: 'Identifica las estructuras sintácticas más habituales y su relación con el sentido de los textos.' },
  { code: 'LCL.6.3', area: 'Lengua Castellana y Literatura', description: 'Aplica los conocimientos lingüísticos adquiridos a la comprensión y mejora de sus producciones orales y escritas.' },

  // CE.LCL.7 – Lengua y sociedad
  { code: 'LCL.7.1', area: 'Lengua Castellana y Literatura', description: 'Reconoce la diversidad lingüística del entorno próximo y de España, valorando positivamente la pluralidad lingüística.' },
  { code: 'LCL.7.2', area: 'Lengua Castellana y Literatura', description: 'Identifica usos discriminatorios del lenguaje y adopta un uso inclusivo, respetuoso y no estereotipado de la lengua.' },

  // CE.LCL.8 – Gestión personal del aprendizaje lingüístico
  { code: 'LCL.8.1', area: 'Lengua Castellana y Literatura', description: 'Reflexiona sobre su propio proceso de aprendizaje lingüístico e identifica sus puntos fuertes y aspectos de mejora.' },
  { code: 'LCL.8.2', area: 'Lengua Castellana y Literatura', description: 'Utiliza estrategias para mejorar sus producciones y ampliar su vocabulario de forma autónoma.' },

  // ──────────────────────────────────────────────────────────────────
  // MATEMÁTICAS
  // ──────────────────────────────────────────────────────────────────
  // CE.MAT.1 – Sentido numérico
  { code: 'MAT.1.1', area: 'Matemáticas', description: 'Lee, escribe, ordena y compara números naturales, enteros, decimales y fracciones en distintos contextos y representaciones.' },
  { code: 'MAT.1.2', area: 'Matemáticas', description: 'Descompone y compone números utilizando distintos criterios (posicional, multiplicativo, factorial) y los representa en la recta numérica.' },
  { code: 'MAT.1.3', area: 'Matemáticas', description: 'Realiza cálculos con las cuatro operaciones básicas con números naturales y decimales, seleccionando el procedimiento más adecuado.' },
  { code: 'MAT.1.4', area: 'Matemáticas', description: 'Estima el resultado de cálculos y operaciones, comprobando la razonabilidad de los resultados obtenidos.' },
  { code: 'MAT.1.5', area: 'Matemáticas', description: 'Utiliza el cálculo mental y estrategias personales de cálculo en situaciones cotidianas, aplicando las propiedades de las operaciones.' },
  { code: 'MAT.1.6', area: 'Matemáticas', description: 'Comprende y utiliza los números fraccionarios y decimales en contextos de la vida cotidiana, reconociendo sus diferentes significados.' },

  // CE.MAT.2 – Sentido de la medida
  { code: 'MAT.2.1', area: 'Matemáticas', description: 'Comprende el proceso de medir, selecciona la unidad adecuada y expresa el resultado con precisión en distintos sistemas de medida.' },
  { code: 'MAT.2.2', area: 'Matemáticas', description: 'Selecciona y utiliza correctamente los instrumentos y estrategias de medida más apropiados para cada magnitud y situación.' },
  { code: 'MAT.2.3', area: 'Matemáticas', description: 'Estima y compara magnitudes (longitud, masa, capacidad, tiempo, superficie, ángulos) utilizando referencias conocidas del entorno.' },
  { code: 'MAT.2.4', area: 'Matemáticas', description: 'Realiza conversiones entre unidades del sistema métrico decimal y las aplica en la resolución de problemas cotidianos.' },

  // CE.MAT.3 – Sentido espacial
  { code: 'MAT.3.1', area: 'Matemáticas', description: 'Describe y representa posiciones, movimientos y orientaciones en el espacio usando coordenadas y referencias.' },
  { code: 'MAT.3.2', area: 'Matemáticas', description: 'Reconoce, describe y clasifica figuras geométricas planas y cuerpos geométricos, identificando sus elementos y propiedades.' },
  { code: 'MAT.3.3', area: 'Matemáticas', description: 'Realiza construcciones y composiciones geométricas con instrumentos y herramientas digitales, aplicando propiedades geométricas.' },
  { code: 'MAT.3.4', area: 'Matemáticas', description: 'Identifica y aplica transformaciones geométricas (traslación, rotación, reflexión y simetría) en el plano.' },
  { code: 'MAT.3.5', area: 'Matemáticas', description: 'Calcula perímetros y áreas de figuras planas mediante fórmulas o descomposición, utilizando unidades adecuadas.' },

  // CE.MAT.4 – Sentido algebraico y pensamiento computacional
  { code: 'MAT.4.1', area: 'Matemáticas', description: 'Identifica, describe y genera regularidades, pautas y relaciones en colecciones de objetos, figuras y secuencias numéricas.' },
  { code: 'MAT.4.2', area: 'Matemáticas', description: 'Usa variables, letras y símbolos para representar números desconocidos y relaciones matemáticas.' },
  { code: 'MAT.4.3', area: 'Matemáticas', description: 'Formula y resuelve problemas y ecuaciones sencillas aplicando el pensamiento algebraico en contextos cotidianos.' },
  { code: 'MAT.4.4', area: 'Matemáticas', description: 'Descompone problemas en pasos más sencillos, identifica patrones y diseña algoritmos para resolverlos (pensamiento computacional).' },

  // CE.MAT.5 – Sentido estocástico
  { code: 'MAT.5.1', area: 'Matemáticas', description: 'Recoge, organiza y clasifica datos de situaciones cotidianas usando tablas, diagramas de barras, pictogramas y gráficos de líneas.' },
  { code: 'MAT.5.2', area: 'Matemáticas', description: 'Lee, interpreta y comunica la información contenida en representaciones gráficas de datos.' },
  { code: 'MAT.5.3', area: 'Matemáticas', description: 'Calcula e interpreta medidas de centralización (moda, media) y dispersión sencillas en conjuntos de datos.' },
  { code: 'MAT.5.4', area: 'Matemáticas', description: 'Identifica experiencias aleatorias y cuantifica la probabilidad de sucesos sencillos en contextos cotidianos.' },

  // CE.MAT.6 – Sentido socioafectivo
  { code: 'MAT.6.1', area: 'Matemáticas', description: 'Verbaliza y comparte el proceso seguido en la resolución de problemas, argumentando las decisiones tomadas.' },
  { code: 'MAT.6.2', area: 'Matemáticas', description: 'Gestiona de forma positiva las emociones ante el error y la dificultad, adoptando una actitud de superación.' },
  { code: 'MAT.6.3', area: 'Matemáticas', description: 'Participa activamente en el trabajo colaborativo, aportando ideas y respetando las de los demás.' },

  // CE.MAT.7 – Resolución de problemas
  { code: 'MAT.7.1', area: 'Matemáticas', description: 'Comprende el enunciado de problemas matemáticos, identificando los datos relevantes, la pregunta y las condiciones.' },
  { code: 'MAT.7.2', area: 'Matemáticas', description: 'Planifica y aplica estrategias diversas de resolución (ensayo-error, representación, simplificación, trabajo hacia atrás).' },
  { code: 'MAT.7.3', area: 'Matemáticas', description: 'Comprueba los resultados obtenidos y los valora críticamente en relación con el contexto del problema.' },
  { code: 'MAT.7.4', area: 'Matemáticas', description: 'Reflexiona sobre el proceso de resolución e identifica estrategias que podrían mejorar los resultados.' },

  // ──────────────────────────────────────────────────────────────────
  // CIENCIAS DE LA NATURALEZA
  // ──────────────────────────────────────────────────────────────────
  { code: 'CN.1.1', area: 'Ciencias de la Naturaleza', description: 'Identifica y describe los seres vivos del entorno, sus características, funciones vitales y relaciones entre ellos y con el medio.' },
  { code: 'CN.1.2', area: 'Ciencias de la Naturaleza', description: 'Reconoce y describe los componentes del medio natural (materia inerte, agua, aire, suelo) y sus propiedades observables.' },
  { code: 'CN.1.3', area: 'Ciencias de la Naturaleza', description: 'Relaciona los cambios y transformaciones en la naturaleza (ciclo del agua, cambios de estado, mezclas) con causas y consecuencias.' },
  { code: 'CN.2.1', area: 'Ciencias de la Naturaleza', description: 'Formula preguntas investigables y diseña procedimientos sencillos para buscar respuestas a partir de la observación y experimentación.' },
  { code: 'CN.2.2', area: 'Ciencias de la Naturaleza', description: 'Recoge, organiza y comunica los datos de sus observaciones e investigaciones usando tablas, gráficas y textos.' },
  { code: 'CN.2.3', area: 'Ciencias de la Naturaleza', description: 'Extrae conclusiones relacionando los resultados obtenidos con el conocimiento científico y los comunica con precisión.' },
  { code: 'CN.3.1', area: 'Ciencias de la Naturaleza', description: 'Identifica hábitos de vida saludables (alimentación, higiene, actividad física, descanso) y los aplica en su vida cotidiana.' },
  { code: 'CN.3.2', area: 'Ciencias de la Naturaleza', description: 'Describe el funcionamiento básico del cuerpo humano y sus sistemas, relacionándolo con la salud y el bienestar.' },
  { code: 'CN.3.3', area: 'Ciencias de la Naturaleza', description: 'Reconoce situaciones de riesgo para la salud y propone medidas de prevención y actuación básicas.' },
  { code: 'CN.4.1', area: 'Ciencias de la Naturaleza', description: 'Identifica los efectos de las acciones humanas sobre el medio natural y propone medidas de conservación y sostenibilidad.' },
  { code: 'CN.4.2', area: 'Ciencias de la Naturaleza', description: 'Comprende y aplica el funcionamiento básico de máquinas y tecnologías sencillas presentes en su entorno.' },
  { code: 'CN.5.1', area: 'Ciencias de la Naturaleza', description: 'Reconoce la contribución de la ciencia y la tecnología a la mejora de la vida de las personas y al conocimiento del mundo.' },
  { code: 'CN.5.2', area: 'Ciencias de la Naturaleza', description: 'Muestra actitudes de curiosidad, rigor y respeto hacia el medio natural y los seres vivos.' },

  // ──────────────────────────────────────────────────────────────────
  // CIENCIAS SOCIALES
  // ──────────────────────────────────────────────────────────────────
  { code: 'CS.1.1', area: 'Ciencias Sociales', description: 'Describe y localiza los principales elementos del entorno natural (relieve, ríos, climas, paisajes) de España, Europa y el mundo.' },
  { code: 'CS.1.2', area: 'Ciencias Sociales', description: 'Analiza la influencia de las actividades humanas en el territorio y valora la importancia de la sostenibilidad ambiental.' },
  { code: 'CS.2.1', area: 'Ciencias Sociales', description: 'Reconoce los principios democráticos básicos y los derechos y deberes de las personas en la sociedad.' },
  { code: 'CS.2.2', area: 'Ciencias Sociales', description: 'Participa activamente en la vida del aula y del centro adoptando actitudes de respeto, cooperación y responsabilidad.' },
  { code: 'CS.2.3', area: 'Ciencias Sociales', description: 'Describe la organización política y territorial de su localidad, comunidad y España, identificando sus instituciones básicas.' },
  { code: 'CS.3.1', area: 'Ciencias Sociales', description: 'Sitúa en el tiempo hechos y etapas históricas relevantes, comprendiendo la sucesión y la causalidad histórica.' },
  { code: 'CS.3.2', area: 'Ciencias Sociales', description: 'Describe las principales civilizaciones y etapas históricas de España y el mundo, identificando sus características más importantes.' },
  { code: 'CS.3.3', area: 'Ciencias Sociales', description: 'Valora el patrimonio histórico y cultural como herencia colectiva, mostrando actitudes de respeto y cuidado.' },
  { code: 'CS.4.1', area: 'Ciencias Sociales', description: 'Localiza lugares en mapas y planos utilizando escalas, coordenadas y elementos cartográficos básicos.' },
  { code: 'CS.4.2', area: 'Ciencias Sociales', description: 'Analiza e interpreta información geográfica procedente de distintas fuentes: mapas, gráficos, imágenes e internet.' },
  { code: 'CS.5.1', area: 'Ciencias Sociales', description: 'Busca, selecciona y contrasta información de distintas fuentes para elaborar respuestas fundamentadas a preguntas sociales.' },
  { code: 'CS.5.2', area: 'Ciencias Sociales', description: 'Elabora conclusiones argumentadas sobre hechos y fenómenos sociales, históricos y geográficos.' },

  // ──────────────────────────────────────────────────────────────────
  // EDUCACIÓN ARTÍSTICA (Plástica y Música)
  // ──────────────────────────────────────────────────────────────────
  { code: 'EA.1.1', area: 'Educación Artística', description: 'Observa y describe con vocabulario específico los elementos visuales y plásticos presentes en el entorno y en obras artísticas.' },
  { code: 'EA.1.2', area: 'Educación Artística', description: 'Escucha activamente producciones musicales de distintos estilos y culturas, identificando sus elementos básicos.' },
  { code: 'EA.2.1', area: 'Educación Artística', description: 'Crea producciones plásticas y visuales utilizando diferentes técnicas, materiales y herramientas con finalidad expresiva y comunicativa.' },
  { code: 'EA.2.2', area: 'Educación Artística', description: 'Planifica y desarrolla proyectos artísticos individuales y colectivos, valorando el proceso tanto como el resultado.' },
  { code: 'EA.3.1', area: 'Educación Artística', description: 'Participa en producciones musicales colectivas (canto, interpretación instrumental, danza) mostrando actitudes de cooperación y respeto.' },
  { code: 'EA.3.2', area: 'Educación Artística', description: 'Lee e interpreta partituras con grafías convencionales y no convencionales de dificultad progresiva.' },
  { code: 'EA.4.1', area: 'Educación Artística', description: 'Reconoce y aprecia manifestaciones artísticas y culturales del patrimonio propio y de otras culturas, valorando su diversidad.' },
  { code: 'EA.4.2', area: 'Educación Artística', description: 'Utiliza herramientas digitales para explorar, crear y compartir producciones artísticas.' },

  // ──────────────────────────────────────────────────────────────────
  // EDUCACIÓN FÍSICA
  // ──────────────────────────────────────────────────────────────────
  { code: 'EF.1.1', area: 'Educación Física', description: 'Adapta sus habilidades motrices básicas a situaciones de diferente complejidad, mostrando control y eficacia en el movimiento.' },
  { code: 'EF.1.2', area: 'Educación Física', description: 'Participa en actividades físicas y juegos de forma activa, respetando las normas y a los demás participantes.' },
  { code: 'EF.2.1', area: 'Educación Física', description: 'Resuelve situaciones motrices individuales y colectivas tomando decisiones ajustadas al contexto.' },
  { code: 'EF.2.2', area: 'Educación Física', description: 'Coopera con sus compañeros en tareas motrices y deportivas, asumiendo distintos roles con responsabilidad.' },
  { code: 'EF.3.1', area: 'Educación Física', description: 'Conoce y aplica hábitos relacionados con la higiene corporal, la actividad física y la alimentación saludable.' },
  { code: 'EF.3.2', area: 'Educación Física', description: 'Identifica los efectos del ejercicio físico sobre el cuerpo y los valora como parte de un estilo de vida activo y saludable.' },
  { code: 'EF.4.1', area: 'Educación Física', description: 'Gestiona las emociones durante la actividad física, mostrando actitudes de esfuerzo, superación y fairplay.' },
  { code: 'EF.4.2', area: 'Educación Física', description: 'Valora la actividad física como fuente de disfrute, bienestar y relación social, mostrando actitudes de inclusión.' },

  // ──────────────────────────────────────────────────────────────────
  // LENGUA EXTRANJERA (Inglés)
  // ──────────────────────────────────────────────────────────────────
  { code: 'LE.1.1', area: 'Lengua Extranjera', description: 'Comprende el sentido global e identifica informaciones relevantes en textos orales breves en lengua extranjera sobre temas cotidianos.' },
  { code: 'LE.1.2', area: 'Lengua Extranjera', description: 'Aplica estrategias básicas de comprensión oral: uso del contexto, lenguaje no verbal e inferencia de significados.' },
  { code: 'LE.2.1', area: 'Lengua Extranjera', description: 'Produce textos orales breves y sencillos en lengua extranjera sobre temas conocidos, con pronunciación y entonación comprensibles.' },
  { code: 'LE.2.2', area: 'Lengua Extranjera', description: 'Participa en intercambios comunicativos orales sencillos en lengua extranjera, usando recursos para mantener la comunicación.' },
  { code: 'LE.3.1', area: 'Lengua Extranjera', description: 'Comprende textos escritos breves y sencillos en lengua extranjera, identificando informaciones clave en distintos formatos y soportes.' },
  { code: 'LE.3.2', area: 'Lengua Extranjera', description: 'Aplica estrategias de comprensión lectora en lengua extranjera: inferencia, uso del contexto y conocimientos previos.' },
  { code: 'LE.4.1', area: 'Lengua Extranjera', description: 'Produce textos escritos breves y sencillos en lengua extranjera con estructura adecuada, respetando las normas básicas de escritura.' },
  { code: 'LE.4.2', area: 'Lengua Extranjera', description: 'Revisa y corrige sus producciones escritas en lengua extranjera usando herramientas de apoyo y la retroalimentación recibida.' },
  { code: 'LE.5.1', area: 'Lengua Extranjera', description: 'Reflexiona sobre los mecanismos de funcionamiento de la lengua extranjera comparándolos con la lengua materna.' },
  { code: 'LE.5.2', area: 'Lengua Extranjera', description: 'Valora la lengua extranjera como instrumento de comunicación intercultural y muestra interés por conocer otras culturas.' },

  // ──────────────────────────────────────────────────────────────────
  // VALORES CÍVICOS Y ÉTICOS
  // ──────────────────────────────────────────────────────────────────
  { code: 'VCE.1.1', area: 'Valores Cívicos y Éticos', description: 'Reconoce y respeta la dignidad y los derechos de todas las personas, rechazando cualquier forma de discriminación.' },
  { code: 'VCE.1.2', area: 'Valores Cívicos y Éticos', description: 'Aplica valores éticos como la honestidad, la responsabilidad y la justicia en sus relaciones cotidianas.' },
  { code: 'VCE.2.1', area: 'Valores Cívicos y Éticos', description: 'Comprende y practica habilidades de convivencia democrática: diálogo, negociación, consenso y resolución pacífica de conflictos.' },
  { code: 'VCE.2.2', area: 'Valores Cívicos y Éticos', description: 'Participa de forma activa y responsable en la vida del aula, el centro y la comunidad.' },
  { code: 'VCE.3.1', area: 'Valores Cívicos y Éticos', description: 'Reflexiona sobre dilemas morales sencillos, argumentando su postura de forma razonada y respetuosa.' },
  { code: 'VCE.3.2', area: 'Valores Cívicos y Éticos', description: 'Identifica y valora los derechos de la infancia, adoptando actitudes de compromiso con su defensa y cumplimiento.' },
];

function importLomloeCriteria() {
  const db = getDb();

  let inserted = 0;
  let skipped = 0;

  const stmt = db.prepare('INSERT INTO criteria (code, description, area) VALUES (?, ?, ?)');
  const exists = db.prepare('SELECT id FROM criteria WHERE code = ?');

  const run = db.transaction(() => {
    for (const c of CRITERIA) {
      if (exists.get(c.code)) {
        skipped++;
      } else {
        stmt.run(c.code, c.description, c.area);
        inserted++;
      }
    }
  });

  run();

  console.log(`\n✓ Criterios LOMLOE importados: ${inserted} nuevos, ${skipped} ya existían`);
  console.log(`  Total criterios en la base de datos: ${db.prepare('SELECT COUNT(*) AS c FROM criteria WHERE active=1').get().c}`);
  return { inserted, skipped };
}

// Ejecución directa: node database/lomloe-criteria.js
if (require.main === module) {
  const { initDatabase } = require('./schema');
  initDatabase();
  importLomloeCriteria();
  process.exit(0);
}

module.exports = { importLomloeCriteria };
