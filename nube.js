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
    try {
        await cargarLibreriaNube();
    } catch (e) {
        console.warn(e.message);
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
