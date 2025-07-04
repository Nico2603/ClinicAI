# 🚀 Guía de Desarrollo - Notas AI

## 📋 Estándares de Código

### **Convenciones de Nomenclatura**
- **PascalCase**: Para componentes, tipos, interfaces (`AuthenticatedApp`, `UserProfile`)
- **camelCase**: Para funciones, variables, métodos (`handleGenerateNote`, `isLoading`)
- **UPPER_CASE**: Para constantes (`DEFAULT_TEMPLATES`, `MEDICAL_SCALES`)
- **kebab-case**: Para archivos y directorios (`note-display.tsx`, `auth-context.tsx`)

### **Estructura de Imports**
```typescript
// React imports
import React, { useState, useEffect } from 'react';

// Types
import { UserProfile, Theme } from '../types';

// Constants
import { DEFAULT_TEMPLATES } from '../lib/constants';

// Hooks
import { useDarkMode } from '../hooks/useDarkMode';

// Services
import { generateNote } from '../lib/services/geminiService';

// Components
import Button from './ui/Button';
```

### **Estructura de Componentes**
```typescript
interface ComponentProps {
  // Props tipadas
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 1. Hooks de estado
  const [state, setState] = useState();
  
  // 2. Hooks de contexto
  const { user } = useAuth();
  
  // 3. Efectos
  useEffect(() => {
    // Lógica de efecto
  }, []);
  
  // 4. Funciones de manejo
  const handleAction = () => {
    // Lógica de acción
  };
  
  // 5. Renderizado
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default Component;
```

## 🔧 Herramientas de Desarrollo

### **Scripts Disponibles**
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construcción para producción
- `npm run start` - Servidor de producción
- `npm run lint` - Análisis de código
- `npm run lint:fix` - Corrección automática
- `npm run format` - Formateo con Prettier
- `npm run format:check` - Verificación de formateo
- `npm run type-check` - Verificación de tipos

### **Configuración del Editor**
- **ESLint**: Análisis de código en tiempo real
- **Prettier**: Formateo automático
- **TypeScript**: Verificación de tipos
- **EditorConfig**: Configuración consistente

## 📁 Arquitectura del Proyecto

### **Directorio src/**
```
src/
├── app/              # Next.js App Router
├── components/       # Componentes reutilizables
│   ├── auth/        # Autenticación
│   ├── notes/       # Funcionalidad de notas
│   ├── ui/          # Componentes UI base
│   └── providers/   # Providers de contexto
├── contexts/        # Contextos React
├── hooks/           # Hooks personalizados
├── lib/             # Librerías y utilidades
│   ├── services/    # Servicios de API
│   ├── constants.ts # Constantes globales
│   ├── supabase.ts  # Cliente Supabase
│   └── utils.ts     # Utilidades
├── types/           # Definiciones de tipos
└── middleware.ts    # Middleware de Next.js
```

### **Servicios**
- **databaseService**: Interacción con Supabase
- **geminiService**: Integración con Google Gemini AI
- **storageService**: Almacenamiento local del usuario

### **Contextos**
- **AuthContext**: Gestión de autenticación
- **ThemeProvider**: Tema oscuro/claro

## 🔄 Flujo de Desarrollo

### **1. Configuración Inicial**
```bash
# Clonar repositorio
git clone <repository-url>

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Iniciar desarrollo
npm run dev
```

### **2. Antes de Commitear**
```bash
# Verificar formato
npm run format:check

# Verificar lint
npm run lint

# Verificar tipos
npm run type-check
```

### **3. Convenciones de Commit**
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bugs
- `docs:` Documentación
- `style:` Formateo, espacios
- `refactor:` Refactorización
- `test:` Pruebas
- `chore:` Tareas de mantenimiento

## 🎯 Mejores Prácticas

### **React/Next.js**
- Usar Server Components cuando sea posible
- Implementar manejo de errores con Error Boundaries
- Optimizar renderizado con React.memo y useMemo
- Usar TypeScript para tipado fuerte

### **Supabase**
- Implementar Row Level Security (RLS)
- Usar transacciones para operaciones complejas
- Optimizar queries con índices apropiados
- Manejar errores de red apropriadamente

### **Styling**
- Usar Tailwind CSS con clases utilitarias
- Implementar tema oscuro/claro
- Mantener consistencia en espaciado y colores
- Usar animaciones sutiles para mejorar UX

### **Performance**
- Implementar lazy loading para componentes pesados
- Usar React Query para caché de datos
- Optimizar imágenes con Next.js Image
- Implementar code splitting apropiado

## 🚦 Testing

### **Tipos de Pruebas**
- **Unit Tests**: Funciones individuales
- **Integration Tests**: Interacción entre componentes
- **E2E Tests**: Flujos completos de usuario

### **Herramientas Recomendadas**
- **Jest**: Framework de testing
- **React Testing Library**: Testing de componentes
- **Cypress**: Testing end-to-end
- **MSW**: Mock de APIs

## 📊 Monitoring y Debugging

### **Herramientas de Desarrollo**
- **React DevTools**: Debug de componentes
- **Redux DevTools**: Debug de estado (si aplica)
- **Next.js DevTools**: Debug de aplicación
- **Browser DevTools**: Performance y network

### **Logging**
- Usar console.error para errores
- Implementar logging estructurado en producción
- Monitorear errores con herramientas como Sentry

## 🔒 Seguridad

### **Mejores Prácticas**
- Nunca exponer claves API en el cliente
- Validar entrada de usuarios
- Usar HTTPS en producción
- Implementar rate limiting
- Sanitizar datos antes de mostrar

### **Autenticación**
- Usar OAuth 2.0 con Google
- Manejar tokens de forma segura
- Implementar logout apropiado
- Verificar permisos en cada request 