import React, { useState } from 'react';
import { useNotes } from '@/hooks/useDatabase';
import NoteDisplay from './notes/NoteDisplay';
import { LoadingSpinner, DocumentTextIcon } from './ui/Icons';

const MyNotesView: React.FC = () => {
  const { notes, isLoading, error } = useNotes();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const selectedNote = notes.find(n => n.id === selectedNoteId) || null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-6 text-neutral-600 dark:text-neutral-300">
        <LoadingSpinner className="h-6 w-6 mr-2" /> Cargando notas…
      </div>
    );
  }

  if (error) {
    return <p className="p-6 text-red-600 dark:text-red-400">{error}</p>;
  }

  if (notes.length === 0) {
    return <p className="p-6 text-neutral-500 dark:text-neutral-400">Aún no tienes notas guardadas.</p>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <aside className="w-full lg:w-1/3 xl:w-1/4 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-800 max-h-[70vh] lg:max-h-none lg:h-[calc(100vh-180px)]">
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-700 overflow-y-auto">
          {notes.map(note => (
            <li key={note.id}>
              <button
                onClick={() => setSelectedNoteId(note.id)}
                className={`w-full text-left p-4 flex items-start space-x-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors ${selectedNoteId === note.id ? 'bg-primary/10 dark:bg-primary/20' : ''}`}
              >
                <DocumentTextIcon className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">{note.title || 'Nota sin título'}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{new Date(note.created_at).toLocaleString()}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex-1">
        {selectedNote ? (
          <NoteDisplay note={selectedNote.content} title={selectedNote.title || 'Detalle de la nota'} />
        ) : (
          <p className="text-neutral-500 dark:text-neutral-400 p-6">Selecciona una nota para verla.</p>
        )}
      </main>
    </div>
  );
};

export default MyNotesView; 