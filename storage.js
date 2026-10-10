const STORAGE_KEY = 'unsa_simulador_cursos_v1';
const ACTIVE_COURSE_KEY = 'unsa_simulador_curso_activo_id';
const PERFIL_KEY = 'unsa_simulador_perfil_v1';

const UNIVERSIDAD_POR_DEFECTO = 'unsa';

const UNIVERSIDADES = {
    unsa:   { siglas: 'UNSA',   nombre: 'Universidad Nacional de San Agustín de Arequipa',    notaAprobatoria: 10.5, colores: { primario: '#7e1927', secundario: '#0f2742' } },
    uni:    { siglas: 'UNI',    nombre: 'Universidad Nacional de Ingeniería',                 notaAprobatoria: 10,   colores: { primario: '#7a1a1f', secundario: '#2b2b2b' } },
    unmsm:  { siglas: 'UNMSM',  nombre: 'Universidad Nacional Mayor de San Marcos',           notaAprobatoria: 10.5, colores: { primario: '#8a1c1c', secundario: '#7a5c00' } },
    pucp:   { siglas: 'PUCP',   nombre: 'Pontificia Universidad Católica del Perú',           notaAprobatoria: 10.5, colores: { primario: '#002d72', secundario: '#3b5b8c' } },
    ucsm:   { siglas: 'UCSM',   nombre: 'Universidad Católica de Santa María',                notaAprobatoria: 10.5, colores: { primario: '#0b5d3b', secundario: '#1f2937' } },
    unsaac: { siglas: 'UNSAAC', nombre: 'Universidad Nacional de San Antonio Abad del Cusco', notaAprobatoria: 10.5, colores: { primario: '#8b1d2c', secundario: '#14532d' } },
    unt:    { siglas: 'UNT',    nombre: 'Universidad Nacional de Trujillo',                   notaAprobatoria: 10.5, colores: { primario: '#1d3c78', secundario: '#6b5416' } },
    unalm:  { siglas: 'UNALM',  nombre: 'Universidad Nacional Agraria La Molina',             notaAprobatoria: 10.5, colores: { primario: '#0f6b3a', secundario: '#1f3a2b' } },
    otra:   { siglas: 'OTRA',   nombre: 'Otra universidad',                                   notaAprobatoria: 10.5, colores: { primario: '#334155', secundario: '#1e293b' }, personalizable: true }
};

/**
 * Avisa que cambiaron los datos personales. Con sesión iniciada, nube.js los sube a la cuenta.
 */
function notificarCambioLocal() {
    if (typeof alCambiarDatosLocales === 'function') alCambiarDatosLocales();
}

/**
 * Normaliza un perfil (guardado o importado) a una forma válida.
 */
function normalizarPerfil(datos) {
    const d = datos && typeof datos === 'object' ? datos : {};
    const p = d.personalizada && typeof d.personalizada === 'object' ? d.personalizada : {};
    const notaPersonalizada = parseFloat(p.notaAprobatoria);
    return {
        universidadId: UNIVERSIDADES[d.universidadId] ? d.universidadId : UNIVERSIDAD_POR_DEFECTO,
        estudiante: typeof d.estudiante === 'string' ? d.estudiante.trim().slice(0, 80) : '',
        personalizada: {
            nombre: typeof p.nombre === 'string' ? p.nombre.trim().slice(0, 100) : '',
            siglas: typeof p.siglas === 'string' ? p.siglas.trim().slice(0, 12) : '',
            notaAprobatoria: !isNaN(notaPersonalizada) && notaPersonalizada >= 0 && notaPersonalizada <= 20 ? notaPersonalizada : 10.5
        }
    };
}

function obtenerPerfil() {
    try {
        return normalizarPerfil(JSON.parse(localStorage.getItem(PERFIL_KEY)));
    } catch (e) {
        return normalizarPerfil(null);
    }
}

function guardarPerfil(perfil) {
    const normalizado = normalizarPerfil(perfil);
    try {
        localStorage.setItem(PERFIL_KEY, JSON.stringify(normalizado));
        notificarCambioLocal();
    } catch (e) {
        console.error("Error al guardar el perfil en localStorage:", e);
    }
    aplicarColoresUniversidad(obtenerUniversidad(normalizado));
    return normalizado;
}

/**
 * Devuelve la universidad del perfil con sus datos efectivos
 * (en "Otra universidad" usa el nombre, siglas y nota que escribió el estudiante).
 */
function obtenerUniversidad(perfil = obtenerPerfil()) {
    const base = UNIVERSIDADES[perfil.universidadId] || UNIVERSIDADES[UNIVERSIDAD_POR_DEFECTO];
    const univ = { id: perfil.universidadId, ...base };
    if (base.personalizable) {
        univ.nombre = perfil.personalizada.nombre || base.nombre;
        univ.siglas = perfil.personalizada.siglas || base.siglas;
        univ.notaAprobatoria = perfil.personalizada.notaAprobatoria;
    }
    return univ;
}

function obtenerNotaAprobatoria() {
    return obtenerUniversidad().notaAprobatoria;
}

/**
 * Expone los colores de la universidad como variables CSS (--univ-primario / --univ-secundario).
 */
function aplicarColoresUniversidad(univ = obtenerUniversidad()) {
    const raiz = document.documentElement;
    raiz.style.setProperty('--univ-primario', univ.colores.primario);
    raiz.style.setProperty('--univ-secundario', univ.colores.secundario);
}

/**
 * Escribe las siglas de la universidad en los elementos marcados con .js-univ-siglas.
 */
function mostrarSiglasUniversidad(univ = obtenerUniversidad()) {
    document.querySelectorAll('.js-univ-siglas').forEach(el => {
        el.textContent = univ.siglas;
    });
}

// Cursos iniciales de ejemplo si es la primera vez que se ingresa
const CURSOS_DEMO = [
    {
        id: 'curso_demo_1',
        nombre: 'Cálculo en Varias Variables',
        codigo: 'MAT-201',
        creditos: 4,
        notaMeta: '',
        notas: {
            nota1: 14.5,
            nota2: 13.0,
            nota3: 11.0,
            nota4: 12.5,
            nota5: '',
            nota6: ''
        },
        pesos: {
            peso1: 15,
            peso2: 15,
            peso3: 15,
            peso4: 15,
            peso5: 20,
            peso6: 20
        },
        fechaModificacion: new Date().toISOString()
    },
    {
        id: 'curso_demo_2',
        nombre: 'Estructuras de Datos',
        codigo: 'CS-202',
        creditos: 4,
        notaMeta: 12.0,
        notas: {
            nota1: 16.0,
            nota2: 15.5,
            nota3: 14.0,
            nota4: 17.0,
            nota5: '',
            nota6: ''
        },
        pesos: {
            peso1: 15,
            peso2: 15,
            peso3: 15,
            peso4: 15,
            peso5: 20,
            peso6: 20
        },
        fechaModificacion: new Date().toISOString()
    },
    {
        id: 'curso_demo_3',
        nombre: 'Física Computacional',
        codigo: 'FIS-103',
        creditos: 3,
        notaMeta: '',
        notas: {
            nota1: 10.0,
            nota2: 9.5,
            nota3: '',
            nota4: '',
            nota5: '',
            nota6: ''
        },
        pesos: {
            peso1: 15,
            peso2: 15,
            peso3: 15,
            peso4: 15,
            peso5: 20,
            peso6: 20
        },
        fechaModificacion: new Date().toISOString()
    }
];

/**
 * Escapa caracteres especiales para insertar texto de usuario en HTML de forma segura.
 */
function escaparHtml(texto) {
    const entidades = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(texto ?? '').replace(/[&<>"']/g, c => entidades[c]);
}

/**
 * Fecha corta para los reportes: "10/10/2026, 03:10 p. m."
 */
function formatearFechaReporte(fecha = new Date()) {
    return fecha.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

const MAX_ESTRELLAS = 5;

/**
 * Normaliza la calificación del docente a un entero entre 0 (sin calificar) y 5.
 */
function normalizarCalificacion(valor) {
    const n = parseInt(valor, 10);
    return isNaN(n) ? 0 : Math.min(Math.max(n, 0), MAX_ESTRELLAS);
}

/**
 * Estrellas en texto plano (★★★☆☆), útil para textContent.
 */
function textoEstrellas(calificacion) {
    const n = normalizarCalificacion(calificacion);
    return '★'.repeat(n) + '☆'.repeat(MAX_ESTRELLAS - n);
}

/**
 * Estrellas en HTML con las llenas y vacías diferenciadas por color.
 */
function htmlEstrellas(calificacion) {
    const n = normalizarCalificacion(calificacion);
    return `<span class="stars-display" role="img" aria-label="${n} de ${MAX_ESTRELLAS} estrellas">` +
        `<span class="star-on">${'★'.repeat(n)}</span><span class="star-off">${'★'.repeat(MAX_ESTRELLAS - n)}</span></span>`;
}

/**
 * Obtiene todos los cursos guardados en LocalStorage.
 * Si no existen, inicializa los cursos de demostración.
 */
function obtenerCursos() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(CURSOS_DEMO));
            return CURSOS_DEMO;
        }
        const cursos = JSON.parse(data);
        return Array.isArray(cursos) ? cursos : [];
    } catch (e) {
        console.error("Error al leer cursos desde localStorage:", e);
        return CURSOS_DEMO;
    }
}

/**
 * Guarda la lista completa de cursos.
 */
function guardarTodosLosCursos(cursos) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cursos));
        notificarCambioLocal();
    } catch (e) {
        console.error("Error al guardar cursos en localStorage:", e);
    }
}

/**
 * Obtiene un curso específico por su ID.
 */
function obtenerCursoPorId(id) {
    const cursos = obtenerCursos();
    return cursos.find(c => c.id === id) || null;
}

/**
 * Guarda o actualiza un curso.
 */
function guardarCurso(curso) {
    const cursos = obtenerCursos();
    curso.fechaModificacion = new Date().toISOString();

    if (!curso.id) {
        curso.id = 'curso_' + Date.now();
        cursos.push(curso);
    } else {
        const index = cursos.findIndex(c => c.id === curso.id);
        if (index !== -1) {
            cursos[index] = curso;
        } else {
            cursos.push(curso);
        }
    }

    guardarTodosLosCursos(cursos);
    establecerCursoActivoId(curso.id);
    return curso;
}

/**
 * Elimina un curso por su ID.
 */
function eliminarCurso(id) {
    let cursos = obtenerCursos();
    cursos = cursos.filter(c => c.id !== id);
    guardarTodosLosCursos(cursos);

    if (obtenerCursoActivoId() === id) {
        localStorage.removeItem(ACTIVE_COURSE_KEY);
    }
}

/**
 * Administra el ID del curso activo actualmente en el simulador.
 */
function obtenerCursoActivoId() {
    return localStorage.getItem(ACTIVE_COURSE_KEY) || null;
}

function establecerCursoActivoId(id) {
    localStorage.setItem(ACTIVE_COURSE_KEY, id);
}

const NOTA_MAXIMA = 20;

// Configuración de las 6 evaluaciones
const EVALUACIONES = [
    { id: 1, nombre: 'Examen Parcial 1', unidad: 'Unidad 01', notaId: 'nota1', pesoId: 'peso1' },
    { id: 2, nombre: 'Evaluación Continua 1', unidad: 'Unidad 01', notaId: 'nota2', pesoId: 'peso2' },
    { id: 3, nombre: 'Examen Parcial 2', unidad: 'Unidad 02', notaId: 'nota3', pesoId: 'peso3' },
    { id: 4, nombre: 'Evaluación Continua 2', unidad: 'Unidad 02', notaId: 'nota4', pesoId: 'peso4' },
    { id: 5, nombre: 'Examen Parcial 3', unidad: 'Unidad 03', notaId: 'nota5', pesoId: 'peso5' },
    { id: 6, nombre: 'Evaluación Continua 3', unidad: 'Unidad 03', notaId: 'nota6', pesoId: 'peso6' }
];

// Niveles de exigencia según la nota requerida en lo pendiente
const NIVELES_EXIGENCIA = [
    { max: 0, clase: 'aprobado' },
    { max: 10.5, clase: 'accesible' },
    { max: 14.0, clase: 'moderado' },
    { max: 17.0, clase: 'exigente' },
    { max: NOTA_MAXIMA, clase: 'critico' }
];

/**
 * Convierte la meta personal a número. Si está vacía o no es numérica usa el valor por
 * defecto, que es la nota aprobatoria de la universidad (una meta de 0 es un número válido).
 */
function parsearNotaMeta(valor, porDefecto = obtenerNotaAprobatoria()) {
    const numero = parseFloat(valor);
    return isNaN(numero) ? porDefecto : numero;
}

/**
 * Devuelve la clase de exigencia ('aprobado', 'accesible', ..., 'desaprobado' si supera 20).
 */
function clasificarExigencia(notaRequerida) {
    const nivel = NIVELES_EXIGENCIA.find(n => notaRequerida <= n.max);
    return nivel ? nivel.clase : 'desaprobado';
}

/**
 * Calcula el resumen académico y predictivo de un curso.
 * Estados posibles: 'invalido', 'sin_pesos', 'completo', 'sin_datos', 'predictivo'.
 *
 * - notaAprobatoria: fijada por la universidad; decide Aprobado / Desaprobado.
 * - notaMeta: meta personal del curso (nunca menor que la aprobatoria); se usa para
 *   calcular la nota requerida y el nivel de exigencia.
 */
function calcularResumenCurso(curso, notaAprobatoria = obtenerNotaAprobatoria()) {
    const notas = curso.notas || {};
    const pesos = curso.pesos || {};
    const notaMeta = Math.max(parsearNotaMeta(curso.notaMeta, notaAprobatoria), notaAprobatoria);

    let sumaPesos = 0;
    let pesoEvaluado = 0;
    let pesoPendiente = 0;
    let puntosAcumulados = 0;
    let notasLlenadas = 0;
    let notasFueraDeRango = false;
    const pendientes = [];

    EVALUACIONES.forEach(ev => {
        const notaRaw = notas[ev.notaId];
        const notaVal = parseFloat(notaRaw);
        const pesoVal = parseFloat(pesos[ev.pesoId]) || 0;
        sumaPesos += pesoVal;

        if (notaRaw !== undefined && notaRaw !== null && String(notaRaw).trim() !== '' && !isNaN(notaVal)) {
            if (notaVal < 0 || notaVal > NOTA_MAXIMA) {
                notasFueraDeRango = true;
            }
            puntosAcumulados += notaVal * pesoVal;
            pesoEvaluado += pesoVal;
            notasLlenadas++;
        } else {
            pesoPendiente += pesoVal;
            pendientes.push(ev.nombre);
        }
    });

    const base = {
        notaMeta,
        notaAprobatoria,
        sumaPesos,
        pesoEvaluado,
        pesoPendiente,
        notasLlenadas,
        pendientes,
        promedioActual: sumaPesos > 0 ? puntosAcumulados / sumaPesos : 0,
        // Promedio solo sobre lo ya evaluado (null si aún no hay notas con peso)
        promedioParcial: pesoEvaluado > 0 ? puntosAcumulados / pesoEvaluado : null,
        pctEvaluado: sumaPesos > 0 ? Math.round((pesoEvaluado / sumaPesos) * 100) : 0
    };

    if (notasFueraDeRango) {
        return {
            ...base,
            estado: 'invalido',
            badgeClass: 'sin_datos',
            badgeTexto: 'Notas fuera de rango',
            promedioActual: 0,
            promedioParcial: null,
            notaRequerida: 0,
            mejorCaso: 0,
            peorCaso: 0,
            detalle: `Hay calificaciones fuera de la escala de 0 a ${NOTA_MAXIMA}. Corrígelas en el simulador.`
        };
    }

    if (sumaPesos === 0) {
        return {
            ...base,
            estado: 'sin_pesos',
            badgeClass: 'sin_datos',
            badgeTexto: 'Sin pesos definidos',
            notaRequerida: 0,
            mejorCaso: 0,
            peorCaso: 0,
            detalle: 'Asigna porcentajes a las evaluaciones.'
        };
    }

    // Sin evaluaciones pendientes con peso: el promedio actual ya es el final
    if (pesoPendiente === 0) {
        const promedio = base.promedioActual;
        const aprobado = promedio >= notaAprobatoria;
        const metaAlcanzada = promedio >= notaMeta;
        const todasCompletas = pendientes.length === 0;
        const textoMeta = notaMeta > notaAprobatoria
            ? ` Meta personal de ${notaMeta.toFixed(1)} ${metaAlcanzada ? 'alcanzada' : 'no alcanzada'}.`
            : '';
        return {
            ...base,
            estado: 'completo',
            metaAlcanzada,
            badgeClass: aprobado ? 'aprobado' : 'desaprobado',
            badgeTexto: todasCompletas
                ? `${aprobado ? 'Aprobado' : 'Desaprobado'} (${promedio.toFixed(2)})`
                : `${promedio.toFixed(2)} / 20`,
            pctEvaluado: 100,
            notaRequerida: 0,
            mejorCaso: promedio,
            peorCaso: promedio,
            detalle: (todasCompletas
                ? `Curso culminado con promedio ${promedio.toFixed(2)}.`
                : 'Todas las evaluaciones con peso asignado están completas.') + textoMeta
        };
    }

    const notaRequerida = (notaMeta * sumaPesos - puntosAcumulados) / pesoPendiente;
    const mejorCaso = (puntosAcumulados + NOTA_MAXIMA * pesoPendiente) / sumaPesos;
    const peorCaso = puntosAcumulados / sumaPesos;
    const exigencia = clasificarExigencia(notaRequerida);
    // Nota requerida solo para aprobar (igual a notaRequerida si la meta es la aprobatoria)
    const notaRequeridaAprobar = (notaAprobatoria * sumaPesos - puntosAcumulados) / pesoPendiente;
    const prediccion = { ...base, notaRequerida, notaRequeridaAprobar, mejorCaso, peorCaso, exigencia };

    if (notasLlenadas === 0) {
        return {
            ...prediccion,
            estado: 'sin_datos',
            badgeClass: 'sin_datos',
            badgeTexto: 'Sin calificaciones',
            detalle: `Requiere ${notaMeta.toFixed(1)} en las evaluaciones.`
        };
    }

    const req = notaRequerida.toFixed(2);
    const textos = {
        aprobado: ['Meta asegurada', `Puntaje suficiente para alcanzar la meta de ${notaMeta.toFixed(1)}. Nota final mínima garantizada: ${peorCaso.toFixed(2)}.`],
        accesible: [`Req. ${req}`, `Exigencia regular: se requiere promediar ${req} en las evaluaciones pendientes.`],
        moderado: [`Req. ${req}`, `Exigencia moderada: se requiere promediar ${req} en las evaluaciones pendientes.`],
        exigente: [`Alta exigencia: ${req}`, `Alta exigencia: se requiere una calificación promedio de ${req} en lo pendiente.`],
        critico: [`Crítico: ${req}`, `Exigencia crítica: se requiere promediar ${req} en las evaluaciones pendientes.`],
        desaprobado: ['Fuera de rango', `Meta inalcanzable (requeriría ${req}). Calificación máxima alcanzable: ${mejorCaso.toFixed(2)}.`]
    };

    return {
        ...prediccion,
        estado: 'predictivo',
        badgeClass: exigencia,
        badgeTexto: textos[exigencia][0],
        detalle: textos[exigencia][1]
    };
}

/**
 * Calcula métricas globales de todos los cursos para el dashboard.
 */
function calcularMetricasGlobales(cursos) {
    if (!cursos || cursos.length === 0) {
        return {
            totalCursos: 0,
            promedioPonderado: 0,
            creditosTotales: 0,
            cursosAprobados: 0,
            cursosEnRiesgo: 0
        };
    }

    let sumaNotasPonderadasCreditos = 0;
    let creditosTotales = 0;
    let cursosAprobados = 0;
    let cursosEnRiesgo = 0;

    cursos.forEach(curso => {
        const creditos = parseInt(curso.creditos) || 3;
        const resumen = calcularResumenCurso(curso);

        creditosTotales += creditos;
        sumaNotasPonderadasCreditos += (resumen.promedioActual * creditos);

        if (resumen.badgeClass === 'aprobado') {
            cursosAprobados++;
        } else if (resumen.badgeClass === 'critico' || resumen.badgeClass === 'desaprobado' || resumen.badgeClass === 'exigente') {
            cursosEnRiesgo++;
        }
    });

    const promedioPonderado = creditosTotales > 0 ? (sumaNotasPonderadasCreditos / creditosTotales) : 0;

    return {
        totalCursos: cursos.length,
        promedioPonderado: promedioPonderado.toFixed(2),
        creditosTotales,
        cursosAprobados,
        cursosEnRiesgo
    };
}

// ==========================================================================
// CATÁLOGO DE DOCENTES Y COMENTARIOS DE CURSOS
// Cada docente se guarda una sola vez y los cursos lo referencian por docenteId.
// La forma de los datos (docentes / calificación / comentarios) está pensada para
// poder sincronizarla más adelante con una base de datos compartida.
// ==========================================================================
const DOCENTES_KEY = 'unsa_simulador_docentes_v1';
const MAX_COMENTARIO = 500;

// Títulos que no forman parte del nombre al comparar ("Dr. Juan Pérez" = "Juan Perez")
const TITULOS_DOCENTE = new Set([
    'dr', 'dra', 'doctor', 'doctora', 'mg', 'mgtr', 'mag', 'magister', 'ing', 'lic', 'licenciado',
    'licenciada', 'msc', 'phd', 'prof', 'profesor', 'profesora', 'ingeniero', 'ingeniera', 'abog', 'arq', 'econ'
]);

/**
 * Normaliza un texto para compararlo: sin tildes, en minúsculas y sin signos.
 */
function normalizarTexto(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .join(' ');
}

/**
 * Normaliza el nombre de un docente: como normalizarTexto y además sin títulos.
 */
function normalizarNombreDocente(nombre) {
    return normalizarTexto(nombre)
        .split(' ')
        .filter(palabra => !TITULOS_DOCENTE.has(palabra))
        .join(' ');
}

function obtenerDocentes() {
    try {
        const lista = JSON.parse(localStorage.getItem(DOCENTES_KEY));
        return Array.isArray(lista) ? lista : [];
    } catch (e) {
        return [];
    }
}

function guardarDocentes(lista) {
    try {
        localStorage.setItem(DOCENTES_KEY, JSON.stringify(lista));
        notificarCambioLocal();
    } catch (e) {
        console.error("Error al guardar docentes en localStorage:", e);
    }
}

function obtenerDocentePorId(id) {
    if (!id) return null;
    return obtenerDocentes().find(d => d.id === id) || null;
}

function buscarDocentePorNombre(nombre) {
    const normalizado = normalizarNombreDocente(nombre);
    if (!normalizado) return null;
    return obtenerDocentes().find(d => d.nombreNormalizado === normalizado) || null;
}

/**
 * Sugerencias para el campo "Docente": cada palabra escrita debe ser el inicio de
 * alguna palabra del nombre ("per lu" encuentra a "Luis Pérez").
 */
function buscarDocentes(texto, limite = 6) {
    const consulta = normalizarNombreDocente(texto).split(' ').filter(Boolean);
    if (consulta.length === 0) return [];
    return obtenerDocentes()
        .filter(d => {
            const palabras = d.nombreNormalizado.split(' ');
            return consulta.every(q => palabras.some(p => p.startsWith(q)));
        })
        .sort((a, b) => {
            // Primero los que empiezan igual que lo escrito, luego alfabético
            const inicio = consulta.join(' ');
            const aInicia = a.nombreNormalizado.startsWith(inicio) ? 0 : 1;
            const bInicia = b.nombreNormalizado.startsWith(inicio) ? 0 : 1;
            return aInicia - bInicia || a.nombre.localeCompare(b.nombre, 'es');
        })
        .slice(0, limite);
}

/**
 * Devuelve el docente con ese nombre si ya existe; si no, lo registra.
 */
function registrarDocente(nombre) {
    const limpio = String(nombre || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    if (!normalizarNombreDocente(limpio)) return null;
    const existente = buscarDocentePorNombre(limpio);
    if (existente) return existente;

    const docente = {
        id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        nombre: limpio,
        nombreNormalizado: normalizarNombreDocente(limpio),
        calificacion: 0,
        fechaRegistro: new Date().toISOString()
    };
    guardarDocentes([...obtenerDocentes(), docente]);
    return docente;
}

function calificarDocente(id, calificacion) {
    const docentes = obtenerDocentes();
    const docente = docentes.find(d => d.id === id);
    if (!docente) return;
    docente.calificacion = normalizarCalificacion(calificacion);
    guardarDocentes(docentes);
}

function contarCursosDeDocente(id, cursos = obtenerCursos()) {
    return cursos.filter(c => c.docenteId === id).length;
}

/**
 * Docente de un curso ({ id, nombre, calificacion }) o null.
 * Usa los campos antiguos del curso si todavía no fue migrado al catálogo.
 */
function obtenerDocenteDeCurso(curso) {
    const docente = obtenerDocentePorId(curso.docenteId);
    if (docente) return { id: docente.id, nombre: docente.nombre, calificacion: normalizarCalificacion(docente.calificacion) };
    if (curso.profesor) return { id: null, nombre: curso.profesor, calificacion: normalizarCalificacion(curso.calificacionProfesor) };
    return null;
}

/**
 * Pasa al catálogo los docentes escritos en cursos antiguos (campo "profesor").
 * Es idempotente: solo toca cursos sin docenteId o con un docenteId que ya no existe.
 */
function migrarDocentes() {
    const cursos = obtenerCursos();
    const idsExistentes = new Set(obtenerDocentes().map(d => d.id));
    let cambios = false;
    cursos.forEach(curso => {
        if (!curso.profesor || (curso.docenteId && idsExistentes.has(curso.docenteId))) return;
        const docente = registrarDocente(curso.profesor);
        if (!docente) return;
        const calificacionAntigua = normalizarCalificacion(curso.calificacionProfesor);
        if (calificacionAntigua > 0 && !docente.calificacion) {
            calificarDocente(docente.id, calificacionAntigua);
        }
        curso.docenteId = docente.id;
        curso.profesor = docente.nombre;
        delete curso.calificacionProfesor;
        cambios = true;
    });
    if (cambios) guardarTodosLosCursos(cursos);
}

/**
 * Agrega un comentario al curso (no lo guarda: llamar a guardarCurso después).
 */
function agregarComentario(curso, texto) {
    const limpio = String(texto || '').trim().slice(0, MAX_COMENTARIO);
    if (!limpio) return null;
    const comentario = {
        id: `com_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        texto: limpio,
        fecha: new Date().toISOString()
    };
    curso.comentarios = [...(Array.isArray(curso.comentarios) ? curso.comentarios : []), comentario];
    return comentario;
}

function eliminarComentario(curso, comentarioId) {
    curso.comentarios = (Array.isArray(curso.comentarios) ? curso.comentarios : []).filter(c => c.id !== comentarioId);
}

/**
 * Valida la lista de docentes de un respaldo (descarta entradas inválidas).
 */
function validarDocentes(lista) {
    if (!Array.isArray(lista)) return [];
    const ids = new Set();
    const nombres = new Set();
    return lista.filter(d => {
        if (!d || typeof d.id !== 'string' || !d.id || typeof d.nombre !== 'string') return false;
        const normalizado = normalizarNombreDocente(d.nombre);
        if (!normalizado || ids.has(d.id) || nombres.has(normalizado)) return false;
        ids.add(d.id);
        nombres.add(normalizado);
        return true;
    }).map(d => ({
        id: d.id,
        nombre: d.nombre.trim().slice(0, 80),
        nombreNormalizado: normalizarNombreDocente(d.nombre),
        calificacion: normalizarCalificacion(d.calificacion),
        fechaRegistro: typeof d.fechaRegistro === 'string' ? d.fechaRegistro : new Date().toISOString()
    }));
}

// ==========================================================================
// CATÁLOGO DE ASIGNATURAS (clave: universidad + código)
// Evita registrar dos veces el mismo curso y permite sugerirlo al escribir.
// ==========================================================================
const ASIGNATURAS_KEY = 'unsa_simulador_asignaturas_v1';

/**
 * Normaliza un código para compararlo: "mat-201", "MAT 201" y "MAT201" son iguales.
 */
function normalizarCodigo(codigo) {
    return String(codigo || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
}

function obtenerAsignaturas() {
    try {
        const lista = JSON.parse(localStorage.getItem(ASIGNATURAS_KEY));
        return Array.isArray(lista) ? lista : [];
    } catch (e) {
        return [];
    }
}

function guardarAsignaturas(lista) {
    try {
        localStorage.setItem(ASIGNATURAS_KEY, JSON.stringify(lista));
        notificarCambioLocal();
    } catch (e) {
        console.error("Error al guardar asignaturas en localStorage:", e);
    }
}

function asignaturasDeUniversidad(universidadId = obtenerPerfil().universidadId) {
    return obtenerAsignaturas().filter(a => a.universidadId === universidadId);
}

function buscarAsignaturaPorCodigo(codigo, universidadId = obtenerPerfil().universidadId) {
    const normalizado = normalizarCodigo(codigo);
    if (!normalizado) return null;
    return asignaturasDeUniversidad(universidadId).find(a => a.codigoNormalizado === normalizado) || null;
}

/**
 * Sugerencias por código (prefijo) o por nombre (cada palabra escrita inicia una palabra del nombre).
 */
function buscarAsignaturas(texto, limite = 6) {
    const codigo = normalizarCodigo(texto);
    const palabras = normalizarTexto(texto).split(' ').filter(Boolean);
    if (!codigo && palabras.length === 0) return [];
    const porCodigo = a => codigo && a.codigoNormalizado.startsWith(codigo);
    const porNombre = a => {
        const delNombre = a.nombreNormalizado.split(' ');
        return palabras.length > 0 && palabras.every(q => delNombre.some(p => p.startsWith(q)));
    };
    return asignaturasDeUniversidad()
        .filter(a => porCodigo(a) || porNombre(a))
        .sort((a, b) => (porCodigo(a) ? 0 : 1) - (porCodigo(b) ? 0 : 1) || a.codigo.localeCompare(b.codigo, 'es'))
        .slice(0, limite);
}

/**
 * Registra la asignatura en el catálogo de la universidad actual o actualiza su nombre y créditos.
 * Solo se catalogan cursos con código, que es lo que los identifica.
 */
function registrarAsignatura({ codigo, nombre, creditos }) {
    const codigoNormalizado = normalizarCodigo(codigo);
    const nombreLimpio = String(nombre || '').trim().replace(/\s+/g, ' ').slice(0, 120);
    if (!codigoNormalizado || !nombreLimpio) return null;

    const universidadId = obtenerPerfil().universidadId;
    const lista = obtenerAsignaturas();
    let asignatura = lista.find(a => a.universidadId === universidadId && a.codigoNormalizado === codigoNormalizado);
    if (asignatura) {
        asignatura.codigo = String(codigo).trim().toUpperCase();
        asignatura.nombre = nombreLimpio;
        asignatura.nombreNormalizado = normalizarTexto(nombreLimpio);
        asignatura.creditos = parseInt(creditos) || asignatura.creditos || 3;
    } else {
        asignatura = {
            id: `asig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            universidadId,
            codigo: String(codigo).trim().toUpperCase(),
            codigoNormalizado,
            nombre: nombreLimpio,
            nombreNormalizado: normalizarTexto(nombreLimpio),
            creditos: parseInt(creditos) || 3,
            fechaRegistro: new Date().toISOString()
        };
        lista.push(asignatura);
    }
    guardarAsignaturas(lista);
    return asignatura;
}

/**
 * Busca entre tus cursos uno que sea el mismo: primero por código (duplicado seguro)
 * y luego por nombre (posible duplicado con otro código).
 */
function buscarCursoDuplicado({ codigo, nombre }, idExcluir = null) {
    const otros = obtenerCursos().filter(c => c.id !== idExcluir);
    const codigoNormalizado = normalizarCodigo(codigo);
    if (codigoNormalizado) {
        const mismoCodigo = otros.find(c => normalizarCodigo(c.codigo) === codigoNormalizado);
        if (mismoCodigo) return { tipo: 'codigo', curso: mismoCodigo };
    }
    const nombreNormalizado = normalizarTexto(nombre);
    if (nombreNormalizado) {
        const mismoNombre = otros.find(c => normalizarTexto(c.nombre) === nombreNormalizado);
        if (mismoNombre) return { tipo: 'nombre', curso: mismoNombre };
    }
    return null;
}

/**
 * Agrega al catálogo los cursos con código que aún no están vinculados (idempotente).
 */
function migrarAsignaturas() {
    const cursos = obtenerCursos();
    const idsExistentes = new Set(obtenerAsignaturas().map(a => a.id));
    let cambios = false;
    cursos.forEach(curso => {
        if (!normalizarCodigo(curso.codigo) || (curso.asignaturaId && idsExistentes.has(curso.asignaturaId))) return;
        const asignatura = registrarAsignatura(curso);
        if (!asignatura) return;
        curso.asignaturaId = asignatura.id;
        cambios = true;
    });
    if (cambios) guardarTodosLosCursos(cursos);
}

/**
 * Valida el catálogo de asignaturas de un respaldo (descarta entradas inválidas o repetidas).
 */
function validarAsignaturas(lista) {
    if (!Array.isArray(lista)) return [];
    const ids = new Set();
    const claves = new Set();
    return lista.filter(a => {
        if (!a || typeof a.id !== 'string' || !a.id || typeof a.nombre !== 'string' || !UNIVERSIDADES[a.universidadId]) return false;
        const clave = `${a.universidadId}|${normalizarCodigo(a.codigo)}`;
        if (!normalizarCodigo(a.codigo) || ids.has(a.id) || claves.has(clave)) return false;
        ids.add(a.id);
        claves.add(clave);
        return true;
    }).map(a => ({
        id: a.id,
        universidadId: a.universidadId,
        codigo: String(a.codigo).trim().toUpperCase(),
        codigoNormalizado: normalizarCodigo(a.codigo),
        nombre: a.nombre.trim().slice(0, 120),
        nombreNormalizado: normalizarTexto(a.nombre),
        creditos: parseInt(a.creditos) || 3,
        fechaRegistro: typeof a.fechaRegistro === 'string' ? a.fechaRegistro : new Date().toISOString()
    }));
}

// ==========================================================================
// RESPALDO DE DATOS (EXPORTAR / RESTAURAR JSON)
// ==========================================================================
const RESPALDO_APP = 'unsa-simulador-notas';
const RESPALDO_VERSION = 1;

/**
 * Arma el contenido del archivo de respaldo con todas las asignaturas.
 */
function crearRespaldo() {
    return {
        app: RESPALDO_APP,
        version: RESPALDO_VERSION,
        fechaExportacion: new Date().toISOString(),
        perfil: obtenerPerfil(),
        docentes: obtenerDocentes(),
        asignaturas: obtenerAsignaturas(),
        cursos: obtenerCursos()
    };
}

/**
 * Valida y normaliza las asignaturas de un respaldo.
 * Acepta el formato de crearRespaldo() o directamente una lista de cursos.
 * Lanza un Error con un mensaje legible si el contenido no es válido.
 */
function validarRespaldo(datos) {
    const lista = Array.isArray(datos) ? datos : (datos && Array.isArray(datos.cursos) ? datos.cursos : null);
    if (!lista) {
        throw new Error('el archivo no contiene una lista de asignaturas.');
    }
    if (lista.length === 0) {
        throw new Error('el respaldo no contiene asignaturas.');
    }

    const esValor = v => typeof v === 'number' || typeof v === 'string';
    const idsUsados = new Set();

    return lista.map((c, i) => {
        if (!c || typeof c !== 'object' || typeof c.nombre !== 'string' || c.nombre.trim() === '') {
            throw new Error(`la asignatura #${i + 1} no tiene un nombre válido.`);
        }

        let id = typeof c.id === 'string' && c.id ? c.id : `curso_${Date.now()}_${i}`;
        if (idsUsados.has(id)) id = `${id}_${i}`;
        idsUsados.add(id);

        const notas = {};
        const pesos = {};
        EVALUACIONES.forEach(ev => {
            const nota = c.notas ? c.notas[ev.notaId] : '';
            const peso = c.pesos ? c.pesos[ev.pesoId] : '';
            notas[ev.notaId] = esValor(nota) ? nota : '';
            pesos[ev.pesoId] = esValor(peso) ? peso : '';
        });

        return {
            id,
            nombre: c.nombre.trim(),
            codigo: typeof c.codigo === 'string' && c.codigo.trim() ? c.codigo.trim() : '',
            creditos: parseInt(c.creditos) || 3,
            // Meta vacía = sigue la nota aprobatoria de la universidad
            notaMeta: c.notaMeta === '' || c.notaMeta === null || c.notaMeta === undefined ? '' : parsearNotaMeta(c.notaMeta),
            asignaturaId: typeof c.asignaturaId === 'string' ? c.asignaturaId : '',
            docenteId: typeof c.docenteId === 'string' ? c.docenteId : '',
            profesor: typeof c.profesor === 'string' ? c.profesor.trim().slice(0, 80) : '',
            calificacionProfesor: normalizarCalificacion(c.calificacionProfesor),
            comentarios: Array.isArray(c.comentarios)
                ? c.comentarios
                    .filter(com => com && typeof com.texto === 'string' && com.texto.trim())
                    .map((com, j) => ({
                        id: typeof com.id === 'string' && com.id ? com.id : `com_${Date.now()}_${i}_${j}`,
                        texto: com.texto.trim().slice(0, MAX_COMENTARIO),
                        fecha: typeof com.fecha === 'string' ? com.fecha : new Date().toISOString()
                    }))
                : [],
            notas,
            pesos,
            fechaModificacion: typeof c.fechaModificacion === 'string' ? c.fechaModificacion : new Date().toISOString()
        };
    });
}

/**
 * Reemplaza todas las asignaturas guardadas por las de un respaldo ya validado.
 */
function restaurarCursos(cursos, docentes, asignaturas) {
    if (docentes) guardarDocentes(validarDocentes(docentes));
    if (asignaturas) guardarAsignaturas(validarAsignaturas(asignaturas));
    guardarTodosLosCursos(cursos);
    localStorage.removeItem(ACTIVE_COURSE_KEY);
    // Cursos con docentes o asignaturas que no vinieron en los catálogos del respaldo
    migrarDocentes();
    migrarAsignaturas();
}

// ==========================================================================
// GESTIÓN DE TEMA (MODO OSCURO / MODO CLARO)
// ==========================================================================
const THEME_KEY = 'unsa_tema_interfaz';

/**
 * Obtiene el tema actual configurado o respeta la preferencia del sistema.
 */
function obtenerTemaActual() {
    try {
        const guardado = localStorage.getItem(THEME_KEY);
        if (guardado === 'dark' || guardado === 'light') {
            return guardado;
        }
    } catch (e) {
        console.error("Error al leer tema de localStorage:", e);
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

/**
 * Aplica el tema seleccionado en el DOM y lo almacena.
 */
function aplicarTema(tema) {
    if (tema === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    try {
        localStorage.setItem(THEME_KEY, tema);
    } catch (e) {}
    actualizarBotonesTema(tema);
}

/**
 * Alterna entre modo oscuro y claro.
 */
function alternarTema() {
    const temaActual = obtenerTemaActual();
    const nuevoTema = temaActual === 'dark' ? 'light' : 'dark';
    aplicarTema(nuevoTema);
    return nuevoTema;
}

/**
 * Actualiza los iconos y textos de los botones de alternancia de tema.
 */
function actualizarBotonesTema(tema) {
    const botones = document.querySelectorAll('.btn-theme-toggle');
    botones.forEach(btn => {
        const iconMoon = btn.querySelector('.icon-moon');
        const iconSun = btn.querySelector('.icon-sun');
        const textSpan = btn.querySelector('.theme-text');

        if (tema === 'dark') {
            if (iconMoon) iconMoon.style.display = 'none';
            if (iconSun) iconSun.style.display = 'inline-block';
            if (textSpan) textSpan.textContent = 'Modo Claro';
            btn.setAttribute('title', 'Cambiar a modo claro');
        } else {
            if (iconMoon) iconMoon.style.display = 'inline-block';
            if (iconSun) iconSun.style.display = 'none';
            if (textSpan) textSpan.textContent = 'Modo Oscuro';
            btn.setAttribute('title', 'Cambiar a modo oscuro');
        }
    });
}

// Inicialización inmediata del tema en carga
(function inicializarTemaInmediato() {
    const tema = obtenerTemaActual();
    if (tema === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    aplicarColoresUniversidad();
    migrarDocentes();
    migrarAsignaturas();
})();

