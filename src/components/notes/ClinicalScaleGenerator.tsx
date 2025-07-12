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

interface APACHEIIScore {
  temperature: number;
  meanArterialPressure: number;
  heartRate: number;
  respiratoryRate: number;
  oxygenation: number;
  arterialPH: number;
  serumSodium: number;
  serumPotassium: number;
  serumCreatinine: number;
  hematocrit: number;
  whiteBloodCells: number;
  glasgowComaScale: number;
  age: number;
  chronicHealth: number;
}

interface SOFAScore {
  respiration: number;
  coagulation: number;
  liver: number;
  cardiovascular: number;
  centralNervousSystem: number;
  renal: number;
}

interface WellsScore {
  clinicalSymptoms: boolean;
  heartRate: boolean;
  immobilization: boolean;
  previousDVT: boolean;
  hemoptysis: boolean;
  malignancy: boolean;
  alternativeDiagnosis: boolean;
}

interface CHA2DS2VAScScore {
  congestiveHeartFailure: boolean;
  hypertension: boolean;
  age: number; // 0, 1, or 2 points based on age ranges
  diabetes: boolean;
  stroke: boolean;
  vascularDisease: boolean;
  sex: boolean; // female = 1 point
}

interface CURB65Score {
  confusion: boolean;
  urea: boolean;
  respiratoryRate: boolean;
  bloodPressure: boolean;
  age: boolean;
}

interface ScaleResult {
  score: number;
  risk: string;
  recommendation: string;
  interpretation: string;
  additionalInfo?: string;
}

// Opciones para Glasgow-Blatchford
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

// Opciones para APACHE II
const temperatureOptions = [
  { value: 4, label: '≥41°C' },
  { value: 3, label: '39-40.9°C' },
  { value: 1, label: '38.5-38.9°C' },
  { value: 0, label: '36-38.4°C' },
  { value: 1, label: '34-35.9°C' },
  { value: 2, label: '32-33.9°C' },
  { value: 3, label: '30-31.9°C' },
  { value: 4, label: '≤29.9°C' }
];

const meanArterialPressureOptions = [
  { value: 4, label: '≥160 mmHg' },
  { value: 3, label: '130-159 mmHg' },
  { value: 2, label: '110-129 mmHg' },
  { value: 0, label: '70-109 mmHg' },
  { value: 2, label: '50-69 mmHg' },
  { value: 4, label: '≤49 mmHg' }
];

const heartRateOptions = [
  { value: 4, label: '≥180 lpm' },
  { value: 3, label: '140-179 lpm' },
  { value: 2, label: '110-139 lpm' },
  { value: 0, label: '70-109 lpm' },
  { value: 2, label: '55-69 lpm' },
  { value: 3, label: '40-54 lpm' },
  { value: 4, label: '≤39 lpm' }
];

const respiratoryRateOptions = [
  { value: 4, label: '≥50 rpm' },
  { value: 3, label: '35-49 rpm' },
  { value: 1, label: '25-34 rpm' },
  { value: 0, label: '12-24 rpm' },
  { value: 1, label: '10-11 rpm' },
  { value: 2, label: '6-9 rpm' },
  { value: 4, label: '≤5 rpm' }
];

const oxygenationOptions = [
  { value: 4, label: 'A-aDO2 ≥500 (FiO2 ≥0.5)' },
  { value: 3, label: 'A-aDO2 350-499 (FiO2 ≥0.5)' },
  { value: 2, label: 'A-aDO2 200-349 (FiO2 ≥0.5)' },
  { value: 0, label: 'A-aDO2 <200 (FiO2 ≥0.5) o PaO2 >70 (FiO2 <0.5)' },
  { value: 1, label: 'PaO2 61-70 (FiO2 <0.5)' },
  { value: 3, label: 'PaO2 55-60 (FiO2 <0.5)' },
  { value: 4, label: 'PaO2 <55 (FiO2 <0.5)' }
];

const arterialPHOptions = [
  { value: 4, label: '≥7.7' },
  { value: 3, label: '7.6-7.69' },
  { value: 1, label: '7.5-7.59' },
  { value: 0, label: '7.33-7.49' },
  { value: 2, label: '7.25-7.32' },
  { value: 3, label: '7.15-7.24' },
  { value: 4, label: '<7.15' }
];

const serumSodiumOptions = [
  { value: 4, label: '≥180 mEq/L' },
  { value: 3, label: '160-179 mEq/L' },
  { value: 2, label: '155-159 mEq/L' },
  { value: 1, label: '150-154 mEq/L' },
  { value: 0, label: '130-149 mEq/L' },
  { value: 2, label: '120-129 mEq/L' },
  { value: 3, label: '111-119 mEq/L' },
  { value: 4, label: '≤110 mEq/L' }
];

const serumPotassiumOptions = [
  { value: 4, label: '≥7 mEq/L' },
  { value: 3, label: '6-6.9 mEq/L' },
  { value: 1, label: '5.5-5.9 mEq/L' },
  { value: 0, label: '3.5-5.4 mEq/L' },
  { value: 1, label: '3-3.4 mEq/L' },
  { value: 2, label: '2.5-2.9 mEq/L' },
  { value: 4, label: '<2.5 mEq/L' }
];

const serumCreatinineOptions = [
  { value: 4, label: '≥3.5 mg/dL' },
  { value: 3, label: '2-3.4 mg/dL' },
  { value: 2, label: '1.5-1.9 mg/dL' },
  { value: 0, label: '0.6-1.4 mg/dL' },
  { value: 2, label: '<0.6 mg/dL' }
];

const hematocritOptions = [
  { value: 4, label: '≥60%' },
  { value: 2, label: '50-59.9%' },
  { value: 1, label: '46-49.9%' },
  { value: 0, label: '30-45.9%' },
  { value: 1, label: '20-29.9%' },
  { value: 2, label: '<20%' }
];

const whiteBloodCellsOptions = [
  { value: 4, label: '≥40,000' },
  { value: 2, label: '20,000-39,999' },
  { value: 1, label: '15,000-19,999' },
  { value: 0, label: '3,000-14,999' },
  { value: 2, label: '1,000-2,999' },
  { value: 4, label: '<1,000' }
];

const glasgowComaScaleOptions = [
  { value: 0, label: '15' },
  { value: 1, label: '14' },
  { value: 2, label: '13' },
  { value: 3, label: '12' },
  { value: 4, label: '11' },
  { value: 5, label: '10' },
  { value: 6, label: '9' },
  { value: 7, label: '8' },
  { value: 8, label: '7' },
  { value: 9, label: '6' },
  { value: 10, label: '5' },
  { value: 11, label: '4' },
  { value: 12, label: '3' }
];

const ageOptions = [
  { value: 0, label: '≤44 años' },
  { value: 2, label: '45-54 años' },
  { value: 3, label: '55-64 años' },
  { value: 5, label: '65-74 años' },
  { value: 6, label: '≥75 años' }
];

const chronicHealthOptions = [
  { value: 0, label: 'Sin enfermedad crónica' },
  { value: 2, label: 'Enfermedad crónica no quirúrgica' },
  { value: 5, label: 'Enfermedad crónica quirúrgica' }
];

// Opciones para SOFA
const respirationOptions = [
  { value: 0, label: 'PaO2/FiO2 ≥400' },
  { value: 1, label: 'PaO2/FiO2 300-399' },
  { value: 2, label: 'PaO2/FiO2 200-299' },
  { value: 3, label: 'PaO2/FiO2 100-199 con ventilación mecánica' },
  { value: 4, label: 'PaO2/FiO2 <100 con ventilación mecánica' }
];

const coagulationOptions = [
  { value: 0, label: 'Plaquetas ≥150,000' },
  { value: 1, label: 'Plaquetas 100,000-149,999' },
  { value: 2, label: 'Plaquetas 50,000-99,999' },
  { value: 3, label: 'Plaquetas 20,000-49,999' },
  { value: 4, label: 'Plaquetas <20,000' }
];

const liverOptions = [
  { value: 0, label: 'Bilirrubina <1.2 mg/dL' },
  { value: 1, label: 'Bilirrubina 1.2-1.9 mg/dL' },
  { value: 2, label: 'Bilirrubina 2.0-5.9 mg/dL' },
  { value: 3, label: 'Bilirrubina 6.0-11.9 mg/dL' },
  { value: 4, label: 'Bilirrubina ≥12.0 mg/dL' }
];

const cardiovascularOptions = [
  { value: 0, label: 'PAM ≥70 mmHg' },
  { value: 1, label: 'PAM <70 mmHg' },
  { value: 2, label: 'Dopamina ≤5 o dobutamina cualquier dosis' },
  { value: 3, label: 'Dopamina >5 o epinefrina ≤0.1 o norepinefrina ≤0.1' },
  { value: 4, label: 'Dopamina >15 o epinefrina >0.1 o norepinefrina >0.1' }
];

const centralNervousSystemOptions = [
  { value: 0, label: 'Glasgow 15' },
  { value: 1, label: 'Glasgow 13-14' },
  { value: 2, label: 'Glasgow 10-12' },
  { value: 3, label: 'Glasgow 6-9' },
  { value: 4, label: 'Glasgow 3-5' }
];

const renalOptions = [
  { value: 0, label: 'Creatinina <1.2 mg/dL' },
  { value: 1, label: 'Creatinina 1.2-1.9 mg/dL' },
  { value: 2, label: 'Creatinina 2.0-3.4 mg/dL' },
  { value: 3, label: 'Creatinina 3.5-4.9 mg/dL o diuresis <500 mL/día' },
  { value: 4, label: 'Creatinina ≥5.0 mg/dL o diuresis <200 mL/día' }
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

  // Estados para todas las escalas
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

  const [apacheScore, setApacheScore] = useState<APACHEIIScore>({
    temperature: 0,
    meanArterialPressure: 0,
    heartRate: 0,
    respiratoryRate: 0,
    oxygenation: 0,
    arterialPH: 0,
    serumSodium: 0,
    serumPotassium: 0,
    serumCreatinine: 0,
    hematocrit: 0,
    whiteBloodCells: 0,
    glasgowComaScale: 0,
    age: 0,
    chronicHealth: 0
  });

  const [sofaScore, setSofaScore] = useState<SOFAScore>({
    respiration: 0,
    coagulation: 0,
    liver: 0,
    cardiovascular: 0,
    centralNervousSystem: 0,
    renal: 0
  });

  const [wellsScore, setWellsScore] = useState<WellsScore>({
    clinicalSymptoms: false,
    heartRate: false,
    immobilization: false,
    previousDVT: false,
    hemoptysis: false,
    malignancy: false,
    alternativeDiagnosis: false
  });

  const [cha2ds2VascScore, setCha2ds2VascScore] = useState<CHA2DS2VAScScore>({
    congestiveHeartFailure: false,
    hypertension: false,
    age: 0,
    diabetes: false,
    stroke: false,
    vascularDisease: false,
    sex: false
  });

  const [curb65Score, setCurb65Score] = useState<CURB65Score>({
    confusion: false,
    urea: false,
    respiratoryRate: false,
    bloodPressure: false,
    age: false
  });

  // Funciones de cálculo
  const calculateGlasgowBlatchford = () => {
    let total = 0;
    
    total += glasgowScore.urea;
    total += glasgowScore.hemoglobin;
    total += glasgowScore.systolicBP;
    
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

    setResult({
      score: total,
      risk,
      recommendation,
      interpretation
    });
  };

  const calculateApacheII = () => {
    let total = 0;
    
    total += apacheScore.temperature;
    total += apacheScore.meanArterialPressure;
    total += apacheScore.heartRate;
    total += apacheScore.respiratoryRate;
    total += apacheScore.oxygenation;
    total += apacheScore.arterialPH;
    total += apacheScore.serumSodium;
    total += apacheScore.serumPotassium;
    total += apacheScore.serumCreatinine;
    total += apacheScore.hematocrit;
    total += apacheScore.whiteBloodCells;
    total += apacheScore.glasgowComaScale;
    total += apacheScore.age;
    total += apacheScore.chronicHealth;

    let risk = '';
    let recommendation = '';
    let interpretation = '';
    let additionalInfo = '';

    if (total <= 10) {
      risk = 'Bajo';
      recommendation = 'Monitoreo estándar en UCI';
      interpretation = 'Mortalidad estimada: 4-15%';
      additionalInfo = 'Paciente con buen pronóstico';
    } else if (total <= 15) {
      risk = 'Moderado';
      recommendation = 'Monitoreo intensivo, optimización de tratamiento';
      interpretation = 'Mortalidad estimada: 16-25%';
      additionalInfo = 'Requiere atención médica intensiva';
    } else if (total <= 20) {
      risk = 'Alto';
      recommendation = 'Manejo agresivo, considerar limitación de esfuerzo terapéutico';
      interpretation = 'Mortalidad estimada: 26-40%';
      additionalInfo = 'Pronóstico reservado';
    } else if (total <= 25) {
      risk = 'Muy alto';
      recommendation = 'Cuidados intensivos máximos, discutir pronóstico con familia';
      interpretation = 'Mortalidad estimada: 41-70%';
      additionalInfo = 'Pronóstico muy reservado';
    } else {
      risk = 'Crítico';
      recommendation = 'Considerar cuidados paliativos, discutir limitación de esfuerzo terapéutico';
      interpretation = 'Mortalidad estimada: >70%';
      additionalInfo = 'Pronóstico extremadamente reservado';
    }

    setResult({
      score: total,
      risk,
      recommendation,
      interpretation,
      additionalInfo
    });
  };

  const calculateSOFA = () => {
    let total = 0;
    
    total += sofaScore.respiration;
    total += sofaScore.coagulation;
    total += sofaScore.liver;
    total += sofaScore.cardiovascular;
    total += sofaScore.centralNervousSystem;
    total += sofaScore.renal;

    let risk = '';
    let recommendation = '';
    let interpretation = '';

    if (total <= 6) {
      risk = 'Bajo';
      recommendation = 'Monitoreo estándar';
      interpretation = 'Mortalidad estimada: <10%';
    } else if (total <= 9) {
      risk = 'Moderado';
      recommendation = 'Monitoreo intensivo';
      interpretation = 'Mortalidad estimada: 15-20%';
    } else if (total <= 12) {
      risk = 'Alto';
      recommendation = 'Soporte orgánico intensivo';
      interpretation = 'Mortalidad estimada: 40-50%';
    } else {
      risk = 'Muy alto';
      recommendation = 'Soporte vital máximo, considerar pronóstico';
      interpretation = 'Mortalidad estimada: >80%';
    }

    setResult({
      score: total,
      risk,
      recommendation,
      interpretation
    });
  };

  const calculateWells = () => {
    let total = 0;
    
    if (wellsScore.clinicalSymptoms) total += 3;
    if (wellsScore.heartRate) total += 1.5;
    if (wellsScore.immobilization) total += 1.5;
    if (wellsScore.previousDVT) total += 1.5;
    if (wellsScore.hemoptysis) total += 1;
    if (wellsScore.malignancy) total += 1;
    if (!wellsScore.alternativeDiagnosis) total += 3;

    let risk = '';
    let recommendation = '';
    let interpretation = '';

    if (total <= 4) {
      risk = 'Bajo';
      recommendation = 'Realizar dímero D. Si negativo, descartar TEP';
      interpretation = 'Probabilidad de TEP: <15%';
    } else if (total <= 6) {
      risk = 'Moderado';
      recommendation = 'Realizar angiografía CT o gammagrafía pulmonar';
      interpretation = 'Probabilidad de TEP: 15-40%';
    } else {
      risk = 'Alto';
      recommendation = 'Realizar angiografía CT urgente o iniciar anticoagulación';
      interpretation = 'Probabilidad de TEP: >40%';
    }

    setResult({
      score: total,
      risk,
      recommendation,
      interpretation
    });
  };

  const calculateCHA2DS2VASc = () => {
    let total = 0;
    
    if (cha2ds2VascScore.congestiveHeartFailure) total += 1;
    if (cha2ds2VascScore.hypertension) total += 1;
    total += cha2ds2VascScore.age;
    if (cha2ds2VascScore.diabetes) total += 1;
    if (cha2ds2VascScore.stroke) total += 2;
    if (cha2ds2VascScore.vascularDisease) total += 1;
    if (cha2ds2VascScore.sex) total += 1;

    let risk = '';
    let recommendation = '';
    let interpretation = '';

    if (total === 0) {
      risk = 'Muy bajo';
      recommendation = 'No anticoagulación. Reevaluar anualmente';
      interpretation = 'Riesgo de stroke: 0%';
    } else if (total === 1) {
      risk = 'Bajo';
      recommendation = 'Considerar anticoagulación (preferir no anticoagular)';
      interpretation = 'Riesgo de stroke: 1.3%';
    } else if (total === 2) {
      risk = 'Moderado';
      recommendation = 'Anticoagulación oral recomendada';
      interpretation = 'Riesgo de stroke: 2.2%';
    } else {
      risk = 'Alto';
      recommendation = 'Anticoagulación oral fuertemente recomendada';
      interpretation = `Riesgo de stroke: ${total >= 9 ? '>15%' : (3.2 + (total - 2) * 1.5).toFixed(1) + '%'}`;
    }

    setResult({
      score: total,
      risk,
      recommendation,
      interpretation
    });
  };

  const calculateCURB65 = () => {
    let total = 0;
    
    if (curb65Score.confusion) total += 1;
    if (curb65Score.urea) total += 1;
    if (curb65Score.respiratoryRate) total += 1;
    if (curb65Score.bloodPressure) total += 1;
    if (curb65Score.age) total += 1;

    let risk = '';
    let recommendation = '';
    let interpretation = '';

    if (total <= 1) {
      risk = 'Bajo';
      recommendation = 'Manejo ambulatorio. Antibióticos orales';
      interpretation = 'Mortalidad: <3%';
    } else if (total === 2) {
      risk = 'Moderado';
      recommendation = 'Considerar hospitalización. Antibióticos IV';
      interpretation = 'Mortalidad: 3-15%';
    } else {
      risk = 'Alto';
      recommendation = 'Hospitalización. Considerar UCI si ≥4 puntos';
      interpretation = 'Mortalidad: >15%';
    }

    setResult({
      score: total,
      risk,
      recommendation,
      interpretation
    });
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
    setApacheScore({
      temperature: 0,
      meanArterialPressure: 0,
      heartRate: 0,
      respiratoryRate: 0,
      oxygenation: 0,
      arterialPH: 0,
      serumSodium: 0,
      serumPotassium: 0,
      serumCreatinine: 0,
      hematocrit: 0,
      whiteBloodCells: 0,
      glasgowComaScale: 0,
      age: 0,
      chronicHealth: 0
    });
    setSofaScore({
      respiration: 0,
      coagulation: 0,
      liver: 0,
      cardiovascular: 0,
      centralNervousSystem: 0,
      renal: 0
    });
    setWellsScore({
      clinicalSymptoms: false,
      heartRate: false,
      immobilization: false,
      previousDVT: false,
      hemoptysis: false,
      malignancy: false,
      alternativeDiagnosis: false
    });
    setCha2ds2VascScore({
      congestiveHeartFailure: false,
      hypertension: false,
      age: 0,
      diabetes: false,
      stroke: false,
      vascularDisease: false,
      sex: false
    });
    setCurb65Score({
      confusion: false,
      urea: false,
      respiratoryRate: false,
      bloodPressure: false,
      age: false
    });
    setResult(null);
  };

  const copyResult = () => {
    if (!result) return;
    
    const scaleName = 
      activeScale === 'glasgow-blatchford' ? 'Glasgow-Blatchford Bleeding Score' :
      activeScale === 'apache-ii' ? 'APACHE II Score' :
      activeScale === 'sofa' ? 'SOFA Score' :
      activeScale === 'wells' ? 'Wells Score para TEP' :
      activeScale === 'cha2ds2-vasc' ? 'CHA2DS2-VASc Score' :
      'CURB-65 Score';

    const text = `${scaleName}

Puntuación: ${result.score}
Riesgo: ${result.risk}
Recomendación: ${result.recommendation}
Interpretación: ${result.interpretation}${result.additionalInfo ? `
Información adicional: ${result.additionalInfo}` : ''}`;

    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Error al copiar:', err));
  };

  const insertIntoNote = () => {
    if (!result || !onScaleGenerated) return;
    
    const scaleName = 
      activeScale === 'glasgow-blatchford' ? 'Glasgow-Blatchford Bleeding Score' :
      activeScale === 'apache-ii' ? 'APACHE II Score' :
      activeScale === 'sofa' ? 'SOFA Score' :
      activeScale === 'wells' ? 'Wells Score para TEP' :
      activeScale === 'cha2ds2-vasc' ? 'CHA2DS2-VASc Score' :
      'CURB-65 Score';

    const text = `${scaleName}: ${result.score} (${result.risk})
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
          
          <button
            onClick={() => setActiveScale('apache-ii')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              activeScale === 'apache-ii'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-emerald-300'
            }`}
          >
            <h4 className="font-semibold text-gray-900 dark:text-white">
              APACHE II Score
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Evalúa la gravedad de la enfermedad y predice mortalidad en cuidados intensivos
            </p>
          </button>

          <button
            onClick={() => setActiveScale('sofa')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              activeScale === 'sofa'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-emerald-300'
            }`}
          >
            <h4 className="font-semibold text-gray-900 dark:text-white">
              SOFA Score
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Evalúa la disfunción orgánica secuencial en pacientes críticos
            </p>
          </button>

          <button
            onClick={() => setActiveScale('wells')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              activeScale === 'wells'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-emerald-300'
            }`}
          >
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Wells Score para TEP
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Evalúa la probabilidad de tromboembolismo pulmonar
            </p>
          </button>

          <button
            onClick={() => setActiveScale('cha2ds2-vasc')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              activeScale === 'cha2ds2-vasc'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-emerald-300'
            }`}
          >
            <h4 className="font-semibold text-gray-900 dark:text-white">
              CHA2DS2-VASc Score
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Evalúa el riesgo de stroke en pacientes con fibrilación auricular
            </p>
          </button>

          <button
            onClick={() => setActiveScale('curb-65')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              activeScale === 'curb-65'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-emerald-300'
            }`}
          >
            <h4 className="font-semibold text-gray-900 dark:text-white">
              CURB-65 Score
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Evalúa la gravedad de la neumonía adquirida en la comunidad
            </p>
          </button>
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
                Calcular Glasgow-Blatchford
              </Button>
              
              <Button
                onClick={clearAll}
                variant="outline"
                className="flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Calculadora APACHE II */}
      {activeScale === 'apache-ii' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              APACHE II Score
            </h3>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Temperatura */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temperatura:
                </label>
                <select
                  value={apacheScore.temperature}
                  onChange={(e) => setApacheScore({...apacheScore, temperature: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {temperatureOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Presión arterial media */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Presión Arterial Media:
                </label>
                <select
                  value={apacheScore.meanArterialPressure}
                  onChange={(e) => setApacheScore({...apacheScore, meanArterialPressure: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {meanArterialPressureOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Frecuencia cardíaca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frecuencia Cardíaca:
                </label>
                <select
                  value={apacheScore.heartRate}
                  onChange={(e) => setApacheScore({...apacheScore, heartRate: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {heartRateOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Frecuencia respiratoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frecuencia Respiratoria:
                </label>
                <select
                  value={apacheScore.respiratoryRate}
                  onChange={(e) => setApacheScore({...apacheScore, respiratoryRate: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {respiratoryRateOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Oxigenación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Oxigenación:
                </label>
                <select
                  value={apacheScore.oxygenation}
                  onChange={(e) => setApacheScore({...apacheScore, oxygenation: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {oxygenationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* pH arterial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  pH Arterial:
                </label>
                <select
                  value={apacheScore.arterialPH}
                  onChange={(e) => setApacheScore({...apacheScore, arterialPH: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {arterialPHOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sodio sérico */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sodio Sérico:
                </label>
                <select
                  value={apacheScore.serumSodium}
                  onChange={(e) => setApacheScore({...apacheScore, serumSodium: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {serumSodiumOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Potasio sérico */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Potasio Sérico:
                </label>
                <select
                  value={apacheScore.serumPotassium}
                  onChange={(e) => setApacheScore({...apacheScore, serumPotassium: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {serumPotassiumOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Creatinina sérica */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Creatinina Sérica:
                </label>
                <select
                  value={apacheScore.serumCreatinine}
                  onChange={(e) => setApacheScore({...apacheScore, serumCreatinine: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {serumCreatinineOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hematocrito */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hematocrito:
                </label>
                <select
                  value={apacheScore.hematocrit}
                  onChange={(e) => setApacheScore({...apacheScore, hematocrit: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {hematocritOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Glóbulos blancos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Glóbulos Blancos:
                </label>
                <select
                  value={apacheScore.whiteBloodCells}
                  onChange={(e) => setApacheScore({...apacheScore, whiteBloodCells: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {whiteBloodCellsOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Escala de Glasgow */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Escala de Glasgow:
                </label>
                <select
                  value={apacheScore.glasgowComaScale}
                  onChange={(e) => setApacheScore({...apacheScore, glasgowComaScale: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {glasgowComaScaleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Edad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Edad:
                </label>
                <select
                  value={apacheScore.age}
                  onChange={(e) => setApacheScore({...apacheScore, age: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {ageOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Salud crónica */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Salud Crónica:
                </label>
                <select
                  value={apacheScore.chronicHealth}
                  onChange={(e) => setApacheScore({...apacheScore, chronicHealth: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {chronicHealthOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={calculateApacheII}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <SparklesIcon className="h-4 w-4" />
                Calcular APACHE II
              </Button>
              
              <Button
                onClick={clearAll}
                variant="outline"
                className="flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Calculadora SOFA */}
      {activeScale === 'sofa' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              SOFA Score
            </h3>
            
            <div className="grid gap-6">
              {/* Respiración */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Respiración:
                </label>
                <select
                  value={sofaScore.respiration}
                  onChange={(e) => setSofaScore({...sofaScore, respiration: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {respirationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Coagulación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coagulación:
                </label>
                <select
                  value={sofaScore.coagulation}
                  onChange={(e) => setSofaScore({...sofaScore, coagulation: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {coagulationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hígado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hígado:
                </label>
                <select
                  value={sofaScore.liver}
                  onChange={(e) => setSofaScore({...sofaScore, liver: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {liverOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cardiovascular */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cardiovascular:
                </label>
                <select
                  value={sofaScore.cardiovascular}
                  onChange={(e) => setSofaScore({...sofaScore, cardiovascular: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {cardiovascularOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sistema nervioso central */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sistema Nervioso Central:
                </label>
                <select
                  value={sofaScore.centralNervousSystem}
                  onChange={(e) => setSofaScore({...sofaScore, centralNervousSystem: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {centralNervousSystemOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Renal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Renal:
                </label>
                <select
                  value={sofaScore.renal}
                  onChange={(e) => setSofaScore({...sofaScore, renal: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {renalOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={calculateSOFA}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <SparklesIcon className="h-4 w-4" />
                Calcular SOFA
              </Button>
              
              <Button
                onClick={clearAll}
                variant="outline"
                className="flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Calculadora Wells */}
      {activeScale === 'wells' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Wells Score para TEP
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="clinicalSymptoms"
                  checked={wellsScore.clinicalSymptoms}
                  onChange={(e) => setWellsScore({...wellsScore, clinicalSymptoms: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="clinicalSymptoms" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Síntomas clínicos de TVP (3 puntos)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="heartRate"
                  checked={wellsScore.heartRate}
                  onChange={(e) => setWellsScore({...wellsScore, heartRate: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                                 <label htmlFor="heartRate" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                   Frecuencia cardíaca {'>'}100 lpm (1.5 puntos)
                 </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="immobilization"
                  checked={wellsScore.immobilization}
                  onChange={(e) => setWellsScore({...wellsScore, immobilization: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="immobilization" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Inmovilización o cirugía en las últimas 4 semanas (1.5 puntos)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="previousDVT"
                  checked={wellsScore.previousDVT}
                  onChange={(e) => setWellsScore({...wellsScore, previousDVT: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="previousDVT" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Historia previa de TVP o TEP (1.5 puntos)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hemoptysis"
                  checked={wellsScore.hemoptysis}
                  onChange={(e) => setWellsScore({...wellsScore, hemoptysis: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="hemoptysis" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Hemoptisis (1 punto)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="malignancy"
                  checked={wellsScore.malignancy}
                  onChange={(e) => setWellsScore({...wellsScore, malignancy: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="malignancy" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Malignidad (1 punto)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="alternativeDiagnosis"
                  checked={wellsScore.alternativeDiagnosis}
                  onChange={(e) => setWellsScore({...wellsScore, alternativeDiagnosis: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="alternativeDiagnosis" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Diagnóstico alternativo más probable que TEP (3 puntos)
                </label>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={calculateWells}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <SparklesIcon className="h-4 w-4" />
                Calcular Wells
              </Button>
              
              <Button
                onClick={clearAll}
                variant="outline"
                className="flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Calculadora CHA2DS2-VASc */}
      {activeScale === 'cha2ds2-vasc' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              CHA2DS2-VASc Score
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="congestiveHeartFailure"
                  checked={cha2ds2VascScore.congestiveHeartFailure}
                  onChange={(e) => setCha2ds2VascScore({...cha2ds2VascScore, congestiveHeartFailure: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="congestiveHeartFailure" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Insuficiencia cardíaca congestiva (1 punto)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hypertension"
                  checked={cha2ds2VascScore.hypertension}
                  onChange={(e) => setCha2ds2VascScore({...cha2ds2VascScore, hypertension: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="hypertension" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Hipertensión (1 punto)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Edad:
                </label>
                <select
                  value={cha2ds2VascScore.age}
                  onChange={(e) => setCha2ds2VascScore({...cha2ds2VascScore, age: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value={0}>Menor de 65 años</option>
                  <option value={1}>65-74 años (1 punto)</option>
                  <option value={2}>≥75 años (2 puntos)</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="diabetes"
                  checked={cha2ds2VascScore.diabetes}
                  onChange={(e) => setCha2ds2VascScore({...cha2ds2VascScore, diabetes: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="diabetes" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Diabetes mellitus (1 punto)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="stroke"
                  checked={cha2ds2VascScore.stroke}
                  onChange={(e) => setCha2ds2VascScore({...cha2ds2VascScore, stroke: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="stroke" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Stroke/AIT/tromboembolismo previo (2 puntos)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="vascularDisease"
                  checked={cha2ds2VascScore.vascularDisease}
                  onChange={(e) => setCha2ds2VascScore({...cha2ds2VascScore, vascularDisease: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="vascularDisease" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Enfermedad vascular (IAM, arteriopatía periférica, placa aórtica) (1 punto)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sex"
                  checked={cha2ds2VascScore.sex}
                  onChange={(e) => setCha2ds2VascScore({...cha2ds2VascScore, sex: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="sex" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Sexo femenino (1 punto)
                </label>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={calculateCHA2DS2VASc}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <SparklesIcon className="h-4 w-4" />
                Calcular CHA2DS2-VASc
              </Button>
              
              <Button
                onClick={clearAll}
                variant="outline"
                className="flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Calculadora CURB-65 */}
      {activeScale === 'curb-65' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              CURB-65 Score
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="confusion"
                  checked={curb65Score.confusion}
                  onChange={(e) => setCurb65Score({...curb65Score, confusion: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="confusion" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Confusion (desorientación) (1 punto)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="urea"
                  checked={curb65Score.urea}
                  onChange={(e) => setCurb65Score({...curb65Score, urea: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                                 <label htmlFor="urea" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                   Urea {'>'}7 mmol/L ({'>'}19 mg/dL) (1 punto)
                 </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="respiratoryRate"
                  checked={curb65Score.respiratoryRate}
                  onChange={(e) => setCurb65Score({...curb65Score, respiratoryRate: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="respiratoryRate" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Respiratory rate ≥30 rpm (1 punto)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="bloodPressure"
                  checked={curb65Score.bloodPressure}
                  onChange={(e) => setCurb65Score({...curb65Score, bloodPressure: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="bloodPressure" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Blood pressure (sistólica {'<'}90 mmHg o diastólica ≤60 mmHg) (1 punto)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="age"
                  checked={curb65Score.age}
                  onChange={(e) => setCurb65Score({...curb65Score, age: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="age" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Age ≥65 años (1 punto)
                </label>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={calculateCURB65}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <SparklesIcon className="h-4 w-4" />
                Calcular CURB-65
              </Button>
              
              <Button
                onClick={clearAll}
                variant="outline"
                className="flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Resultado de la Escala
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
                Recomendación:
              </h4>
              <p className="text-gray-700 dark:text-gray-300 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                {result.recommendation}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Interpretación:
              </h4>
              <p className="text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                {result.interpretation}
              </p>
            </div>

            {result.additionalInfo && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Información adicional:
                </h4>
                <p className="text-gray-700 dark:text-gray-300 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  {result.additionalInfo}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalScaleGenerator; 