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
    clienteNube = window.supabase.createClient(NUBE_CONFIG.url, NUBE_CONFIG.clavePublica);
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
