# Base de Datos Notas-AI - Schema Definitivo

## Resumen

Esta base de datos ha sido completamente reseteada y simplificada para la aplicación Notas-AI. Se eliminaron todas las complejidades innecesarias y se mantuvo solo lo esencial.

## Estructura de Tablas

### 1. `users`
Tabla sincronizada con Supabase Auth para información de usuarios.

```sql
- id (uuid, PK) - Referencia a auth.users(id)
- email (text, unique)
- name (text)
- image (text)
- phone_number (text)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### 2. `user_templates`
Plantillas personalizadas creadas por cada usuario.

```sql
- id (uuid, PK)
- name (text) - Nombre de la plantilla
- content (text) - Contenido de la plantilla
- user_id (uuid, FK) - Referencia a users(id)
- is_active (boolean) - Estado activo/inactivo
- created_at (timestamptz)
- updated_at (timestamptz)
```

### 3. `notes`
Notas generadas por los usuarios usando sus plantillas.

```sql
- id (uuid, PK)
- title (text) - Título de la nota
- content (text) - Contenido de la nota
- user_id (uuid, FK) - Referencia a users(id)
- user_template_id (uuid, FK) - Referencia a user_templates(id)
- patient_id (text) - ID del paciente
- patient_name (text) - Nombre del paciente
- diagnosis (text) - Diagnóstico
- treatment (text) - Tratamiento
- is_private (boolean) - Privacidad de la nota
- tags (text[]) - Etiquetas
- created_at (timestamptz)
- updated_at (timestamptz)
```

## Funciones Disponibles

### Para Usuarios
- `ensure_user_exists()` - Asegura que el usuario autenticado existe en la tabla users
- `ensure_current_user_exists()` - RPC para asegurar usuario actual

### Para Plantillas
- `create_user_template(name, content)` - Crea una nueva plantilla de usuario
- `rename_user_template(uuid, new_name)` - Renombra una plantilla existente
- `get_user_templates_with_usage()` - Obtiene plantillas con conteo de uso

## Seguridad

- **Row Level Security (RLS)** habilitado en todas las tablas
- Los usuarios solo pueden ver/editar sus propios datos
- Políticas de seguridad implementadas para todas las operaciones CRUD

## Triggers

- `on_auth_user_created` - Crea automáticamente el registro de usuario cuando se registra en Auth
- `user_templates_updated_at` - Actualiza automáticamente el timestamp de modificación

## Arquitectura Simplificada

**Eliminado:**
- Tabla `specialties` (especialidades médicas)
- Tabla `templates` (plantillas predefinidas)
- Plantillas por defecto automáticas
- Migraciones múltiples
- Archivos temporales

**Mantenido:**
- Solo tablas esenciales
- Funciones necesarias
- Seguridad completa
- Funcionalidad completa para la aplicación

## Aplicación del Schema

Para aplicar este schema a una nueva base de datos:

```bash
psql "postgresql://[CONNECTION_STRING]" -f supabase/schema.sql
```

## Estado Actual

✅ Base de datos completamente reseteada
✅ Schema definitivo aplicado
✅ Tablas creadas: users, user_templates, notes
✅ Funciones implementadas y operativas
✅ Seguridad RLS aplicada
✅ Triggers funcionando
✅ Archivos innecesarios eliminados

La base de datos está lista para usar con la aplicación Notas-AI. 