const STORAGE_KEY = 'unsa_simulador_cursos_v1';
const ACTIVE_COURSE_KEY = 'unsa_simulador_curso_activo_id';

// Cursos iniciales de ejemplo si es la primera vez que se ingresa
const CURSOS_DEMO = [
    {
        id: 'curso_demo_1',
        nombre: 'Cálculo en Varias Variables',
        codigo: 'MAT-201',
        creditos: 4,
        notaMeta: 10.5,
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
        notaMeta: 10.5,
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

// ==========================================================================
// MOTOR DE CÁLCULO COMPARTIDO (dashboard y simulador)
// ==========================================================================

const NOTA_MAXIMA = 20;
const NOTA_META_DEFECTO = 10.5;

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
 * Convierte la nota meta a número; solo usa el valor por defecto si está vacía o no es numérica
 * (una meta de 0 es válida).
 */
function parsearNotaMeta(valor) {
    const numero = parseFloat(valor);
    return isNaN(numero) ? NOTA_META_DEFECTO : numero;
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
 */
function calcularResumenCurso(curso) {
    const notas = curso.notas || {};
    const pesos = curso.pesos || {};
    const notaMeta = parsearNotaMeta(curso.notaMeta);

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
        const aprobado = promedio >= notaMeta;
        const todasCompletas = pendientes.length === 0;
        return {
            ...base,
            estado: 'completo',
            badgeClass: aprobado ? 'aprobado' : 'desaprobado',
            badgeTexto: todasCompletas
                ? `${aprobado ? 'Aprobado' : 'Desaprobado'} (${promedio.toFixed(2)})`
                : `${promedio.toFixed(2)} / 20`,
            pctEvaluado: 100,
            notaRequerida: 0,
            mejorCaso: promedio,
            peorCaso: promedio,
            detalle: todasCompletas
                ? `Curso culminado con promedio ${promedio.toFixed(2)}.`
                : 'Todas las evaluaciones con peso asignado están completas.'
        };
    }

    const notaRequerida = (notaMeta * sumaPesos - puntosAcumulados) / pesoPendiente;
    const mejorCaso = (puntosAcumulados + NOTA_MAXIMA * pesoPendiente) / sumaPesos;
    const peorCaso = puntosAcumulados / sumaPesos;
    const exigencia = clasificarExigencia(notaRequerida);
    const prediccion = { ...base, notaRequerida, mejorCaso, peorCaso, exigencia };

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
})();

