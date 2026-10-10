# Simulador y Gestor Académico de Asignaturas

Plataforma académica diseñada para estudiantes universitarios (adaptada al sistema de fases, continuas y exámenes parciales de la UNSA) para gestionar múltiples cursos simultáneamente, calcular promedios ponderados, predecir calificaciones requeridas para aprobar y generar reportes impresos o en PDF.

## 🚀 Características Principales

### 1. Panel de Control Multicurso (`index.html`)
- **Gestión Integral de Asignaturas:** Crea, edita y elimina cursos de tu semestre académico.
- **Métricas Globales del Semestre:**
  - Total de asignaturas matriculadas.
  - Promedio ponderado semestral calculado por créditos curriculares.
  - Conteo de asignaturas con meta asegurada y en seguimiento académico.
- **Consolidado Semestral en PDF:** Genera un reporte imprimible con el consolidado curricular de todos los cursos y el estado semestral proyectado.
- **Tarjetas Resumen con Diagnóstico:** Progreso evaluado en barra visual, puntos acumulados, techo máximo y estado predictivo para cada curso.
- **Buscador en Tiempo Real:** Filtra tus asignaturas por nombre o código al instante.

### 2. Simulador Predictivo por Asignatura (`simulador.html`)
- **Modo Inverso ("¿Cuánto necesito para aprobar?"):** Permite ingresar únicamente las notas disponibles y calcula la calificación promedio mínima que requieres en las evaluaciones pendientes para alcanzar la nota meta (por defecto 10.5).
- **Diagnóstico y Niveles de Exigencia:** Dictamen académico normativo (Meta asegurada, Exigencia regular, moderada, alta, crítica o fuera de rango).
- **Análisis de Escenarios Extremos:** Visualiza tu mejor escenario (sacando 20 en lo pendiente) y tu piso mínimo garantizado (sacando 00).
- **Reporte Oficial de Asignatura en PDF:** Emite una ficha técnica formal con membrete institucional de la UNSA, desglose de fases/continuas y dictamen proyectado listo para imprimir o guardar en PDF.
- **Selector Rápido de Asignaturas:** Cambia entre cursos directamente desde el encabezado del simulador sin salir de la página.
- **Auto-guardado en Tiempo Real:** Todos los cambios se sincronizan al instante en `localStorage`.

### 3. Modo Oscuro Institucional de Alto Confort
- **Diseñado para Estudio Nocturno:** Paleta azul noche (`#0a131e` / `#101c2b`) de contraste suave que reduce la fatiga visual.
- **Sincronización Total:** Se conserva la preferencia en `localStorage`, detecta automáticamente el modo del sistema y previene destellos de luz al cambiar de página.
- **Impresión Siempre Limpia:** Al exportar a PDF o imprimir, se formatea automáticamente sobre fondo blanco puro con tinta negra y azul institucional mediante `@media print`.

### 4. Plantillas de Ponderación Rápidas
- **UNSA Típico (30% - 30% - 40%):** Fase 1 (15%/15%), Fase 2 (15%/15%), Fase 3 (20%/20%).
- **Equitativo (~16.7%):** Distribución uniforme entre las 6 evaluaciones.
- **En blanco:** Configuración libre y personalizada de pesos.

---

## 📁 Estructura del Proyecto

```text
Simulador_Notas/
├── index.html        # Dashboard principal de gestión de asignaturas, métricas y consolidado semestral
├── simulador.html    # Simulador detallado, calculador predictivo y ficha oficial en PDF
├── storage.js        # Módulo de persistencia (localStorage), gestión de tema oscuro y métricas globales
├── cursos.js         # Controlador e interactividad del dashboard principal y reporte semestral
├── script.js         # Controlador del motor predictivo, auto-guardado y reporte de asignatura en PDF
├── styles.css        # Sistema de diseño institucional, modo oscuro y reglas de impresión @media print
└── README.md         # Documentación del proyecto
```
