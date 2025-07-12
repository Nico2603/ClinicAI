# Instrucciones para Limpiar la Base de Datos

## Problema Identificado

La aplicación tenía problemas con:
1. Carga infinita al cambiar plantillas
2. Plantillas no se guardaban correctamente
3. Generación de notas usaba plantillas predefinidas en lugar de las personalizadas
4. El prompt de OpenAI incluía datos de ejemplo en lugar de usar solo el formato

## Solución Implementada

### 1. Limpieza de Base de Datos

**IMPORTANTE: Ejecutar este script SQL en la consola SQL de Supabase**

```sql
-- Script para limpiar la base de datos y solucionar problemas con plantillas
-- Ejecutar este script en la consola SQL de Supabase

-- 1. Limpiar todas las plantillas predefinidas (no personalizadas)
DELETE FROM public.templates;

-- 2. Limpiar todas las especialidades predefinidas (no las necesitamos)
DELETE FROM public.specialties;

-- 3. Actualizar notas existentes para usar solo user_template_id
UPDATE public.notes 
SET template_id = NULL, specialty_id = NULL 
WHERE template_id IS NOT NULL OR specialty_id IS NOT NULL;

-- 4. Limpiar cualquier referencia a especialidades en notas
ALTER TABLE public.notes 
DROP CONSTRAINT IF EXISTS notes_specialty_id_fkey;

ALTER TABLE public.notes 
DROP CONSTRAINT IF EXISTS notes_template_id_fkey;

-- 5. Asegurar que todas las plantillas de usuario están activas
UPDATE public.user_templates 
SET is_active = true 
WHERE is_active = false;

-- 6. Crear índices optimizados para rendimiento
CREATE INDEX IF NOT EXISTS idx_user_templates_user_id_active ON public.user_templates(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_notes_user_template_id ON public.notes(user_template_id);

-- 7. Verificar datos después de la limpieza
SELECT 'Plantillas predefinidas eliminadas' as status, COUNT(*) as count FROM public.templates;
SELECT 'Especialidades eliminadas' as status, COUNT(*) as count FROM public.specialties;
SELECT 'Plantillas de usuario activas' as status, COUNT(*) as count FROM public.user_templates WHERE is_active = true;
SELECT 'Notas con plantillas personalizadas' as status, COUNT(*) as count FROM public.notes WHERE user_template_id IS NOT NULL;
```

### 2. Pasos para Ejecutar

1. **Ir a Supabase Dashboard**
   - Abrir https://app.supabase.com
   - Seleccionar tu proyecto

2. **Abrir SQL Editor**
   - Ir a "SQL Editor" en el menú lateral
   - Hacer clic en "New query"

3. **Ejecutar Script de Limpieza**
   - Copiar todo el contenido del archivo `database-cleanup.sql`
   - Pegarlo en el editor SQL
   - Hacer clic en "Run" para ejecutar

4. **Verificar Resultados**
   - El script mostrará mensajes de confirmación
   - Verificar que las plantillas predefinidas fueron eliminadas
   - Confirmar que las plantillas personalizadas están activas

### 3. Cambios Realizados en el Código

- **Prompt OpenAI mejorado**: Ahora usa SOLO el formato de la plantilla, nunca los datos de ejemplo
- **Guardado de notas corregido**: Ahora guarda correctamente con `user_template_id`
- **Plantillas simplificadas**: Eliminados ejemplos específicos, solo formato genérico
- **Especialidades eliminadas**: Sistema simplificado sin especialidades predefinidas

### 4. Funcionamiento Nuevo

1. **Crear Plantilla**: El usuario crea una plantilla con su formato deseado
2. **Uso como Formato**: La IA usa la plantilla como estructura/formato únicamente
3. **Datos del Paciente**: Solo se usan los datos reales ingresados por el usuario
4. **Guardado Correcto**: Las notas se guardan con referencia a la plantilla personalizada

### 5. Verificación

Después de ejecutar el script, verificar:
- [ ] Las plantillas se crean correctamente
- [ ] Las plantillas se guardan sin mostrar "cargando infinitamente"
- [ ] Al generar notas, se usa la plantilla personalizada seleccionada
- [ ] El formato se respeta pero no se copian datos de ejemplo

### 6. Importante

- **Solo usar plantillas personalizadas**: Ya no hay plantillas predefinidas
- **El formato es sagrado**: La IA respeta exactamente el formato de la plantilla
- **No datos de ejemplo**: La IA nunca usa datos ficticios de la plantilla
- **Formato vs. Datos**: La plantilla es estructura, los datos vienen del usuario

## Notas Técnicas

- Se mantuvieron las columnas `specialty_id` y `template_id` por compatibilidad
- Se agregó `user_template_id` para las plantillas personalizadas
- Se optimizaron los índices para mejor rendimiento
- Se limpiaron las constantes innecesarias

## Soporte

Si hay problemas después de la limpieza:
1. Verificar que el script se ejecutó completamente
2. Revisar la consola del navegador para errores
3. Probar crear una nueva plantilla personalizada
4. Verificar que la generación de notas funciona correctamente 