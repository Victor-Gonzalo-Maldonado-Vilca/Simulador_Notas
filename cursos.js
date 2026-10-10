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
            const docente = obtenerDocenteDeCurso(curso);
            const filaDocente = docente
                ? `<div class="course-teacher-row">
                        <span class="course-teacher-name">Docente: <strong>${escaparHtml(docente.nombre)}</strong></span>
                        ${docente.calificacion > 0 ? htmlEstrellas(docente.calificacion) : ''}
                   </div>`
                : '';
            const totalComentarios = Array.isArray(curso.comentarios) ? curso.comentarios.length : 0;

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
                ${filaDocente}

                <!-- Estado Diagnóstico -->
                <div class="course-status-row">
                    <span class="result-status-pill ${resumen.badgeClass}">
                        ${resumen.badgeTexto}
                    </span>
                    <span class="course-target-hint">
                        ${totalComentarios > 0 ? `<span class="course-comments-count" title="Comentarios del curso">💬 ${totalComentarios}</span> · ` : ''}Meta: ${resumen.notaMeta.toFixed(1)}
                    </span>
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
        prepararCampoDocente(null);
        prepararCamposAsignatura();
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
        prepararCampoDocente(curso);
        prepararCamposAsignatura();
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

    // Selector de estrellas del docente (clic en la misma estrella = quitar calificación)
    const contenedorEstrellas = document.getElementById('curso-profesor-estrellas');
    const inputCalificacion = document.getElementById('curso-profesor-calificacion');

    function establecerCalificacionFormulario(valor) {
        const n = normalizarCalificacion(valor);
        inputCalificacion.value = n;
        contenedorEstrellas.querySelectorAll('.star-btn').forEach(btn => {
            const valorBoton = Number(btn.dataset.valor);
            btn.classList.toggle('activa', valorBoton <= n);
            btn.setAttribute('aria-checked', String(valorBoton === n));
        });
    }

    if (contenedorEstrellas && inputCalificacion) {
        // Se crean de 5 a 1: con flex row-reverse se ven de 1 a 5 y el hover ilumina las anteriores
        for (let i = MAX_ESTRELLAS; i >= 1; i--) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'star-btn';
            btn.dataset.valor = i;
            btn.textContent = '★';
            btn.setAttribute('role', 'radio');
            btn.setAttribute('aria-label', `${i} ${i === 1 ? 'estrella' : 'estrellas'}`);
            btn.addEventListener('click', () => {
                const actual = Number(inputCalificacion.value);
                establecerCalificacionFormulario(actual === i ? 0 : i);
            });
            contenedorEstrellas.appendChild(btn);
        }
    }

    // =========================================================================
    // CAMPOS CON SUGERENCIAS (componente reutilizable)
    // =========================================================================

    /**
     * Convierte un input en un campo con lista de sugerencias accesible (teclado y mouse).
     * - buscar(texto): devuelve los elementos a sugerir
     * - describir(elemento): { titulo, detalleHtml } de cada opción
     * - alElegir(elemento): se llama al seleccionar una opción
     * - alEscribir(): se llama en cada cambio, después de actualizar la lista
     */
    function crearCampoConSugerencias({ input, lista, prefijoId, buscar, describir, alElegir, alEscribir }) {
        let actuales = [];
        let indice = -1;

        function cerrar() {
            lista.hidden = true;
            lista.innerHTML = '';
            input.setAttribute('aria-expanded', 'false');
            input.removeAttribute('aria-activedescendant');
            actuales = [];
            indice = -1;
        }

        function marcar(nuevoIndice) {
            indice = nuevoIndice;
            lista.querySelectorAll('.combo-option').forEach((opcion, i) => {
                const activa = i === indice;
                opcion.classList.toggle('activa', activa);
                opcion.setAttribute('aria-selected', String(activa));
                if (activa) input.setAttribute('aria-activedescendant', opcion.id);
            });
        }

        function elegir(elemento) {
            cerrar();
            alElegir(elemento);
        }

        function mostrar() {
            actuales = buscar(input.value);
            lista.innerHTML = '';
            if (actuales.length === 0) {
                cerrar();
                return;
            }
            actuales.forEach((elemento, i) => {
                const { titulo, detalleHtml } = describir(elemento);
                const opcion = document.createElement('li');
                opcion.className = 'combo-option';
                opcion.id = `${prefijoId}-${i}`;
                opcion.setAttribute('role', 'option');
                opcion.setAttribute('aria-selected', 'false');

                const textoTitulo = document.createElement('span');
                textoTitulo.className = 'combo-option-name';
                textoTitulo.textContent = titulo;
                const detalle = document.createElement('span');
                detalle.className = 'combo-option-meta';
                detalle.innerHTML = detalleHtml;
                opcion.append(textoTitulo, detalle);

                // mousedown (no click) para elegir antes de que el campo pierda el foco
                opcion.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    elegir(elemento);
                });
                lista.appendChild(opcion);
            });
            lista.hidden = false;
            input.setAttribute('aria-expanded', 'true');
            indice = -1;
        }

        input.addEventListener('input', () => {
            mostrar();
            if (alEscribir) alEscribir();
        });

        input.addEventListener('keydown', (e) => {
            if (lista.hidden) return;
            if (e.key === 'ArrowDown') {
                marcar((indice + 1) % actuales.length);
                e.preventDefault();
            } else if (e.key === 'ArrowUp') {
                marcar(indice <= 0 ? actuales.length - 1 : indice - 1);
                e.preventDefault();
            } else if (e.key === 'Enter' && indice >= 0) {
                elegir(actuales[indice]);
                e.preventDefault();
            } else if (e.key === 'Escape') {
                cerrar();
                e.preventDefault();
            }
        });

        input.addEventListener('blur', cerrar);

        return {
            cerrar,
            haySugerencias: () => actuales.length > 0
        };
    }

    // =========================================================================
    // ASIGNATURA: SUGERENCIAS POR NOMBRE O CÓDIGO Y DETECCIÓN DE DUPLICADOS
    // =========================================================================
    const inputNombreCurso = document.getElementById('curso-nombre');
    const inputCodigoCurso = document.getElementById('curso-codigo');
    const avisoDuplicado = document.getElementById('curso-duplicado');
    const textoDuplicado = document.getElementById('curso-duplicado-texto');
    const btnAbrirDuplicado = document.getElementById('curso-duplicado-abrir');
    let cursoDuplicado = null;

    function describirAsignatura(asignatura) {
        const yaInscrito = buscarCursoDuplicado({ codigo: asignatura.codigo }, document.getElementById('curso-id').value);
        return {
            titulo: `${asignatura.codigo} · ${asignatura.nombre}`,
            detalleHtml: `${asignatura.creditos} créditos${yaInscrito ? ' · <strong>Ya está en tus cursos</strong>' : ''}`
        };
    }

    function elegirAsignatura(asignatura) {
        inputCodigoCurso.value = asignatura.codigo;
        inputNombreCurso.value = asignatura.nombre;
        document.getElementById('curso-creditos').value = asignatura.creditos;
        revisarDuplicado();
    }

    // Muestra el aviso si el curso ya existe entre tus asignaturas
    function revisarDuplicado() {
        const idEdicion = document.getElementById('curso-id').value;
        const resultado = buscarCursoDuplicado({ codigo: inputCodigoCurso.value, nombre: inputNombreCurso.value }, idEdicion);
        cursoDuplicado = resultado ? resultado.curso : null;
        if (!resultado) {
            avisoDuplicado.hidden = true;
            avisoDuplicado.classList.remove('bloqueante');
            return null;
        }
        const c = resultado.curso;
        textoDuplicado.textContent = resultado.tipo === 'codigo'
            ? `Ya tienes un curso con el código ${c.codigo}: "${c.nombre}". No se puede registrar dos veces.`
            : `Ya tienes "${c.nombre}"${c.codigo ? ` con el código ${c.codigo}` : ''}. Si es el mismo curso, ábrelo en lugar de crear otro.`;
        avisoDuplicado.classList.toggle('bloqueante', resultado.tipo === 'codigo');
        avisoDuplicado.hidden = false;
        return resultado;
    }

    const sugerenciasNombreCurso = crearCampoConSugerencias({
        input: inputNombreCurso,
        lista: document.getElementById('curso-nombre-sugerencias'),
        prefijoId: 'sugerencia-nombre',
        buscar: texto => normalizarTexto(texto).length >= 2 ? buscarAsignaturas(texto) : [],
        describir: describirAsignatura,
        alElegir: elegirAsignatura,
        alEscribir: revisarDuplicado
    });

    const sugerenciasCodigoCurso = crearCampoConSugerencias({
        input: inputCodigoCurso,
        lista: document.getElementById('curso-codigo-sugerencias'),
        prefijoId: 'sugerencia-codigo',
        buscar: texto => normalizarCodigo(texto) ? buscarAsignaturas(texto) : [],
        describir: describirAsignatura,
        alElegir: elegirAsignatura,
        alEscribir: revisarDuplicado
    });

    btnAbrirDuplicado.addEventListener('click', () => {
        if (!cursoDuplicado) return;
        establecerCursoActivoId(cursoDuplicado.id);
        window.location.href = `simulador.html?id=${encodeURIComponent(cursoDuplicado.id)}`;
    });

    function prepararCamposAsignatura() {
        sugerenciasNombreCurso.cerrar();
        sugerenciasCodigoCurso.cerrar();
        cursoDuplicado = null;
        avisoDuplicado.hidden = true;
        avisoDuplicado.classList.remove('bloqueante');
    }

    // =========================================================================
    // DOCENTE: SUGERENCIAS DEL CATÁLOGO DE DOCENTES
    // =========================================================================
    const inputProfesor = document.getElementById('curso-profesor');
    const inputDocenteId = document.getElementById('curso-docente-id');
    const estadoProfesor = document.getElementById('curso-profesor-estado');

    function textoCursosDocente(docente) {
        const n = contarCursosDeDocente(docente.id);
        return n === 1 ? '1 curso' : `${n} cursos`;
    }

    const sugerenciasDocente = crearCampoConSugerencias({
        input: inputProfesor,
        lista: document.getElementById('curso-profesor-sugerencias'),
        prefijoId: 'sugerencia-docente',
        buscar: buscarDocentes,
        describir: docente => ({
            titulo: docente.nombre,
            detalleHtml: `${docente.calificacion > 0 ? htmlEstrellas(docente.calificacion) + ' · ' : ''}${textoCursosDocente(docente)}`
        }),
        alElegir: docente => {
            inputProfesor.value = docente.nombre;
            inputDocenteId.value = docente.id;
            establecerCalificacionFormulario(docente.calificacion);
            actualizarEstadoProfesor();
        },
        alEscribir: () => {
            // Si lo escrito es exactamente un docente registrado, se vincula solo
            const coincidencia = buscarDocentePorNombre(inputProfesor.value);
            inputDocenteId.value = coincidencia ? coincidencia.id : '';
            if (coincidencia) establecerCalificacionFormulario(coincidencia.calificacion);
            actualizarEstadoProfesor();
        }
    });

    // Mensaje bajo el campo: docente ya registrado o nuevo
    function actualizarEstadoProfesor() {
        const texto = inputProfesor.value.trim();
        const docente = obtenerDocentePorId(inputDocenteId.value);
        if (!texto) {
            estadoProfesor.textContent = '';
        } else if (docente) {
            estadoProfesor.textContent = `✓ Docente registrado · ${textoCursosDocente(docente)}`;
        } else if (sugerenciasDocente.haySugerencias()) {
            estadoProfesor.textContent = 'Elige un docente de la lista o sigue escribiendo para registrar uno nuevo.';
        } else {
            estadoProfesor.textContent = 'Se registrará como nuevo docente.';
        }
    }

    // Prepara el campo docente al abrir el modal (vacío o con el docente del curso)
    function prepararCampoDocente(curso) {
        const docente = curso ? obtenerDocenteDeCurso(curso) : null;
        inputProfesor.value = docente ? docente.nombre : '';
        inputDocenteId.value = docente && docente.id ? docente.id : '';
        establecerCalificacionFormulario(docente ? docente.calificacion : 0);
        sugerenciasDocente.cerrar();
        actualizarEstadoProfesor();
    }

    // Vincula el curso con el docente elegido o escrito (registrándolo si es nuevo)
    function resolverDocenteFormulario() {
        const nombreDocente = inputProfesor.value.trim();
        if (!nombreDocente) return { docenteId: '', profesor: '' };
        const docente = obtenerDocentePorId(inputDocenteId.value) || registrarDocente(nombreDocente);
        if (!docente) return { docenteId: '', profesor: '' };
        calificarDocente(docente.id, inputCalificacion.value);
        return { docenteId: docente.id, profesor: docente.nombre };
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
            const duplicado = revisarDuplicado();
            if (duplicado && duplicado.tipo === 'codigo') {
                inputCodigoCurso.focus();
                return;
            }
            if (duplicado && duplicado.tipo === 'nombre' &&
                !confirm(`Ya tienes "${duplicado.curso.nombre}". ¿Seguro que es un curso distinto y quieres registrarlo?`)) {
                return;
            }

            const { docenteId, profesor } = resolverDocenteFormulario();
            // El catálogo de la universidad identifica al curso por su código
            const asignatura = registrarAsignatura({ codigo, nombre, creditos });
            const asignaturaId = asignatura ? asignatura.id : '';
            // Mismo formato de código que el catálogo (por ejemplo "qui-101" se guarda como "QUI-101")
            const codigoFinal = asignatura ? asignatura.codigo : codigo;
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
                Object.assign(existente, { nombre, codigo: codigoFinal, creditos, notaMeta: meta, asignaturaId, docenteId, profesor });
                // La calificación ahora vive en el catálogo de docentes
                delete existente.calificacionProfesor;
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
                codigo: codigoFinal,
                creditos,
                asignaturaId,
                docenteId,
                profesor,
                comentarios: [],
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
        const fecha = formatearFechaReporte(ahora);
        const perfil = obtenerPerfil();
        const univ = obtenerUniversidad(perfil);
        aplicarColoresUniversidad(univ);
        const metricas = calcularMetricasGlobales(cursos);
        const enCurso = metricas.totalCursos - metricas.cursosAprobados - metricas.cursosEnRiesgo;

        document.getElementById('rep-sem-fecha').textContent = fecha;
        document.getElementById('rep-sem-generado-fecha').textContent = fecha;
        document.getElementById('rep-sem-univ-nombre').textContent = univ.nombre.toUpperCase();
        document.getElementById('rep-sem-codigo').textContent = `CONS-${univ.siglas}-${ahora.getTime().toString().slice(-6)}`;
        document.getElementById('rep-sem-estudiante').textContent = perfil.estudiante || 'No registrado';
        document.getElementById('rep-sem-firma-nombre').textContent = perfil.estudiante;
        document.getElementById('rep-sem-nota-aprobatoria').textContent = univ.notaAprobatoria.toFixed(2);
        document.getElementById('rep-sem-nota-fuente').textContent = `(fijada por ${univ.siglas})`;
        document.getElementById('rep-sem-total-cursos').textContent = metricas.totalCursos;
        document.getElementById('rep-sem-total-creditos').textContent = metricas.creditosTotales;
        document.getElementById('rep-sem-promedio-global').textContent = `${metricas.promedioPonderado} / 20.00`;
        document.getElementById('rep-sem-resumen-estados').textContent =
            `${metricas.cursosAprobados} con meta asegurada • ${metricas.cursosEnRiesgo} en seguimiento • ${enCurso} en curso`;

        const tablaCuerpo = document.getElementById('rep-sem-tabla-cuerpo');
        tablaCuerpo.innerHTML = '';

        cursos.forEach(c => {
            const res = calcularResumenCurso(c);
            const datosDocente = obtenerDocenteDeCurso(c);
            const docente = datosDocente
                ? `${escaparHtml(datosDocente.nombre)}${datosDocente.calificacion > 0 ? `<br>${htmlEstrellas(datosDocente.calificacion)}` : ''}`
                : '<span class="rep-muted">—</span>';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escaparHtml(c.codigo || 'S/C')}</strong></td>
                <td><strong>${escaparHtml(c.nombre)}</strong></td>
                <td class="rep-td-docente">${docente}</td>
                <td style="text-align: center;">${escaparHtml(c.creditos || 3)}</td>
                <td style="text-align: center;">${res.pctEvaluado}% (${res.notasLlenadas}/6)</td>
                <td style="text-align: center; font-weight: 700;">${res.promedioActual.toFixed(2)}</td>
                <td style="text-align: center;">${res.promedioParcial !== null ? res.promedioParcial.toFixed(2) : '—'}</td>
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
                const docentesRespaldo = datos && Array.isArray(datos.docentes) ? datos.docentes : null;
                const asignaturasRespaldo = datos && Array.isArray(datos.asignaturas) ? datos.asignaturas : null;
                const mensaje = `El respaldo contiene ${cursos.length} asignatura(s). ` +
                    `Se reemplazarán las ${cursosActuales.length} asignatura(s) actuales. ¿Deseas continuar?`;
                if (confirm(mensaje)) {
                    restaurarCursos(cursos, docentesRespaldo, asignaturasRespaldo);
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
            // Con sesión iniciada, el perfil también se actualiza en la cuenta
            if (usuarioNube) sincronizarPerfilNube();
        });

        renderizarPerfil();
    }

    // =========================================================================
    // CUENTA: INICIO DE SESIÓN CON ENLACE AL CORREO (nube.js)
    // =========================================================================
    const modalSesion = document.getElementById('modal-sesion');
    const btnSesion = document.getElementById('btn-sesion');
    const textoBtnSesion = document.getElementById('btn-sesion-texto');
    const vistaAcceso = document.getElementById('sesion-vista-acceso');
    const vistaCuenta = document.getElementById('sesion-vista-cuenta');
    const formSesion = document.getElementById('form-sesion');
    const inputCorreo = document.getElementById('sesion-correo');
    const mensajeSesion = document.getElementById('sesion-mensaje');
    const btnEnviarEnlace = document.getElementById('btn-enviar-enlace');
    let usuarioNube = null;
    let escuchandoSesion = false;

    function asegurarEscuchaSesion() {
        if (escuchandoSesion) return;
        escuchandoSesion = true;
        escucharSesionNube(alCambiarSesion);
    }

    function mostrarMensajeSesion(texto, tipo) {
        mensajeSesion.textContent = texto;
        mensajeSesion.className = `sesion-mensaje ${tipo}`;
        mensajeSesion.hidden = !texto;
    }

    // Botón de la barra: "Iniciar sesión" o el correo de la cuenta
    function actualizarVistaSesion(usuario) {
        usuarioNube = usuario;
        if (usuario) {
            const correo = usuario.email || 'Mi cuenta';
            textoBtnSesion.textContent = correo.length > 22 ? `${correo.slice(0, 20)}…` : correo;
            btnSesion.title = `Sesión iniciada como ${correo}`;
            btnSesion.classList.add('activa');
            document.getElementById('sesion-correo-activo').textContent = correo;
        } else {
            textoBtnSesion.textContent = 'Iniciar sesión';
            btnSesion.title = 'Iniciar sesión para participar en lo compartido';
            btnSesion.classList.remove('activa');
        }
        vistaAcceso.hidden = !!usuario;
        vistaCuenta.hidden = !usuario;
    }

    function abrirModalSesion() {
        actualizarVistaSesion(usuarioNube);
        mostrarMensajeSesion('', '');
        const local = !puedeIniciarSesion();
        document.getElementById('sesion-aviso-local').hidden = !local;
        document.getElementById('sesion-enlace-publicado').href = SITIO_PUBLICADO;
        inputCorreo.disabled = local;
        btnEnviarEnlace.disabled = local;
        modalSesion.style.display = 'flex';
        if (!usuarioNube && !local) inputCorreo.focus();
    }

    function cerrarModalSesion() {
        modalSesion.style.display = 'none';
    }

    if (modalSesion && btnSesion) {
        btnSesion.addEventListener('click', abrirModalSesion);
        document.getElementById('btn-cerrar-sesion-modal').addEventListener('click', cerrarModalSesion);
        document.getElementById('btn-cancelar-sesion').addEventListener('click', cerrarModalSesion);
        document.getElementById('btn-listo-sesion').addEventListener('click', cerrarModalSesion);
        modalSesion.addEventListener('click', (e) => {
            if (e.target === modalSesion) cerrarModalSesion();
        });

        formSesion.addEventListener('submit', async (e) => {
            e.preventDefault();
            const correo = inputCorreo.value.trim();
            if (!inputCorreo.checkValidity() || !correo) {
                mostrarMensajeSesion('Escribe un correo válido.', 'error');
                inputCorreo.focus();
                return;
            }
            btnEnviarEnlace.disabled = true;
            btnEnviarEnlace.textContent = 'Enviando…';
            mostrarMensajeSesion('', '');
            try {
                await enviarEnlaceAcceso(correo);
                mostrarMensajeSesion(`Listo. Te enviamos un enlace a ${correo}. Ábrelo en el dispositivo donde quieras usar tu cuenta (revisa también la carpeta de spam).`, 'exito');
                // La sesión se activará al volver desde el enlace: preparar la escucha
                asegurarEscuchaSesion();
            } catch (error) {
                mostrarMensajeSesion(error.message, 'error');
            } finally {
                btnEnviarEnlace.disabled = false;
                btnEnviarEnlace.textContent = 'Enviar enlace';
            }
        });

        document.getElementById('btn-cerrar-sesion').addEventListener('click', async () => {
            await cerrarSesionNube();
            actualizarVistaSesion(null);
            cerrarModalSesion();
        });

        actualizarVistaSesion(null);
    }

    function alCambiarSesion(usuario, evento) {
        actualizarVistaSesion(usuario);
        // Al iniciar sesión se guardan en la cuenta el nombre y la universidad del perfil
        if (usuario && evento === 'SIGNED_IN') sincronizarPerfilNube();
    }

    // Solo se descarga la librería si ya hay sesión o si se vuelve desde el enlace del correo
    if (haySesionPendiente()) {
        asegurarEscuchaSesion();
        obtenerUsuarioNube().then(usuario => actualizarVistaSesion(usuario));
    }

    // Alternar tema oscuro/claro
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    if (btnThemeToggle) {
        btnThemeToggle.addEventListener('click', alternarTema);
    }

    actualizarBotonesTema(obtenerTemaActual());
    actualizarDashboard();
});

