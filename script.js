// ==========================================================================
// SIMULADOR DE NOTAS ACADÉMICO - MODO PREDICTIVO "¿CUÁNTO NECESITO PARA APROBAR?"
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

let alertaTimeout = null;

// Función para mostrar alertas en la interfaz
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

// Actualizar contadores de pesos y notas completadas
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

    // Actualizar badge de pesos
    if (totalPesosBadge) {
        totalPesosBadge.textContent = `${sumaPesos.toFixed(sumaPesos % 1 === 0 ? 0 : 1)}%`;
        totalPesosBadge.classList.remove('valid', 'warning');
        if (Math.round(sumaPesos) === 100) {
            totalPesosBadge.classList.add('valid');
        } else if (sumaPesos > 0) {
            totalPesosBadge.classList.add('warning');
        }
    }

    // Actualizar badge de notas
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

// Aplicar plantilla de pesos
function aplicarPlantillaPesos(pesos) {
    EVALUACIONES.forEach((ev, index) => {
        const inputPeso = document.getElementById(ev.pesoId);
        if (inputPeso && pesos[index] !== undefined) {
            inputPeso.value = pesos[index];
        }
    });
    actualizarContadores();
    calcularOSimular(false);
}

// Plantilla UNSA típica: 30% Fase 1 (15%/15%), 30% Fase 2 (15%/15%), 40% Fase 3 (20%/20%)
if (btnPresetUnsa) {
    btnPresetUnsa.addEventListener('click', () => {
        aplicarPlantillaPesos([15, 15, 15, 15, 20, 20]);
        mostrarAlerta("Plantilla UNSA aplicada: Fase 1 (30%), Fase 2 (30%), Fase 3 (40%).", "info");
    });
}

// Plantilla equitativa (~16.7% cada una)
if (btnPresetIguales) {
    btnPresetIguales.addEventListener('click', () => {
        aplicarPlantillaPesos([16.67, 16.67, 16.67, 16.67, 16.66, 16.66]);
        mostrarAlerta("Plantilla equitativa aplicada: ~16.7% para cada evaluación.", "info");
    });
}

// Función principal de cálculo y simulación predictiva
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

    if (notasFueraDeRango) {
        if (mostrarAlertas) {
            mostrarAlerta("Atención: Las calificaciones deben estar en la escala de 0 a 20.", "danger");
        }
    }

    // Si no hay datos ingresados
    if (completadas.length === 0 && sumaPesos === 0) {
        if (mostrarAlertas) {
            mostrarAlerta("Por favor, ingresa tus notas y los pesos porcentuales correspondientes.");
        }
        resetearResultado();
        return;
    }

    // Si los pesos no están definidos
    if (sumaPesos === 0) {
        if (mostrarAlertas) {
            mostrarAlerta("Debes asignar los porcentajes (%) de las evaluaciones para realizar el cálculo. Puedes usar los botones de plantillas arriba.", "danger");
        }
        return;
    }

    // Efecto visual de rebote suave en el número
    resultadoElement.style.transform = "scale(1.08)";
    setTimeout(() => {
        resultadoElement.style.transform = "scale(1)";
    }, 180);

    // =========================================================================
    // CASO 1: TODAS LAS NOTAS ESTÁN INGRESADAS (Promedio Final Completo)
    // =========================================================================
    if (pendientes.length === 0) {
        const sumaPonderada = completadas.reduce((acc, ev) => acc + (ev.nota * ev.peso), 0);
        const promedio = sumaPonderada / sumaPesos;

        resultadoTipoEtiqueta.textContent = "Resultado Final Ponderado";
        resultadoElement.textContent = promedio.toFixed(2);

        estadoElement.className = "result-status-pill";
        if (promedio >= notaMeta) {
            estadoElement.textContent = `✓ Condición: Aprobado (Meta: ${notaMeta.toFixed(1)})`;
            estadoElement.classList.add('aprobado');
        } else {
            estadoElement.textContent = `✕ Condición: Desaprobado (Meta: ${notaMeta.toFixed(1)})`;
            estadoElement.classList.add('desaprobado');
        }

        resultadoMensaje.innerHTML = `Completaste las 6 evaluaciones del curso. Tu promedio final ponderado es de <strong>${promedio.toFixed(2)}</strong> sobre 20.`;

        // Métricas secundarias
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

    // =========================================================================
    // CASO 2: MODO PREDICTIVO "¿CUÁNTO NECESITO PARA APROBAR?"
    // =========================================================================
    // Peso evaluado y peso pendiente
    const pesoEvaluado = completadas.reduce((acc, ev) => acc + ev.peso, 0);
    const pesoPendiente = pendientes.reduce((acc, ev) => acc + ev.peso, 0);

    if (pesoPendiente === 0) {
        if (mostrarAlertas) {
            mostrarAlerta("Las evaluaciones pendientes tienen peso 0%. Asigna porcentajes para calcular cuánto necesitas.", "warning");
        }
        return;
    }

    // Puntos acumulados en base al peso total
    const puntosAcumulados = completadas.reduce((acc, ev) => acc + (ev.nota * ev.peso), 0);

    // Nota requerida promedio en lo pendiente para alcanzar notaMeta
    // Fórmula: (puntosAcumulados + notaReq * pesoPendiente) / sumaPesos = notaMeta
    // notaReq = (notaMeta * sumaPesos - puntosAcumulados) / pesoPendiente
    const notaRequerida = (notaMeta * sumaPesos - puntosAcumulados) / pesoPendiente;

    // Escenarios extremos
    const mejorCasoMax = (puntosAcumulados + 20 * pesoPendiente) / sumaPesos;
    const peorCasoMin = (puntosAcumulados + 0 * pesoPendiente) / sumaPesos;
    const aporteActual = puntosAcumulados / sumaPesos;
    const pctEvaluado = ((pesoEvaluado / sumaPesos) * 100).toFixed(0);

    // Texto de evaluaciones pendientes
    const nombresPendientes = pendientes.map(p => `<strong>${p.nombre}</strong>`).join(', ');
    const textoEvaluaciones = pendientes.length === 1 
        ? `en ${nombresPendientes}` 
        : `en promedio en las ${pendientes.length} evaluaciones pendientes (${nombresPendientes})`;

    resultadoTipoEtiqueta.textContent = pendientes.length === 1 
        ? `Nota Necesaria en ${pendientes[0].nombre}` 
        : `Nota Promedio Requerida en Pendientes`;

    estadoElement.className = "result-status-pill";

    // Clasificación del resultado predictivo
    if (notaRequerida <= 0) {
        // Ya aprobó con las notas acumuladas
        resultadoElement.textContent = "0.00";
        estadoElement.textContent = "★ ¡Aprobación Asegurada!";
        estadoElement.classList.add('aprobado');
        resultadoMensaje.innerHTML = `¡Felicitaciones! Con tus notas acumuladas ya alcanzaste la meta de <strong>${notaMeta.toFixed(1)}</strong>. Incluso sacando 0.00 en lo que falta, tu nota mínima final asegurada es de <strong>${peorCasoMin.toFixed(2)}</strong>.`;
    } else if (notaRequerida <= 10.5) {
        resultadoElement.textContent = notaRequerida.toFixed(2);
        estadoElement.textContent = `✓ Meta Muy Accesible (${notaRequerida.toFixed(2)})`;
        estadoElement.classList.add('accesible');
        resultadoMensaje.innerHTML = `Para alcanzar tu meta de <strong>${notaMeta.toFixed(1)}</strong>, necesitas obtener al menos <strong>${notaRequerida.toFixed(2)}</strong> ${textoEvaluaciones}.`;
    } else if (notaRequerida <= 14.0) {
        resultadoElement.textContent = notaRequerida.toFixed(2);
        estadoElement.textContent = `✓ Meta Alcanzable (${notaRequerida.toFixed(2)})`;
        estadoElement.classList.add('moderado');
        resultadoMensaje.innerHTML = `Requieres una calificación de al menos <strong>${notaRequerida.toFixed(2)}</strong> ${textoEvaluaciones} para aprobar con <strong>${notaMeta.toFixed(1)}</strong>.`;
    } else if (notaRequerida <= 17.0) {
        resultadoElement.textContent = notaRequerida.toFixed(2);
        estadoElement.textContent = `⚠ Meta Exigente (${notaRequerida.toFixed(2)})`;
        estadoElement.classList.add('exigente');
        resultadoMensaje.innerHTML = `Deberás esforzarte al máximo: necesitas una calificación promedio de al menos <strong>${notaRequerida.toFixed(2)}</strong> ${textoEvaluaciones} para alcanzar <strong>${notaMeta.toFixed(1)}</strong>.`;
    } else if (notaRequerida <= 20.0) {
        resultadoElement.textContent = notaRequerida.toFixed(2);
        estadoElement.textContent = `🔥 Nivel Crítico (${notaRequerida.toFixed(2)})`;
        estadoElement.classList.add('critico');
        resultadoMensaje.innerHTML = `¡Situación muy ajustada! Necesitas una nota casi perfecta de <strong>${notaRequerida.toFixed(2)}</strong> ${textoEvaluaciones} para alcanzar tu meta de <strong>${notaMeta.toFixed(1)}</strong>.`;
    } else {
        // Imposible matemáticamente
        resultadoElement.textContent = notaRequerida.toFixed(2);
        estadoElement.textContent = "✕ Meta Inalcanzable";
        estadoElement.classList.add('desaprobado');
        resultadoMensaje.innerHTML = `Lamentablemente la meta de <strong>${notaMeta.toFixed(1)}</strong> es matemáticamente inalcanzable, ya que requerirías <strong>${notaRequerida.toFixed(2)}</strong> (el límite es 20). Tu nota máxima posible sacando 20 en todo lo restante es <strong>${mejorCasoMax.toFixed(2)}</strong>.`;
    }

    // Actualizar métricas secundarias
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

// Resetear resultado
function resetearResultado() {
    resultadoTipoEtiqueta.textContent = "Estado de la Simulación";
    resultadoElement.textContent = "--";
    estadoElement.className = "result-status-pill";
    estadoElement.textContent = "Esperando datos";
    resultadoMensaje.textContent = "Ingresa tus notas actuales y porcentajes. Si dejas evaluaciones en blanco, el simulador calculará automáticamente la nota que requieres para aprobar.";
    metricasSecundarias.style.display = 'none';
}

// Event Listeners en tiempo real para todos los campos
EVALUACIONES.forEach(ev => {
    const inputNota = document.getElementById(ev.notaId);
    const inputPeso = document.getElementById(ev.pesoId);

    if (inputNota) {
        inputNota.addEventListener('input', () => {
            // Validar que no se exceda de 20
            const val = parseFloat(inputNota.value);
            if (val > 20) {
                mostrarAlerta(`La calificación no puede ser mayor a 20.`, "danger");
            }
            actualizarContadores();
            calcularOSimular(false);
        });
    }

    if (inputPeso) {
        inputPeso.addEventListener('input', () => {
            actualizarContadores();
            calcularOSimular(false);
        });
    }
});

if (notaMetaInput) {
    notaMetaInput.addEventListener('input', () => {
        calcularOSimular(false);
    });
}

// Evento de envío del formulario
formulario.addEventListener('submit', function(event) {
    event.preventDefault();
    calcularOSimular(true);
});

// Botón Limpiar
if (btnLimpiar) {
    btnLimpiar.addEventListener('click', function() {
        formulario.reset();
        notaMetaInput.value = "10.5";
        if (alertaBox) {
            alertaBox.classList.remove('show');
        }
        actualizarContadores();
        resetearResultado();
    });
}

// Inicialización
actualizarContadores();