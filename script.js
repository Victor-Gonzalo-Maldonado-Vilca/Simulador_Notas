// ==========================================================================
// SIMULADOR DE NOTAS ACADÉMICO - MODO PREDICTIVO Y MULTICURSO
// ==========================================================================

// Elementos principales del DOM
const formulario = document.getElementById('formulario_notas');
const resultadoElement = document.getElementById('resultado');
const estadoElement = document.getElementById('estado-academico');
const resultadoTipoEtiqueta = document.getElementById('resultado-tipo-etiqueta');
const resultadoMensaje = document.getElementById('resultado-mensaje');
const totalPesosBadge = document.getElementById('total-pesos-badge');
const totalNotasBadge = document.getElementById('total-notas-badge');
const alertaBox = document.getElementById('alerta-box');
const alertaMensaje = document.getElementById('alerta-mensaje');
const btnLimpiar = document.getElementById('btn-limpiar');
const notaMetaInput = document.getElementById('nota-meta');
const btnPresetUnsa = document.getElementById('preset-unsa');
const btnPresetIguales = document.getElementById('preset-iguales');

// Elementos de navegación y contexto de curso
const selectorCursoActivo = document.getElementById('selector-curso-activo');
const tituloCursoActual = document.getElementById('titulo-curso-actual');
const subtituloCursoActual = document.getElementById('subtitulo-curso-actual');
const badgeCodigoCurso = document.getElementById('badge-codigo-curso');
const autosaveTag = document.getElementById('autosave-tag');

// Métricas secundarias
const metricasSecundarias = document.getElementById('metricas-secundarias');
const metricAcumulado = document.getElementById('metric-acumulado');
const metricPesoEvaluado = document.getElementById('metric-peso-evaluado');
const metricMaximo = document.getElementById('metric-maximo');
const metricMinimo = document.getElementById('metric-minimo');
const metricMeta = document.getElementById('metric-meta');

// Configuración de las 6 evaluaciones
const EVALUACIONES = [
    { id: 1, nombre: 'Examen Parcial 1', unidad: 'Unidad 01', notaId: 'nota1', pesoId: 'peso1' },
    { id: 2, nombre: 'Evaluación Continua 1', unidad: 'Unidad 01', notaId: 'nota2', pesoId: 'peso2' },
    { id: 3, nombre: 'Examen Parcial 2', unidad: 'Unidad 02', notaId: 'nota3', pesoId: 'peso3' },
    { id: 4, nombre: 'Evaluación Continua 2', unidad: 'Unidad 02', notaId: 'nota4', pesoId: 'peso4' },
    { id: 5, nombre: 'Examen Parcial 3', unidad: 'Unidad 03', notaId: 'nota5', pesoId: 'peso5' },
    { id: 6, nombre: 'Evaluación Continua 3', unidad: 'Unidad 03', notaId: 'nota6', pesoId: 'peso6' }
];

let cursoActual = null;
let alertaTimeout = null;
let autosaveTimeout = null;

// =========================================================================
// GESTIÓN Y CARGA DE CURSO
// =========================================================================

function inicializarCurso() {
    const cursos = obtenerCursos();
    if (!cursos || cursos.length === 0) {
        window.location.href = 'index.html';
        return;
    }

    // Identificar curso solicitado por URL o por activo en localStorage
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    const idActivo = obtenerCursoActivoId();

    let seleccionado = null;
    if (idParam) {
        seleccionado = obtenerCursoPorId(idParam);
    }
    if (!seleccionado && idActivo) {
        seleccionado = obtenerCursoPorId(idActivo);
    }
    if (!seleccionado) {
        seleccionado = cursos[0];
    }

    cursoActual = seleccionado;
    establecerCursoActivoId(cursoActual.id);

    // Llenar selector de cursos
    poblarSelectorCursos(cursos, cursoActual.id);

    // Cargar datos del curso en la interfaz
    cargarDatosCursoEnFormulario(cursoActual);
}

function poblarSelectorCursos(cursos, idSeleccionado) {
    if (!selectorCursoActivo) return;
    selectorCursoActivo.innerHTML = '';

    cursos.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = `${c.codigo ? `[${c.codigo}] ` : ''}${c.nombre}`;
        if (c.id === idSeleccionado) {
            option.selected = true;
        }
        selectorCursoActivo.appendChild(option);
    });

    selectorCursoActivo.addEventListener('change', (e) => {
        const nuevoId = e.target.value;
        const nuevoCurso = obtenerCursoPorId(nuevoId);
        if (nuevoCurso) {
            cursoActual = nuevoCurso;
            establecerCursoActivoId(nuevoId);
            window.history.replaceState(null, '', `simulador.html?id=${nuevoId}`);
            cargarDatosCursoEnFormulario(cursoActual);
        }
    });
}

function cargarDatosCursoEnFormulario(curso) {
    // Encabezados
    if (tituloCursoActual) tituloCursoActual.textContent = curso.nombre;
    if (subtituloCursoActual) {
        subtituloCursoActual.textContent = `Código: ${curso.codigo || 'UNSA'} • Créditos: ${curso.creditos || 3} • Simula las notas requeridas para aprobar.`;
    }
    if (badgeCodigoCurso) {
        badgeCodigoCurso.textContent = `${curso.codigo || 'UNSA'} • ${curso.creditos || 3} Créditos`;
    }

    // Nota Meta
    if (notaMetaInput) {
        notaMetaInput.value = (curso.notaMeta !== undefined && curso.notaMeta !== null) ? curso.notaMeta : 10.5;
    }

    // Cargar notas y pesos
    const notas = curso.notas || {};
    const pesos = curso.pesos || {};

    EVALUACIONES.forEach(ev => {
        const inputNota = document.getElementById(ev.notaId);
        const inputPeso = document.getElementById(ev.pesoId);

        if (inputNota) {
            inputNota.value = (notas[ev.notaId] !== undefined && notas[ev.notaId] !== null) ? notas[ev.notaId] : '';
        }
        if (inputPeso) {
            inputPeso.value = (pesos[ev.pesoId] !== undefined && pesos[ev.pesoId] !== null) ? pesos[ev.pesoId] : '';
        }
    });

    actualizarContadores();
    calcularOSimular(false);
}

function autoGuardarCurso() {
    if (!cursoActual) return;

    cursoActual.notaMeta = parseFloat(notaMetaInput.value) || 10.5;
    cursoActual.notas = cursoActual.notas || {};
    cursoActual.pesos = cursoActual.pesos || {};

    EVALUACIONES.forEach(ev => {
        const inputNota = document.getElementById(ev.notaId);
        const inputPeso = document.getElementById(ev.pesoId);

        cursoActual.notas[ev.notaId] = inputNota.value.trim();
        cursoActual.pesos[ev.pesoId] = inputPeso.value.trim();
    });

    guardarCurso(cursoActual);

    // Animación visual de guardado
    if (autosaveTag) {
        autosaveTag.classList.add('saving');
        if (autosaveTimeout) clearTimeout(autosaveTimeout);
        autosaveTimeout = setTimeout(() => {
            autosaveTag.classList.remove('saving');
        }, 600);
    }
}

// =========================================================================
// ALERTAS Y CONTADORES
// =========================================================================

function mostrarAlerta(mensaje, tipo = 'warning') {
    if (alertaBox && alertaMensaje) {
        if (alertaTimeout) clearTimeout(alertaTimeout);
        alertaMensaje.textContent = mensaje;
        alertaBox.className = `alert-box alert-${tipo} show`;
        alertaTimeout = setTimeout(() => {
            alertaBox.classList.remove('show');
        }, 5000);
    } else {
        alert(mensaje);
    }
}

function actualizarContadores() {
    let sumaPesos = 0;
    let notasLlenadas = 0;

    EVALUACIONES.forEach(ev => {
        const pesoVal = parseFloat(document.getElementById(ev.pesoId).value) || 0;
        const notaVal = document.getElementById(ev.notaId).value.trim();

        sumaPesos += pesoVal;
        if (notaVal !== '') {
            notasLlenadas++;
        }
    });

    if (totalPesosBadge) {
        totalPesosBadge.textContent = `${sumaPesos.toFixed(sumaPesos % 1 === 0 ? 0 : 1)}%`;
        totalPesosBadge.classList.remove('valid', 'warning');
        if (Math.round(sumaPesos) === 100) {
            totalPesosBadge.classList.add('valid');
        } else if (sumaPesos > 0) {
            totalPesosBadge.classList.add('warning');
        }
    }

    if (totalNotasBadge) {
        totalNotasBadge.textContent = `${notasLlenadas} / 6`;
        totalNotasBadge.classList.remove('valid', 'warning');
        if (notasLlenadas === 6) {
            totalNotasBadge.classList.add('valid');
        } else if (notasLlenadas > 0) {
            totalNotasBadge.classList.add('warning');
        }
    }

    return { sumaPesos, notasLlenadas };
}

// Plantillas de pesos
function aplicarPlantillaPesos(pesos) {
    EVALUACIONES.forEach((ev, index) => {
        const inputPeso = document.getElementById(ev.pesoId);
        if (inputPeso && pesos[index] !== undefined) {
            inputPeso.value = pesos[index];
        }
    });
    actualizarContadores();
    autoGuardarCurso();
    calcularOSimular(false);
}

if (btnPresetUnsa) {
    btnPresetUnsa.addEventListener('click', () => {
        aplicarPlantillaPesos([15, 15, 15, 15, 20, 20]);
        mostrarAlerta("Plantilla UNSA aplicada: Fase 1 (30%), Fase 2 (30%), Fase 3 (40%).", "info");
    });
}

if (btnPresetIguales) {
    btnPresetIguales.addEventListener('click', () => {
        aplicarPlantillaPesos([16.67, 16.67, 16.67, 16.67, 16.66, 16.66]);
        mostrarAlerta("Plantilla equitativa aplicada: ~16.7% para cada evaluación.", "info");
    });
}

// =========================================================================
// MOTOR DE CÁLCULO PREDICTIVO
// =========================================================================

function calcularOSimular(mostrarAlertas = true) {
    const metaInputVal = parseFloat(notaMetaInput.value);
    const notaMeta = isNaN(metaInputVal) ? 10.5 : metaInputVal;

    if (notaMeta < 0 || notaMeta > 20) {
        if (mostrarAlertas) {
            mostrarAlerta("La nota meta debe estar entre 0 y 20.", "danger");
        }
        return;
    }

    const { sumaPesos } = actualizarContadores();

    const completadas = [];
    const pendientes = [];
    let notasFueraDeRango = false;

    EVALUACIONES.forEach(ev => {
        const inputNota = document.getElementById(ev.notaId);
        const inputPeso = document.getElementById(ev.pesoId);

        const notaRaw = inputNota.value.trim();
        const pesoVal = parseFloat(inputPeso.value) || 0;

        if (notaRaw !== '') {
            const notaNum = parseFloat(notaRaw);
            if (notaNum < 0 || notaNum > 20) {
                notasFueraDeRango = true;
            }
            completadas.push({
                ...ev,
                nota: notaNum,
                peso: pesoVal
            });
        } else {
            pendientes.push({
                ...ev,
                peso: pesoVal
            });
        }
    });

    if (notasFueraDeRango && mostrarAlertas) {
        mostrarAlerta("Atención: Las calificaciones deben estar en la escala de 0 a 20.", "danger");
    }

    // Sin datos ingresados
    if (completadas.length === 0 && sumaPesos === 0) {
        if (mostrarAlertas) {
            mostrarAlerta("Por favor, ingresa tus notas y los pesos porcentuales correspondientes.");
        }
        resetearResultado();
        return;
    }

    // Sin pesos asignados
    if (sumaPesos === 0) {
        if (mostrarAlertas) {
            mostrarAlerta("Debes asignar los porcentajes (%) de las evaluaciones para realizar el cálculo. Puedes usar las plantillas de arriba.", "danger");
        }
        return;
    }

    // Animación visual
    resultadoElement.style.transform = "scale(1.08)";
    setTimeout(() => {
        resultadoElement.style.transform = "scale(1)";
    }, 180);

    // CASO 1: TODAS LAS NOTAS COMPLETAS
    if (pendientes.length === 0) {
        const sumaPonderada = completadas.reduce((acc, ev) => acc + (ev.nota * ev.peso), 0);
        const promedio = sumaPonderada / sumaPesos;

        resultadoTipoEtiqueta.textContent = "Resultado Final Ponderado";
        resultadoElement.textContent = promedio.toFixed(2);

        estadoElement.className = "result-status-pill";
        if (promedio >= notaMeta) {
            estadoElement.textContent = `Condición: Aprobado (Meta: ${notaMeta.toFixed(1)})`;
            estadoElement.classList.add('aprobado');
        } else {
            estadoElement.textContent = `Condición: Desaprobado (Meta: ${notaMeta.toFixed(1)})`;
            estadoElement.classList.add('desaprobado');
        }

        resultadoMensaje.innerHTML = `Evaluación completa de <strong>${cursoActual ? cursoActual.nombre : 'la asignatura'}</strong>. El promedio final ponderado obtenido es <strong>${promedio.toFixed(2)}</strong> sobre 20.`;

        metricasSecundarias.style.display = 'grid';
        metricAcumulado.textContent = promedio.toFixed(2);
        metricPesoEvaluado.textContent = "100% evaluado";
        metricMaximo.textContent = promedio.toFixed(2);
        metricMinimo.textContent = promedio.toFixed(2);
        metricMeta.textContent = notaMeta.toFixed(2);

        if (sumaPesos !== 100 && mostrarAlertas) {
            mostrarAlerta(`Nota: La suma total de los pesos es ${sumaPesos.toFixed(1)}%, no 100%. El cálculo se normalizó proporcionalmente.`, 'warning');
        }
        return;
    }

    // CASO 2: MODO PREDICTIVO
    const pesoEvaluado = completadas.reduce((acc, ev) => acc + ev.peso, 0);
    const pesoPendiente = pendientes.reduce((acc, ev) => acc + ev.peso, 0);

    if (pesoPendiente === 0) {
        if (mostrarAlertas) {
            mostrarAlerta("Las evaluaciones pendientes tienen peso 0%. Asigna porcentajes para calcular la proyección requerida.", "warning");
        }
        return;
    }

    const puntosAcumulados = completadas.reduce((acc, ev) => acc + (ev.nota * ev.peso), 0);
    const notaRequerida = (notaMeta * sumaPesos - puntosAcumulados) / pesoPendiente;

    const mejorCasoMax = (puntosAcumulados + 20 * pesoPendiente) / sumaPesos;
    const peorCasoMin = (puntosAcumulados + 0 * pesoPendiente) / sumaPesos;
    const aporteActual = puntosAcumulados / sumaPesos;
    const pctEvaluado = ((pesoEvaluado / sumaPesos) * 100).toFixed(0);

    const nombresPendientes = pendientes.map(p => `<strong>${p.nombre}</strong>`).join(', ');
    const textoEvaluaciones = pendientes.length === 1 
        ? `en ${nombresPendientes}` 
        : `en promedio en las ${pendientes.length} evaluaciones pendientes (${nombresPendientes})`;

    resultadoTipoEtiqueta.textContent = pendientes.length === 1 
        ? `Calificación requerida en ${pendientes[0].nombre}` 
        : `Calificación promedio requerida en pendientes`;

    estadoElement.className = "result-status-pill";

    if (notaRequerida <= 0) {
        resultadoElement.textContent = "0.00";
        estadoElement.textContent = "Meta asegurada (Aprobación garantizada)";
        estadoElement.classList.add('aprobado');
        resultadoMensaje.innerHTML = `Con las calificaciones registradas en <strong>${cursoActual ? cursoActual.nombre : 'la asignatura'}</strong>, el puntaje acumulado es suficiente para alcanzar la meta de <strong>${notaMeta.toFixed(1)}</strong>. Tu promedio final mínimo garantizado es <strong>${peorCasoMin.toFixed(2)}</strong>.`;
    } else if (notaRequerida <= 10.5) {
        resultadoElement.textContent = notaRequerida.toFixed(2);
        estadoElement.textContent = `Exigencia regular (${notaRequerida.toFixed(2)})`;
        estadoElement.classList.add('accesible');
        resultadoMensaje.innerHTML = `Para alcanzar la meta de <strong>${notaMeta.toFixed(1)}</strong>, se requiere una calificación mínima de <strong>${notaRequerida.toFixed(2)}</strong> ${textoEvaluaciones}.`;
    } else if (notaRequerida <= 14.0) {
        resultadoElement.textContent = notaRequerida.toFixed(2);
        estadoElement.textContent = `Exigencia moderada (${notaRequerida.toFixed(2)})`;
        estadoElement.classList.add('moderado');
        resultadoMensaje.innerHTML = `Para alcanzar la meta de <strong>${notaMeta.toFixed(1)}</strong>, se requiere promediar <strong>${notaRequerida.toFixed(2)}</strong> ${textoEvaluaciones}.`;
    } else if (notaRequerida <= 17.0) {
        resultadoElement.textContent = notaRequerida.toFixed(2);
        estadoElement.textContent = `Alta exigencia (${notaRequerida.toFixed(2)})`;
        estadoElement.classList.add('exigente');
        resultadoMensaje.innerHTML = `Para alcanzar la meta de <strong>${notaMeta.toFixed(1)}</strong>, se requiere una calificación promedio de <strong>${notaRequerida.toFixed(2)}</strong> ${textoEvaluaciones}.`;
    } else if (notaRequerida <= 20.0) {
        resultadoElement.textContent = notaRequerida.toFixed(2);
        estadoElement.textContent = `Exigencia crítica (${notaRequerida.toFixed(2)})`;
        estadoElement.classList.add('critico');
        resultadoMensaje.innerHTML = `Condición de alta rigurosidad: se requiere una calificación de <strong>${notaRequerida.toFixed(2)}</strong> ${textoEvaluaciones} para alcanzar la meta de <strong>${notaMeta.toFixed(1)}</strong>.`;
    } else {
        resultadoElement.textContent = notaRequerida.toFixed(2);
        estadoElement.textContent = "Condición fuera de rango (> 20.00)";
        estadoElement.classList.add('desaprobado');
        resultadoMensaje.innerHTML = `La meta de <strong>${notaMeta.toFixed(1)}</strong> no es matemáticamente alcanzable en la escala vigesimal, ya que requeriría <strong>${notaRequerida.toFixed(2)}</strong>. El promedio máximo alcanzable con nota 20 en lo pendiente es <strong>${mejorCasoMax.toFixed(2)}</strong>.`;
    }

    metricasSecundarias.style.display = 'grid';
    metricAcumulado.textContent = aporteActual.toFixed(2);
    metricPesoEvaluado.textContent = `${pctEvaluado}% evaluado`;
    metricMaximo.textContent = mejorCasoMax.toFixed(2);
    metricMinimo.textContent = peorCasoMin.toFixed(2);
    metricMeta.textContent = notaMeta.toFixed(2);

    if (sumaPesos !== 100 && mostrarAlertas) {
        mostrarAlerta(`Los pesos actuales suman ${sumaPesos.toFixed(1)}%. El simulador normalizó los porcentajes sobre el total actual.`, 'warning');
    }
}

function resetearResultado() {
    resultadoTipoEtiqueta.textContent = "Estado de la Simulación";
    resultadoElement.textContent = "--";
    estadoElement.className = "result-status-pill";
    estadoElement.textContent = "Esperando datos";
    resultadoMensaje.textContent = "Ingresa tus notas actuales y porcentajes. Si dejas evaluaciones en blanco, el simulador calculará automáticamente la nota que requieres para aprobar.";
    metricasSecundarias.style.display = 'none';
}

// =========================================================================
// EVENT LISTENERS Y AUTOGUARDADO
// =========================================================================

EVALUACIONES.forEach(ev => {
    const inputNota = document.getElementById(ev.notaId);
    const inputPeso = document.getElementById(ev.pesoId);

    if (inputNota) {
        inputNota.addEventListener('input', () => {
            const val = parseFloat(inputNota.value);
            if (val > 20) {
                mostrarAlerta(`La calificación no puede ser mayor a 20.`, "danger");
            }
            actualizarContadores();
            autoGuardarCurso();
            calcularOSimular(false);
        });
    }

    if (inputPeso) {
        inputPeso.addEventListener('input', () => {
            actualizarContadores();
            autoGuardarCurso();
            calcularOSimular(false);
        });
    }
});

if (notaMetaInput) {
    notaMetaInput.addEventListener('input', () => {
        autoGuardarCurso();
        calcularOSimular(false);
    });
}

formulario.addEventListener('submit', function(event) {
    event.preventDefault();
    autoGuardarCurso();
    calcularOSimular(true);
});

if (btnLimpiar) {
    btnLimpiar.addEventListener('click', function() {
        formulario.reset();
        notaMetaInput.value = "10.5";
        if (alertaBox) alertaBox.classList.remove('show');
        actualizarContadores();
        autoGuardarCurso();
        resetearResultado();
    });
}

// Inicializar al cargar el documento
document.addEventListener('DOMContentLoaded', inicializarCurso);