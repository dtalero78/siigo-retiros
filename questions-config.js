// Configuración de preguntas por área
// Basado en GENERAL.pdf y SALES.pdf

const questionsGeneral = [
  // SECCIÓN 01: Experiencia en Siigo
  {
    number: 1,
    section: "01| Experiencia en Siigo",
    question: "¿Cómo fue tu experiencia general en Siigo?",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Negativa", "Excelente"]
  },
  {
    number: 2,
    section: "01| Experiencia en Siigo",
    question: "¿Qué razones te llevaron a elegir trabajar en Siigo?",
    type: "dropdown",
    required: true,
    options: [
      "Oportunidad de crecimiento y desarrollo profesional",
      "Cultura organizacional",
      "Plan de carrera y formación interna",
      "Estabilidad laboral",
      "Beneficios y compensación",
      "Trabajo remoto",
      "Recomendación de amigos o conocidos",
      "Posicionamiento y reputación de la empresa en el mercado",
      "Oportunidad de primer empleo o experiencia laboral",
      "Otro (¿cuál?)"
    ]
  },
  {
    number: 3,
    section: "01| Experiencia en Siigo",
    question: "¿Se cumplieron tus expectativas en Siigo?",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Nada", "Totalmente"]
  },
  {
    number: 4,
    section: "01| Experiencia en Siigo",
    question: "¿Por qué?",
    type: "textarea",
    required: false,
    placeholder: "Cuéntanos más sobre el cumplimiento de tus expectativas"
  },

  // SECCIÓN 02: Clima y Cultura Siigo
  {
    number: 5,
    section: "02| Clima y Cultura Siigo",
    question: "¿Cómo describirías el ambiente de trabajo con tu equipo y en Siigo en general?",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Muy negativo", "Muy positivo"]
  },
  {
    number: 6,
    section: "02| Clima y Cultura Siigo",
    question: "¿Cómo podrías describir tu relación con tu líder o entrenador?",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Decepcionante", "Excelente"]
  },
  {
    number: 7,
    section: "02| Clima y Cultura Siigo",
    question: "¿Por qué?",
    type: "textarea",
    required: false,
    placeholder: "Cuéntanos más sobre tu relación con tu líder"
  },
  {
    number: 8,
    section: "02| Clima y Cultura Siigo",
    question: "¿En qué medida crees que se vivió la cultura Siigo en tu día a día?",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Nada", "Totalmente"]
  },
  {
    number: 9,
    section: "02| Clima y Cultura Siigo",
    question: "¿Por qué?",
    type: "textarea",
    required: false,
    placeholder: "Comparte tu experiencia sobre la cultura Siigo"
  },

  // SECCIÓN 03: Siigo
  {
    number: 10,
    section: "03| Siigo",
    question: "Recomendarías trabajar en Siigo a un amigo o familiar",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Para nada", "Absolutamente"]
  },
  {
    number: 11,
    section: "03| Siigo",
    question: "¿Qué fue lo que más disfrutaste de trabajar en Siigo?",
    type: "textarea",
    required: true,
    placeholder: "Comparte lo que más valoraste de tu experiencia"
  },
  {
    number: 12,
    section: "03| Siigo",
    question: "¿Qué crees que podríamos mejorar como organización?",
    type: "textarea",
    required: true,
    placeholder: "Tus sugerencias son muy importantes para nosotros"
  },

  // SECCIÓN 04: Razones
  {
    number: 13,
    section: "04| Razones",
    question: "Selecciona la categoría que mejor representa el motivo principal de tu decisión de retirarte:",
    type: "dropdown",
    required: true,
    options: [
      "Ambiente laboral negativo",
      "Anticipar terminación de contrato",
      "Cambio en condiciones acordadas",
      "Cambio de proyecto, estudios u objetivos personales",
      "Carga laboral o estrés alto",
      "Choque con estilo de liderazgo",
      "Deficiente onboarding/inducción",
      "Desalineación con valores de la empresa",
      "Dificultad para conciliar trabajo y vida personal",
      "Falta de capacitación continua",
      "Falta de oportunidades de crecimiento",
      "Inconformidad con comisiones",
      "Insatisfacción con beneficios",
      "Mejor oferta laboral",
      "Motivos personales",
      "Problemas de conectividad",
      "Problemas de salud personal",
      "Presión por metas",
      "Rol no acorde a perfil"
    ]
  },
  {
    number: 14,
    section: "04| Razones",
    question: "¿Por qué?",
    type: "textarea",
    required: false,
    placeholder: "Explica con más detalle tu motivo principal"
  },
  {
    number: 15,
    section: "04| Razones",
    question: "¿Qué crees que Siigo podría haber hecho para que decidieras quedarte?",
    type: "textarea",
    required: true,
    placeholder: "Tu respuesta puede ser en texto o voz"
  },
  {
    number: 16,
    section: "04| Razones",
    question: "¿Qué fue lo que más influyó en tu decisión de salir de Siigo?",
    type: "textarea",
    required: true,
    placeholder: "Tu respuesta puede ser en texto o voz"
  },
  {
    number: 17,
    section: "04| Razones",
    question: "¿Tu decisión de salir fue algo que venías pensando desde hace tiempo o surgió recientemente?",
    type: "radio",
    required: true,
    options: [
      "Hace mucho tiempo",
      "Últimos meses",
      "Decisión reciente",
      "Otro (¿Cuál?)"
    ]
  }
];

const questionsSales = [
  // SECCIÓN 01: Experiencia general en Siigo
  {
    number: 1,
    section: "01| Experiencia general en Siigo",
    question: "¿Cómo fue tu experiencia general en Siigo?",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Negativa", "Excelente"]
  },
  {
    number: 2,
    section: "01| Experiencia general en Siigo",
    question: "¿Qué razones te llevaron a elegir trabajar en Siigo?",
    type: "dropdown",
    required: true,
    options: [
      "Oportunidad de crecimiento y desarrollo profesional",
      "Cultura organizacional",
      "Plan de carrera y formación interna",
      "Estabilidad laboral",
      "Beneficios y compensación",
      "Trabajo remoto",
      "Recomendación de amigos o conocidos",
      "Posicionamiento y reputación de la empresa en el mercado",
      "Oportunidad de primer empleo o experiencia laboral",
      "Otro (¿cuál?)"
    ]
  },
  {
    number: 3,
    section: "01| Experiencia general en Siigo",
    question: "¿Se cumplieron tus expectativas en Siigo?",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Nada", "Totalmente"]
  },
  {
    number: 4,
    section: "01| Experiencia general en Siigo",
    question: "¿Por qué?",
    type: "textarea",
    required: false,
    placeholder: "Cuéntanos más sobre el cumplimiento de tus expectativas"
  },

  // SECCIÓN 02: Clima y Cultura Siigo
  {
    number: 5,
    section: "02| Clima y Cultura Siigo",
    question: "¿Cómo describirías el ambiente de trabajo con tu equipo y en Siigo en general?",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Muy negativo", "Muy positivo"]
  },
  {
    number: 6,
    section: "02| Clima y Cultura Siigo",
    question: "¿Cómo podrías describir tu relación con tu líder o entrenador?",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Decepcionante", "Excelente"]
  },
  {
    number: 7,
    section: "02| Clima y Cultura Siigo",
    question: "¿Por qué?",
    type: "textarea",
    required: false,
    placeholder: "Cuéntanos más sobre tu relación con tu líder"
  },
  {
    number: 8,
    section: "02| Clima y Cultura Siigo",
    question: "¿En qué medida crees que se vivió la cultura Siigo en tu día a día?",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Nada", "Totalmente"]
  },
  {
    number: 9,
    section: "02| Clima y Cultura Siigo",
    question: "¿Por qué?",
    type: "textarea",
    required: false,
    placeholder: "Comparte tu experiencia sobre la cultura Siigo"
  },

  // SECCIÓN 03: Proceso de selección y contratación (ESPECÍFICO PARA SALES)
  {
    number: 10,
    section: "03| Proceso de selección y contratación",
    question: "¿Cómo te sentiste durante tu proceso de selección y contratación en Siigo?",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Muy mal", "Excelente"]
  },
  {
    number: 11,
    section: "03| Proceso de selección y contratación",
    question: "¿Qué tan clara y transparente fue la información que recibiste sobre salario, comisiones, horarios y beneficios?",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Nada clara", "Muy clara"]
  },
  {
    number: 12,
    section: "03| Proceso de selección y contratación",
    question: "¿Encontraste alguna diferencia entre lo que se te comunicó en el proceso y lo que realmente viviste en tu rol?",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Mucha diferencia", "Ninguna diferencia"]
  },
  {
    number: 13,
    section: "03| Proceso de selección y contratación",
    question: "¿Sientes que te contactamos a tiempo para la firma de contrato y el inicio de tu inducción?",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Nada oportuno", "Totalmente oportuno"]
  },
  {
    number: 14,
    section: "03| Proceso de selección y contratación",
    question: "Desde tu ingreso, ¿contaste con todas las herramientas tecnológicas (computador, teclado, mouse etc) necesarias para desempeñarte en tu rol?",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Nada", "Totalmente"]
  },
  {
    number: 15,
    section: "03| Proceso de selección y contratación",
    question: "Algún comentario adicional",
    type: "textarea",
    required: false,
    placeholder: "Comparte cualquier comentario adicional sobre el proceso"
  },

  // SECCIÓN 04: Entrenamiento e Inducción (ESPECÍFICO PARA SALES)
  {
    number: 16,
    section: "04| Entrenamiento e Inducción",
    question: "¿La metodología de aprendizaje te ayudó a comprender bien nuestro producto, las plataformas tecnológicas (synergy, teams, oracle etc) y los procesos?",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Muy negativo", "Muy positivo"]
  },
  {
    number: 17,
    section: "04| Entrenamiento e Inducción",
    question: "¿Por qué?",
    type: "textarea",
    required: false,
    placeholder: "Explica tu experiencia con la metodología de aprendizaje"
  },
  {
    number: 18,
    section: "04| Entrenamiento e Inducción",
    question: "¿Qué tan acompañado(a) te sentiste por tu formador en esas primeras semanas?",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Nada acompañado", "Totalmente acompañado"]
  },
  {
    number: 19,
    section: "04| Entrenamiento e Inducción",
    question: "¿Por qué?",
    type: "textarea",
    required: false,
    placeholder: "Cuéntanos sobre el acompañamiento recibido"
  },
  {
    number: 20,
    section: "04| Entrenamiento e Inducción",
    question: "¿Recibiste feedback oportuno durante tu proceso de formación?",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Nada oportuno", "Totalmente oportuno"]
  },
  {
    number: 21,
    section: "04| Entrenamiento e Inducción",
    question: "¿Por qué?",
    type: "textarea",
    required: false,
    placeholder: "Comparte tu experiencia con el feedback recibido"
  },

  // SECCIÓN 05: Siigo Satisfacción
  {
    number: 22,
    section: "05| Siigo Satisfacción",
    question: "Recomendarías trabajar en Siigo a un amigo o familiar",
    type: "scale",
    required: true,
    min: 0,
    max: 10,
    labels: ["Para nada", "Absolutamente"]
  },

  // SECCIÓN 07: Razones (nota: el PDF salta de 05 a 07)
  {
    number: 23,
    section: "07| Razones",
    question: "Selecciona la categoría que mejor representa el motivo principal de tu decisión de retirarte:",
    type: "dropdown",
    required: true,
    options: [
      "Ambiente laboral negativo",
      "Anticipar terminación de contrato",
      "Cambio en condiciones acordadas",
      "Cambio de proyecto, estudios u objetivos personales",
      "Carga laboral o estrés alto",
      "Choque con estilo de liderazgo",
      "Deficiente onboarding/inducción",
      "Desalineación con valores de la empresa",
      "Dificultad para conciliar trabajo y vida personal",
      "Falta de capacitación continua",
      "Falta de oportunidades de crecimiento",
      "Inconformidad con comisiones",
      "Insatisfacción con beneficios",
      "Mejor oferta laboral",
      "Motivos personales",
      "Problemas de conectividad",
      "Problemas de salud personal",
      "Presión por metas",
      "Rol no acorde a perfil"
    ]
  },
  {
    number: 25,
    section: "07| Razones",
    question: "¿Por qué?",
    type: "textarea",
    required: false,
    placeholder: "Explica con más detalle tu motivo principal"
  },
  {
    number: 26,
    section: "07| Razones",
    question: "¿Qué crees que Siigo podría haber hecho para que decidieras quedarte?",
    type: "textarea",
    required: true,
    placeholder: "Tu respuesta nos ayuda a mejorar"
  },
  {
    number: 27,
    section: "07| Razones",
    question: "¿Qué fue lo que más influyó en tu decisión de salir de Siigo?",
    type: "textarea",
    required: true,
    placeholder: "Comparte los factores más importantes"
  },
  {
    number: 28,
    section: "07| Razones",
    question: "¿Tu decisión de salir fue algo que venías pensando desde hace tiempo o surgió recientemente?",
    type: "radio",
    required: true,
    options: [
      "Hace mucho tiempo",
      "Últimos meses",
      "Decisión reciente",
      "Otro (¿Cuál?)"
    ]
  }
];

// Función para obtener las preguntas según el área
function getQuestionsByArea(area) {
  // Si el área es "Sales", usar las preguntas específicas de Sales
  if (area && area.toLowerCase() === 'sales') {
    return questionsSales;
  }
  // Para cualquier otra área, usar las preguntas generales
  return questionsGeneral;
}

module.exports = {
  questionsGeneral,
  questionsSales,
  getQuestionsByArea
};