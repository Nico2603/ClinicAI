# 🏥 Notas-AI | Asistente Inteligente de Notas Clínicas

<div align="center">

**Una aplicación web moderna y potente para la generación automatizada de notas médicas con Inteligencia Artificial**

[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![NextAuth](https://img.shields.io/badge/NextAuth-4.24.11-7C3AED?style=for-the-badge&logo=next-auth)](https://next-auth.js.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.7.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![OpenAI GPT](https://img.shields.io/badge/OpenAI-GPT--4o--mini-00A67E?style=for-the-badge&logo=openai)](https://openai.com/)

</div>

---

## 🌟 Características Principales

### 🔐 **Autenticación Segura**
- **Google OAuth**: Inicio de sesión seguro con Google
- **NextAuth.js**: Manejo profesional de sesiones
- **Base de Datos**: Sesiones persistentes con PostgreSQL

### 🚀 **Generación Inteligente de Notas**
- **Plantillas por Especialidad**: Más de 30 especialidades médicas predefinidas
- **IA Avanzada**: Powered by OpenAI GPT-4o-mini
- **Formato Profesional**: Genera notas que siguen estándares clínicos colombianos

### 🎤 **Reconocimiento de Voz Integrado**
- **Dictado en Tiempo Real**: Transcripción automática mientras hablas
- **Optimizado para Español**: Configurado para español colombiano (es-CO)
- **Manos Libres**: Perfecto para consultas médicas ocupadas

### 📋 **Evaluación con Escalas Médicas**
- **Escalas Validadas**: PHQ-9, GAD-7, Glasgow, CHA₂DS₂-VASc, MoCA, AUDIT-C
- **Aplicación Automática**: La IA interpreta información clínica y aplica escalas
- **Resultados Profesionales**: Formato listo para historia clínica

### 🔍 **Sugerencias Inteligentes de IA**
- **Análisis Clínico**: Recomendaciones basadas en evidencia científica
- **Preguntas Adicionales**: Sugerencias para profundizar en la evaluación
- **Valor Agregado**: Más allá de la simple transcripción

### 📝 **Editor de Plantillas Personalizable**
- **Totalmente Editable**: Modifica plantillas existentes o crea las tuyas
- **Guardado en Base de Datos**: Tus cambios se sincronizan automáticamente
- **Formato Flexible**: Adapta las plantillas a tu estilo de trabajo

### 📚 **Historial Persistente**
- **Base de Datos Segura**: Todas tus notas se guardan en PostgreSQL
- **Búsqueda Avanzada**: Encuentra notas rápidamente
- **Sincronización**: Accede a tus notas desde cualquier dispositivo

### 🎨 **Experiencia de Usuario Premium**
- **Modo Oscuro/Claro**: Cambio automático según preferencias del sistema
- **Interfaz Responsive**: Funciona perfectamente en desktop, tablet y móvil
- **Navegación Intuitiva**: Diseño limpio y profesional

---

## 🏥 Especialidades Médicas Soportadas

<details>
<summary><strong>Ver todas las especialidades (30+)</strong></summary>

### **Especialidades Clínicas**
- 🩺 **Medicina General** - Plantilla completa SOAP con signos vitales
- 🧠 **Psiquiatría** - Examen mental detallado con criterios DSM-5/CIE-11
- ❤️ **Cardiología** - Evaluación cardiovascular especializada
- 🦴 **Ortopedia y Traumatología** - Examen físico específico y pruebas especiales
- 🧑‍⚕️ **Medicina Interna** - Enfoque integral de medicina interna
- 🧠 **Neurología** - Examen neurológico completo con pares craneales

### **Especialidades Quirúrgicas**
- 🔪 **Cirugía General** - Incluye plan quirúrgico y consentimiento
- 💉 **Anestesiología** - Evaluación preanestésica y clasificación ASA
- 👩‍⚕️ **Ginecología y Obstetricia** - Antecedentes gineco-obstétricos

### **Especialidades Diagnósticas**
- 📡 **Radiología** - Formato para informes de diagnóstico por imágenes
- 👁️ **Oftalmología** - Agudeza visual y examen oftalmológico detallado

### **Especialidades de Apoyo**
- 🍎 **Nutrición y Dietética** - Valoración antropométrica y plan nutricional
- 🏃‍♂️ **Fisioterapia** - Evaluación funcional y plan de rehabilitación
- 🧠 **Psicología Clínica** - Examen mental y plan de intervención psicológica
- 🦷 **Odontología General** - Odontograma y plan de tratamiento dental

### **Medicina de Urgencias**
- 🚨 **Medicina de Emergencias** - Evaluación ABCDE y triage
- 👨‍⚕️ **Medicina Familiar** - Enfoque biopsicosocial
- 🏢 **Salud Ocupacional** - Evaluación de riesgos laborales

**Y muchas más...**

</details>

---

## 📊 Escalas Médicas Integradas

| Escala | Área | Descripción |
|--------|------|-------------|
| **PHQ-9** | Psiquiatría | Cuestionario de Salud del Paciente para Depresión |
| **GAD-7** | Psiquiatría | Trastorno de Ansiedad Generalizada |
| **Glasgow (GCS)** | Neurología | Escala de Coma de Glasgow |
| **CHA₂DS₂-VASc** | Cardiología | Riesgo de ACV en Fibrilación Auricular |
| **MoCA** | Neurología | Evaluación Cognitiva de Montreal |
| **AUDIT-C** | Psiquiatría | Identificación de Trastornos por Consumo de Alcohol |

---

## 🛠️ Tecnologías Utilizadas

### **Framework y Frontend**
- **Next.js 14.0.4** - Framework React full-stack con App Router
- **React 18.2.0** - Biblioteca de interfaz de usuario
- **TypeScript 5.2.2** - Tipado estático para mayor robustez
- **Tailwind CSS** - Framework de estilos utility-first

### **Autenticación y Base de Datos**
- **NextAuth.js 4.24.11** - Autenticación completa con OAuth
- **Prisma 6.7.0** - ORM moderno para TypeScript
- **PostgreSQL** - Base de datos relacional robusta
- **Google OAuth** - Autenticación segura con Google

### **Inteligencia Artificial**
- **OpenAI GPT-4o-mini** - Modelo de IA optimizado para tareas médicas
- **openai 4.67.1** - SDK oficial de OpenAI

### **APIs y Servicios**
- **Web Speech API** - Reconocimiento de voz nativo del navegador
- **Middleware de Rate Limiting** - Protección contra abuso de API
- **React Query** - Manejo de estado del servidor

---

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- Node.js 18+ instalado
- PostgreSQL configurado
- Una clave API de OpenAI
- Credenciales de Google OAuth
- Navegador moderno con soporte para Web Speech API

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/tu-usuario/Notas-AI.git
cd Notas-AI
```

### **2. Instalar Dependencias**
```bash
npm install
```

### **3. Configurar Variables de Entorno**
Crea un archivo `.env` en la raíz del proyecto:
```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/notasai"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-super-seguro-aqui"

# Google OAuth (obtener en Google Cloud Console)
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"

# OpenAI API
NEXT_PUBLIC_OPENAI_API_KEY="tu-clave-api-de-openai"
```

### **4. Configurar Base de Datos**
```bash
# Generar cliente de Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# (Opcional) Abrir Prisma Studio
npm run db:studio
```

### **5. Configurar Google OAuth**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Habilita la API de Google+ y OAuth 2.0
4. Crea credenciales OAuth 2.0 Web Application
5. Agrega las URLs autorizadas:
   - **Development**: `http://localhost:3000/api/auth/callback/google`
   - **Production**: `https://tu-dominio.com/api/auth/callback/google`

### **6. Ejecutar en Desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### **7. Construir para Producción**
```bash
npm run build
npm start
```

---

## 📖 Cómo Usar la Aplicación

### **1. Autenticación**
1. **Visita** la aplicación en tu navegador
2. **Haz clic** en "Iniciar sesión con Google"
3. **Autoriza** la aplicación con tu cuenta de Google
4. **Accede** automáticamente a la aplicación principal

### **2. Generación de Notas con Plantillas**
1. **Selecciona** una especialidad médica
2. **Dicta o escribe** la información del paciente
3. **Haz clic** en "Generar Nota" ✨
4. **Revisa y edita** el resultado si es necesario
5. **Guarda** la nota en tu historial

### **3. Uso del Reconocimiento de Voz**
1. **Haz clic** en el botón de micrófono 🎤
2. **Habla claramente** con la información del paciente
3. **La transcripción** aparece en tiempo real
4. **Haz clic** nuevamente para detener el dictado

### **4. Generación de Sugerencias Inteligentes**
1. **Ingresa** información clínica en la sección "Sugerencias de IA"
2. **Haz clic** en "Generar Sugerencias" 💡
3. **Recibe** recomendaciones basadas en evidencia
4. **Incorpora** las sugerencias útiles en tu evaluación

### **5. Aplicación de Escalas Médicas**
1. **Selecciona** la escala apropiada (PHQ-9, GAD-7, etc.)
2. **Ingresa** la información clínica del paciente
3. **Haz clic** en "Generar Escala" 📊
4. **Obtén** el puntaje y la interpretación automática

### **6. Gestión de Historial**
1. **Ve** a la sección "Historial"
2. **Busca** notas por especialidad, fecha o contenido
3. **Carga** notas anteriores para editarlas
4. **Elimina** notas que ya no necesites

---

## 🏗️ Arquitectura del Proyecto

```
Notas-AI/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   └── auth/          # NextAuth endpoints
│   │   ├── globals.css        # Estilos globales
│   │   ├── layout.tsx         # Layout principal
│   │   └── page.tsx           # Página principal
│   ├── components/            # Componentes React
│   │   ├── auth/             # Componentes de autenticación
│   │   ├── notes/            # Componentes de notas
│   │   ├── providers/        # Providers de contexto
│   │   └── ui/               # Componentes de UI
│   ├── lib/                  # Librerías y utilidades
│   │   ├── constants.ts      # Constantes de la aplicación
│   │   ├── supabase.ts       # Cliente Supabase
│   │   ├── utils.ts          # Funciones utilitarias
│   │   └── services/         # Servicios de API
│   │       ├── databaseService.ts
│   │       ├── openaiService.ts
│   │       └── storageService.ts
│   ├── contexts/            # Contextos React
│   ├── hooks/              # Custom hooks
│   ├── types/              # Tipos TypeScript
│   └── middleware.ts       # Middleware de Next.js
├── public/                 # Archivos estáticos
│   └── favicon.ico
├── supabase-setup.sql     # Configuración inicial de Supabase
├── next.config.js         # Configuración Next.js
├── tailwind.config.js     # Configuración Tailwind
└── tsconfig.json         # Configuración TypeScript
```

---

## 🔒 Seguridad y Privacidad

- **🔐 Autenticación OAuth**: Login seguro con Google
- **🛡️ Rate Limiting**: Protección contra abuso de API
- **🔒 Headers de Seguridad**: CSP, XSS y CSRF protection
- **💾 Datos Encriptados**: Toda la información se almacena de forma segura
- **🌐 HTTPS**: Comunicación encriptada en producción
- **🔑 Variables de Entorno**: Claves API protegidas

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

## 👨‍💻 Desarrollado por

**Tu Nombre** - [GitHub](https://github.com/tu-usuario) - [Email](mailto:tu-email@example.com)

---

<div align="center">
<strong>⭐ Si este proyecto te ha sido útil, ¡dale una estrella! ⭐</strong>
</div>
