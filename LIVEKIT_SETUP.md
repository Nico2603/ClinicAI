# Configuración de LiveKit + Deepgram

## 🎉 ¡Implementación Completada!

Se ha implementado exitosamente LiveKit como capa de abstracción para manejar las conexiones WebSocket con Deepgram. Esto resuelve los errores de conexión que experimentabas anteriormente.

## 📋 ¿Qué se implementó?

### ✅ Nuevos Servicios
- **LiveKitService**: Maneja conexiones WebSocket robustas a través de LiveKit
- **useLiveKitSpeech**: Hook de React que reemplaza a useDeepgramSpeech

### ✅ Componentes Actualizados
- `NoteUpdater.tsx` - Ahora usa LiveKit
- `AIClinicalScales.tsx` - Ahora usa LiveKit  
- `TemplateNoteView.tsx` - Ahora usa LiveKit
- `Debug.tsx` - Ahora usa LiveKit

### ✅ Configuración de Variables de Entorno
Se añadieron las variables de LiveKit al archivo `.env.example`

## 🔧 Configuración Requerida

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```bash
# API Keys existentes
NEXT_PUBLIC_DEEPGRAM_API_KEY=tu_deepgram_api_key_aqui
NEXT_PUBLIC_OPENAI_API_KEY=tu_openai_api_key_aqui

# LiveKit Configuration (YA CONFIGURADO PARA TU PROYECTO)
NEXT_PUBLIC_LIVEKIT_URL=wss://clinicai-1jpw3nvz.livekit.cloud
NEXT_PUBLIC_LIVEKIT_API_KEY=APINQ6pjPH5e7Lw
NEXT_PUBLIC_LIVEKIT_API_SECRET=KIJHCCqfdvwgBa67Drb4fPq0ldssGPy6l3u8bwmUfhSA

# Supabase Configuration (si las tienes)
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
```

### 2. Configuración de Deepgram

Asegúrate de tener una API key válida de Deepgram con suficientes créditos.

## 🚀 Cómo Usar

### Iniciar el Proyecto

```bash
npm run dev
```

### Probar la Funcionalidad

1. **Abrir la aplicación** en el navegador
2. **Navegar a cualquier vista** que tenga funcionalidad de dictado
3. **Hacer clic en el botón de micrófono** 🎤
4. **Permitir acceso al micrófono** cuando el navegador lo solicite
5. **Comenzar a hablar** - deberías ver las transcripciones apareciendo

### Depuración

Si tienes problemas, puedes usar el componente Debug que incluye:
- Prueba de conectividad con LiveKit
- Verificación de configuración
- Logs detallados en la consola

## 🔍 Beneficios de LiveKit

### Mejor Manejo de Conexiones
- **Reconexión automática** cuando se pierde la conexión
- **Gestión de estados** más robusta
- **Menos errores de WebSocket**

### Escalabilidad
- **Infraestructura profesional** para audio en tiempo real
- **Optimización automática** de la calidad de audio
- **Compatibilidad** con múltiples navegadores

### Características Adicionales
- **Cancelación de eco** mejorada
- **Supresión de ruido** automática
- **Control de ganancia** automático

## 🏗️ Arquitectura

```
Usuario → LiveKit Room → Deepgram WebSocket → Transcripción
   ↑                                              ↓
   ←──────── Callbacks de React ←─────────────────
```

1. **LiveKit** maneja la conexión WebSocket principal
2. **MediaRecorder** captura el audio del micrófono
3. **Deepgram** procesa la transcripción en tiempo real
4. **React hooks** manejan el estado y callbacks

## ⚠️ Notas Importantes

### Para Desarrollo
- Los tokens JWT se generan en el cliente (solo para desarrollo)
- La implementación actual es **solo para pruebas y desarrollo**

### Para Producción
- **IMPORTANTE**: Los tokens JWT deben generarse en tu backend
- Implementar autenticación y autorización apropiadas
- Configurar límites de rate limiting
- Monitorear el uso de créditos de Deepgram

## 🔧 Personalización

### Cambiar Idioma de Transcripción
En `livekitService.ts`, línea ~200:
```typescript
language: 'es', // Cambiar por 'en', 'fr', etc.
```

### Ajustar Configuración de Audio
En `livekitService.ts`, línea ~110:
```typescript
audio: {
  echoCancellation: true,    // Cancelación de eco
  noiseSuppression: true,    // Supresión de ruido
  autoGainControl: true,     // Control automático de ganancia
  sampleRate: 16000,         // Frecuencia de muestreo
  channelCount: 1,           // Mono audio
}
```

## 🆘 Solución de Problemas

### Error: "Configuración de LiveKit incompleta"
- Verifica que todas las variables NEXT_PUBLIC_LIVEKIT_* estén configuradas

### Error: "API key de Deepgram no configurada"
- Verifica que NEXT_PUBLIC_DEEPGRAM_API_KEY esté configurada correctamente

### Sin transcripciones
- Verifica la conectividad de internet
- Revisa la consola del navegador para errores
- Asegúrate de que Deepgram tenga créditos disponibles

### Problemas de permisos de micrófono
- Asegúrate de estar usando HTTPS (o localhost)
- Verifica los permisos del navegador
- Intenta recargar la página

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs en la consola del navegador
2. Verifica la configuración de variables de entorno
3. Prueba la conectividad usando el componente Debug

## 🎯 Próximos Pasos

Para un entorno de producción, considera:
1. **Implementar generación de tokens JWT en el backend**
2. **Añadir autenticación de usuarios**
3. **Configurar monitoreo y alertas**
4. **Implementar límites de uso**
5. **Optimizar la configuración de audio según tus necesidades**

---

¡La implementación está lista para usar! 🚀 