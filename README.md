# Simulador y Gestor Académico de Asignaturas

Plataforma académica diseñada para estudiantes universitarios (adaptada al sistema de fases, continuas y parciales de la UNSA) para gestionar múltiples cursos simultáneamente, calcular promedios ponderados y predecir calificaciones requeridas para aprobar.

## 🚀 Características Principales

### 1. Panel de Control Multicurso (`index.html`)
- **Gestión Integral de Asignaturas:** Crea, edita y elimina cursos de tu semestre.
- **Métricas Globales del Semestre:**
  - Cantidad total de asignaturas matriculadas.
  - Promedio ponderado semestral calculado por créditos.
  - Conteo de asignaturas con meta asegurada y en seguimiento/riesgo.
- **Tarjetas Resumen con Diagnóstico:** Progreso evaluado en barra visual, puntos acumulados, techo máximo y estado predictivo para cada curso.
- **Buscador en Tiempo Real:** Filtra tus asignaturas por nombre o código al instante.

### 2. Simulador Predictivo por Asignatura (`simulador.html`)
- **Modo Inverso ("¿Cuánto necesito para aprobar?"):** Permite ingresar únicamente las notas disponibles y calcula la nota promedio mínima que requieres en las evaluaciones pendientes para alcanzar la nota meta (por defecto 10.5).
- **Diagnóstico y Niveles de Exigencia:** Alertas visuales dinámicas (Meta Asegurada, Accesible, Exigente, Crítico o Matemáticamente Inalcanzable).
- **Análisis de Escenarios Extremos:** Visualiza tu mejor escenario (sacando 20 en lo pendiente) y tu piso mínimo asegurado (sacando 00).
- **Selector Rápido de Asignaturas:** Cambia entre cursos directamente desde el encabezado del simulador sin volver atrás.
- **Auto-guardado en Tiempo Real:** Todos los cambios se sincronizan al instante en `localStorage`.

### 3. Plantillas de Ponderación Rápidas
- **UNSA Típico (30% - 30% - 40%):** Fase 1 (15%/15%), Fase 2 (15%/15%), Fase 3 (20%/20%).
- **Equitativo (~16.7%):** Distribución uniforme entre las 6 evaluaciones.
- **En blanco:** Configuración libre y personalizada de pesos.

---

## 📁 Estructura del Proyecto

```text
Simulador_Notas/
├── index.html        # Dashboard principal de gestión de asignaturas y métricas semestrales
├── simulador.html    # Simulador detallado y calculador predictivo para una asignatura
├── storage.js        # Módulo de persistencia (localStorage), CRUD y lógica de métricas globales
├── cursos.js         # Controlador e interactividad del dashboard principal (index.html)
├── script.js         # Controlador del motor predictivo y simulador individual (simulador.html)
├── styles.css        # Hoja de estilos unificada y diseño formal institucional
└── README.md         # Documentación del proyecto
```
