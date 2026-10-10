// ==========================================================================
// STORAGE.JS - MÓDULO DE PERSISTENCIA Y MODELO DE DATOS DE CURSOS
// ==========================================================================

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
            nota2: 09.5,
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

/**
 * Calcula el resumen académico y predictivo de un curso.
 */
function calcularResumenCurso(curso) {
    const notas = curso.notas || {};
    const pesos = curso.pesos || {};
    const notaMeta = parseFloat(curso.notaMeta) || 10.5;

    let sumaPesos = 0;
    let pesoEvaluado = 0;
    let pesoPendiente = 0;
    let puntosAcumulados = 0;
    let notasLlenadas = 0;
    const pendientesNombres = [];

    const nombresEvaluaciones = [
        'Examen Parcial 1',
        'Evaluación Continua 1',
        'Examen Parcial 2',
        'Evaluación Continua 2',
        'Examen Parcial 3',
        'Evaluación Continua 3'
    ];

    for (let i = 1; i <= 6; i++) {
        const notaRaw = notas[`nota${i}`];
        const pesoVal = parseFloat(pesos[`peso${i}`]) || 0;
        sumaPesos += pesoVal;

        if (notaRaw !== undefined && notaRaw !== null && notaRaw !== '' && !isNaN(parseFloat(notaRaw))) {
            const notaVal = parseFloat(notaRaw);
            puntosAcumulados += (notaVal * pesoVal);
            pesoEvaluado += pesoVal;
            notasLlenadas++;
        } else {
            pesoPendiente += pesoVal;
            pendientesNombres.push(nombresEvaluaciones[i - 1]);
        }
    }

    const pctEvaluado = sumaPesos > 0 ? (pesoEvaluado / sumaPesos) * 100 : 0;
    const aporteActual = sumaPesos > 0 ? puntosAcumulados / sumaPesos : 0;

    if (sumaPesos === 0) {
        return {
            estado: 'sin_pesos',
            badgeClass: 'sin_datos',
            badgeTexto: 'Sin pesos definidos',
            promedioActual: 0,
            notaRequerida: 0,
            pctEvaluado: 0,
            notasLlenadas: 0,
            mejorCaso: 0,
            peorCaso: 0,
            detalle: 'Asigna porcentajes a las evaluaciones.'
        };
    }

    if (notasLlenadas === 0) {
        return {
            estado: 'sin_datos',
            badgeClass: 'sin_datos',
            badgeTexto: 'Sin calificaciones',
            promedioActual: 0,
            notaRequerida: notaMeta,
            pctEvaluado: 0,
            notasLlenadas: 0,
            mejorCaso: 20,
            peorCaso: 0,
            detalle: `Requiere ${notaMeta.toFixed(1)} en las evaluaciones.`
        };
    }

    // Todas las notas llenas
    if (notasLlenadas === 6) {
        const promedioFinal = aporteActual;
        const aprobado = promedioFinal >= notaMeta;
        return {
            estado: aprobado ? 'aprobado' : 'desaprobado',
            badgeClass: aprobado ? 'aprobado' : 'desaprobado',
            badgeTexto: aprobado ? `Aprobado (${promedioFinal.toFixed(2)})` : `Desaprobado (${promedioFinal.toFixed(2)})`,
            promedioActual: promedioFinal,
            notaRequerida: 0,
            pctEvaluado: 100,
            notasLlenadas: 6,
            mejorCaso: promedioFinal,
            peorCaso: promedioFinal,
            detalle: `Curso culminado con promedio ${promedioFinal.toFixed(2)}.`
        };
    }

    // Notas parciales (Modo predictivo)
    const mejorCaso = (puntosAcumulados + 20 * pesoPendiente) / sumaPesos;
    const peorCaso = (puntosAcumulados + 0 * pesoPendiente) / sumaPesos;

    if (pesoPendiente === 0) {
        const promedio = aporteActual;
        return {
            estado: promedio >= notaMeta ? 'aprobado' : 'desaprobado',
            badgeClass: promedio >= notaMeta ? 'aprobado' : 'desaprobado',
            badgeTexto: `${promedio.toFixed(2)} / 20`,
            promedioActual: promedio,
            notaRequerida: 0,
            pctEvaluado: 100,
            notasLlenadas,
            mejorCaso: promedio,
            peorCaso: promedio,
            detalle: 'Todas las evaluaciones con peso asignado están completas.'
        };
    }

    const notaRequerida = (notaMeta * sumaPesos - puntosAcumulados) / pesoPendiente;

    let badgeClass = 'moderado';
    let badgeTexto = `Requiere: ${notaRequerida.toFixed(2)}`;
    let detalle = `Necesitas ${notaRequerida.toFixed(2)} en lo pendiente para llegar a ${notaMeta.toFixed(1)}.`;

    if (notaRequerida <= 0) {
        badgeClass = 'aprobado';
        badgeTexto = 'Meta asegurada';
        detalle = `Puntaje suficiente para alcanzar la meta de ${notaMeta.toFixed(1)}. Nota final mínima garantizada: ${peorCaso.toFixed(2)}.`;
    } else if (notaRequerida <= 10.5) {
        badgeClass = 'accesible';
        badgeTexto = `Req. ${notaRequerida.toFixed(2)}`;
        detalle = `Exigencia regular: se requiere promediar ${notaRequerida.toFixed(2)} en las evaluaciones pendientes.`;
    } else if (notaRequerida <= 14.0) {
        badgeClass = 'moderado';
        badgeTexto = `Req. ${notaRequerida.toFixed(2)}`;
        detalle = `Exigencia moderada: se requiere promediar ${notaRequerida.toFixed(2)} en las evaluaciones pendientes.`;
    } else if (notaRequerida <= 17.0) {
        badgeClass = 'exigente';
        badgeTexto = `Alta exigencia: ${notaRequerida.toFixed(2)}`;
        detalle = `Alta exigencia: se requiere una calificación promedio de ${notaRequerida.toFixed(2)} en lo pendiente.`;
    } else if (notaRequerida <= 20.0) {
        badgeClass = 'critico';
        badgeTexto = `Crítico: ${notaRequerida.toFixed(2)}`;
        detalle = `Exigencia crítica: se requiere promediar ${notaRequerida.toFixed(2)} en las evaluaciones pendientes.`;
    } else {
        badgeClass = 'desaprobado';
        badgeTexto = 'Fuera de rango';
        detalle = `Meta inalcanzable (requeriría ${notaRequerida.toFixed(2)}). Calificación máxima alcanzable: ${mejorCaso.toFixed(2)}.`;
    }

    return {
        estado: 'predictivo',
        badgeClass,
        badgeTexto,
        promedioActual: aporteActual,
        notaRequerida,
        pctEvaluado: Math.round(pctEvaluado),
        notasLlenadas,
        mejorCaso,
        peorCaso,
        detalle
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

        if (resumen.badgeClass === 'aprobado' || resumen.notaRequerida <= 0) {
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

