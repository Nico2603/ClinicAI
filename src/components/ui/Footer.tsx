'use client';

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors duration-300 mt-auto">
      <div className="container-app mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-4 sm:py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 text-xs sm:text-sm">
        {/* Marca */}
        <div className="md:col-span-1 flex flex-col gap-1.5 sm:gap-2 text-center sm:text-left">
          <span className="text-lg sm:text-2xl font-bold gradient-text">Clinic<span className="text-primary">AI</span></span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            © {new Date().getFullYear()} ClinicAI.<br className="sm:hidden"/>
            <span className="hidden sm:inline"><br/></span>
            Todos los derechos reservados.
          </span>
        </div>
        {/* Legal */}
        <div className="flex flex-col gap-1.5 sm:gap-2 text-center sm:text-left">
          <span className="font-semibold text-neutral-800 dark:text-neutral-100 mb-1 text-xs sm:text-sm">LEGAL</span>
          <a href="/legal" className="hover:underline text-neutral-700 dark:text-neutral-300 text-xs sm:text-sm transition-colors">
            Términos y Condiciones
          </a>
        </div>
        {/* Contacto */}
        <div className="flex flex-col gap-1.5 sm:gap-2 text-center sm:text-left">
          <span className="font-semibold text-neutral-800 dark:text-neutral-100 mb-1 text-xs sm:text-sm">CONTACTO</span>
          <div className="space-y-1 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
            <div className="leading-relaxed">2093 Philadelphia Pike #9001</div>
            <div className="leading-relaxed">Claymont, DE, 19703, United States</div>
            <div className="leading-relaxed">+1 (347) 654 4961</div>
            <div className="leading-relaxed">talent@teilur.com</div>
          </div>
        </div>
      </div>
      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3 pb-2 px-4 text-xs text-neutral-500 dark:text-neutral-400 text-center">
        <span className="font-bold">AVISO LEGAL:</span> ClinicAI proporciona únicamente asistencia basada en inteligencia artificial. No es un servicio de salud mental ni reemplaza la atención profesional.
        <div className="mt-3 flex flex-col items-center gap-1">
          <span className="font-semibold text-neutral-700 dark:text-neutral-200 text-sm">Desarrollado por Nicolás Ceballos Brito</span>
          <div className="flex gap-4 mt-1">
            <a href="https://nico2603.github.io/PersonalPage/" target="_blank" rel="noopener noreferrer" aria-label="Página personal" className="hover:text-primary transition-colors">
              <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14.5A6.5 6.5 0 1110 3.5a6.5 6.5 0 010 13zm0-11a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"/></svg>
            </a>
            <a href="https://github.com/Nico2603" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-primary transition-colors">
              <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.157-1.11-1.465-1.11-1.465-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.34-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.338 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.417-.012 2.747 0 .267.18.579.688.481C19.138 20.203 22 16.447 22 12.021 22 6.484 17.523 2 12 2z"/></svg>
            </a>
            <a href="https://www.linkedin.com/in/nicolas-ceballos-brito/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-primary transition-colors">
              <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.966 0-1.75-.79-1.75-1.76 0-.97.784-1.76 1.75-1.76s1.75.79 1.75 1.76c0 .97-.784 1.76-1.75 1.76zm13.5 10.28h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.89v1.23h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v4.72z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}; 