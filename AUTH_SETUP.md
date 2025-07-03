# Configuración de Autenticación Google OAuth para Notas-AI

## Instalación de Dependencias

Ejecute el siguiente comando para instalar las dependencias necesarias:

```bash
npm install
```

Las nuevas dependencias incluidas son:
- `@google-cloud/local-auth`: Para autenticación local de Google
- `google-auth-library`: Biblioteca de autenticación de Google
- `jwt-decode`: Para decodificar tokens JWT

## Configuración de Variables de Entorno

1. Asegúrese de que el archivo `.env` existe en la raíz del proyecto
2. El archivo ya contiene la configuración necesaria:

```env
VITE_GOOGLE_CLIENT_ID=256246358105-gbtf6q7g883f74j8f23bkhfthi1b6b22.apps.googleusercontent.com
```

## Características Implementadas

### ✅ Sistema de Autenticación
- **Proveedor**: Google OAuth usando Google Identity Services
- **Contexto de autenticación**: `AuthContext` para manejo global del estado
- **Persistencia**: Sesión guardada en localStorage
- **Protección de rutas**: La aplicación requiere autenticación para acceder

### ✅ Componentes Creados
- `AuthContext`: Contexto para manejo de autenticación
- `LoginButton`: Botón para iniciar sesión con Google
- `UserProfile`: Componente para mostrar perfil del usuario y cerrar sesión
- `LoginPage`: Página completa de inicio de sesión
- `AuthenticatedApp`: Versión autenticada de la aplicación principal

### ✅ Almacenamiento por Usuario
- **Templates**: Cada usuario tiene sus propias plantillas
- **Historial**: Notas históricas separadas por usuario
- **Persistencia**: Datos guardados con prefijo de usuario en localStorage

### ✅ Configuración de Google OAuth
- **Client ID**: Configurado correctamente
- **Dominios permitidos**: `https://notas-ai.onrender.com`
- **Callback URL**: `https://notas-ai.onrender.com/api/auth/callback/google`

## Estructura de Archivos Nuevos

```
Notas-AI/
├── contexts/
│   └── AuthContext.tsx          # Contexto de autenticación
├── components/
│   ├── AuthenticatedApp.tsx     # App principal para usuarios autenticados
│   ├── LoginButton.tsx          # Botón de login con Google
│   ├── LoginPage.tsx           # Página de inicio de sesión
│   └── UserProfile.tsx         # Perfil de usuario y logout
├── .env                        # Variables de entorno
├── .env.example               # Ejemplo de variables de entorno
└── vite-env.d.ts             # Tipos para variables de entorno
```

## Funcionamiento

1. **Inicio**: La aplicación verifica si hay un usuario autenticado
2. **Sin autenticación**: Muestra `LoginPage` con botón de Google
3. **Con autenticación**: Muestra `AuthenticatedApp` con todas las funcionalidades
4. **Datos por usuario**: Templates e historial se guardan específicamente para cada usuario
5. **Logout**: Limpia la sesión pero preserva los datos del usuario

## Testing

Para probar la aplicación:

1. Ejecute `npm run dev`
2. Acceda a la aplicación
3. Verá la página de login
4. Haga clic en "Continuar con Google"
5. Complete el flujo de autenticación
6. La aplicación cargará con sus datos específicos

## Notas de Seguridad

- ✅ Client ID configurado correctamente
- ✅ Dominios autorizados configurados
- ✅ Datos separados por usuario
- ✅ Sesión persistente pero segura
- ✅ Logout completo disponible

## Migración de Datos Existentes

Los datos existentes (templates, historial) permanecerán en localStorage bajo las claves originales. Los nuevos datos autenticados se guardarán con claves específicas del usuario (`notasai_templates_[userId]`, `notasai_history_[userId]`). 