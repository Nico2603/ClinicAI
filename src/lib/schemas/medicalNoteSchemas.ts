// ==========================================
// JSON SCHEMAS PARA NOTAS MÉDICAS ESTRUCTURADAS
// ==========================================

export const MEDICAL_NOTE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    medical_note: {
      type: "object",
      properties: {
        header: {
          type: "object",
          properties: {
            patient_name: { type: "string" },
            medical_record: { type: "string" },
            date: { type: "string" },
            specialty: { type: "string" },
            physician: { type: "string" }
          },
          required: ["date", "specialty"]
        },
        subjective: {
          type: "object",
          properties: {
            chief_complaint: { type: "string" },
            history_present_illness: { type: "string" },
            symptoms: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  symptom: { type: "string" },
                  duration: { type: "string" },
                  intensity: { type: "string" },
                  characteristics: { type: "string" }
                },
                required: ["symptom"]
              }
            },
            relevant_history: { type: "string" }
          }
        },
        objective: {
          type: "object",
          properties: {
            vital_signs: {
              type: "object",
              properties: {
                blood_pressure: { type: "string" },
                heart_rate: { type: "string" },
                temperature: { type: "string" },
                respiratory_rate: { type: "string" },
                oxygen_saturation: { type: "string" }
              }
            },
            physical_examination: {
              type: "object",
              properties: {
                general_appearance: { type: "string" },
                systems_review: {
                  type: "object",
                  properties: {
                    cardiovascular: { type: "string" },
                    respiratory: { type: "string" },
                    neurological: { type: "string" },
                    gastrointestinal: { type: "string" },
                    genitourinary: { type: "string" },
                    musculoskeletal: { type: "string" },
                    dermatological: { type: "string" }
                  }
                }
              }
            },
            diagnostic_tests: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  test_name: { type: "string" },
                  result: { type: "string" },
                  reference_range: { type: "string" },
                  interpretation: { type: "string" }
                },
                required: ["test_name", "result"]
              }
            }
          }
        },
        assessment: {
          type: "object",
          properties: {
            clinical_analysis: { type: "string" },
            differential_diagnosis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  diagnosis: { type: "string" },
                  probability: { type: "string" },
                  supporting_evidence: { type: "string" }
                },
                required: ["diagnosis"]
              }
            },
            primary_diagnosis: { type: "string" },
            secondary_diagnoses: {
              type: "array",
              items: { type: "string" }
            },
            risk_factors: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["clinical_analysis"]
        },
        plan: {
          type: "object",
          properties: {
            treatment: {
              type: "object",
              properties: {
                medications: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      dosage: { type: "string" },
                      frequency: { type: "string" },
                      duration: { type: "string" },
                      instructions: { type: "string" }
                    },
                    required: ["name", "dosage", "frequency"]
                  }
                },
                procedures: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      procedure: { type: "string" },
                      indication: { type: "string" },
                      timing: { type: "string" }
                    },
                    required: ["procedure"]
                  }
                },
                non_pharmacological: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            },
            monitoring: {
              type: "object",
              properties: {
                follow_up: { type: "string" },
                monitoring_parameters: {
                  type: "array",
                  items: { type: "string" }
                },
                warning_signs: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            },
            education: {
              type: "object",
              properties: {
                patient_education: { type: "string" },
                lifestyle_modifications: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          }
        },
        metadata: {
          type: "object",
          properties: {
            template_used: { type: "string" },
            completeness_score: { 
              type: "number", 
              minimum: 0, 
              maximum: 100 
            },
            missing_data: {
              type: "array",
              items: { type: "string" }
            },
            generation_timestamp: { type: "string" },
            verification_status: {
              type: "string",
              enum: ["verified", "needs_review", "incomplete"]
            }
          },
          required: ["template_used", "generation_timestamp"]
        }
      },
      required: ["subjective", "assessment", "plan", "metadata"]
    }
  },
  required: ["medical_note"]
};

export const CLINICAL_SCALE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    scale_evaluation: {
      type: "object",
      properties: {
        scale_name: { type: "string" },
        scale_version: { type: "string" },
        evaluation_date: { type: "string" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item_number: { type: "number" },
              item_description: { type: "string" },
              score: { 
                type: ["number", "string"],
                description: "Score value or 'insufficient_data'"
              },
              justification: { type: "string" },
              data_source: { type: "string" },
              confidence_level: {
                type: "string",
                enum: ["high", "medium", "low", "insufficient"]
              }
            },
            required: ["item_number", "item_description", "score", "justification"]
          }
        },
        total_score: {
          type: "object",
          properties: {
            raw_score: { type: "number" },
            max_possible_score: { type: "number" },
            percentage_complete: { type: "number" },
            interpretable: { type: "boolean" },
            interpretation: { type: "string" }
          },
          required: ["raw_score", "max_possible_score", "percentage_complete", "interpretable"]
        },
        clinical_interpretation: {
          type: "object",
          properties: {
            severity_level: {
              type: "string",
              enum: ["mild", "moderate", "severe", "undetermined"]
            },
            clinical_significance: { type: "string" },
            recommendations: {
              type: "array",
              items: { type: "string" }
            },
            limitations: {
              type: "array",
              items: { type: "string" }
            }
          }
        },
        missing_data: {
          type: "object",
          properties: {
            missing_items: {
              type: "array",
              items: { type: "string" }
            },
            impact_on_validity: { type: "string" },
            suggestions_for_completion: {
              type: "array",
              items: { type: "string" }
            }
          }
        },
        metadata: {
          type: "object",
          properties: {
            evaluator: { type: "string" },
            data_quality: {
              type: "string",
              enum: ["excellent", "good", "fair", "poor"]
            },
            confidence_in_evaluation: {
              type: "number",
              minimum: 0,
              maximum: 100
            }
          }
        }
      },
      required: ["scale_name", "evaluation_date", "items", "total_score", "missing_data"]
    }
  },
  required: ["scale_evaluation"]
};

export const TEMPLATE_STRUCTURE_SCHEMA = {
  type: "object",
  properties: {
    template_analysis: {
      type: "object",
      properties: {
        template_name: { type: "string" },
        specialty: { type: "string" },
        structure_elements: {
          type: "array",
          items: {
            type: "object",
            properties: {
              section_name: { type: "string" },
              section_type: {
                type: "string",
                enum: ["header", "subjective", "objective", "assessment", "plan", "footer", "custom"]
              },
              format_requirements: {
                type: "object",
                properties: {
                  text_case: {
                    type: "string",
                    enum: ["uppercase", "lowercase", "titlecase", "mixed"]
                  },
                  bullet_style: {
                    type: "string",
                    enum: ["dash", "number", "letter", "roman", "none"]
                  },
                  indentation: { type: "number" },
                  required_fields: {
                    type: "array",
                    items: { type: "string" }
                  },
                  optional_fields: {
                    type: "array",
                    items: { type: "string" }
                  }
                }
              },
              data_expectations: {
                type: "object",
                properties: {
                  expects_patient_data: { type: "boolean" },
                  expects_clinical_findings: { type: "boolean" },
                  expects_diagnostic_results: { type: "boolean" },
                  custom_requirements: {
                    type: "array",
                    items: { type: "string" }
                  }
                }
              }
            },
            required: ["section_name", "section_type", "format_requirements"]
          }
        },
        format_preservation_rules: {
          type: "array",
          items: { type: "string" }
        },
        quality_checkpoints: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["template_name", "structure_elements"]
    }
  },
  required: ["template_analysis"]
};

// ==========================================
// FUNCTION CALLING SCHEMAS
// ==========================================

export const GENERATE_MEDICAL_NOTE_FUNCTION = {
  name: "generate_structured_medical_note",
  description: "Genera una nota médica estructurada siguiendo JSON Schema estricto",
  parameters: {
    type: "object",
    properties: {
      template_structure: {
        type: "string",
        description: "Estructura exacta de la plantilla médica a seguir"
      },
      patient_information: {
        type: "string",
        description: "Información completa del paciente proporcionada"
      },
      specialty_context: {
        type: "string",
        description: "Contexto de la especialidad médica específica"
      },
      note_sections: {
        type: "object",
        properties: {
          subjective_findings: {
            type: "string",
            description: "Información subjetiva extraída del paciente"
          },
          objective_findings: {
            type: "string", 
            description: "Hallazgos objetivos identificados"
          },
          clinical_assessment: {
            type: "string",
            description: "Análisis clínico profesional"
          },
          treatment_plan: {
            type: "string",
            description: "Plan de tratamiento propuesto"
          }
        }
      },
      quality_requirements: {
        type: "object",
        properties: {
          format_fidelity: {
            type: "boolean",
            description: "Mantener 100% fidelidad al formato de plantilla"
          },
          medical_accuracy: {
            type: "boolean", 
            description: "Asegurar precisión médica en terminología"
          },
          completeness_check: {
            type: "boolean",
            description: "Verificar completitud según datos disponibles"
          }
        }
      }
    },
    required: ["template_structure", "patient_information", "specialty_context"]
  }
};

export const EVALUATE_CLINICAL_SCALE_FUNCTION = {
  name: "evaluate_clinical_scale_structured",
  description: "Evalúa una escala clínica siguiendo JSON Schema estricto",
  parameters: {
    type: "object",
    properties: {
      scale_name: {
        type: "string",
        description: "Nombre exacto de la escala clínica a evaluar"
      },
      clinical_data: {
        type: "string",
        description: "Información clínica disponible para la evaluación"
      },
      evaluation_context: {
        type: "object",
        properties: {
          patient_age: { type: "string" },
          patient_sex: { type: "string" },
          clinical_setting: { type: "string" },
          evaluation_purpose: { type: "string" }
        }
      },
      quality_standards: {
        type: "object",
        properties: {
          require_explicit_evidence: {
            type: "boolean",
            description: "Solo usar evidencia explícita disponible"
          },
          flag_insufficient_data: {
            type: "boolean",
            description: "Marcar claramente datos insuficientes"
          },
          provide_confidence_levels: {
            type: "boolean",
            description: "Incluir niveles de confianza para cada ítem"
          }
        }
      }
    },
    required: ["scale_name", "clinical_data"]
  }
};

// ==========================================
// VALIDATION UTILITIES
// ==========================================

export const validateMedicalNoteResponse = (response: any): boolean => {
  try {
    // Validación básica de estructura requerida
    if (!response.medical_note) return false;
    if (!response.medical_note.subjective) return false;
    if (!response.medical_note.assessment) return false;
    if (!response.medical_note.plan) return false;
    if (!response.medical_note.metadata) return false;
    
    // Validar metadata requerida
    const metadata = response.medical_note.metadata;
    if (!metadata.template_used || !metadata.generation_timestamp) return false;
    
    return true;
  } catch (error) {
    console.error('Error validando respuesta de nota médica:', error);
    return false;
  }
};

export const validateClinicalScaleResponse = (response: any): boolean => {
  try {
    if (!response.scale_evaluation) return false;
    if (!response.scale_evaluation.scale_name) return false;
    if (!response.scale_evaluation.items || !Array.isArray(response.scale_evaluation.items)) return false;
    if (!response.scale_evaluation.total_score) return false;
    if (!response.scale_evaluation.missing_data) return false;
    
    return true;
  } catch (error) {
    console.error('Error validando respuesta de escala clínica:', error);
    return false;
  }
};

// ==========================================
// SCHEMA GENERATORS
// ==========================================

export const generateDynamicMedicalNoteSchema = (templateStructure: string): object => {
  // Analizar estructura de plantilla y generar schema dinámico
  const baseSchema = { ...MEDICAL_NOTE_RESPONSE_SCHEMA };
  
  // Aquí podrías agregar lógica para personalizar el schema basado en la plantilla específica
  // Por ejemplo, agregar secciones específicas de especialidad
  
  return baseSchema;
};

export const generateSpecialtySpecificSchema = (specialty: string): object => {
  const baseSchema = { ...MEDICAL_NOTE_RESPONSE_SCHEMA };
  
  // Personalizar schema según especialidad
  switch (specialty.toLowerCase()) {
    case 'cardiología':
    case 'cardiology':
      // Agregar campos específicos de cardiología
      break;
    case 'neurología':
    case 'neurology':
      // Agregar campos específicos de neurología
      break;
    case 'pediatría':
    case 'pediatrics':
      // Agregar campos específicos de pediatría
      break;
    default:
      break;
  }
  
  return baseSchema;
};

const medicalNoteSchemas = {
  MEDICAL_NOTE_RESPONSE_SCHEMA,
  CLINICAL_SCALE_RESPONSE_SCHEMA,
  TEMPLATE_STRUCTURE_SCHEMA,
  GENERATE_MEDICAL_NOTE_FUNCTION,
  EVALUATE_CLINICAL_SCALE_FUNCTION,
  validateMedicalNoteResponse,
  validateClinicalScaleResponse,
  generateDynamicMedicalNoteSchema,
  generateSpecialtySpecificSchema
};

export default medicalNoteSchemas; 