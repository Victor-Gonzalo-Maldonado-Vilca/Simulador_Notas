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
        renderizarTarjetas(cursosActuales);
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

            const codigo = curso.codigo ? curso.codigo : 'UNSA';
            const creditos = curso.creditos ? `${curso.creditos} Créditos` : '3 Créditos';

            card.innerHTML = `
                <div class="course-card-header">
                    <div class="course-meta-tags">
                        <span class="course-code-badge">${codigo}</span>
                        <span class="course-credits-badge">${creditos}</span>
                    </div>
                    <button type="button" class="btn-icon-danger" title="Eliminar Asignatura" data-id="${curso.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>

                <h3 class="course-title">${curso.nombre}</h3>

                <!-- Estado Diagnóstico -->
                <div class="course-status-row">
                    <span class="result-status-pill ${resumen.badgeClass}">
                        ${resumen.badgeTexto}
                    </span>
                    <span class="course-target-hint">Meta: ${parseFloat(curso.notaMeta || 10.5).toFixed(1)}</span>
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
                        <span>Techo: <strong>${resumen.mejorCaso.toFixed(2)}</strong></span>
                    </div>
                    <button type="button" class="btn btn-primary btn-sm btn-abrir-simulador" data-id="${curso.id}">
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
        inputBuscar.addEventListener('input', (e) => {
            const termino = e.target.value.toLowerCase().trim();
            const filtrados = cursosActuales.filter(c => 
                c.nombre.toLowerCase().includes(termino) || 
                (c.codigo && c.codigo.toLowerCase().includes(termino))
            );
            renderizarTarjetas(filtrados);
        });
    }

    // Modal Control
    function abrirModalNuevo() {
        formCurso.reset();
        document.getElementById('curso-id').value = '';
        modalTitulo.textContent = 'Nueva Asignatura';
        document.getElementById('curso-meta').value = '10.5';
        document.getElementById('curso-creditos').value = '4';
        document.getElementById('grupo-plantilla-pesos').style.display = 'block';
        modalCurso.style.display = 'flex';
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

    // Guardar nuevo curso desde modal
    if (formCurso) {
        formCurso.addEventListener('submit', (e) => {
            e.preventDefault();

            const nombre = document.getElementById('curso-nombre').value.trim();
            const codigo = document.getElementById('curso-codigo').value.trim();
            const creditos = parseInt(document.getElementById('curso-creditos').value) || 3;
            const meta = parseFloat(document.getElementById('curso-meta').value) || 10.5;

            const plantillaSeleccionada = document.querySelector('input[name="plantilla-pesos"]:checked').value;

            let pesos = { peso1: '', peso2: '', peso3: '', peso4: '', peso5: '', peso6: '' };
            if (plantillaSeleccionada === 'unsa') {
                pesos = { peso1: 15, peso2: 15, peso3: 15, peso4: 15, peso5: 20, peso6: 20 };
            } else if (plantillaSeleccionada === 'iguales') {
                pesos = { peso1: 16.67, peso2: 16.67, peso3: 16.67, peso4: 16.67, peso5: 16.66, peso6: 16.66 };
            }

            const nuevoCurso = {
                nombre,
                codigo: codigo || 'UNSA',
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
    actualizarDashboard();
});
