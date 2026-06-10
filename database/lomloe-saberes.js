/**
 * Saberes básicos LOMLOE – Educación Primaria
 * Real Decreto 157/2022, de 1 de marzo
 *
 * Uso: node database/lomloe-saberes.js
 * Cada saber incluye `criteria` con los códigos de criterio relacionados.
 */

const { getDb } = require('../config/database');

const SABERES = [
  // ══════════════════════════════════════════════════════════════════
  // LENGUA CASTELLANA Y LITERATURA
  // ══════════════════════════════════════════════════════════════════
  // Bloque A: Comunicación oral
  { code: 'LCL-A.1', area: 'Lengua Castellana y Literatura', bloque: 'A. Comunicación oral',
    description: 'Géneros discursivos orales cotidianos: diálogos, debates, exposiciones, narraciones y descripciones orales.',
    criteria: ['LCL.1.1','LCL.1.2','LCL.2.1'] },
  { code: 'LCL-A.2', area: 'Lengua Castellana y Literatura', bloque: 'A. Comunicación oral',
    description: 'Estrategias de escucha activa y comprensión: atención sostenida, anticipación, retención de información y reformulación.',
    criteria: ['LCL.1.3','LCL.1.4'] },
  { code: 'LCL-A.3', area: 'Lengua Castellana y Literatura', bloque: 'A. Comunicación oral',
    description: 'Elementos de la comunicación oral: pronunciación, entonación, ritmo, volumen y recursos no verbales (gestos, postura).',
    criteria: ['LCL.2.1','LCL.2.2'] },
  { code: 'LCL-A.4', area: 'Lengua Castellana y Literatura', bloque: 'A. Comunicación oral',
    description: 'Normas de la comunicación oral: turno de palabra, escucha activa, respeto y participación constructiva.',
    criteria: ['LCL.2.4','LCL.1.4'] },
  { code: 'LCL-A.5', area: 'Lengua Castellana y Literatura', bloque: 'A. Comunicación oral',
    description: 'Planificación del discurso oral: intención comunicativa, destinatario y organización de las ideas.',
    criteria: ['LCL.2.3','LCL.2.1'] },

  // Bloque B: Comunicación escrita
  { code: 'LCL-B.1', area: 'Lengua Castellana y Literatura', bloque: 'B. Comunicación escrita',
    description: 'Lectura: decodificación, fluidez y precisión lectora; automatización del proceso lector.',
    criteria: ['LCL.3.1'] },
  { code: 'LCL-B.2', area: 'Lengua Castellana y Literatura', bloque: 'B. Comunicación escrita',
    description: 'Estrategias de comprensión lectora: antes (anticipación), durante (inferencia, monitoreo) y después (resumen, valoración).',
    criteria: ['LCL.3.2','LCL.3.3'] },
  { code: 'LCL-B.3', area: 'Lengua Castellana y Literatura', bloque: 'B. Comunicación escrita',
    description: 'Tipología textual: textos narrativos, descriptivos, expositivos, instructivos y argumentativos; características y estructura.',
    criteria: ['LCL.3.2','LCL.4.1'] },
  { code: 'LCL-B.4', area: 'Lengua Castellana y Literatura', bloque: 'B. Comunicación escrita',
    description: 'Escritura: planificación, textualización y revisión; coherencia, cohesión y adecuación al contexto.',
    criteria: ['LCL.4.1','LCL.4.3'] },
  { code: 'LCL-B.5', area: 'Lengua Castellana y Literatura', bloque: 'B. Comunicación escrita',
    description: 'Normas ortográficas y gramaticales básicas: acentuación, puntuación, mayúsculas y ortografía de uso frecuente.',
    criteria: ['LCL.4.2'] },
  { code: 'LCL-B.6', area: 'Lengua Castellana y Literatura', bloque: 'B. Comunicación escrita',
    description: 'Herramientas digitales para la lectura, escritura, revisión y presentación de textos.',
    criteria: ['LCL.4.4','LCL.8.2'] },

  // Bloque C: Educación literaria
  { code: 'LCL-C.1', area: 'Lengua Castellana y Literatura', bloque: 'C. Educación literaria',
    description: 'Géneros literarios: narrativa, poesía y teatro; elementos formales básicos y recursos literarios.',
    criteria: ['LCL.5.3'] },
  { code: 'LCL-C.2', area: 'Lengua Castellana y Literatura', bloque: 'C. Educación literaria',
    description: 'Lectura autónoma: obras adecuadas a la edad e intereses; hábito lector y disfrute de la literatura.',
    criteria: ['LCL.5.1','LCL.5.2'] },
  { code: 'LCL-C.3', area: 'Lengua Castellana y Literatura', bloque: 'C. Educación literaria',
    description: 'Creación literaria: escritura de textos con intención estética siguiendo modelos (poemas, cuentos, diálogos).',
    criteria: ['LCL.5.4'] },

  // Bloque D: Reflexión sobre la lengua
  { code: 'LCL-D.1', area: 'Lengua Castellana y Literatura', bloque: 'D. Reflexión sobre la lengua',
    description: 'Morfología: clases de palabras (sustantivo, adjetivo, verbo, adverbio, pronombre, preposición, conjunción) y sus variaciones.',
    criteria: ['LCL.6.1'] },
  { code: 'LCL-D.2', area: 'Lengua Castellana y Literatura', bloque: 'D. Reflexión sobre la lengua',
    description: 'Sintaxis básica: estructura de la oración simple; sujeto, predicado y complementos elementales.',
    criteria: ['LCL.6.2'] },
  { code: 'LCL-D.3', area: 'Lengua Castellana y Literatura', bloque: 'D. Reflexión sobre la lengua',
    description: 'Semántica y léxico: significado contextual, sinónimos, antónimos, familia léxica, campo semántico y polisemia.',
    criteria: ['LCL.6.3','LCL.8.2'] },
  { code: 'LCL-D.4', area: 'Lengua Castellana y Literatura', bloque: 'D. Reflexión sobre la lengua',
    description: 'Variación lingüística: lenguas cooficiales de España, variedades dialectales, registro formal e informal.',
    criteria: ['LCL.7.1','LCL.7.2'] },

  // ══════════════════════════════════════════════════════════════════
  // MATEMÁTICAS
  // ══════════════════════════════════════════════════════════════════
  // Bloque A: Sentido numérico
  { code: 'MAT-A.1', area: 'Matemáticas', bloque: 'A. Sentido numérico',
    description: 'Números naturales: lectura, escritura, orden y comparación. Valor posicional y sistema de numeración decimal.',
    criteria: ['MAT.1.1','MAT.1.2'] },
  { code: 'MAT-A.2', area: 'Matemáticas', bloque: 'A. Sentido numérico',
    description: 'Fracciones: concepto, representación gráfica, comparación y equivalencia. Fracciones propias e impropias.',
    criteria: ['MAT.1.6'] },
  { code: 'MAT-A.3', area: 'Matemáticas', bloque: 'A. Sentido numérico',
    description: 'Números decimales: valor posicional, comparación, representación y relación con las fracciones.',
    criteria: ['MAT.1.6','MAT.1.1'] },
  { code: 'MAT-A.4', area: 'Matemáticas', bloque: 'A. Sentido numérico',
    description: 'Las cuatro operaciones: adición, sustracción, multiplicación y división. Propiedades, algoritmos y relaciones.',
    criteria: ['MAT.1.3'] },
  { code: 'MAT-A.5', area: 'Matemáticas', bloque: 'A. Sentido numérico',
    description: 'Cálculo mental: estrategias de cálculo, descomposición, uso de propiedades y automatización de hechos básicos.',
    criteria: ['MAT.1.5'] },
  { code: 'MAT-A.6', area: 'Matemáticas', bloque: 'A. Sentido numérico',
    description: 'Estimación y aproximación de resultados: redondeo, orden de magnitud y razonabilidad de resultados.',
    criteria: ['MAT.1.4'] },
  { code: 'MAT-A.7', area: 'Matemáticas', bloque: 'A. Sentido numérico',
    description: 'Proporcionalidad: razón, proporción, regla de tres y porcentajes en contextos cotidianos.',
    criteria: ['MAT.1.6','MAT.1.3'] },

  // Bloque B: Sentido de la medida
  { code: 'MAT-B.1', area: 'Matemáticas', bloque: 'B. Sentido de la medida',
    description: 'Magnitudes y unidades: longitud (mm, cm, m, km), masa (g, kg), capacidad (ml, l), tiempo (s, min, h, días).',
    criteria: ['MAT.2.1','MAT.2.4'] },
  { code: 'MAT-B.2', area: 'Matemáticas', bloque: 'B. Sentido de la medida',
    description: 'Instrumentos y estrategias de medida: selección del instrumento adecuado; conversión entre unidades del SMD.',
    criteria: ['MAT.2.2','MAT.2.4'] },
  { code: 'MAT-B.3', area: 'Matemáticas', bloque: 'B. Sentido de la medida',
    description: 'Estimación y comparación de magnitudes: referencias conocidas del entorno para estimar longitudes, masas y tiempos.',
    criteria: ['MAT.2.3'] },
  { code: 'MAT-B.4', area: 'Matemáticas', bloque: 'B. Sentido de la medida',
    description: 'Ángulos: concepto, tipos (agudo, recto, obtuso, llano) y medida en grados.',
    criteria: ['MAT.2.1','MAT.3.4'] },

  // Bloque C: Sentido espacial
  { code: 'MAT-C.1', area: 'Matemáticas', bloque: 'C. Sentido espacial',
    description: 'Posición y orientación en el espacio: coordenadas cartesianas, planos y mapas.',
    criteria: ['MAT.3.1'] },
  { code: 'MAT-C.2', area: 'Matemáticas', bloque: 'C. Sentido espacial',
    description: 'Figuras planas: polígonos (triángulos, cuadriláteros, polígonos regulares) y círculo; elementos y clasificación.',
    criteria: ['MAT.3.2'] },
  { code: 'MAT-C.3', area: 'Matemáticas', bloque: 'C. Sentido espacial',
    description: 'Cuerpos geométricos: poliedros (prismas, pirámides) y cuerpos de revolución; elementos y clasificación.',
    criteria: ['MAT.3.2'] },
  { code: 'MAT-C.4', area: 'Matemáticas', bloque: 'C. Sentido espacial',
    description: 'Transformaciones isométricas: simetría axial y central, traslación y rotación en el plano.',
    criteria: ['MAT.3.4'] },
  { code: 'MAT-C.5', area: 'Matemáticas', bloque: 'C. Sentido espacial',
    description: 'Perímetro y área de figuras planas: cuadrado, rectángulo, triángulo, paralelogramo y círculo.',
    criteria: ['MAT.3.5'] },
  { code: 'MAT-C.6', area: 'Matemáticas', bloque: 'C. Sentido espacial',
    description: 'Construcciones geométricas con regla, compás y herramientas digitales; aplicación de propiedades.',
    criteria: ['MAT.3.3'] },

  // Bloque D: Sentido algebraico y pensamiento computacional
  { code: 'MAT-D.1', area: 'Matemáticas', bloque: 'D. Sentido algebraico',
    description: 'Patrones y regularidades: sucesiones numéricas, visuales y geométricas; identificación y generalización.',
    criteria: ['MAT.4.1'] },
  { code: 'MAT-D.2', area: 'Matemáticas', bloque: 'D. Sentido algebraico',
    description: 'Variables y expresiones algebraicas sencillas: uso de la letra para representar números desconocidos.',
    criteria: ['MAT.4.2'] },
  { code: 'MAT-D.3', area: 'Matemáticas', bloque: 'D. Sentido algebraico',
    description: 'Ecuaciones sencillas de primer grado: planteamiento, resolución e interpretación en contexto.',
    criteria: ['MAT.4.3'] },
  { code: 'MAT-D.4', area: 'Matemáticas', bloque: 'D. Sentido algebraico',
    description: 'Pensamiento computacional: descomposición de problemas, reconocimiento de patrones, algoritmos y depuración.',
    criteria: ['MAT.4.4'] },

  // Bloque E: Sentido estocástico
  { code: 'MAT-E.1', area: 'Matemáticas', bloque: 'E. Sentido estocástico',
    description: 'Estadística: recogida y organización de datos; tablas de frecuencia; gráficos de barras, pictogramas y líneas.',
    criteria: ['MAT.5.1'] },
  { code: 'MAT-E.2', area: 'Matemáticas', bloque: 'E. Sentido estocástico',
    description: 'Interpretación de gráficos estadísticos; medidas de centralización: media aritmética, moda y mediana.',
    criteria: ['MAT.5.2','MAT.5.3'] },
  { code: 'MAT-E.3', area: 'Matemáticas', bloque: 'E. Sentido estocástico',
    description: 'Probabilidad: experimentos aleatorios, espacio muestral, sucesos y cuantificación de la probabilidad.',
    criteria: ['MAT.5.4'] },

  // Bloque F: Sentido socioafectivo
  { code: 'MAT-F.1', area: 'Matemáticas', bloque: 'F. Sentido socioafectivo',
    description: 'Estrategias de resolución de problemas: ensayo-error, representación, simplificación, trabajo hacia atrás y uso de tablas.',
    criteria: ['MAT.7.1','MAT.7.2'] },
  { code: 'MAT-F.2', area: 'Matemáticas', bloque: 'F. Sentido socioafectivo',
    description: 'Actitudes matemáticas: curiosidad, perseverancia, reflexión sobre el error y mejora de los procesos.',
    criteria: ['MAT.6.2','MAT.7.4'] },
  { code: 'MAT-F.3', area: 'Matemáticas', bloque: 'F. Sentido socioafectivo',
    description: 'Comunicación matemática: argumentación, justificación de resultados y trabajo colaborativo.',
    criteria: ['MAT.6.1','MAT.6.3','MAT.7.3'] },

  // ══════════════════════════════════════════════════════════════════
  // CIENCIAS DE LA NATURALEZA
  // ══════════════════════════════════════════════════════════════════
  { code: 'CN-A.1', area: 'Ciencias de la Naturaleza', bloque: 'A. Cultura científica',
    description: 'Metodología científica: observación sistemática, planteamiento de hipótesis, diseño y realización de experimentos sencillos.',
    criteria: ['CN.2.1'] },
  { code: 'CN-A.2', area: 'Ciencias de la Naturaleza', bloque: 'A. Cultura científica',
    description: 'Instrumentos científicos: lupa, termómetro, balanza, microscopio escolar; uso correcto y preciso.',
    criteria: ['CN.2.1','CN.2.2'] },
  { code: 'CN-A.3', area: 'Ciencias de la Naturaleza', bloque: 'A. Cultura científica',
    description: 'Comunicación científica: recogida y organización de datos en tablas y gráficas; elaboración de informes.',
    criteria: ['CN.2.2','CN.2.3'] },
  { code: 'CN-B.1', area: 'Ciencias de la Naturaleza', bloque: 'B. Tecnología y digitalización',
    description: 'Máquinas y mecanismos sencillos: palancas, poleas, engranajes; principios de funcionamiento y aplicaciones.',
    criteria: ['CN.4.2'] },
  { code: 'CN-B.2', area: 'Ciencias de la Naturaleza', bloque: 'B. Tecnología y digitalización',
    description: 'Sostenibilidad tecnológica: impacto ambiental de la tecnología; diseño sostenible y reciclaje.',
    criteria: ['CN.4.1','CN.4.2'] },
  { code: 'CN-C.1', area: 'Ciencias de la Naturaleza', bloque: 'C. Vida en nuestro mundo',
    description: 'Seres vivos: características, clasificación (animales, plantas, hongos) y adaptaciones al medio.',
    criteria: ['CN.1.1'] },
  { code: 'CN-C.2', area: 'Ciencias de la Naturaleza', bloque: 'C. Vida en nuestro mundo',
    description: 'Ecosistemas: componentes bióticos y abióticos; cadenas y redes tróficas; equilibrio y biodiversidad.',
    criteria: ['CN.1.1','CN.4.1'] },
  { code: 'CN-C.3', area: 'Ciencias de la Naturaleza', bloque: 'C. Vida en nuestro mundo',
    description: 'El cuerpo humano: aparatos y sistemas (digestivo, respiratorio, circulatorio, locomotor, nervioso); funciones vitales.',
    criteria: ['CN.3.2'] },
  { code: 'CN-C.4', area: 'Ciencias de la Naturaleza', bloque: 'C. Vida en nuestro mundo',
    description: 'Salud y hábitos saludables: alimentación equilibrada, higiene, actividad física, descanso y prevención de enfermedades.',
    criteria: ['CN.3.1','CN.3.3'] },
  { code: 'CN-C.5', area: 'Ciencias de la Naturaleza', bloque: 'C. Vida en nuestro mundo',
    description: 'La materia: estados (sólido, líquido, gaseoso), cambios de estado, propiedades y mezclas.',
    criteria: ['CN.1.2','CN.1.3'] },
  { code: 'CN-C.6', area: 'Ciencias de la Naturaleza', bloque: 'C. Vida en nuestro mundo',
    description: 'La energía: tipos (luz, calor, sonido, eléctrica), fuentes renovables y no renovables, transformaciones.',
    criteria: ['CN.1.3','CN.4.1'] },
  { code: 'CN-C.7', area: 'Ciencias de la Naturaleza', bloque: 'C. Vida en nuestro mundo',
    description: 'El agua y el aire: propiedades, ciclo del agua, composición del aire y su importancia para los seres vivos.',
    criteria: ['CN.1.2','CN.1.3'] },
  { code: 'CN-C.8', area: 'Ciencias de la Naturaleza', bloque: 'C. Vida en nuestro mundo',
    description: 'Medio ambiente y sostenibilidad: impacto humano, cambio climático, contaminación y medidas de conservación.',
    criteria: ['CN.4.1','CN.5.2'] },

  // ══════════════════════════════════════════════════════════════════
  // CIENCIAS SOCIALES
  // ══════════════════════════════════════════════════════════════════
  { code: 'CS-A.1', area: 'Ciencias Sociales', bloque: 'A. Cultura científica social',
    description: 'Métodos de las ciencias sociales: fuentes primarias y secundarias; contraste y valoración crítica de la información.',
    criteria: ['CS.5.1','CS.5.2'] },
  { code: 'CS-A.2', area: 'Ciencias Sociales', bloque: 'A. Cultura científica social',
    description: 'Cartografía: mapas físicos y políticos, planos, escalas, coordenadas geográficas y puntos cardinales.',
    criteria: ['CS.4.1','CS.4.2'] },
  { code: 'CS-B.1', area: 'Ciencias Sociales', bloque: 'B. Comprensión del entorno',
    description: 'España: relieve (mesetas, montañas, ríos), climas y paisajes; las comunidades autónomas.',
    criteria: ['CS.1.1'] },
  { code: 'CS-B.2', area: 'Ciencias Sociales', bloque: 'B. Comprensión del entorno',
    description: 'Europa y el mundo: principales países, relieve y grandes ríos; continentes y océanos.',
    criteria: ['CS.1.1'] },
  { code: 'CS-B.3', area: 'Ciencias Sociales', bloque: 'B. Comprensión del entorno',
    description: 'Actividades económicas: sectores primario, secundario y terciario; desarrollo sostenible y comercio justo.',
    criteria: ['CS.1.2'] },
  { code: 'CS-B.4', area: 'Ciencias Sociales', bloque: 'B. Comprensión del entorno',
    description: 'Historia de España y el mundo: Prehistoria, Antigüedad, Edad Media, Moderna y Contemporánea; hechos relevantes.',
    criteria: ['CS.3.1','CS.3.2'] },
  { code: 'CS-B.5', area: 'Ciencias Sociales', bloque: 'B. Comprensión del entorno',
    description: 'Patrimonio histórico y cultural: manifestaciones locales, nacionales y mundiales; respeto y conservación.',
    criteria: ['CS.3.3'] },
  { code: 'CS-C.1', area: 'Ciencias Sociales', bloque: 'C. Ciudadanía democrática',
    description: 'Organización política y territorial: municipio, comunidad autónoma y Estado español; instituciones básicas.',
    criteria: ['CS.2.3'] },
  { code: 'CS-C.2', area: 'Ciencias Sociales', bloque: 'C. Ciudadanía democrática',
    description: 'Principios democráticos: derechos y deberes ciudadanos; Constitución española; Derechos del Niño.',
    criteria: ['CS.2.1','CS.2.2'] },
  { code: 'CS-C.3', area: 'Ciencias Sociales', bloque: 'C. Ciudadanía democrática',
    description: 'Participación y convivencia democrática: diálogo, acuerdos, resolución pacífica de conflictos y responsabilidad.',
    criteria: ['CS.2.2'] },

  // ══════════════════════════════════════════════════════════════════
  // EDUCACIÓN ARTÍSTICA
  // ══════════════════════════════════════════════════════════════════
  { code: 'EA-A.1', area: 'Educación Artística', bloque: 'A. Educación plástica y visual',
    description: 'Lenguaje visual y plástico: elementos básicos (línea, color, forma, textura, espacio) y su uso expresivo.',
    criteria: ['EA.1.1'] },
  { code: 'EA-A.2', area: 'Educación Artística', bloque: 'A. Educación plástica y visual',
    description: 'Técnicas y materiales plásticos: dibujo, pintura (tempera, acuarela), collage, escultura y técnicas mixtas.',
    criteria: ['EA.2.1'] },
  { code: 'EA-A.3', area: 'Educación Artística', bloque: 'A. Educación plástica y visual',
    description: 'Lectura e interpretación de imágenes: análisis formal y significado de obras plásticas y visuales.',
    criteria: ['EA.1.1','EA.4.1'] },
  { code: 'EA-B.1', area: 'Educación Artística', bloque: 'B. Educación musical',
    description: 'Elementos musicales: pulso, ritmo, melodía, armonía, tempo (rápido/lento), dinámica (fuerte/suave) y timbre.',
    criteria: ['EA.1.2'] },
  { code: 'EA-B.2', area: 'Educación Artística', bloque: 'B. Educación musical',
    description: 'Lectura e interpretación musical: grafías convencionales y no convencionales de dificultad progresiva.',
    criteria: ['EA.3.2'] },
  { code: 'EA-B.3', area: 'Educación Artística', bloque: 'B. Educación musical',
    description: 'Práctica musical: canto, interpretación instrumental (flauta, percusión), danza y movimiento expresivo.',
    criteria: ['EA.3.1'] },
  { code: 'EA-C.1', area: 'Educación Artística', bloque: 'C. Arte, cultura y sociedad',
    description: 'Patrimonio artístico y cultural: manifestaciones artísticas locales, nacionales e internacionales; respeto y valoración.',
    criteria: ['EA.4.1'] },
  { code: 'EA-C.2', area: 'Educación Artística', bloque: 'C. Arte, cultura y sociedad',
    description: 'Creación artística digital: uso de herramientas digitales para explorar, crear y compartir producciones.',
    criteria: ['EA.4.2'] },
  { code: 'EA-C.3', area: 'Educación Artística', bloque: 'C. Arte, cultura y sociedad',
    description: 'Proyectos artísticos: planificación y desarrollo de proyectos individuales y colectivos con valoración del proceso.',
    criteria: ['EA.2.2'] },

  // ══════════════════════════════════════════════════════════════════
  // EDUCACIÓN FÍSICA
  // ══════════════════════════════════════════════════════════════════
  { code: 'EF-A.1', area: 'Educación Física', bloque: 'A. Actividad física y salud',
    description: 'Habilidades motrices básicas: desplazamientos, saltos, giros, lanzamientos y recepciones en diferentes contextos.',
    criteria: ['EF.1.1'] },
  { code: 'EF-A.2', area: 'Educación Física', bloque: 'A. Actividad física y salud',
    description: 'Condición física orientada a la salud: resistencia aeróbica, fuerza, flexibilidad y velocidad.',
    criteria: ['EF.3.2'] },
  { code: 'EF-A.3', area: 'Educación Física', bloque: 'A. Actividad física y salud',
    description: 'Hábitos saludables en la actividad física: higiene corporal, hidratación, alimentación y descanso.',
    criteria: ['EF.3.1'] },
  { code: 'EF-B.1', area: 'Educación Física', bloque: 'B. Organización y gestión',
    description: 'Deportes y juegos: técnicas básicas, tácticas elementales, reglas y adaptaciones.',
    criteria: ['EF.1.2','EF.2.1'] },
  { code: 'EF-B.2', area: 'Educación Física', bloque: 'B. Organización y gestión',
    description: 'Juegos populares, tradicionales y autóctonos: características, valores culturales y participación.',
    criteria: ['EF.1.2','EF.4.2'] },
  { code: 'EF-B.3', area: 'Educación Física', bloque: 'B. Organización y gestión',
    description: 'Trabajo cooperativo en actividades motrices: roles, estrategias colectivas y resolución de situaciones problema.',
    criteria: ['EF.2.2'] },
  { code: 'EF-C.1', area: 'Educación Física', bloque: 'C. Expresión corporal y motriz',
    description: 'Expresión corporal y danza: posibilidades expresivas del cuerpo, ritmo y coordinación.',
    criteria: ['EF.4.1','EF.4.2'] },
  { code: 'EF-C.2', area: 'Educación Física', bloque: 'C. Expresión corporal y motriz',
    description: 'Actividades en el entorno natural: orientación, senderismo y juegos en la naturaleza; respeto medioambiental.',
    criteria: ['EF.4.2'] },

  // ══════════════════════════════════════════════════════════════════
  // LENGUA EXTRANJERA
  // ══════════════════════════════════════════════════════════════════
  { code: 'LE-A.1', area: 'Lengua Extranjera', bloque: 'A. Comunicación',
    description: 'Comprensión oral en LE: estrategias de escucha, vocabulario de alta frecuencia y estructuras comunicativas básicas.',
    criteria: ['LE.1.1','LE.1.2'] },
  { code: 'LE-A.2', area: 'Lengua Extranjera', bloque: 'A. Comunicación',
    description: 'Producción e interacción oral en LE: fonética, pronunciación, entonación e intercambios comunicativos cotidianos.',
    criteria: ['LE.2.1','LE.2.2'] },
  { code: 'LE-A.3', area: 'Lengua Extranjera', bloque: 'A. Comunicación',
    description: 'Comprensión lectora en LE: estrategias de lectura, tipología textual básica e inferencia de significados.',
    criteria: ['LE.3.1','LE.3.2'] },
  { code: 'LE-A.4', area: 'Lengua Extranjera', bloque: 'A. Comunicación',
    description: 'Producción escrita en LE: estructuras gramaticales básicas, léxico de uso frecuente y revisión.',
    criteria: ['LE.4.1','LE.4.2'] },
  { code: 'LE-B.1', area: 'Lengua Extranjera', bloque: 'B. Plurilingüismo',
    description: 'Comparación entre lenguas: similitudes, diferencias y transferencias lingüísticas; estrategias plurilingües.',
    criteria: ['LE.5.1'] },
  { code: 'LE-C.1', area: 'Lengua Extranjera', bloque: 'C. Interculturalidad',
    description: 'Diversidad cultural y lingüística: costumbres, tradiciones y formas de vida de otras culturas; actitud de apertura.',
    criteria: ['LE.5.2'] },

  // ══════════════════════════════════════════════════════════════════
  // VALORES CÍVICOS Y ÉTICOS
  // ══════════════════════════════════════════════════════════════════
  { code: 'VCE-A.1', area: 'Valores Cívicos y Éticos', bloque: 'A. Identidad y dignidad',
    description: 'Identidad personal: autoconocimiento, autoestima, gestión emocional y bienestar.',
    criteria: ['VCE.1.1','VCE.1.2'] },
  { code: 'VCE-A.2', area: 'Valores Cívicos y Éticos', bloque: 'A. Identidad y dignidad',
    description: 'Dignidad humana: derechos fundamentales, valores éticos universales y rechazo de toda discriminación.',
    criteria: ['VCE.1.1'] },
  { code: 'VCE-B.1', area: 'Valores Cívicos y Éticos', bloque: 'B. Alteridad y convivencia',
    description: 'Diversidad e inclusión: respeto a las diferencias; igualdad de derechos y no discriminación.',
    criteria: ['VCE.1.1','VCE.2.1'] },
  { code: 'VCE-B.2', area: 'Valores Cívicos y Éticos', bloque: 'B. Alteridad y convivencia',
    description: 'Convivencia democrática: participación, diálogo, negociación, consenso y resolución pacífica de conflictos.',
    criteria: ['VCE.2.1','VCE.2.2'] },
  { code: 'VCE-B.3', area: 'Valores Cívicos y Éticos', bloque: 'B. Alteridad y convivencia',
    description: 'Responsabilidad social y ciudadana: compromiso con el bien común, sostenibilidad y justicia social.',
    criteria: ['VCE.2.2'] },
  { code: 'VCE-C.1', area: 'Valores Cívicos y Éticos', bloque: 'C. Pensamiento ético',
    description: 'Razonamiento moral: dilemas éticos sencillos, argumentación razonada y toma de decisiones responsables.',
    criteria: ['VCE.3.1'] },
  { code: 'VCE-C.2', area: 'Valores Cívicos y Éticos', bloque: 'C. Pensamiento ético',
    description: 'Derechos de la infancia: Convención sobre los Derechos del Niño; compromiso con su protección y cumplimiento.',
    criteria: ['VCE.3.2'] },
];

function importLomloeSaberes() {
  const db = getDb();

  const getCriterion = db.prepare('SELECT id FROM criteria WHERE code = ?');
  const existsSaber  = db.prepare('SELECT id FROM saberes WHERE code = ?');
  const insertSaber  = db.prepare('INSERT INTO saberes (code, description, area, bloque) VALUES (?, ?, ?, ?)');
  const insertLink   = db.prepare('INSERT OR IGNORE INTO saber_criteria (saber_id, criterion_id) VALUES (?, ?)');

  let inserted = 0, skipped = 0, links = 0, missingCrit = [];

  const run = db.transaction(() => {
    for (const s of SABERES) {
      let saberId;
      const existing = existsSaber.get(s.code);
      if (existing) {
        skipped++;
        saberId = existing.id;
      } else {
        const r = insertSaber.run(s.code, s.description, s.area, s.bloque);
        saberId = r.lastInsertRowid;
        inserted++;
      }

      for (const code of (s.criteria || [])) {
        const crit = getCriterion.get(code);
        if (crit) {
          insertLink.run(saberId, crit.id);
          links++;
        } else {
          missingCrit.push(code);
        }
      }
    }
  });

  run();

  console.log(`\n✓ Saberes LOMLOE importados: ${inserted} nuevos, ${skipped} ya existían`);
  console.log(`  Asociaciones criterio-saber creadas: ${links}`);
  if (missingCrit.length) {
    console.log(`  ⚠ Criterios no encontrados (importa primero con npm run import-lomloe): ${[...new Set(missingCrit)].join(', ')}`);
  }
  console.log(`  Total saberes en BD: ${db.prepare('SELECT COUNT(*) AS c FROM saberes WHERE active=1').get().c}`);
  return { inserted, skipped, links };
}

if (require.main === module) {
  const { initDatabase } = require('./schema');
  initDatabase();
  importLomloeSaberes();
  process.exit(0);
}

module.exports = { importLomloeSaberes };
