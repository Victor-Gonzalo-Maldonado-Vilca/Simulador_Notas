// ==========================================================================
// GRAFICO.JS - GRÁFICO DE ESCENARIOS (nota final según el promedio en lo pendiente)
// Depende de storage.js (NOTA_MAXIMA). Se usa en la tarjeta de resultado y en el PDF.
// ==========================================================================

// Paletas validadas (azul / naranja, seguras para daltonismo) para cada superficie
const PALETAS_GRAFICO = {
    pantalla: {
        serie: '#3987e5',
        meta: '#d95926',
        referencia: '#94a3b8',
        grid: 'rgba(255, 255, 255, 0.08)',
        eje: 'rgba(255, 255, 255, 0.22)',
        texto: '#e2e8f0',
        textoSecundario: '#94a3b8',
        superficie: '#0b1a2a'
    },
    impresion: {
        serie: '#2a78d6',
        meta: '#eb6834',
        referencia: '#64748b',
        grid: '#e2e8f0',
        eje: '#cbd5e1',
        texto: '#0f172a',
        textoSecundario: '#475569',
        superficie: '#ffffff'
    }
};

const MARGEN_GRAFICO = { arriba: 18, derecha: 92, abajo: 42, izquierda: 40 };

/**
 * Nota final si se obtiene un promedio "x" en las evaluaciones pendientes (relación lineal).
 */
function notaFinalSegunPendiente(resumen, x) {
    return resumen.peorCaso + (resumen.mejorCaso - resumen.peorCaso) * (x / NOTA_MAXIMA);
}

/**
 * Construye el SVG del gráfico como texto. Solo inserta números y etiquetas fijas.
 */
function construirSvgEscenarios(resumen, ancho, alto, paleta) {
    const m = MARGEN_GRAFICO;
    const anchoPlot = ancho - m.izquierda - m.derecha;
    const altoPlot = alto - m.arriba - m.abajo;
    const px = x => m.izquierda + (x / NOTA_MAXIMA) * anchoPlot;
    const py = y => m.arriba + (1 - y / NOTA_MAXIMA) * altoPlot;
    const fmt = n => n.toFixed(2);
    // Borde del color de la superficie para que el texto se lea aunque cruce una línea
    const halo = `paint-order="stroke" stroke="${paleta.superficie}" stroke-width="3" stroke-linejoin="round"`;
    const partes = [];

    // Cuadrícula y ejes (líneas finas y discretas)
    [0, 5, 10, 15, 20].forEach(v => {
        partes.push(`<line x1="${m.izquierda}" y1="${py(v)}" x2="${m.izquierda + anchoPlot}" y2="${py(v)}" stroke="${v === 0 ? paleta.eje : paleta.grid}" stroke-width="1"/>`);
        partes.push(`<text x="${m.izquierda - 8}" y="${py(v) + 4}" text-anchor="end" font-size="11" fill="${paleta.textoSecundario}">${v}</text>`);
        partes.push(`<text x="${px(v)}" y="${m.arriba + altoPlot + 16}" text-anchor="middle" font-size="11" fill="${paleta.textoSecundario}">${v}</text>`);
    });
    partes.push(`<text x="${m.izquierda + anchoPlot / 2}" y="${alto - 6}" text-anchor="middle" font-size="11" fill="${paleta.textoSecundario}">Promedio que obtengas en las evaluaciones pendientes</text>`);
    partes.push(`<text x="12" y="${m.arriba + altoPlot / 2}" text-anchor="middle" font-size="11" fill="${paleta.textoSecundario}" transform="rotate(-90 12 ${m.arriba + altoPlot / 2})">Nota final</text>`);

    // Líneas de referencia: nota aprobatoria (gris) y meta personal (naranja)
    const yAprob = py(resumen.notaAprobatoria);
    const hayMeta = resumen.notaMeta > resumen.notaAprobatoria;
    const yMeta = py(resumen.notaMeta);
    let yEtiquetaAprob = yAprob + 4;
    let yEtiquetaMeta = yMeta + 4;
    if (hayMeta && Math.abs(yAprob - yMeta) < 14) {
        // Separar etiquetas cercanas para que no se encimen
        yEtiquetaMeta = yMeta - 3;
        yEtiquetaAprob = yAprob + 11;
    }
    partes.push(`<line x1="${m.izquierda}" y1="${yAprob}" x2="${m.izquierda + anchoPlot}" y2="${yAprob}" stroke="${paleta.referencia}" stroke-width="1.5"/>`);
    partes.push(`<text x="${m.izquierda + anchoPlot + 8}" y="${yEtiquetaAprob}" font-size="11" font-weight="600" fill="${paleta.texto}">Aprueba ${resumen.notaAprobatoria}</text>`);
    if (hayMeta) {
        partes.push(`<line x1="${m.izquierda}" y1="${yMeta}" x2="${m.izquierda + anchoPlot}" y2="${yMeta}" stroke="${paleta.meta}" stroke-width="1.5"/>`);
        partes.push(`<text x="${m.izquierda + anchoPlot + 8}" y="${yEtiquetaMeta}" font-size="11" font-weight="600" fill="${paleta.texto}">Meta ${resumen.notaMeta}</text>`);
    }

    // Serie: área tenue + línea de 2px
    const x0 = px(0), x1 = px(NOTA_MAXIMA);
    const y0 = py(resumen.peorCaso), y1 = py(resumen.mejorCaso);
    const base = py(0);
    partes.push(`<path d="M${x0},${base} L${x0},${y0} L${x1},${y1} L${x1},${base} Z" fill="${paleta.serie}" fill-opacity="0.1"/>`);
    partes.push(`<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${paleta.serie}" stroke-width="2" stroke-linecap="round"/>`);

    // Extremos etiquetados: piso (sacando 0) y techo (sacando 20)
    const punto = (x, y, color) =>
        `<circle cx="${x}" cy="${y}" r="4.5" fill="${color}" stroke="${paleta.superficie}" stroke-width="2"/>`;
    partes.push(punto(x0, y0, paleta.serie));
    partes.push(punto(x1, y1, paleta.serie));

    // Punto clave: promedio necesario para la meta (o para aprobar si no hay meta mayor)
    const req = resumen.notaRequerida;
    const hayPuntoClave = req > 0 && req <= NOTA_MAXIMA;
    const xr = px(req), yr = py(resumen.notaMeta);

    // Etiquetas de extremos solo si hay espacio y no chocan con la de "Necesitas"
    // (sus valores siguen en el tooltip y en la tabla)
    const choca = (x, y) => hayPuntoClave && Math.abs(x - xr) < 110 && Math.abs(y - (base - 12)) < 24;
    if (anchoPlot >= 300) {
        if (!choca(x0, y0)) {
            partes.push(`<text x="${x0 + 8}" y="${y0 - 8}" font-size="11" fill="${paleta.texto}" ${halo}>Piso ${fmt(resumen.peorCaso)}</text>`);
        }
        if (!choca(x1, y1)) {
            partes.push(`<text x="${x1 - 8}" y="${y1 - 10}" text-anchor="end" font-size="11" fill="${paleta.texto}" ${halo}>Techo ${fmt(resumen.mejorCaso)}</text>`);
        }
    }

    if (hayPuntoClave) {
        const anclaFin = xr > m.izquierda + anchoPlot * 0.7;
        partes.push(`<line x1="${xr}" y1="${yr}" x2="${xr}" y2="${base}" stroke="${paleta.meta}" stroke-width="1" stroke-opacity="0.6"/>`);
        partes.push(punto(xr, yr, paleta.meta));
        partes.push(`<text x="${anclaFin ? xr - 8 : xr + 8}" y="${base - 8}" text-anchor="${anclaFin ? 'end' : 'start'}" font-size="11.5" font-weight="700" fill="${paleta.texto}" ${halo}>Necesitas ${fmt(req)}</text>`);
    }

    // Capa de interacción (crosshair + punto de lectura), oculta hasta el hover
    partes.push(`<g class="grafico-cursor" style="display:none">
        <line class="grafico-cursor-linea" x1="0" y1="${m.arriba}" x2="0" y2="${base}" stroke="${paleta.textoSecundario}" stroke-width="1"/>
        <circle class="grafico-cursor-punto" cx="0" cy="0" r="5" fill="${paleta.serie}" stroke="${paleta.superficie}" stroke-width="2"/>
    </g>`);
    partes.push(`<rect class="grafico-hit" x="${m.izquierda}" y="${m.arriba}" width="${anchoPlot}" height="${altoPlot}" fill="transparent"/>`);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" font-family="inherit">${partes.join('')}</svg>`;
}

/**
 * Texto de condición para un escenario (siempre con etiqueta, nunca solo color).
 */
function condicionEscenario(resumen, final) {
    if (resumen.notaMeta > resumen.notaAprobatoria && final >= resumen.notaMeta) return 'Aprueba y alcanza la meta';
    return final >= resumen.notaAprobatoria ? 'Aprueba' : 'Desaprueba';
}

/**
 * Dibuja el gráfico interactivo en pantalla: SVG, tooltip, teclado y tabla accesible.
 */
function renderizarGraficoEscenarios(contenedor, resumen) {
    const lienzo = contenedor.querySelector('.grafico-lienzo');
    const tooltip = contenedor.querySelector('.grafico-tooltip');
    const tablaCuerpo = contenedor.querySelector('.grafico-tabla tbody');
    // Visible antes de medir, para que el ancho del lienzo sea el real
    contenedor.style.display = 'block';
    const ancho = Math.max(lienzo.clientWidth || 640, 300);
    const alto = ancho < 480 ? 220 : 260;

    lienzo.innerHTML = construirSvgEscenarios(resumen, ancho, alto, PALETAS_GRAFICO.pantalla);
    const svg = lienzo.querySelector('svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Nota final según el promedio en lo pendiente: de ${resumen.peorCaso.toFixed(2)} sacando 0 a ${resumen.mejorCaso.toFixed(2)} sacando 20.`);

    // Tabla accesible (los mismos valores que el tooltip, sin necesidad de hover)
    tablaCuerpo.innerHTML = '';
    for (let x = 0; x <= NOTA_MAXIMA; x += 2) {
        const final = notaFinalSegunPendiente(resumen, x);
        const fila = document.createElement('tr');
        [x, final.toFixed(2), condicionEscenario(resumen, final)].forEach(valor => {
            const celda = document.createElement('td');
            celda.textContent = valor;
            fila.appendChild(celda);
        });
        tablaCuerpo.appendChild(fila);
    }

    // Crosshair que se ajusta al entero más cercano (0..20)
    const m = MARGEN_GRAFICO;
    const anchoPlot = ancho - m.izquierda - m.derecha;
    const altoPlot = alto - m.arriba - m.abajo;
    const cursor = svg.querySelector('.grafico-cursor');
    const lineaCursor = svg.querySelector('.grafico-cursor-linea');
    const puntoCursor = svg.querySelector('.grafico-cursor-punto');
    let actual = Math.min(Math.max(Math.round(resumen.notaRequerida), 0), NOTA_MAXIMA);

    function mostrar(x) {
        actual = Math.min(Math.max(x, 0), NOTA_MAXIMA);
        const final = notaFinalSegunPendiente(resumen, actual);
        const cx = m.izquierda + (actual / NOTA_MAXIMA) * anchoPlot;
        const cy = m.arriba + (1 - final / NOTA_MAXIMA) * altoPlot;
        cursor.style.display = '';
        lineaCursor.setAttribute('x1', cx);
        lineaCursor.setAttribute('x2', cx);
        puntoCursor.setAttribute('cx', cx);
        puntoCursor.setAttribute('cy', cy);

        tooltip.innerHTML = '';
        const valor = document.createElement('strong');
        valor.textContent = final.toFixed(2);
        const detalle = document.createElement('span');
        detalle.textContent = `nota final si promedias ${actual} en lo pendiente`;
        const estado = document.createElement('span');
        estado.className = 'grafico-tooltip-estado';
        estado.textContent = condicionEscenario(resumen, final);
        tooltip.append(valor, detalle, estado);
        tooltip.style.display = 'flex';
        const izquierda = Math.min(Math.max(cx - tooltip.offsetWidth / 2, 0), ancho - tooltip.offsetWidth);
        tooltip.style.left = `${izquierda}px`;
        tooltip.style.top = `${Math.max(cy - tooltip.offsetHeight - 14, 0)}px`;
    }

    function ocultar() {
        cursor.style.display = 'none';
        tooltip.style.display = 'none';
    }

    const hit = svg.querySelector('.grafico-hit');
    hit.addEventListener('pointermove', (e) => {
        const caja = svg.getBoundingClientRect();
        const xPx = (e.clientX - caja.left) * (ancho / caja.width);
        mostrar(Math.round(((xPx - m.izquierda) / anchoPlot) * NOTA_MAXIMA));
    });
    hit.addEventListener('pointerleave', ocultar);

    // Mismo detalle con teclado: flechas para moverse por los escenarios
    svg.setAttribute('tabindex', '0');
    svg.addEventListener('focus', () => mostrar(actual));
    svg.addEventListener('blur', ocultar);
    svg.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { mostrar(actual + 1); e.preventDefault(); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { mostrar(actual - 1); e.preventDefault(); }
    });

}

/**
 * SVG estático con colores de impresión para el reporte PDF.
 */
function svgEscenariosImpresion(resumen) {
    return construirSvgEscenarios(resumen, 640, 250, PALETAS_GRAFICO.impresion);
}
