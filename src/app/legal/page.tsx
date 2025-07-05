'use client';

import { motion } from 'framer-motion';

export default function LegalPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="container mx-auto max-w-4xl px-4 py-8 sm:py-12 lg:py-16"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8 lg:p-10 prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none">
          <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700">
            Política de Privacidad y Términos de Uso
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Última actualización: 23 de enero de 2025
          </p>
          
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            En Notas-AI, tu privacidad y la protección de tus datos son nuestra máxima prioridad. 
            Esta Política de Privacidad explica cómo recopilamos, utilizamos y protegemos tu información 
            personal cuando utilizas nuestra plataforma de gestión de notas con inteligencia artificial.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
            Información que Recopilamos
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Cuando utilizas Notas-AI, recopilamos únicamente la información necesaria para proporcionarte 
            un servicio personalizado y seguro:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
            <li><strong>Información de cuenta:</strong> Si te registras con Google, recopilamos tu nombre, dirección de correo electrónico y foto de perfil.</li>
            <li><strong>Contenido de notas:</strong> Las notas que creas, incluyendo texto, imágenes y metadatos asociados.</li>
            <li><strong>Datos de uso:</strong> Información sobre cómo interactúas con la aplicación, incluyendo preferencias y configuraciones.</li>
            <li><strong>Información técnica:</strong> Datos de dispositivo, dirección IP y información del navegador para garantizar la seguridad y funcionalidad del servicio.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
            Cómo Utilizamos tu Información
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Utilizamos tu información exclusivamente para:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
            <li>Proporcionar y mantener el servicio de Notas-AI</li>
            <li>Sincronizar tus notas entre dispositivos</li>
            <li>Mejorar nuestros algoritmos de IA para sugerencias más precisas</li>
            <li>Garantizar la seguridad y prevenir el uso fraudulento</li>
            <li>Personalizar tu experiencia en la aplicación</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            <strong>Nunca vendemos ni compartimos tu información personal con terceros</strong> con fines comerciales o publicitarios.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
            Privacidad y Seguridad de tus Notas
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            La privacidad de tus notas es fundamental para nosotros:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
            <li><strong>Cifrado:</strong> Todas tus notas se almacenan con cifrado de extremo a extremo</li>
            <li><strong>Acceso limitado:</strong> Solo tú tienes acceso al contenido completo de tus notas</li>
            <li><strong>IA responsable:</strong> Nuestros algoritmos procesan datos de manera agregada y anónima para mejoras del servicio</li>
            <li><strong>Control total:</strong> Puedes exportar o eliminar todas tus notas en cualquier momento</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
            Inteligencia Artificial y Procesamiento de Datos
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Notas-AI utiliza tecnología de inteligencia artificial para:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
            <li>Proporcionar sugerencias de organización y categorización automática</li>
            <li>Generar resúmenes inteligentes de tus notas</li>
            <li>Mejorar la función de búsqueda semántica</li>
            <li>Ofrecer plantillas personalizadas basadas en tu estilo de escritura</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            El procesamiento de IA se realiza de forma segura y respetando tu privacidad. 
            Los datos se procesan de manera que no pueden ser vinculados a tu identidad personal.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
            Tus Derechos y Contacto
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Tienes derecho a acceder, corregir o eliminar tu información personal en cualquier momento. 
            También puedes retirar tu consentimiento o hacer preguntas sobre cómo manejamos tus datos. 
            Si deseas contactarnos, por favor escríbenos a:
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md text-sm mb-4">
            <p className="text-gray-800 dark:text-gray-200">
              <strong>Dirección:</strong><br />
              2093 Philadelphia Pike #9001<br />
              Claymont, DE, 19703<br />
              Estados Unidos
            </p>
            <p className="mt-2 text-gray-800 dark:text-gray-200">
              <strong>Teléfono:</strong> +1 (347) 654 4961
            </p>
            <p className="mt-2 text-gray-800 dark:text-gray-200">
              <strong>Email:</strong> privacy@notas-ai.com
            </p>
            <p className="mt-2 text-gray-800 dark:text-gray-200">
              <strong>Soporte:</strong> soporte@notas-ai.com
            </p>
          </div>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
            Servicios de Terceros
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Utilizamos servicios de terceros confiables para funciones específicas:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
            <li><strong>Google Authentication:</strong> Para inicio de sesión seguro</li>
            <li><strong>Servicios de hosting:</strong> Para garantizar la disponibilidad y velocidad de la plataforma</li>
            <li><strong>Servicios de IA:</strong> Para funcionalidades de procesamiento de lenguaje natural</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Todos nuestros socios cumplen con altos estándares de protección de datos y privacidad.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
            Tus Derechos
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Como usuario de Notas-AI, tienes derecho a:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
            <li>Acceder a toda tu información personal almacenada</li>
            <li>Corregir o actualizar tus datos</li>
            <li>Exportar todas tus notas en formato estándar</li>
            <li>Eliminar permanentemente tu cuenta y todos los datos asociados</li>
            <li>Retirar tu consentimiento para el procesamiento de datos</li>
            <li>Recibir información sobre cómo se utilizan tus datos</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
            Retención y Eliminación de Datos
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Conservamos tus datos mientras mantengas tu cuenta activa. Si eliminas tu cuenta, 
            todos tus datos personales y notas se eliminarán permanentemente dentro de 30 días. 
            Algunos datos agregados y anónimos pueden conservarse para mejorar nuestros servicios.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
            Menores de Edad
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Notas-AI está diseñado para usuarios mayores de 13 años. Si descubrimos que hemos 
            recopilado información de un menor de 13 años sin el consentimiento parental apropiado, 
            eliminaremos esa información inmediatamente.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
            Actualizaciones de esta Política
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Podemos actualizar esta Política de Privacidad ocasionalmente para reflejar cambios 
            en nuestros servicios o requisitos legales. Te notificaremos sobre cualquier cambio 
            significativo a través de la aplicación o por correo electrónico.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
            Términos de Uso
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Al utilizar Notas-AI, aceptas:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
            <li>Utilizar el servicio de manera responsable y legal</li>
            <li>No compartir contenido ilegal, ofensivo o que viole derechos de terceros</li>
            <li>Mantener la confidencialidad de tu cuenta</li>
            <li>Respetar los derechos de propiedad intelectual</li>
          </ul>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <strong>Nota importante:</strong> Esta política se actualiza regularmente. 
              Te recomendamos revisarla periódicamente para mantenerte informado sobre 
              cómo protegemos tu información.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
