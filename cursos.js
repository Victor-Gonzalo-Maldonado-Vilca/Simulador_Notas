document.addEventListener('DOMContentLoaded', () => {
    const contenedorCursos = document.getElementById('contenedor-cursos');
    const emptyState = document.getElementById('empty-state');
    const inputBuscar = document.getElementById('input-buscar-curso');
    const btnAbrirModal = document.getElementById('btn-abrir-modal-nuevo');
    const btnCrearPrimerCurso = document.getElementById('btn-crear-primer-curso');
    const modalCurso = document.getElementById('modal-curso');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');
    const btnCancelarModal = document.getElementById('btn-cancelar-modal');
    const formCurso = document.getElementById('form-curso');
    const modalTitulo = document.getElementById('modal-titulo');

    // Métricas globales
    const elTotalCursos = document.getElementById('global-total-cursos');
    const elPromedioPonderado = document.getElementById('global-promedio-ponderado');
    const elAprobados = document.getElementById('global-aprobados');
    const elEnRiesgo = document.getElementById('global-en-riesgo');

    let cursosActuales = obtenerCursos();

    // Renderizar dashboard completo
    function actualizarDashboard() {
        cursosActuales = obtenerCursos();
        actualizarMetricas();
        renderizarTarjetas(filtrarCursos(cursosActuales));
    }

    // Aplica el término del buscador (si hay uno) para no perder el filtro al re-renderizar
    function filtrarCursos(lista) {
        const termino = inputBuscar ? inputBuscar.value.toLowerCase().trim() : '';
        if (!termino) return lista;
        return lista.filter(c =>
            c.nombre.toLowerCase().includes(termino) ||
            (c.codigo && c.codigo.toLowerCase().includes(termino))
        );
    }

    // Actualizar métricas globales
    function actualizarMetricas() {
        const metricas = calcularMetricasGlobales(cursosActuales);
        if (elTotalCursos) elTotalCursos.textContent = metricas.totalCursos;
        if (elPromedioPonderado) elPromedioPonderado.textContent = metricas.promedioPonderado;
        if (elAprobados) elAprobados.textContent = metricas.cursosAprobados;
        if (elEnRiesgo) elEnRiesgo.textContent = metricas.cursosEnRiesgo;
    }

    // Renderizar tarjetas de cursos
    function renderizarTarjetas(lista) {
        if (!contenedorCursos) return;
        contenedorCursos.innerHTML = '';

        if (lista.length === 0) {
            emptyState.style.display = 'block';
            return;
        } else {
            emptyState.style.display = 'none';
        }

        lista.forEach(curso => {
            const resumen = calcularResumenCurso(curso);
            const card = document.createElement('article');
            card.className = 'course-card';

            const codigo = escaparHtml(curso.codigo ? curso.codigo : 'S/C');
            const creditos = escaparHtml(curso.creditos ? `${curso.creditos} Créditos` : '3 Créditos');
            const nombre = escaparHtml(curso.nombre);
            const idSeguro = escaparHtml(curso.id);

            card.innerHTML = `
                <div class="course-card-header">
                    <div class="course-meta-tags">
                        <span class="course-code-badge">${codigo}</span>
                        <span class="course-credits-badge">${creditos}</span>
                    </div>
                    <div class="course-card-actions">
                        <button type="button" class="btn-icon-edit" title="Editar Asignatura" data-id="${idSeguro}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                        </button>
                        <button type="button" class="btn-icon-danger" title="Eliminar Asignatura" data-id="${idSeguro}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <h3 class="course-title">${nombre}</h3>

                <!-- Estado Diagnóstico -->
                <div class="course-status-row">
                    <span class="result-status-pill ${resumen.badgeClass}">
                        ${resumen.badgeTexto}
                    </span>
                    <span class="course-target-hint">Meta: ${resumen.notaMeta.toFixed(1)}</span>
                </div>

                <!-- Barra de Progreso del Ciclo -->
                <div class="course-progress-section">
                    <div class="progress-labels">
                        <span>Progreso evaluado</span>
                        <strong>${resumen.pctEvaluado}% (${resumen.notasLlenadas}/6 notas)</strong>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${resumen.pctEvaluado}%;"></div>
                    </div>
                </div>

                <!-- Detalle explicativo -->
                <p class="course-detail-text">${resumen.detalle}</p>

                <!-- Footer de la tarjeta con botón de acción -->
                <div class="course-card-footer">
                    <div class="course-mini-stats">
                        <span>Acumulado: <strong>${resumen.promedioActual.toFixed(2)}</strong></span>
                        <span>Parcial: <strong>${resumen.promedioParcial !== null ? resumen.promedioParcial.toFixed(2) : '--'}</strong></span>
                        <span>Techo: <strong>${resumen.mejorCaso.toFixed(2)}</strong></span>
                    </div>
                    <button type="button" class="btn btn-primary btn-sm btn-abrir-simulador" data-id="${idSeguro}">
                        Simular Notas
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </div>
            `;

            // Event listener para abrir simulador
            card.querySelector('.btn-abrir-simulador').addEventListener('click', () => {
                establecerCursoActivoId(curso.id);
                window.location.href = `simulador.html?id=${curso.id}`;
            });

            // Event listener para editar
            card.querySelector('.btn-icon-edit').addEventListener('click', (e) => {
                e.stopPropagation();
                abrirModalEditar(curso);
            });

            // Event listener para eliminar
            card.querySelector('.btn-icon-danger').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`¿Estás seguro de que deseas eliminar la asignatura "${curso.nombre}"? Esta acción no se puede deshacer.`)) {
                    eliminarCurso(curso.id);
                    actualizarDashboard();
                }
            });

            contenedorCursos.appendChild(card);
        });
    }

    // Buscador en tiempo real
    if (inputBuscar) {
        inputBuscar.addEventListener('input', () => {
            renderizarTarjetas(filtrarCursos(cursosActuales));
        });
    }

    // Modal Control
    const btnGuardarCurso = document.getElementById('btn-guardar-curso');

    function abrirModalNuevo() {
        formCurso.reset();
        sincronizarRadioCards();
        document.getElementById('curso-id').value = '';
        modalTitulo.textContent = 'Nueva Asignatura';
        btnGuardarCurso.textContent = 'Guardar Asignatura';
        prepararCampoMeta('');
        document.getElementById('curso-creditos').value = '4';
        document.getElementById('grupo-plantilla-pesos').style.display = 'block';
        modalCurso.style.display = 'flex';
    }

    // En edición no se muestra la plantilla de pesos: los pesos se ajustan en el simulador
    function abrirModalEditar(curso) {
        formCurso.reset();
        document.getElementById('curso-id').value = curso.id;
        document.getElementById('curso-nombre').value = curso.nombre;
        document.getElementById('curso-codigo').value = curso.codigo || '';
        document.getElementById('curso-creditos').value = curso.creditos || 3;
        prepararCampoMeta(curso.notaMeta ?? '');
        document.getElementById('grupo-plantilla-pesos').style.display = 'none';
        modalTitulo.textContent = 'Editar Asignatura';
        btnGuardarCurso.textContent = 'Guardar Cambios';
        modalCurso.style.display = 'flex';
    }

    // La meta personal es opcional y no puede ser menor que la nota aprobatoria de la universidad
    function prepararCampoMeta(valor) {
        const univ = obtenerUniversidad();
        const inputMeta = document.getElementById('curso-meta');
        inputMeta.value = valor;
        inputMeta.min = univ.notaAprobatoria;
        inputMeta.placeholder = univ.notaAprobatoria;
        document.getElementById('curso-meta-sufijo').textContent = `Aprobatoria ${univ.siglas}: ${univ.notaAprobatoria}`;
    }

    // Marca visualmente la tarjeta del radio seleccionado (form.reset() no actualiza las clases)
    function sincronizarRadioCards() {
        document.querySelectorAll('.radio-card').forEach(card => {
            const radio = card.querySelector('input[type="radio"]');
            card.classList.toggle('selected', !!(radio && radio.checked));
        });
    }

    function cerrarModal() {
        modalCurso.style.display = 'none';
    }

    if (btnAbrirModal) btnAbrirModal.addEventListener('click', abrirModalNuevo);
    if (btnCrearPrimerCurso) btnCrearPrimerCurso.addEventListener('click', abrirModalNuevo);
    if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);
    if (btnCancelarModal) btnCancelarModal.addEventListener('click', cerrarModal);

    modalCurso.addEventListener('click', (e) => {
        if (e.target === modalCurso) cerrarModal();
    });

    // Manejo visual de radio buttons en modal
    const radioCards = document.querySelectorAll('.radio-card');
    radioCards.forEach(card => {
        card.addEventListener('click', () => {
            radioCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
    });

    // Guardar curso nuevo o editado desde el modal
    if (formCurso) {
        formCurso.addEventListener('submit', (e) => {
            e.preventDefault();

            const idEdicion = document.getElementById('curso-id').value;
            const nombre = document.getElementById('curso-nombre').value.trim();
            const codigo = document.getElementById('curso-codigo').value.trim();
            const creditos = parseInt(document.getElementById('curso-creditos').value) || 3;
            const metaRaw = document.getElementById('curso-meta').value.trim();
            // Meta vacía = sigue la nota aprobatoria de la universidad
            const meta = metaRaw === '' ? '' : parsearNotaMeta(metaRaw);

            // Edición: se actualizan solo los datos generales, conservando notas y pesos
            if (idEdicion) {
                const existente = obtenerCursoPorId(idEdicion);
                if (!existente) {
                    alert('La asignatura que intentas editar ya no existe.');
                    cerrarModal();
                    actualizarDashboard();
                    return;
                }
                Object.assign(existente, { nombre, codigo, creditos, notaMeta: meta });
                guardarCurso(existente);
                cerrarModal();
                actualizarDashboard();
                return;
            }

            const plantillaSeleccionada = document.querySelector('input[name="plantilla-pesos"]:checked').value;

            let pesos = { peso1: '', peso2: '', peso3: '', peso4: '', peso5: '', peso6: '' };
            if (plantillaSeleccionada === 'unsa') {
                pesos = { peso1: 15, peso2: 15, peso3: 15, peso4: 15, peso5: 20, peso6: 20 };
            } else if (plantillaSeleccionada === 'iguales') {
                pesos = { peso1: 16.67, peso2: 16.67, peso3: 16.67, peso4: 16.67, peso5: 16.66, peso6: 16.66 };
            }

            const nuevoCurso = {
                nombre,
                codigo,
                creditos,
                notaMeta: meta,
                notas: { nota1: '', nota2: '', nota3: '', nota4: '', nota5: '', nota6: '' },
                pesos
            };

            const guardado = guardarCurso(nuevoCurso);
            cerrarModal();
            actualizarDashboard();

            // Preguntar si desea ir al simulador directamente
            if (confirm(`¡Asignatura "${nombre}" creada con éxito!\n¿Deseas abrir su simulador de notas ahora?`)) {
                establecerCursoActivoId(guardado.id);
                window.location.href = `simulador.html?id=${guardado.id}`;
            }
        });
    }

    // =========================================================================
    // REPORTE CONSOLIDADO SEMESTRAL EN PDF
    // =========================================================================
    const btnReporteSemestral = document.getElementById('btn-reporte-semestral');

    function generarReporteSemestralPDF() {
        const cursos = obtenerCursos();
        if (!cursos || cursos.length === 0) {
            alert("No hay asignaturas registradas para generar el consolidado.");
            return;
        }

        const ahora = new Date();
        const formatoFecha = ahora.toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        const metricas = calcularMetricasGlobales(cursos);

        document.getElementById('rep-sem-fecha').textContent = formatoFecha;
        const univ = obtenerUniversidad();
        document.getElementById('rep-sem-univ-nombre').textContent = univ.nombre.toUpperCase();
        document.getElementById('rep-sem-codigo').textContent = `CONSOLIDADO-${univ.siglas}-${Date.now().toString().slice(-6)}`;
        document.getElementById('rep-sem-total-cursos').textContent = metricas.totalCursos;
        document.getElementById('rep-sem-total-creditos').textContent = metricas.creditosTotales;
        document.getElementById('rep-sem-promedio-global').textContent = `${metricas.promedioPonderado} / 20.00`;
        document.getElementById('rep-sem-resumen-estados').textContent = `${metricas.cursosAprobados} aseguradas • ${metricas.cursosEnRiesgo} en seguimiento`;

        const tablaCuerpo = document.getElementById('rep-sem-tabla-cuerpo');
        tablaCuerpo.innerHTML = '';

        cursos.forEach(c => {
            const res = calcularResumenCurso(c);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escaparHtml(c.codigo || 'S/C')}</strong></td>
                <td><strong>${escaparHtml(c.nombre)}</strong></td>
                <td style="text-align: center;">${escaparHtml(c.creditos || 3)}</td>
                <td style="text-align: center;">${res.pctEvaluado}% (${res.notasLlenadas}/6)</td>
                <td style="text-align: center; font-weight: 700;">${res.promedioActual.toFixed(2)}</td>
                <td style="text-align: right;"><span class="rep-diag-badge ${res.badgeClass}">${res.badgeTexto}</span></td>
            `;
            tablaCuerpo.appendChild(tr);
        });

        // Lanzar diálogo de impresión
        window.print();
    }

    if (btnReporteSemestral) {
        btnReporteSemestral.addEventListener('click', generarReporteSemestralPDF);
    }

    // =========================================================================
    // RESPALDO JSON (DESCARGAR / RESTAURAR)
    // =========================================================================
    const btnExportarRespaldo = document.getElementById('btn-exportar-respaldo');
    const btnImportarRespaldo = document.getElementById('btn-importar-respaldo');
    const inputImportarRespaldo = document.getElementById('input-importar-respaldo');

    function descargarRespaldo() {
        const contenido = JSON.stringify(crearRespaldo(), null, 2);
        const url = URL.createObjectURL(new Blob([contenido], { type: 'application/json' }));
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `respaldo-simulador-unsa-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    function restaurarDesdeArchivo(archivo) {
        const lector = new FileReader();
        lector.onload = () => {
            try {
                const datos = JSON.parse(lector.result);
                const cursos = validarRespaldo(datos);
                const mensaje = `El respaldo contiene ${cursos.length} asignatura(s). ` +
                    `Se reemplazarán las ${cursosActuales.length} asignatura(s) actuales. ¿Deseas continuar?`;
                if (confirm(mensaje)) {
                    restaurarCursos(cursos);
                    // Los respaldos nuevos también traen el perfil (universidad y estudiante)
                    if (datos && datos.perfil) {
                        guardarPerfil(datos.perfil);
                        renderizarPerfil();
                    }
                    actualizarDashboard();
                    alert('Respaldo restaurado correctamente.');
                }
            } catch (error) {
                const detalle = error instanceof SyntaxError ? 'el archivo no es un JSON válido.' : error.message;
                alert(`No se pudo restaurar el respaldo: ${detalle}`);
            }
        };
        lector.onerror = () => alert('No se pudo leer el archivo seleccionado.');
        lector.readAsText(archivo);
    }

    if (btnExportarRespaldo) {
        btnExportarRespaldo.addEventListener('click', descargarRespaldo);
    }

    if (btnImportarRespaldo && inputImportarRespaldo) {
        btnImportarRespaldo.addEventListener('click', () => inputImportarRespaldo.click());
        inputImportarRespaldo.addEventListener('change', () => {
            const archivo = inputImportarRespaldo.files[0];
            // Limpiar el valor permite volver a elegir el mismo archivo después
            inputImportarRespaldo.value = '';
            if (archivo) restaurarDesdeArchivo(archivo);
        });
    }

    // =========================================================================
    // PERFIL DEL ESTUDIANTE (UNIVERSIDAD Y NOTA APROBATORIA)
    // =========================================================================
    const modalPerfil = document.getElementById('modal-perfil');
    const formPerfil = document.getElementById('form-perfil');
    const selectUniversidad = document.getElementById('perfil-universidad');
    const grupoUnivPersonalizada = document.getElementById('grupo-univ-personalizada');
    const grupoNotaFija = document.getElementById('grupo-nota-fija');

    function renderizarPerfil() {
        const perfil = obtenerPerfil();
        const univ = obtenerUniversidad(perfil);
        document.getElementById('perfil-univ-nombre').textContent = univ.nombre;
        document.getElementById('perfil-estudiante').textContent = perfil.estudiante || 'Agrega tu nombre para los reportes';
        document.getElementById('perfil-nota-aprobatoria').textContent = univ.notaAprobatoria;
        mostrarSiglasUniversidad(univ);
    }

    function poblarSelectUniversidades() {
        selectUniversidad.innerHTML = '';
        Object.entries(UNIVERSIDADES).forEach(([id, u]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = u.personalizable ? u.nombre : `${u.siglas} — ${u.nombre}`;
            selectUniversidad.appendChild(option);
        });
    }

    // Muestra la nota fija (no editable) o los campos de "Otra universidad"
    function actualizarVistaUniversidad() {
        const base = UNIVERSIDADES[selectUniversidad.value];
        const personalizable = !!base.personalizable;
        grupoUnivPersonalizada.style.display = personalizable ? 'block' : 'none';
        grupoNotaFija.style.display = personalizable ? 'none' : 'block';
        document.getElementById('perfil-univ-nombre-input').required = personalizable;
        document.getElementById('perfil-univ-nota').required = personalizable;
        document.getElementById('perfil-nota-fija').textContent = base.notaAprobatoria;
        document.getElementById('perfil-swatch-primario').style.background = base.colores.primario;
        document.getElementById('perfil-swatch-secundario').style.background = base.colores.secundario;
    }

    function abrirModalPerfil() {
        const perfil = obtenerPerfil();
        document.getElementById('perfil-nombre').value = perfil.estudiante;
        selectUniversidad.value = perfil.universidadId;
        document.getElementById('perfil-univ-nombre-input').value = perfil.personalizada.nombre;
        document.getElementById('perfil-univ-siglas').value = perfil.personalizada.siglas;
        document.getElementById('perfil-univ-nota').value = perfil.personalizada.notaAprobatoria;
        actualizarVistaUniversidad();
        modalPerfil.style.display = 'flex';
    }

    function cerrarModalPerfil() {
        modalPerfil.style.display = 'none';
    }

    if (modalPerfil && formPerfil) {
        poblarSelectUniversidades();
        selectUniversidad.addEventListener('change', actualizarVistaUniversidad);
        document.getElementById('btn-editar-perfil').addEventListener('click', abrirModalPerfil);
        document.getElementById('btn-cerrar-perfil').addEventListener('click', cerrarModalPerfil);
        document.getElementById('btn-cancelar-perfil').addEventListener('click', cerrarModalPerfil);
        modalPerfil.addEventListener('click', (e) => {
            if (e.target === modalPerfil) cerrarModalPerfil();
        });

        formPerfil.addEventListener('submit', (e) => {
            e.preventDefault();
            guardarPerfil({
                universidadId: selectUniversidad.value,
                estudiante: document.getElementById('perfil-nombre').value,
                personalizada: {
                    nombre: document.getElementById('perfil-univ-nombre-input').value,
                    siglas: document.getElementById('perfil-univ-siglas').value,
                    notaAprobatoria: document.getElementById('perfil-univ-nota').value
                }
            });
            cerrarModalPerfil();
            renderizarPerfil();
            // La nota aprobatoria cambia el estado de todos los cursos
            actualizarDashboard();
        });

        renderizarPerfil();
    }

    // Alternar tema oscuro/claro
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    if (btnThemeToggle) {
        btnThemeToggle.addEventListener('click', alternarTema);
    }

    actualizarBotonesTema(obtenerTemaActual());
    actualizarDashboard();
});

