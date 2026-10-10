# Simulador y Gestor Académico de Asignaturas

Aplicación web para estudiantes universitarios que permite gestionar varios cursos a la vez, calcular promedios ponderados, predecir la nota que se necesita en las evaluaciones pendientes y generar reportes en PDF. Está pensada para el sistema de fases, evaluaciones continuas y exámenes parciales de la UNSA, y se adapta a otras universidades mediante el perfil del estudiante.

Funciona por completo en el navegador: no necesita instalación, servidor ni conexión a internet (salvo para cargar la tipografía). Los datos se guardan en el `localStorage` del navegador.

## 🚀 Cómo usarlo

1. Abre `index.html` en el navegador.
2. Elige tu universidad con **Cambiar perfil** (por defecto es UNSA) y, si quieres, escribe tu nombre para los reportes.
3. Crea tus asignaturas con **Nueva Asignatura** y entra al simulador de cada una con **Simular Notas**.

## ✨ Características

### 1. Perfil del estudiante y universidad
- **Nota aprobatoria fija por universidad:** al elegir la universidad se asigna su nota aprobatoria y no se puede editar (UNSA 10.5, UNI 10, UNMSM, PUCP, UCSM, UNSAAC, UNT, UNALM).
- **Otra universidad:** si la tuya no está en la lista, puedes escribir su nombre, siglas y nota aprobatoria.
- **Colores institucionales:** cada universidad tiene sus colores, que se aplican a la tarjeta de perfil y a los reportes PDF.
- **Nombre del estudiante:** aparece en los reportes y en la línea de firma.

> Las notas aprobatorias y los colores están definidos en el objeto `UNIVERSIDADES` de `storage.js`. Verifícalos con el reglamento de evaluación vigente de cada universidad.

### 2. Panel de asignaturas (`index.html`)
- **Gestión de asignaturas:** crear, editar y eliminar cursos (nombre, código, créditos, docente y meta personal).
- **Docente con calificación:** registra al docente de cada curso y califícalo de 1 a 5 estrellas.
- **Métricas del semestre:** cursos matriculados, acumulado ponderado por créditos, metas aseguradas y cursos en seguimiento.
- **Tarjetas con diagnóstico:** progreso evaluado, puntaje acumulado, promedio parcial, techo máximo y estado de cada curso.
- **Buscador en tiempo real** por nombre o código (el filtro se conserva al editar o eliminar).
- **Respaldo y restauración en JSON:** descarga un archivo con todas tus asignaturas y tu perfil, y restáuralo en otro navegador o computadora.
- **Consolidado semestral en PDF.**

### 3. Simulador por asignatura (`simulador.html`)
- **¿Cuánto necesito para aprobar?:** ingresa solo las notas que ya tienes y el simulador calcula el promedio mínimo que necesitas en las evaluaciones pendientes.
- **Nota aprobatoria y meta personal:** la nota aprobatoria de tu universidad decide si apruebas; la meta personal (opcional, por ejemplo 14) calcula cuánto necesitas para llegar a ella. Si la meta es mayor, también se indica lo mínimo para solo aprobar.
- **Niveles de exigencia:** meta asegurada, exigencia regular, moderada, alta, crítica o fuera de rango.
- **Métricas:** puntaje acumulado, promedio parcial (solo sobre lo evaluado), mejor caso (sacando 20), piso mínimo (sacando 00) y meta.
- **Gráfico de escenarios interactivo:** muestra tu nota final según el promedio que obtengas en lo pendiente, con las líneas de nota aprobatoria y meta. Se puede recorrer con el cursor o con las flechas del teclado, e incluye una tabla de escenarios.
- **Validaciones:** las notas fuera de la escala 0–20 no entran al cálculo.
- **Selector rápido de asignaturas** y **autoguardado** en tiempo real.
- **Ficha de la asignatura en PDF.**

### 4. Reportes PDF
- Se generan con el diálogo de impresión del navegador (**Guardar como PDF**).
- Incluyen el nombre y los colores de la universidad, los datos del estudiante, la nota aprobatoria, la meta, el docente y el diagnóstico.
- La ficha de la asignatura incluye el gráfico de escenarios y cabe en una hoja A4.
- Son **reportes personales, no oficiales**: no sustituyen las actas ni los registros académicos de la universidad.

### 5. Plantillas de ponderación
- **Por fases (30% - 30% - 40%):** Fase 1 (15%/15%), Fase 2 (15%/15%), Fase 3 (20%/20%).
- **Equitativo (~16.7%):** distribución uniforme entre las 6 evaluaciones.
- **En blanco:** pesos libres.

### 6. Modo oscuro e interfaz adaptable
- Modo oscuro de alto confort para estudio nocturno; recuerda tu preferencia y respeta la del sistema.
- Diseño adaptable a celulares desde 320 px de ancho.
- Los reportes siempre se imprimen sobre fondo blanco.

---

## 📁 Estructura del proyecto

```text
Simulador_Notas/
├── index.html        # Panel de asignaturas, perfil del estudiante y consolidado semestral
├── simulador.html    # Simulador predictivo por asignatura y ficha en PDF
├── storage.js        # Datos y lógica compartida: persistencia, catálogo de universidades, perfil,
│                     # motor de cálculo, respaldo JSON y tema oscuro
├── cursos.js         # Controlador del panel: tarjetas, formularios, perfil, respaldo y consolidado
├── script.js         # Controlador del simulador: formulario, resultados, autoguardado y ficha PDF
├── grafico.js        # Gráfico de escenarios (SVG) para el simulador y el PDF
├── styles.css        # Estilos, modo oscuro, diseño adaptable y reglas de impresión
└── README.md         # Documentación del proyecto
```

## 💾 Datos y privacidad

- Todo se guarda **solo en tu navegador** (`localStorage`); nada se envía a ningún servidor.
- Si borras los datos del navegador, se pierden las asignaturas. Usa **Respaldo** periódicamente para tener una copia en archivo.
- Para pasar tus datos a otro dispositivo: **Respaldo** en el original y **Restaurar** en el nuevo.
