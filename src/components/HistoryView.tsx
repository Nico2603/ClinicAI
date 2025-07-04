import React from 'react';
import { HistoricNote } from '../types';
import { DocumentTextIcon, LightBulbIcon, CalculatorIcon } from './ui/Icons';

interface HistoryViewProps {
  historicNotes: HistoricNote[];
  loadNoteFromHistory: (note: HistoricNote) => void;
  clearHistory: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ historicNotes, loadNoteFromHistory, clearHistory }) => {
  
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('es-CO', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (historicNotes.length === 0) {
    return (
      <div className="text-center p-10 bg-white dark:bg-dark-surface shadow-xl rounded-lg">
        <DocumentTextIcon className="mx-auto h-16 w-16 text-neutral-400 dark:text-neutral-500 mb-4" />
        <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-200 mb-2">Historial Vacío</h3>
        <p className="text-neutral-500 dark:text-neutral-400">
          No hay notas guardadas en el historial todavía. Comienza a generar notas y aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="history-heading" className="bg-white dark:bg-dark-surface shadow-xl rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 id="history-heading" className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">
                Historial de Notas
            </h2>
            <button
                onClick={clearHistory}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-700/50 rounded-md border border-red-500 dark:border-red-600 transition-colors"
                aria-label="Limpiar todo el historial de notas"
            >
                Limpiar Historial
            </button>
        </div>
      
      <div className="space-y-4">
        {historicNotes.map((note) => (
          <div key={note.id} className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
              <div className="flex items-center mb-2 sm:mb-0">
                {note.type === 'template' && <DocumentTextIcon className="h-5 w-5 mr-2 text-primary dark:text-dark-primary" />}
                {note.type === 'suggestion' && <LightBulbIcon className="h-5 w-5 mr-2 text-secondary dark:text-dark-secondary" />}
                {note.type === 'scale' && <CalculatorIcon className="h-5 w-5 mr-2 text-teal-500 dark:text-teal-400" />}

                <h3 className="text-md font-semibold text-neutral-700 dark:text-neutral-200">
                  {note.type === 'template' && `Nota de Plantilla (${note.specialtyName || 'General'})`}
                  {note.type === 'suggestion' && 'Sugerencia IA'}
                  {note.type === 'scale' && `Escala: ${note.scaleName || 'Calculada'}`}
                </h3>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatDate(note.timestamp)}</p>
            </div>
            
            <div className="mb-3">
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-0.5">Entrada Original:</p>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                {note.originalInput.substring(0, 100)}{note.originalInput.length > 100 ? '...' : ''}
              </p>
            </div>
            <div className="mb-3">
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-0.5">Contenido Generado:</p>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                 {note.content.substring(0, 150)}{note.content.length > 150 ? '...' : ''}
              </p>
            </div>

            <button
              onClick={() => loadNoteFromHistory(note)}
              className="px-4 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-dark dark:bg-dark-primary dark:hover:bg-primary-light rounded-md shadow-sm transition-colors"
              aria-label={`Cargar nota del ${formatDate(note.timestamp)} en el editor`}
            >
              Cargar en Vista Principal
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HistoryView;