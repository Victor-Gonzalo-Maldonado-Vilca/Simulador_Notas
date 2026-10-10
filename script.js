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
const metricParcial = document.getElementById('metric-parcial');
const metricMaximo = document.getElementById('metric-maximo');
const metricMinimo = document.getElementById('metric-minimo');
const metricMeta = document.getElementById('metric-meta');

// EVALUACIONES, NOTA_MAXIMA y el motor de cálculo se definen en storage.js

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
        const docente = obtenerDocenteDeCurso(curso);
        const textoDocente = docente
            ? ` • Docente: ${docente.nombre}${docente.calificacion > 0 ? ' ' + textoEstrellas(docente.calificacion) : ''}`
            : '';
        subtituloCursoActual.textContent = `Código: ${curso.codigo || 'S/C'} • Créditos: ${curso.creditos || 3}${textoDocente} • Simula las notas requeridas para aprobar.`;
    }
    if (badgeCodigoCurso) {
        badgeCodigoCurso.textContent = `${curso.codigo || 'S/C'} • ${curso.creditos || 3} Créditos`;
    }

    // Nota Meta
    if (notaMetaInput) {
        notaMetaInput.value = curso.notaMeta ?? '';
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
    renderizarComentarios();
}

// =========================================================================
// COMENTARIOS DEL CURSO
// =========================================================================
const formComentario = document.getElementById('form-comentario');
const textoComentario = document.getElementById('comentario-texto');
const contadorComentario = document.getElementById('comentario-contador');
const listaComentarios = document.getElementById('lista-comentarios');
const comentariosVacio = document.getElementById('comentarios-vacio');

function actualizarContadorComentario() {
    if (contadorComentario) contadorComentario.textContent = `${textoComentario.value.length} / ${MAX_COMENTARIO}`;
}

// Lista los comentarios del más reciente al más antiguo (texto siempre con textContent)
function renderizarComentarios() {
    if (!listaComentarios || !cursoActual) return;
    const comentarios = Array.isArray(cursoActual.comentarios) ? [...cursoActual.comentarios].reverse() : [];
    listaComentarios.innerHTML = '';
    comentariosVacio.hidden = comentarios.length > 0;

    comentarios.forEach(comentario => {
        const item = document.createElement('li');
        item.className = 'comment-item';

        const texto = document.createElement('p');
        texto.className = 'comment-text';
        texto.textContent = comentario.texto;

        const pie = document.createElement('div');
        pie.className = 'comment-foot';
        const fecha = document.createElement('time');
        fecha.dateTime = comentario.fecha;
        fecha.textContent = formatearFechaReporte(new Date(comentario.fecha));
        const btnEliminar = document.createElement('button');
        btnEliminar.type = 'button';
        btnEliminar.className = 'comment-delete';
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.setAttribute('aria-label', 'Eliminar comentario');
        btnEliminar.addEventListener('click', () => {
            if (!confirm('¿Eliminar este comentario?')) return;
            eliminarComentario(cursoActual, comentario.id);
            guardarCurso(cursoActual);
            renderizarComentarios();
        });

        pie.append(fecha, btnEliminar);
        item.append(texto, pie);
        listaComentarios.appendChild(item);
    });
}

if (formComentario && textoComentario) {
    textoComentario.addEventListener('input', actualizarContadorComentario);
    formComentario.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!cursoActual || !agregarComentario(cursoActual, textoComentario.value)) return;
        guardarCurso(cursoActual);
        textoComentario.value = '';
        actualizarContadorComentario();
        renderizarComentarios();
    });
}

// Lee notas, pesos y meta del formulario con la misma forma que un curso guardado
function leerDatosFormulario() {
    const notas = {};
    const pesos = {};
    EVALUACIONES.forEach(ev => {
        notas[ev.notaId] = document.getElementById(ev.notaId).value.trim();
        pesos[ev.pesoId] = document.getElementById(ev.pesoId).value.trim();
    });
    // La meta se guarda tal cual: vacía significa "usar la nota aprobatoria"
    return { notaMeta: notaMetaInput.value.trim(), notas, pesos };
}

function autoGuardarCurso() {
    if (!cursoActual) return;

    Object.assign(cursoActual, leerDatosFormulario());
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
        mostrarAlerta("Plantilla por fases aplicada: Fase 1 (30%), Fase 2 (30%), Fase 3 (40%).", "info");
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
    actualizarContadores();

    const datos = leerDatosFormulario();
    const notaAprobatoria = obtenerNotaAprobatoria();
    const metaIngresada = parsearNotaMeta(datos.notaMeta, notaAprobatoria);

    if (metaIngresada < 0 || metaIngresada > NOTA_MAXIMA) {
        if (mostrarAlertas) {
            mostrarAlerta(`La nota meta debe estar entre 0 y ${NOTA_MAXIMA}.`, "danger");
        }
        mostrarResultadoInvalido("Nota meta fuera de rango", `Corrige la nota meta: debe estar entre 0 y ${NOTA_MAXIMA}.`);
        return;
    }

    if (metaIngresada < notaAprobatoria && mostrarAlertas) {
        mostrarAlerta(`La meta personal no puede ser menor que la nota aprobatoria (${notaAprobatoria}). Se usará ${notaAprobatoria}.`, "info");
    }

    // Cálculo compartido con el dashboard (storage.js)
    const r = calcularResumenCurso(datos, notaAprobatoria);
    const notaMeta = r.notaMeta;

    if (r.estado === 'invalido') {
        if (mostrarAlertas) {
            mostrarAlerta(`Atención: Las calificaciones deben estar en la escala de 0 a ${NOTA_MAXIMA}.`, "danger");
        }
        mostrarResultadoInvalido("Calificaciones fuera de rango", `Corrige las calificaciones: deben estar entre 0 y ${NOTA_MAXIMA} para poder realizar el cálculo.`);
        return;
    }

    if (r.estado === 'sin_pesos') {
        if (mostrarAlertas) {
            if (r.notasLlenadas === 0) {
                mostrarAlerta("Por favor, ingresa tus notas y los pesos porcentuales correspondientes.");
            } else {
                mostrarAlerta("Debes asignar los porcentajes (%) de las evaluaciones para realizar el cálculo. Puedes usar las plantillas de arriba.", "danger");
            }
        }
        resetearResultado();
        return;
    }

    animarResultado();

    const nombreCurso = cursoActual ? escaparHtml(cursoActual.nombre) : 'la asignatura';
    const metaTexto = notaMeta.toFixed(1);

    // CASO 1: SIN EVALUACIONES PENDIENTES CON PESO (resultado final)
    if (r.estado === 'completo') {
        const promedio = r.promedioActual.toFixed(2);

        resultadoTipoEtiqueta.textContent = "Resultado Final Ponderado";
        resultadoElement.textContent = promedio;
        estadoElement.className = `result-status-pill ${r.badgeClass}`;
        estadoElement.textContent = `Condición: ${r.badgeClass === 'aprobado' ? 'Aprobado' : 'Desaprobado'} (Nota aprobatoria: ${notaAprobatoria})`;
        resultadoMensaje.innerHTML = r.pendientes.length === 0
            ? `Evaluación completa de <strong>${nombreCurso}</strong>. El promedio final ponderado obtenido es <strong>${promedio}</strong> sobre 20.`
            : `Las evaluaciones pendientes de <strong>${nombreCurso}</strong> tienen peso 0%, por lo que el promedio final ponderado es <strong>${promedio}</strong> sobre 20.`;
        if (notaMeta > notaAprobatoria) {
            resultadoMensaje.innerHTML += ` Meta personal de <strong>${metaTexto}</strong>: ${r.metaAlcanzada ? 'alcanzada' : 'no alcanzada'}.`;
        }

        mostrarMetricas(r, "100% evaluado");
        ocultarGrafico();
        avisarSiPesosNoSuman100(r.sumaPesos, mostrarAlertas, `Nota: La suma total de los pesos es ${r.sumaPesos.toFixed(1)}%, no 100%. El cálculo se normalizó proporcionalmente.`);
        return;
    }

    // CASO 2: MODO PREDICTIVO
    const req = r.notaRequerida.toFixed(2);
    const nombresPendientes = r.pendientes.map(nombre => `<strong>${nombre}</strong>`).join(', ');
    const textoEvaluaciones = r.pendientes.length === 1
        ? `en ${nombresPendientes}`
        : `en promedio en las ${r.pendientes.length} evaluaciones pendientes (${nombresPendientes})`;

    resultadoTipoEtiqueta.textContent = r.pendientes.length === 1
        ? `Calificación requerida en ${r.pendientes[0]}`
        : `Calificación promedio requerida en pendientes`;

    const presentacion = {
        aprobado: {
            estado: "Meta asegurada (Aprobación garantizada)",
            mensaje: `Con las calificaciones registradas en <strong>${nombreCurso}</strong>, el puntaje acumulado es suficiente para alcanzar la meta de <strong>${metaTexto}</strong>. Tu promedio final mínimo garantizado es <strong>${r.peorCaso.toFixed(2)}</strong>.`
        },
        accesible: {
            estado: `Exigencia regular (${req})`,
            mensaje: `Para alcanzar la meta de <strong>${metaTexto}</strong>, se requiere una calificación mínima de <strong>${req}</strong> ${textoEvaluaciones}.`
        },
        moderado: {
            estado: `Exigencia moderada (${req})`,
            mensaje: `Para alcanzar la meta de <strong>${metaTexto}</strong>, se requiere promediar <strong>${req}</strong> ${textoEvaluaciones}.`
        },
        exigente: {
            estado: `Alta exigencia (${req})`,
            mensaje: `Para alcanzar la meta de <strong>${metaTexto}</strong>, se requiere una calificación promedio de <strong>${req}</strong> ${textoEvaluaciones}.`
        },
        critico: {
            estado: `Exigencia crítica (${req})`,
            mensaje: `Condición de alta rigurosidad: se requiere una calificación de <strong>${req}</strong> ${textoEvaluaciones} para alcanzar la meta de <strong>${metaTexto}</strong>.`
        },
        desaprobado: {
            estado: `Condición fuera de rango (> ${NOTA_MAXIMA}.00)`,
            mensaje: `La meta de <strong>${metaTexto}</strong> no es matemáticamente alcanzable en la escala vigesimal, ya que requeriría <strong>${req}</strong>. El promedio máximo alcanzable con nota 20 en lo pendiente es <strong>${r.mejorCaso.toFixed(2)}</strong>.`
        }
    }[r.exigencia];

    resultadoElement.textContent = r.exigencia === 'aprobado' ? "0.00" : req;
    estadoElement.className = `result-status-pill ${r.exigencia}`;
    estadoElement.textContent = presentacion.estado;
    resultadoMensaje.innerHTML = presentacion.mensaje;

    // Con una meta personal mayor, informar también lo mínimo para solo aprobar
    if (notaMeta > notaAprobatoria && r.exigencia !== 'aprobado') {
        resultadoMensaje.innerHTML += r.notaRequeridaAprobar <= 0
            ? ` La aprobación del curso (nota ${notaAprobatoria}) ya está asegurada.`
            : r.notaRequeridaAprobar <= NOTA_MAXIMA
                ? ` Para solo aprobar (nota ${notaAprobatoria}) necesitas <strong>${r.notaRequeridaAprobar.toFixed(2)}</strong>.`
                : ` Aprobar el curso (nota ${notaAprobatoria}) ya no es alcanzable.`;
    }

    mostrarMetricas(r, `${r.pctEvaluado}% evaluado`);
    mostrarGrafico(r);
    avisarSiPesosNoSuman100(r.sumaPesos, mostrarAlertas, `Los pesos actuales suman ${r.sumaPesos.toFixed(1)}%. El simulador normalizó los porcentajes sobre el total actual.`);
}

// Gráfico de escenarios (grafico.js): solo tiene sentido mientras quedan evaluaciones pendientes
const graficoEscenarios = document.getElementById('grafico-escenarios');
let resumenGrafico = null;
let redimensionTimeout = null;

function mostrarGrafico(resumen) {
    resumenGrafico = resumen;
    if (graficoEscenarios) renderizarGraficoEscenarios(graficoEscenarios, resumen);
}

function ocultarGrafico() {
    resumenGrafico = null;
    if (graficoEscenarios) graficoEscenarios.style.display = 'none';
}

window.addEventListener('resize', () => {
    if (redimensionTimeout) clearTimeout(redimensionTimeout);
    redimensionTimeout = setTimeout(() => {
        if (resumenGrafico) mostrarGrafico(resumenGrafico);
    }, 150);
});

function animarResultado() {
    resultadoElement.style.transform = "scale(1.08)";
    setTimeout(() => {
        resultadoElement.style.transform = "scale(1)";
    }, 180);
}

function mostrarMetricas(resumen, textoPesoEvaluado) {
    metricasSecundarias.style.display = 'grid';
    metricAcumulado.textContent = resumen.promedioActual.toFixed(2);
    metricPesoEvaluado.textContent = textoPesoEvaluado;
    metricParcial.textContent = resumen.promedioParcial !== null ? resumen.promedioParcial.toFixed(2) : '--';
    metricMaximo.textContent = resumen.mejorCaso.toFixed(2);
    metricMinimo.textContent = resumen.peorCaso.toFixed(2);
    metricMeta.textContent = resumen.notaMeta.toFixed(2);
}

// Tolerancia para que plantillas como 16.67 + ... + 16.66 no disparen la alerta por redondeo
function avisarSiPesosNoSuman100(sumaPesos, mostrarAlertas, mensaje) {
    if (mostrarAlertas && Math.abs(sumaPesos - 100) > 0.01) {
        mostrarAlerta(mensaje, 'warning');
    }
}

function mostrarResultadoInvalido(estadoTexto, mensaje) {
    resultadoTipoEtiqueta.textContent = "Estado de la Simulación";
    resultadoElement.textContent = "--";
    estadoElement.className = "result-status-pill desaprobado";
    estadoElement.textContent = estadoTexto;
    resultadoMensaje.textContent = mensaje;
    metricasSecundarias.style.display = 'none';
    ocultarGrafico();
}

function resetearResultado() {
    resultadoTipoEtiqueta.textContent = "Estado de la Simulación";
    resultadoElement.textContent = "--";
    estadoElement.className = "result-status-pill";
    estadoElement.textContent = "Esperando datos";
    resultadoMensaje.textContent = "Ingresa tus notas actuales y porcentajes. Si dejas evaluaciones en blanco, el simulador calculará automáticamente la nota que requieres para aprobar.";
    metricasSecundarias.style.display = 'none';
    ocultarGrafico();
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
            if (val < 0 || val > NOTA_MAXIMA) {
                mostrarAlerta(`La calificación debe estar entre 0 y ${NOTA_MAXIMA}.`, "danger");
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
        const nombreCurso = cursoActual ? cursoActual.nombre : 'esta asignatura';
        if (!confirm(`¿Deseas borrar todas las notas y pesos de "${nombreCurso}"? Esta acción no se puede deshacer.`)) {
            return;
        }
        formulario.reset();
        notaMetaInput.value = '';
        if (alertaBox) alertaBox.classList.remove('show');
        actualizarContadores();
        autoGuardarCurso();
        resetearResultado();
    });
}

// =========================================================================
// REPORTE ACADÉMICO OFICIAL EN PDF / IMPRESIÓN
// =========================================================================

const btnExportarPdf = document.getElementById('btn-exportar-pdf');

function generarReportePDF() {
    if (!cursoActual) return;

    // Asegurar que los datos más recientes estén calculados y guardados
    autoGuardarCurso();
    calcularOSimular(false);

    const docSheet = document.getElementById('documento-reporte-pdf');
    if (!docSheet) return;

    // Metadatos y datos del estudiante
    const ahora = new Date();
    const perfil = obtenerPerfil();
    const univ = obtenerUniversidad(perfil);
    aplicarColoresUniversidad(univ);
    const fecha = formatearFechaReporte(ahora);

    document.getElementById('rep-fecha-emision').textContent = fecha;
    document.getElementById('rep-generado-fecha').textContent = fecha;
    document.getElementById('rep-univ-nombre').textContent = univ.nombre.toUpperCase();
    document.getElementById('rep-codigo-doc').textContent = `SIM-${univ.siglas}-${ahora.getTime().toString().slice(-6)}`;
    document.getElementById('rep-estudiante').textContent = perfil.estudiante || 'No registrado';
    document.getElementById('rep-firma-nombre').textContent = perfil.estudiante;
    document.getElementById('rep-nota-aprobatoria').textContent = univ.notaAprobatoria.toFixed(2);
    document.getElementById('rep-nota-aprobatoria-fuente').textContent = `(fijada por ${univ.siglas})`;

    // Datos del curso
    document.getElementById('rep-curso-nombre').textContent = cursoActual.nombre;
    document.getElementById('rep-curso-codigo').textContent = cursoActual.codigo || 'S/C';
    document.getElementById('rep-curso-creditos').textContent = cursoActual.creditos || 3;
    document.getElementById('rep-curso-meta').textContent = Math.max(parsearNotaMeta(notaMetaInput.value), univ.notaAprobatoria).toFixed(2);
    const docenteCurso = obtenerDocenteDeCurso(cursoActual);
    const calificacionDocente = docenteCurso ? docenteCurso.calificacion : 0;
    document.getElementById('rep-curso-profesor').textContent = docenteCurso ? docenteCurso.nombre : 'No registrado';
    document.getElementById('rep-curso-profesor-estrellas').innerHTML = calificacionDocente > 0
        ? `${htmlEstrellas(calificacionDocente)} <span class="rep-muted">(${calificacionDocente}/${MAX_ESTRELLAS})</span>`
        : '';

    // Llenar tabla de evaluaciones
    const tablaCuerpo = document.getElementById('rep-tabla-cuerpo');
    tablaCuerpo.innerHTML = '';

    let totalPesos = 0;
    let totalPuntos = 0;

    // Suma de pesos para normalizar aportes (igual que en el simulador)
    const resumen = calcularResumenCurso(leerDatosFormulario());
    const sumaPesosNormalizacion = resumen.sumaPesos;

    const fases = [
        { nombre: 'Fase I', unidad: 'Unidad 01', evals: [EVALUACIONES[0], EVALUACIONES[1]] },
        { nombre: 'Fase II', unidad: 'Unidad 02', evals: [EVALUACIONES[2], EVALUACIONES[3]] },
        { nombre: 'Fase III', unidad: 'Unidad 03', evals: [EVALUACIONES[4], EVALUACIONES[5]] }
    ];

    fases.forEach((fase) => {
        fase.evals.forEach((ev, idx) => {
            const notaVal = document.getElementById(ev.notaId).value.trim();
            const pesoVal = parseFloat(document.getElementById(ev.pesoId).value) || 0;
            totalPesos += pesoVal;

            const tr = document.createElement('tr');
            const tdFase = idx === 0
                ? `<td rowspan="2" class="rep-td-fase"><strong>${fase.nombre}</strong><br><span class="rep-muted">${fase.unidad}</span></td>`
                : '';

            let califTexto;
            let aporteTexto;
            if (notaVal !== '') {
                const n = parseFloat(notaVal);
                const aporte = sumaPesosNormalizacion > 0 ? (n * pesoVal) / sumaPesosNormalizacion : 0;
                califTexto = n.toFixed(2);
                aporteTexto = `+${aporte.toFixed(2)} pts`;
                totalPuntos += aporte;
            } else {
                califTexto = '<span class="rep-tag-pendiente">Pendiente</span>';
                aporteTexto = '<span class="rep-tag-pendiente">Por evaluar</span>';
            }

            tr.innerHTML = `
                ${tdFase}
                <td>${ev.nombre}</td>
                <td style="text-align: center;">${pesoVal.toFixed(1)}%</td>
                <td style="text-align: center; font-weight: 700;">${califTexto}</td>
                <td style="text-align: right; font-weight: 700;">${aporteTexto}</td>
            `;
            tablaCuerpo.appendChild(tr);
        });
    });

    document.getElementById('rep-total-pesos-td').innerHTML = `<strong>${totalPesos.toFixed(1)}%</strong>`;
    document.getElementById('rep-total-aporte-td').innerHTML = `<strong>${totalPuntos.toFixed(2)} / 20.00 pts</strong>`;

    // Diagnóstico (mismo texto y estado que la tarjeta de resultado)
    const condicion = document.getElementById('rep-diag-condicion');
    condicion.textContent = estadoElement.textContent || 'En proceso';
    condicion.className = `rep-diag-badge ${estadoElement.className.replace('result-status-pill', '').trim()}`;
    document.getElementById('rep-diag-nota-req-lbl').textContent = `${resultadoTipoEtiqueta.textContent}:`;
    document.getElementById('rep-diag-nota-req').textContent = `${resultadoElement.textContent} / 20`;
    document.getElementById('rep-diag-mensaje').innerHTML = resultadoMensaje.innerHTML;

    document.getElementById('rep-scen-acumulado').textContent = metricAcumulado.textContent || totalPuntos.toFixed(2);
    document.getElementById('rep-scen-parcial').textContent = metricParcial.textContent || '--';
    document.getElementById('rep-scen-minimo').textContent = metricMinimo.textContent || '--';
    document.getElementById('rep-scen-maximo').textContent = metricMaximo.textContent || '--';

    // Gráfico de escenarios: solo mientras queden evaluaciones pendientes
    const seccionGrafico = document.getElementById('rep-seccion-grafico');
    if (resumenGrafico) {
        document.getElementById('rep-grafico').innerHTML = svgEscenariosImpresion(resumenGrafico);
        document.getElementById('rep-grafico-leyenda').textContent =
            'Nota final según el promedio que se obtenga en las evaluaciones pendientes. Línea gris: nota aprobatoria' +
            (resumenGrafico.notaMeta > resumenGrafico.notaAprobatoria ? '; línea naranja: meta personal.' : '.');
        seccionGrafico.style.display = '';
    } else {
        document.getElementById('rep-grafico').innerHTML = '';
        seccionGrafico.style.display = 'none';
    }

    // Lanzar diálogo nativo de impresión / Guardar como PDF
    window.print();
}

if (btnExportarPdf) {
    btnExportarPdf.addEventListener('click', generarReportePDF);
}

// Botón de alternancia de tema
const btnThemeToggle = document.getElementById('btn-theme-toggle');
if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', alternarTema);
}

// Muestra la nota aprobatoria de la universidad (no editable) junto a la meta personal
function configurarUniversidadEnSimulador() {
    const univ = obtenerUniversidad();
    const tag = document.getElementById('tag-nota-aprobatoria');
    if (tag) tag.textContent = `Aprobatoria ${univ.siglas}: ${univ.notaAprobatoria}`;
    if (notaMetaInput) {
        notaMetaInput.min = univ.notaAprobatoria;
        notaMetaInput.placeholder = univ.notaAprobatoria;
    }
    mostrarSiglasUniversidad(univ);
}

// Inicializar al cargar el documento
document.addEventListener('DOMContentLoaded', () => {
    configurarUniversidadEnSimulador();
    inicializarCurso();
    actualizarBotonesTema(obtenerTemaActual());
});