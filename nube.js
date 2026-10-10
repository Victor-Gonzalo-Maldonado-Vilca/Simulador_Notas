// ==========================================================================
// NUBE.JS - CONEXIÓN CON SUPABASE (datos compartidos entre estudiantes)
// La app funciona sin esto: la librería solo se descarga cuando se necesita la nube,
// así el simulador sigue funcionando sin internet.
// ==========================================================================

// Configuración pública del proyecto. La clave "publishable" está pensada para ir en
// el navegador: la seguridad la dan las políticas RLS de supabase/schema.sql.
// Nunca pongas aquí la contraseña de la base de datos ni la "secret key".
const NUBE_CONFIG = {
    url: 'https://rjlffpotrtvscywqyxaj.supabase.co',
    clavePublica: 'sb_publishable_DijCKUgfOJyw6QxcPDW4tw_7f-kVYqQ',
    libreria: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.1/dist/umd/supabase.js'
};

let clienteNube = null;
let cargaLibreriaNube = null;
let promesaClienteNube = null;

/**
 * Descarga la librería de Supabase una sola vez (devuelve una promesa).
 */
function cargarLibreriaNube() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    if (cargaLibreriaNube) return cargaLibreriaNube;
    cargaLibreriaNube = new Promise((resolver, rechazar) => {
        const script = document.createElement('script');
        script.src = NUBE_CONFIG.libreria;
        script.async = true;
        script.onload = () => resolver();
        script.onerror = () => {
            cargaLibreriaNube = null; // permitir reintentar cuando vuelva la conexión
            rechazar(new Error('No se pudo cargar la conexión con la nube. Revisa tu internet.'));
        };
        document.head.appendChild(script);
    });
    return cargaLibreriaNube;
}

/**
 * Cliente de Supabase listo para usar (null si no hay internet).
 */
async function obtenerClienteNube() {
    if (clienteNube) return clienteNube;
    // Una sola creación aunque varias partes de la página lo pidan a la vez
    if (!promesaClienteNube) promesaClienteNube = crearClienteNube();
    return promesaClienteNube;
}

async function crearClienteNube() {
    try {
        await cargarLibreriaNube();
    } catch (e) {
        console.warn(e.message);
        promesaClienteNube = null; // reintentar cuando vuelva la conexión
        return null;
    }
    clienteNube = window.supabase.createClient(NUBE_CONFIG.url, NUBE_CONFIG.clavePublica, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            // "implicit" permite abrir el enlace del correo en otro navegador o dispositivo
            flowType: 'implicit'
        }
    });
    return clienteNube;
}

/**
 * Comprueba que la base de datos responde y que el esquema está instalado.
 * Uso desde la consola del navegador: await probarConexionNube()
 */
async function probarConexionNube() {
    const cliente = await obtenerClienteNube();
    if (!cliente) return { ok: false, motivo: 'Sin conexión a internet.' };
    const { data, error } = await cliente.from('universidades').select('id, siglas').order('id');
    if (error) return { ok: false, motivo: error.message };
    return { ok: true, universidades: data.map(u => u.siglas) };
}

// ==========================================================================
// SESIÓN (enlace de acceso por correo, sin contraseña)
// ==========================================================================

// Dirección publicada: el enlace del correo solo puede volver a direcciones registradas en Supabase
const SITIO_PUBLICADO = 'https://victor-gonzalo-maldonado-vilca.github.io/Simulador_Notas/';

// Nombre con el que supabase-js guarda la sesión en localStorage
function claveSesionNube() {
    return `sb-${new URL(NUBE_CONFIG.url).hostname.split('.')[0]}-auth-token`;
}

/**
 * Hay que cargar la nube al abrir la página si ya hay una sesión guardada o si se vuelve
 * desde el enlace del correo; si no, la librería no se descarga (la app sigue funcionando sin internet).
 */
function haySesionPendiente() {
    try {
        if (localStorage.getItem(claveSesionNube())) return true;
    } catch (e) { /* almacenamiento bloqueado */ }
    return /access_token=|error_description=/.test(window.location.hash);
}

/**
 * El enlace del correo necesita volver a una dirección web (no funciona con el archivo abierto localmente).
 */
function puedeIniciarSesion() {
    const { protocol, hostname } = window.location;
    return protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1';
}

// Carpeta de la página actual (por ejemplo .../Simulador_Notas/), a donde vuelve el enlace
function urlRetornoSesion() {
    return window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
}

function traducirErrorNube(error) {
    const mensaje = (error && error.message) || '';
    if (/rate limit|too many|security purposes|seconds/i.test(mensaje)) {
        return 'Se enviaron demasiados correos seguidos. Espera unos minutos e inténtalo de nuevo.';
    }
    if (/not authorized|not allowed|signups not allowed/i.test(mensaje)) {
        return 'Este correo todavía no está autorizado para recibir enlaces de acceso.';
    }
    if (/invalid.*email|email.*invalid/i.test(mensaje)) {
        return 'El correo no es válido.';
    }
    return mensaje || 'No se pudo completar la operación. Inténtalo de nuevo.';
}

async function clienteNubeObligatorio() {
    const cliente = await obtenerClienteNube();
    if (!cliente) throw new Error('Sin conexión a internet.');
    return cliente;
}

/**
 * Envía el enlace de acceso. Si es la primera vez, Supabase crea la cuenta.
 */
async function enviarEnlaceAcceso(correo) {
    const cliente = await clienteNubeObligatorio();
    const { error } = await cliente.auth.signInWithOtp({
        email: correo,
        options: { emailRedirectTo: urlRetornoSesion(), shouldCreateUser: true }
    });
    if (error) throw new Error(traducirErrorNube(error));
}

async function obtenerUsuarioNube() {
    const cliente = await obtenerClienteNube();
    if (!cliente) return null;
    const { data } = await cliente.auth.getSession();
    return data.session ? data.session.user : null;
}

async function cerrarSesionNube() {
    const cliente = await obtenerClienteNube();
    if (cliente) await cliente.auth.signOut();
}

/**
 * Avisa cada vez que se inicia o cierra sesión: callback(usuario | null).
 */
async function escucharSesionNube(callback) {
    const cliente = await obtenerClienteNube();
    if (!cliente) return;
    cliente.auth.onAuthStateChange((evento, sesion) => {
        // Fuera del callback de Supabase, como recomienda su documentación
        setTimeout(() => callback(sesion ? sesion.user : null, evento), 0);
    });
}

/**
 * Copia a la nube el nombre y la universidad del perfil local (no incluye notas).
 */
async function sincronizarPerfilNube() {
    const cliente = await obtenerClienteNube();
    const usuario = await obtenerUsuarioNube();
    if (!cliente || !usuario) return;
    const perfil = obtenerPerfil();
    const cambios = { nombre: perfil.estudiante || null };
    // "Otra universidad" no existe en la base compartida
    if (perfil.universidadId !== 'otra') cambios.universidad_id = perfil.universidadId;
    const { error } = await cliente.from('perfiles').update(cambios).eq('id', usuario.id);
    if (error) console.warn('No se pudo sincronizar el perfil:', error.message);
}

// ==========================================================================
// DATOS PERSONALES POR CUENTA (cursos, notas, perfil y catálogos propios)
//
// - Sin sesión ("invitado"): los datos viven solo en este navegador, como siempre.
// - Al iniciar sesión: los datos de invitado se apartan y se cargan los de la cuenta.
// - Con sesión: cada cambio se sube a la tabla privada datos_usuario.
// - Al cerrar sesión: se sube lo pendiente, se borran los datos de la cuenta de este
//   navegador y vuelven los de invitado.
// ==========================================================================
const CLAVES_DATOS_PERSONALES = [STORAGE_KEY, DOCENTES_KEY, ASIGNATURAS_KEY, PERFIL_KEY, ACTIVE_COURSE_KEY];
const SUFIJO_INVITADO = '__invitado';
const CUENTA_ACTIVA_KEY = 'unsa_simulador_cuenta_activa';     // id de la cuenta cuyos datos están cargados
const ACTUALIZADO_KEY = 'unsa_simulador_actualizado';         // último cambio local (ms)
const SINCRONIZADO_KEY = 'unsa_simulador_sincronizado';       // versión que coincide con la nube (ms)
const ESPERA_SUBIDA_MS = 1500;

let temporizadorSubida = null;
let preparandoCuenta = false;

function leerClave(clave) {
    try { return localStorage.getItem(clave); } catch (e) { return null; }
}

function escribirClave(clave, valor) {
    try {
        if (valor === null || valor === undefined) localStorage.removeItem(clave);
        else localStorage.setItem(clave, String(valor));
    } catch (e) { /* almacenamiento lleno o bloqueado */ }
}

function leerJSON(clave, porDefecto) {
    try {
        const valor = JSON.parse(leerClave(clave));
        return valor === null ? porDefecto : valor;
    } catch (e) {
        return porDefecto;
    }
}

function cuentaActivaId() {
    return leerClave(CUENTA_ACTIVA_KEY);
}

// Aparta los datos de invitado para recuperarlos al cerrar sesión
function apartarDatosInvitado() {
    CLAVES_DATOS_PERSONALES.forEach(clave => escribirClave(clave + SUFIJO_INVITADO, leerClave(clave)));
}

function restaurarDatosInvitado() {
    CLAVES_DATOS_PERSONALES.forEach(clave => {
        escribirClave(clave, leerClave(clave + SUFIJO_INVITADO));
        escribirClave(clave + SUFIJO_INVITADO, null);
    });
}

function limpiarDatosActivos() {
    CLAVES_DATOS_PERSONALES.forEach(clave => escribirClave(clave, null));
}

/**
 * Documento que se guarda en la nube (no incluye el tema ni la sesión).
 */
function exportarDatosPersonales() {
    return {
        version: 1,
        perfil: obtenerPerfil(),
        cursos: leerJSON(STORAGE_KEY, []),
        docentes: obtenerDocentes(),
        asignaturas: obtenerAsignaturas()
    };
}

/**
 * Carga un documento de la nube en este navegador (sin volver a subirlo).
 */
function aplicarDatosPersonales(datos) {
    const d = datos && typeof datos === 'object' ? datos : {};
    let cursos = [];
    if (Array.isArray(d.cursos) && d.cursos.length > 0) {
        try { cursos = validarRespaldo(d.cursos); } catch (e) { cursos = []; }
    }
    // '[]' explícito: una cuenta sin cursos no debe mostrar los cursos de ejemplo
    escribirClave(STORAGE_KEY, JSON.stringify(cursos));
    escribirClave(DOCENTES_KEY, JSON.stringify(validarDocentes(d.docentes)));
    escribirClave(ASIGNATURAS_KEY, JSON.stringify(validarAsignaturas(d.asignaturas)));
    escribirClave(PERFIL_KEY, JSON.stringify(normalizarPerfil(d.perfil)));
    escribirClave(ACTIVE_COURSE_KEY, null);
    aplicarColoresUniversidad();
}

async function descargarDatosNube(usuario) {
    const cliente = await clienteNubeObligatorio();
    const { data, error } = await cliente
        .from('datos_usuario')
        .select('datos, actualizado_en')
        .eq('usuario_id', usuario.id)
        .maybeSingle();
    if (error) throw new Error(traducirErrorNube(error));
    return data;
}

/**
 * Sube los datos locales a la cuenta activa (si la sesión sigue siendo de esa cuenta).
 */
async function subirDatosNube() {
    clearTimeout(temporizadorSubida);
    temporizadorSubida = null;
    const cuenta = cuentaActivaId();
    if (!cuenta) return false;
    const cliente = await obtenerClienteNube();
    const usuario = await obtenerUsuarioNube();
    if (!cliente || !usuario || usuario.id !== cuenta) return false;

    const actualizado = Number(leerClave(ACTUALIZADO_KEY)) || Date.now();
    const { error } = await cliente.from('datos_usuario').upsert({
        usuario_id: usuario.id,
        datos: exportarDatosPersonales(),
        actualizado_en: new Date(actualizado).toISOString()
    });
    if (error) {
        console.warn('No se pudieron guardar los datos en la cuenta:', error.message);
        return false;
    }
    escribirClave(SINCRONIZADO_KEY, actualizado);
    return true;
}

/**
 * storage.js llama a esta función en cada cambio de datos personales.
 */
function alCambiarDatosLocales() {
    escribirClave(ACTUALIZADO_KEY, Date.now());
    if (!cuentaActivaId()) return;
    clearTimeout(temporizadorSubida);
    temporizadorSubida = setTimeout(subirDatosNube, ESPERA_SUBIDA_MS);
}

// Si en otra pestaña se inicia o cierra sesión, esta recarga para no mezclar los datos
// de la cuenta con los de invitado
window.addEventListener('storage', (e) => {
    if (e.key === CUENTA_ACTIVA_KEY) window.location.reload();
});

// Si se cierra o cambia de pestaña con cambios pendientes, subirlos en ese momento
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && temporizadorSubida) subirDatosNube();
});

/**
 * Agrega a la cuenta los cursos de invitado que no estén ya (mismo id o mismo código).
 * Los docentes se registran en el catálogo de la cuenta para no duplicarlos.
 */
function fusionarCursosInvitado(cursosInvitado) {
    const docentesInvitado = leerJSON(DOCENTES_KEY + SUFIJO_INVITADO, []);
    const cursos = leerJSON(STORAGE_KEY, []);
    const ids = new Set(cursos.map(c => c.id));
    const codigos = new Set(cursos.map(c => normalizarCodigo(c.codigo)).filter(Boolean));
    let agregados = 0;

    cursosInvitado.forEach(curso => {
        const codigo = normalizarCodigo(curso.codigo);
        if (ids.has(curso.id) || (codigo && codigos.has(codigo))) return;
        const copia = { ...curso };
        const docenteInvitado = docentesInvitado.find(d => d.id === curso.docenteId);
        const nombreDocente = docenteInvitado ? docenteInvitado.nombre : curso.profesor;
        if (nombreDocente) {
            const docente = registrarDocente(nombreDocente);
            if (docente) {
                if (docenteInvitado && docenteInvitado.calificacion && !docente.calificacion) {
                    calificarDocente(docente.id, docenteInvitado.calificacion);
                }
                copia.docenteId = docente.id;
                copia.profesor = docente.nombre;
            }
        }
        delete copia.asignaturaId; // se vuelve a vincular con el catálogo de la cuenta
        cursos.push(copia);
        ids.add(copia.id);
        if (codigo) codigos.add(codigo);
        agregados++;
    });

    guardarTodosLosCursos(cursos);
    migrarAsignaturas();
    return agregados;
}

function cursosPropiosDeInvitado() {
    return leerJSON(STORAGE_KEY + SUFIJO_INVITADO, [])
        .filter(c => c && !String(c.id).startsWith('curso_demo_'));
}

/**
 * Deja cargados en este navegador los datos de la cuenta. Devuelve true si cambiaron
 * (la página debe recargarse para mostrarlos).
 */
async function prepararDatosDeCuenta(usuario, { preguntar = false } = {}) {
    if (preparandoCuenta) return false;
    preparandoCuenta = true;
    try {
        const cuenta = cuentaActivaId();

        // Misma cuenta de antes: traer cambios hechos en otro dispositivo o subir los locales
        if (cuenta === usuario.id) {
            const remoto = await descargarDatosNube(usuario);
            const local = Number(leerClave(ACTUALIZADO_KEY)) || 0;
            const sincronizado = Number(leerClave(SINCRONIZADO_KEY)) || 0;
            if (remoto) {
                const fechaRemota = Date.parse(remoto.actualizado_en);
                if (fechaRemota > sincronizado && local <= sincronizado) {
                    aplicarDatosPersonales(remoto.datos);
                    escribirClave(ACTUALIZADO_KEY, fechaRemota);
                    escribirClave(SINCRONIZADO_KEY, fechaRemota);
                    return true;
                }
            }
            if (!remoto || local > sincronizado) await subirDatosNube();
            return false;
        }

        // Primero se descarga (si falla, el navegador queda como estaba)
        const remoto = await descargarDatosNube(usuario);

        // Datos de otra cuenta que no cerró sesión: ya están en su nube, se quitan de aquí.
        // Si no había cuenta, los datos actuales son de invitado y se apartan.
        if (cuenta) limpiarDatosActivos();
        else apartarDatosInvitado();
        const propios = cursosPropiosDeInvitado();

        if (remoto) {
            aplicarDatosPersonales(remoto.datos);
            const fechaRemota = Date.parse(remoto.actualizado_en);
            escribirClave(ACTUALIZADO_KEY, fechaRemota);
            escribirClave(SINCRONIZADO_KEY, fechaRemota);
            // Se marca la cuenta al final: otras pestañas recargan al ver este cambio
            escribirClave(CUENTA_ACTIVA_KEY, usuario.id);
            const enCuenta = leerJSON(STORAGE_KEY, []).length;
            if (propios.length > 0 && preguntar && confirm(
                `Tu cuenta ya tiene ${enCuenta} curso(s).\n¿Agregar también los ${propios.length} curso(s) que tenías en este navegador?\n(Los que tengan el mismo código no se duplican.)`)) {
                fusionarCursosInvitado(propios);
                await subirDatosNube();
            }
        } else {
            // Cuenta nueva: empezar con el perfil de invitado y, si se acepta, con sus cursos
            const importar = propios.length > 0 && preguntar && confirm(
                `¿Guardar en tu cuenta los ${propios.length} curso(s) que tienes en este navegador?\n` +
                'Si eliges "Cancelar", tu cuenta empezará sin cursos (los de este navegador no se pierden).');
            CLAVES_DATOS_PERSONALES.forEach(clave => escribirClave(clave, leerClave(clave + SUFIJO_INVITADO)));
            if (!importar) {
                escribirClave(STORAGE_KEY, '[]');
                escribirClave(ACTIVE_COURSE_KEY, null);
            } else {
                // Los cursos pasan a la cuenta: no quedan visibles para quien use este navegador sin sesión
                escribirClave(STORAGE_KEY + SUFIJO_INVITADO, '[]');
            }
            escribirClave(ACTUALIZADO_KEY, Date.now());
            escribirClave(CUENTA_ACTIVA_KEY, usuario.id);
            await subirDatosNube();
        }
        return true;
    } finally {
        preparandoCuenta = false;
    }
}

/**
 * Cierra sesión sin perder cambios: sube lo pendiente, quita los datos de la cuenta
 * de este navegador y recupera los de invitado.
 */
async function cerrarSesionYLimpiar() {
    await subirDatosNube();
    await cerrarSesionNube();
    salirDeCuentaLocal();
}

function salirDeCuentaLocal() {
    limpiarDatosActivos();
    restaurarDatosInvitado();
    [CUENTA_ACTIVA_KEY, ACTUALIZADO_KEY, SINCRONIZADO_KEY].forEach(clave => escribirClave(clave, null));
}

/**
 * Se llama al abrir cada página: deja listos los datos de la cuenta (o de invitado si la
 * sesión ya no es válida). Devuelve true si la página debe recargarse.
 */
async function iniciarSincronizacionNube({ preguntar = false } = {}) {
    if (!haySesionPendiente() && !cuentaActivaId()) return false;
    const cliente = await obtenerClienteNube();
    if (!cliente) return false; // sin internet: se sigue usando la copia local de la cuenta
    const usuario = await obtenerUsuarioNube();
    if (!usuario) {
        if (cuentaActivaId()) {
            salirDeCuentaLocal(); // la sesión venció: no dejar visibles los datos de la cuenta
            return true;
        }
        return false;
    }
    try {
        return await prepararDatosDeCuenta(usuario, { preguntar });
    } catch (e) {
        console.warn('No se pudo sincronizar con la cuenta:', e.message);
        return false;
    }
}
