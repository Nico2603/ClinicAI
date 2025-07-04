# 🤝 Guía de Contribución - Notas AI

## 📋 Cómo Contribuir

¡Gracias por tu interés en contribuir a Notas AI! Esta guía te ayudará a empezar.

## 🚀 Configuración del Entorno

### **Requisitos Previos**
- Node.js 18+ 
- npm o yarn
- Git
- Cuenta de Supabase (para desarrollo)
- API Key de Google Gemini

### **Configuración Inicial**
```bash
# 1. Fork el repositorio
git clone https://github.com/tu-usuario/notas-ai.git
cd notas-ai

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 4. Iniciar desarrollo
npm run dev
```

## 📝 Proceso de Contribución

### **1. Crear un Issue**
- Describe el problema o mejora
- Incluye pasos para reproducir (si es un bug)
- Sugiere una solución si es posible

### **2. Crear una Rama**
```bash
git checkout -b feature/nombre-de-feature
# o
git checkout -b fix/descripcion-del-fix
```

### **3. Hacer Cambios**
- Sigue las convenciones de código
- Añade tests si es necesario
- Actualiza documentación
- Haz commits descriptivos

### **4. Testing**
```bash
# Verificar formato
npm run format:check

# Verificar lint
npm run lint

# Verificar tipos
npm run type-check

# Ejecutar tests
npm test
```

### **5. Pull Request**
- Título descriptivo
- Descripción detallada de cambios
- Referencia a issues relacionados
- Screenshots si hay cambios visuales

## 🎯 Tipos de Contribución

### **🐛 Reportar Bugs**
- Usa el template de bug report
- Incluye pasos para reproducir
- Especifica el navegador/OS
- Adjunta screenshots si aplica

### **💡 Proponer Features**
- Usa el template de feature request
- Explica el caso de uso
- Considera la implementación
- Discute alternativas

### **📚 Documentación**
- Mejora README y docs
- Corrige errores tipográficos
- Añade ejemplos de uso
- Traduce contenido

### **🎨 Mejoras de UI/UX**
- Sigue las guías de diseño
- Mantén consistencia visual
- Considera accesibilidad
- Testa en diferentes dispositivos

## 📏 Estándares de Código

### **Convenciones de Nomenclatura**
- Componentes: `PascalCase`
- Archivos: `kebab-case`
- Variables/Funciones: `camelCase`
- Constantes: `UPPER_CASE`

### **Estructura de Archivos**
```
src/
├── components/
│   ├── feature-name/
│   │   ├── ComponentName.tsx
│   │   ├── ComponentName.test.tsx
│   │   └── index.ts
│   └── ui/
├── hooks/
│   ├── useFeatureName.ts
│   └── useFeatureName.test.ts
└── lib/
    ├── feature-name/
    │   ├── service.ts
    │   └── service.test.ts
    └── utils.ts
```

### **Convenciones de Commit**
```
tipo(scope): descripción

feat(auth): añadir login con Google
fix(notes): corregir guardado de plantillas
docs(readme): actualizar instrucciones
style(ui): mejorar espaciado en botones
refactor(hooks): simplificar useDatabase
test(components): añadir tests para NoteDisplay
chore(deps): actualizar dependencias
```

## 🔍 Revisión de Código

### **Checklist para Reviewers**
- [ ] Código sigue las convenciones
- [ ] Tests pasan correctamente
- [ ] No hay console.log o código debug
- [ ] Performance es aceptable
- [ ] Accesibilidad considerada
- [ ] Documentación actualizada

### **Checklist para Contributors**
- [ ] Código formateado con Prettier
- [ ] ESLint sin errores
- [ ] TypeScript sin errores
- [ ] Tests incluidos para nuevas features
- [ ] Documentación actualizada
- [ ] Screenshots para cambios visuales

## 🎨 Guías de Diseño

### **Colores**
- Usa variables CSS para colores
- Mantén consistencia con el tema
- Considera modo oscuro/claro
- Asegura contraste apropiado

### **Tipografía**
- Usa clases Tailwind predefinidas
- Jerarquía visual clara
- Tamaños responsivos
- Legibilidad en todos los dispositivos

### **Spacing**
- Usa sistema de spacing de Tailwind
- Consistencia en márgenes/padding
- Ritmo vertical apropiado
- Responsive design

## 🧪 Testing

### **Tipos de Tests**
- **Unit**: Funciones individuales
- **Integration**: Interacción entre componentes
- **E2E**: Flujos completos de usuario

### **Convenciones de Testing**
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test implementation
  });
  
  it('should handle user interaction', () => {
    // Test implementation
  });
});
```

## 📚 Recursos

### **Tecnologías Utilizadas**
- [Next.js](https://nextjs.org/) - Framework React
- [TypeScript](https://www.typescriptlang.org/) - Tipado estático
- [Tailwind CSS](https://tailwindcss.com/) - Estilos
- [Supabase](https://supabase.com/) - Base de datos
- [Google Gemini](https://ai.google.dev/) - AI/ML

### **Herramientas de Desarrollo**
- [ESLint](https://eslint.org/) - Análisis de código
- [Prettier](https://prettier.io/) - Formateo
- [React DevTools](https://react.dev/tools) - Debug
- [VS Code](https://code.visualstudio.com/) - Editor recomendado

## 🆘 Ayuda y Soporte

### **Dónde Obtener Ayuda**
- Crear un issue en GitHub
- Revisar documentación existente
- Buscar en issues cerrados
- Contactar mantenedores

### **Comunicación**
- Sé respetuoso y constructivo
- Proporciona contexto necesario
- Usa español o inglés
- Responde en tiempo razonable

## 🏆 Reconocimientos

Todos los contribuidores serán reconocidos en:
- README del proyecto
- Página de contributors
- Releases notes
- Documentación del proyecto

¡Gracias por contribuir a Notas AI! 🎉 