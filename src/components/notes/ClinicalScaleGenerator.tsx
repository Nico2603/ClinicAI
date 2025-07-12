'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { SparklesIcon, CopyIcon, CheckIcon, TrashIcon } from '../ui/Icons';

interface ClinicalScaleGeneratorProps {
  className?: string;
  onScaleGenerated?: (scaleText: string) => void;
  existingNoteContent?: string;
}

// Tipos para las escalas
interface GlasgowBlatchfordScore {
  urea: number;
  hemoglobin: number;
  systolicBP: number;
  pulse: boolean;
  melena: boolean;
  syncope: boolean;
  hepaticDisease: boolean;
  cardiacFailure: boolean;
}

interface ScaleResult {
  score: number;
  risk: string;
  recommendation: string;
  interpretation: string;
}

// Opciones para los campos
const ureaOptions = [
  { value: 0, label: 'Menor de 39' },
  { value: 2, label: '39-69' },
  { value: 3, label: '70-99' },
  { value: 4, label: '100-199' },
  { value: 6, label: '200 o mayor' }
];

const hemoglobinMaleOptions = [
  { value: 0, label: '130 o mayor' },
  { value: 1, label: '120-129' },
  { value: 3, label: '100-119' },
  { value: 6, label: 'Menor de 100' }
];

const hemoglobinFemaleOptions = [
  { value: 0, label: '120 o mayor' },
  { value: 1, label: '100-119' },
  { value: 6, label: 'Menor de 100' }
];

const systolicBPOptions = [
  { value: 0, label: '110 o mayor' },
  { value: 1, label: '100-109' },
  { value: 2, label: '90-99' },
  { value: 3, label: 'Menor de 90' }
];

const ClinicalScaleGenerator: React.FC<ClinicalScaleGeneratorProps> = ({ 
  className = '',
  onScaleGenerated,
  existingNoteContent 
}) => {
  const [activeScale, setActiveScale] = useState<string>('glasgow-blatchford');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [copied, setCopied] = useState<boolean>(false);
  const [result, setResult] = useState<ScaleResult | null>(null);

  // Estado para Glasgow-Blatchford
  const [glasgowScore, setGlasgowScore] = useState<GlasgowBlatchfordScore>({
    urea: 0,
    hemoglobin: 0,
    systolicBP: 0,
    pulse: false,
    melena: false,
    syncope: false,
    hepaticDisease: false,
    cardiacFailure: false
  });

  const calculateGlasgowBlatchford = () => {
    let total = 0;
    
    // Urea sanguínea
    total += glasgowScore.urea;
    
    // Hemoglobina
    total += glasgowScore.hemoglobin;
    
    // Presión arterial sistólica
    total += glasgowScore.systolicBP;
    
    // Otros factores (cada uno suma 1 punto)
    if (glasgowScore.pulse) total += 1;
    if (glasgowScore.melena) total += 1;
    if (glasgowScore.syncope) total += 1;
    if (glasgowScore.hepaticDisease) total += 1;
    if (glasgowScore.cardiacFailure) total += 1;

    let risk = '';
    let recommendation = '';
    let interpretation = '';

    if (total === 0) {
      risk = 'Muy bajo';
      recommendation = 'Paciente puede ser dado de alta sin necesidad de intervención inmediata';
      interpretation = 'Riesgo muy bajo de necesitar intervención médica';
    } else if (total >= 1 && total <= 3) {
      risk = 'Bajo';
      recommendation = 'Monitoreo cercano, considerar manejo ambulatorio';
      interpretation = 'Riesgo bajo-moderado de necesitar intervención';
    } else if (total >= 4 && total <= 6) {
      risk = 'Moderado';
      recommendation = 'Hospitalización recomendada, evaluación por gastroenterología';
      interpretation = 'Riesgo moderado-alto de necesitar intervención';
    } else {
      risk = 'Alto';
      recommendation = 'Hospitalización inmediata, evaluación urgente por gastroenterología';
      interpretation = 'Riesgo alto de necesitar intervención médica urgente';
    }

    const newResult: ScaleResult = {
      score: total,
      risk,
      recommendation,
      interpretation
    };

    setResult(newResult);
  };

  const clearAll = () => {
    setGlasgowScore({
      urea: 0,
      hemoglobin: 0,
      systolicBP: 0,
      pulse: false,
      melena: false,
      syncope: false,
      hepaticDisease: false,
      cardiacFailure: false
    });
    setResult(null);
  };

  const copyResult = () => {
    if (!result) return;
    
    const text = `Glasgow-Blatchford Bleeding Score

Puntuación: ${result.score}
Riesgo: ${result.risk}
Recomendación: ${result.recommendation}
Interpretación: ${result.interpretation}

Detalles del cálculo:
- Urea sanguínea: ${glasgowScore.urea} puntos
- Hemoglobina: ${glasgowScore.hemoglobin} puntos
- Presión arterial sistólica: ${glasgowScore.systolicBP} puntos
- Pulso mayor de 100/min: ${glasgowScore.pulse ? 'Sí (1 punto)' : 'No (0 puntos)'}
- Presentación con melena: ${glasgowScore.melena ? 'Sí (1 punto)' : 'No (0 puntos)'}
- Presentación con síncope: ${glasgowScore.syncope ? 'Sí (1 punto)' : 'No (0 puntos)'}
- Enfermedad hepática: ${glasgowScore.hepaticDisease ? 'Sí (1 punto)' : 'No (0 puntos)'}
- Fallo cardíaco: ${glasgowScore.cardiacFailure ? 'Sí (1 punto)' : 'No (0 puntos)'}`;

    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Error al copiar:', err));
  };

  const insertIntoNote = () => {
    if (!result || !onScaleGenerated) return;
    
    const text = `Glasgow-Blatchford Bleeding Score: ${result.score} (${result.risk})
${result.recommendation}`;

    onScaleGenerated(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-6 border border-emerald-200 dark:border-emerald-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <SparklesIcon className="h-6 w-6 text-emerald-600" />
          Calculadora de Escalas Clínicas
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Calcula escalas clínicas de forma interactiva e ingresa los resultados directamente en tus notas.
        </p>
      </div>

      {/* Selector de Escala */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Selecciona una Escala Clínica
        </h3>
        <div className="grid gap-3">
          <button
            onClick={() => setActiveScale('glasgow-blatchford')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              activeScale === 'glasgow-blatchford'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-emerald-300'
            }`}
          >
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Glasgow-Blatchford Bleeding Score
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Evalúa el riesgo de sangrado gastrointestinal superior y la necesidad de intervención
            </p>
          </button>
          
          {/* Placeholder para escalas futuras */}
          <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 opacity-50">
            <h4 className="font-semibold text-gray-500 dark:text-gray-400">
              Más escalas próximamente...
            </h4>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              APACHE II, SOFA, Wells, y más escalas se agregarán pronto
            </p>
          </div>
        </div>
      </div>

      {/* Calculadora Glasgow-Blatchford */}
      {activeScale === 'glasgow-blatchford' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Glasgow-Blatchford Bleeding Score
            </h3>
            
            {/* Selector de Género */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Género del Paciente
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setGender('male')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    gender === 'male'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-emerald-300'
                  }`}
                >
                  Masculino
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    gender === 'female'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-emerald-300'
                  }`}
                >
                  Femenino
                </button>
              </div>
            </div>

            <div className="grid gap-6">
              {/* Urea sanguínea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Urea sanguínea (mg/dL):
                </label>
                <select
                  value={glasgowScore.urea}
                  onChange={(e) => setGlasgowScore({...glasgowScore, urea: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {ureaOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hemoglobina */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {gender === 'male' ? 'Varón: Hemoglobina (g/L):' : 'Mujer: Hemoglobina (g/L):'}
                </label>
                <select
                  value={glasgowScore.hemoglobin}
                  onChange={(e) => setGlasgowScore({...glasgowScore, hemoglobin: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {(gender === 'male' ? hemoglobinMaleOptions : hemoglobinFemaleOptions).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Presión arterial sistólica */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Presión Arterial Sistólica (mm Hg):
                </label>
                <select
                  value={glasgowScore.systolicBP}
                  onChange={(e) => setGlasgowScore({...glasgowScore, systolicBP: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {systolicBPOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Checkboxes para otros factores */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="pulse"
                    checked={glasgowScore.pulse}
                    onChange={(e) => setGlasgowScore({...glasgowScore, pulse: e.target.checked})}
                    className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="pulse" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Pulso mayor de 100/min
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="melena"
                    checked={glasgowScore.melena}
                    onChange={(e) => setGlasgowScore({...glasgowScore, melena: e.target.checked})}
                    className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="melena" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Presentación con melena
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="syncope"
                    checked={glasgowScore.syncope}
                    onChange={(e) => setGlasgowScore({...glasgowScore, syncope: e.target.checked})}
                    className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="syncope" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Presentación con síncope
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hepaticDisease"
                    checked={glasgowScore.hepaticDisease}
                    onChange={(e) => setGlasgowScore({...glasgowScore, hepaticDisease: e.target.checked})}
                    className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="hepaticDisease" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Enfermedad hepática *
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="cardiacFailure"
                    checked={glasgowScore.cardiacFailure}
                    onChange={(e) => setGlasgowScore({...glasgowScore, cardiacFailure: e.target.checked})}
                    className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="cardiacFailure" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Fallo cardíaco **
                  </label>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={calculateGlasgowBlatchford}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <SparklesIcon className="h-4 w-4" />
                Calcular Glasgow-Blatchford Bleeding Score
              </Button>
              
              <Button
                onClick={clearAll}
                variant="outline"
                className="flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Borrar información
              </Button>
            </div>
          </div>

          {/* Resultado */}
          {result && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Puntuación Glasgow-Blatchford
                </h3>
                <div className="flex gap-2">
                  <Button
                    onClick={copyResult}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </Button>
                  
                  {onScaleGenerated && (
                    <Button
                      onClick={insertIntoNote}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      Insertar en Nota
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Puntuación:
                  </span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {result.score}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Riesgo:
                  </span>
                  <span className={`text-lg font-bold ${
                    result.risk === 'Muy bajo' ? 'text-green-600 dark:text-green-400' :
                    result.risk === 'Bajo' ? 'text-yellow-600 dark:text-yellow-400' :
                    result.risk === 'Moderado' ? 'text-orange-600 dark:text-orange-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {result.risk}
                  </span>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Actitud recomendada frente al enfermo:
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    {result.recommendation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClinicalScaleGenerator; 