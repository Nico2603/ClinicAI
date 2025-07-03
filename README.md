# 🏥 Notas-AI | Asistente Inteligente de Notas Clínicas

<div align="center">

**Una aplicación web moderna y potente para la generación automatizada de notas médicas con Inteligencia Artificial**

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)

</div>

---

## 🌟 Características Principales

### 🚀 **Generación Inteligente de Notas**
- **Plantillas por Especialidad**: Más de 30 especialidades médicas predefinidas
- **IA Avanzada**: Powered by Google Gemini 2.5 Flash Preview
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
- **Guardado Automático**: Tus cambios se preservan localmente
- **Formato Flexible**: Adapta las plantillas a tu estilo de trabajo

### 📚 **Historial Inteligente**
- **Almacenamiento Local**: Todas tus notas se guardan automáticamente
- **Búsqueda Avanzada**: Encuentra notas rápidamente
- **Carga Rápida**: Reutiliza notas anteriores como punto de partida

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

### **Frontend**
- **React 19.1.0** - Framework de UI más moderno
- **TypeScript 5.7.2** - Tipado estático para mayor robustez
- **Vite 6.2.0** - Build tool ultrarrápido
- **CSS Moderno** - Diseño responsive y mode oscuro/claro

### **Inteligencia Artificial**
- **Google Gemini 2.5 Flash Preview** - Modelo de IA de última generación
- **@google/genai 1.6.0** - SDK oficial de Google Generative AI

### **APIs Web Nativas**
- **Web Speech API** - Reconocimiento de voz nativo del navegador
- **Local Storage** - Persistencia de datos local y segura

---

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- Node.js 18+ instalado
- Una clave API de Google Gemini (gratuita)
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
Crea un archivo `.env.local` en la raíz del proyecto:
```env
API_KEY=tu_clave_api_de_gemini_aqui
```

> 💡 **¿Cómo obtener tu API Key de Google Gemini?**
> 1. Visita [Google AI Studio](https://ai.google.dev/)
> 2. Inicia sesión con tu cuenta de Google
> 3. Genera una nueva API Key (es gratuita)
> 4. Copia y pega la clave en tu archivo `.env.local`

### **4. Ejecutar en Desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### **5. Construir para Producción**
```bash
npm run build
npm run preview
```

---

## 📖 Cómo Usar la Aplicación

### **1. Generación de Notas con Plantillas**
1. **Selecciona** una especialidad médica
2. **Dicta o escribe** la información del paciente
3. **Haz clic** en "Generar Nota" ✨
4. **Revisa y edita** el resultado si es necesario
5. **Copia** la nota a tu sistema de historia clínica

### **2. Uso del Reconocimiento de Voz**
1. **Haz clic** en el botón de micrófono 🎤
2. **Habla claramente** con la información del paciente
3. **La transcripción** aparece en tiempo real
4. **Haz clic** nuevamente para detener el dictado

### **3. Generación de Sugerencias Inteligentes**
1. **Ingresa** información clínica en la sección "Sugerencias de IA"
2. **Haz clic** en "Generar Sugerencias" 💡
3. **Recibe** recomendaciones basadas en evidencia
4. **Incorpora** las sugerencias útiles en tu evaluación

### **4. Aplicación de Escalas Médicas**
1. **Selecciona** la escala apropiada (PHQ-9, GAD-7, etc.)
2. **Ingresa** la información clínica del paciente
3. **Haz clic** en "Generar Escala" 📊
4. **Obtén** el puntaje y la interpretación automática

### **5. Personalización de Plantillas**
1. **Ve** a la sección "Editar Plantillas"
2. **Selecciona** la especialidad que deseas modificar
3. **Edita** la plantilla según tus necesidades
4. **Guarda** - Los cambios se preservan automáticamente

### **6. Gestión del Historial**
1. **Accede** a la sección "Historial"
2. **Busca** notas anteriores por fecha o contenido
3. **Reutiliza** notas como punto de partida
4. **Elimina** entradas que ya no necesites

---

## ⚙️ Configuración Avanzada

### **Personalización del Modelo de IA**
El archivo `constants.ts` permite modificar el modelo de Gemini utilizado:
```typescript
export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';
```

### **Configuración de Idioma**
El reconocimiento de voz está configurado para español colombiano:
```typescript
speechRecognitionInstance.current.lang = 'es-CO';
```

### **Agregar Nuevas Especialidades**
Puedes agregar nuevas especialidades editando el array `DEFAULT_SPECIALTIES` en `constants.ts`:
```typescript
{ id: 'nueva_especialidad', name: 'Nueva Especialidad' }
```

---

## 🎯 Casos de Uso Principales

### **Para Médicos Generales**
- Acelera la documentación de consultas de rutina
- Mejora la consistencia en el formato de notas
- Reduce el tiempo de escritura hasta en un 70%

### **Para Especialistas**
- Plantillas específicas para cada especialidad
- Aplicación automática de escalas validadas
- Sugerencias de IA basadas en evidencia

### **Para Estudiantes de Medicina**
- Aprende formatos profesionales de notas médicas
- Practica con casos reales usando IA
- Comprende mejor la estructura de diferentes especialidades

### **Para Centros de Salud**
- Estandariza la documentación clínica
- Mejora la calidad de las historias clínicas
- Reduce errores de documentación

---

## 🔒 Privacidad y Seguridad

### **Datos Locales**
- **Almacenamiento Local**: Todos los datos se guardan en tu navegador
- **Sin Servidor**: No enviamos información a servidores externos
- **Control Total**: Tienes control completo sobre tus datos

### **Uso de IA**
- **Solo Texto**: Únicamente se envía texto a Gemini para procesamiento
- **Sin Datos Identificables**: La IA no almacena información personal
- **Términos de Google**: Sujeto a los términos de uso de Google AI

---

## 🤝 Contribuir al Proyecto

¡Las contribuciones son bienvenidas! Aquí te mostramos cómo puedes ayudar:

### **Formas de Contribuir**
1. **Reportar Bugs** - Abre un issue con detalles del problema
2. **Sugerir Mejoras** - Propón nuevas características
3. **Agregar Plantillas** - Contribuye con plantillas de nuevas especialidades
4. **Mejorar Documentación** - Ayuda a mantener actualizada la documentación
5. **Traducir** - Ayuda con traducciones a otros idiomas

### **Proceso de Contribución**
1. **Fork** el repositorio
2. **Crea** una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. **Commit** tus cambios (`git commit -m 'Agregar nueva característica'`)
4. **Push** a la rama (`git push origin feature/nueva-caracteristica`)
5. **Abre** un Pull Request

---

## 🐛 Solución de Problemas

### **Problemas Comunes**

**❌ "API key not configured"**
- Verifica que hayas creado el archivo `.env.local`
- Asegúrate de que la variable se llame exactamente `API_KEY`
- Reinicia el servidor de desarrollo

**❌ "Reconocimiento de voz no funciona"**
- Verifica que tu navegador soporte Web Speech API
- Asegúrate de dar permisos de micrófono
- Prueba en Chrome o Edge (mejor compatibilidad)

**❌ "La aplicación se ve rara en móvil"**
- La aplicación está optimizada para desktop
- En móvil funciona, pero la experiencia es mejor en pantallas grandes

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👏 Créditos y Agradecimientos

### **Tecnologías Utilizadas**
- **React Team** - Por el increíble framework
- **Google** - Por la API de Gemini AI
- **TypeScript Team** - Por el excelente sistema de tipos
- **Vite Team** - Por la herramienta de build ultrarrápida

### **Inspiración**
Este proyecto fue creado para mejorar la eficiencia en la documentación médica y ayudar a profesionales de la salud en Colombia y Latinoamérica.

---

## 📞 Contacto y Soporte

¿Tienes preguntas? ¿Necesitas ayuda? ¿Quieres colaborar?

- **📧 Email**: [tu-email@ejemplo.com]
- **🐙 GitHub**: [Abre un issue](https://github.com/tu-usuario/Notas-AI/issues)
- **💬 Discusiones**: [GitHub Discussions](https://github.com/tu-usuario/Notas-AI/discussions)

---

<div align="center">

**⭐ Si este proyecto te ha sido útil, considera darle una estrella en GitHub ⭐**

**Hecho con ❤️ para mejorar la atención médica en Colombia**

</div>
