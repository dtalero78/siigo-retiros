// Sistema de carga dinámica de preguntas según el área del usuario

let dynamicQuestions = [];
let userArea = null;

// Función para cargar las preguntas según el área
async function loadDynamicQuestions(area) {
    try {
        console.log('Cargando preguntas para área:', area);
        const response = await fetch(`/api/questions?area=${encodeURIComponent(area)}`);
        if (!response.ok) {
            throw new Error('Error al cargar las preguntas');
        }
        dynamicQuestions = await response.json();
        console.log(`Preguntas cargadas: ${dynamicQuestions.length} preguntas`);
        return dynamicQuestions;
    } catch (error) {
        console.error('Error cargando preguntas:', error);
        // En caso de error, cargar preguntas generales
        const fallbackResponse = await fetch('/api/questions');
        dynamicQuestions = await fallbackResponse.json();
        return dynamicQuestions;
    }
}

// Función para renderizar las preguntas en el formulario
function renderDynamicQuestions(questions, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} no encontrado`);
        return;
    }

    // Limpiar contenido previo
    container.innerHTML = '';

    // Agrupar preguntas por sección
    const sections = {};
    questions.forEach(q => {
        if (!sections[q.section]) {
            sections[q.section] = [];
        }
        sections[q.section].push(q);
    });

    // Renderizar cada sección
    Object.keys(sections).forEach(sectionName => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'question-section mb-8';

        // Título de sección
        const sectionTitle = document.createElement('h3');
        sectionTitle.className = 'text-lg font-bold text-gray-800 mb-4 border-b pb-2';
        sectionTitle.textContent = sectionName;
        sectionDiv.appendChild(sectionTitle);

        // Renderizar preguntas de la sección
        sections[sectionName].forEach(question => {
            const questionDiv = renderQuestion(question);
            sectionDiv.appendChild(questionDiv);
        });

        container.appendChild(sectionDiv);
    });
}

// Función para renderizar una pregunta individual
function renderQuestion(question) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item mb-6';
    questionDiv.setAttribute('data-question-number', question.number);

    // Label de la pregunta
    const label = document.createElement('label');
    label.className = 'block text-sm font-semibold text-gray-700 mb-2';
    label.setAttribute('for', `dq${question.number}`);
    label.innerHTML = question.question + (question.required ? ' <span class="text-red-500">*</span>' : '');
    questionDiv.appendChild(label);

    // Renderizar según el tipo de pregunta
    switch (question.type) {
        case 'text':
            questionDiv.appendChild(createTextField(question));
            break;
        case 'textarea':
            questionDiv.appendChild(createTextAreaField(question));
            break;
        case 'radio':
            questionDiv.appendChild(createRadioField(question));
            break;
        case 'dropdown':
        case 'select':
            questionDiv.appendChild(createDropdownField(question));
            break;
        case 'scale':
            questionDiv.appendChild(createScaleField(question));
            break;
        case 'date':
            questionDiv.appendChild(createDateField(question));
            break;
        case 'matrix':
            questionDiv.appendChild(createMatrixField(question));
            break;
        default:
            console.warn(`Tipo de pregunta no reconocido: ${question.type}`);
            questionDiv.appendChild(createTextField(question));
    }

    return questionDiv;
}

// Crear campo de texto
function createTextField(question) {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `dq${question.number}`;
    input.name = `dq${question.number}`;
    input.className = 'w-full border-2 border-gray-300 rounded-xl p-4 focus:border-siigo focus:outline-none transition-colors';
    input.placeholder = question.placeholder || '';
    if (question.required) input.required = true;
    return input;
}

// Crear campo de área de texto
function createTextAreaField(question) {
    const textarea = document.createElement('textarea');
    textarea.id = `dq${question.number}`;
    textarea.name = `dq${question.number}`;
    textarea.className = 'w-full border-2 border-gray-300 rounded-xl p-4 focus:border-siigo focus:outline-none transition-colors';
    textarea.rows = 4;
    textarea.placeholder = question.placeholder || '';
    if (question.required) textarea.required = true;
    return textarea;
}

// Crear campo de radio buttons
function createRadioField(question) {
    const container = document.createElement('div');
    container.className = 'space-y-2';

    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'flex items-center';

        const input = document.createElement('input');
        input.type = 'radio';
        input.id = `dq${question.number}_${index}`;
        input.name = `dq${question.number}`;
        input.value = option;
        input.className = 'mr-2 w-4 h-4 text-siigo';
        if (question.required && index === 0) input.required = true;

        const label = document.createElement('label');
        label.setAttribute('for', `dq${question.number}_${index}`);
        label.className = 'text-gray-700 cursor-pointer';
        label.textContent = option;

        optionDiv.appendChild(input);
        optionDiv.appendChild(label);
        container.appendChild(optionDiv);
    });

    return container;
}

// Crear campo dropdown
function createDropdownField(question) {
    const select = document.createElement('select');
    select.id = `dq${question.number}`;
    select.name = `dq${question.number}`;
    select.className = 'w-full border-2 border-gray-300 rounded-xl p-4 focus:border-siigo focus:outline-none transition-colors';
    if (question.required) select.required = true;

    // Opción por defecto
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecciona una opción';
    select.appendChild(defaultOption);

    // Agregar opciones
    question.options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        select.appendChild(optionElement);
    });

    return select;
}

// Crear campo de escala
function createScaleField(question) {
    const container = document.createElement('div');
    container.className = 'scale-container bg-gray-50 p-4 rounded-lg';

    const scaleWrapper = document.createElement('div');
    scaleWrapper.className = 'flex justify-between items-center';

    // Label izquierdo
    if (question.labels && question.labels[0]) {
        const leftLabel = document.createElement('span');
        leftLabel.className = 'text-sm text-gray-600 mr-2';
        leftLabel.textContent = question.labels[0];
        scaleWrapper.appendChild(leftLabel);
    }

    // Crear botones de escala
    const scaleButtons = document.createElement('div');
    scaleButtons.className = 'flex gap-2';

    for (let i = question.min; i <= question.max; i++) {
        const scaleItem = document.createElement('div');
        scaleItem.className = 'text-center';

        const input = document.createElement('input');
        input.type = 'radio';
        input.id = `dq${question.number}_${i}`;
        input.name = `dq${question.number}`;
        input.value = i;
        input.className = 'w-5 h-5 cursor-pointer';
        if (question.required && i === question.min) input.required = true;

        const label = document.createElement('label');
        label.setAttribute('for', `dq${question.number}_${i}`);
        label.className = 'block text-sm mt-1 cursor-pointer';
        label.textContent = i;

        scaleItem.appendChild(input);
        scaleItem.appendChild(label);
        scaleButtons.appendChild(scaleItem);
    }

    scaleWrapper.appendChild(scaleButtons);

    // Label derecho
    if (question.labels && question.labels[1]) {
        const rightLabel = document.createElement('span');
        rightLabel.className = 'text-sm text-gray-600 ml-2';
        rightLabel.textContent = question.labels[1];
        scaleWrapper.appendChild(rightLabel);
    }

    container.appendChild(scaleWrapper);
    return container;
}

// Crear campo de fecha
function createDateField(question) {
    const input = document.createElement('input');
    input.type = 'date';
    input.id = `dq${question.number}`;
    input.name = `dq${question.number}`;
    input.className = 'w-full border-2 border-gray-300 rounded-xl p-4 focus:border-siigo focus:outline-none transition-colors';
    if (question.required) input.required = true;
    return input;
}

// Crear campo de matriz (para preguntas con múltiples items y escala)
function createMatrixField(question) {
    const container = document.createElement('div');
    container.className = 'overflow-x-auto';

    const table = document.createElement('table');
    table.className = 'matrix-table w-full';

    // Crear encabezado
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // Primera columna vacía
    const emptyHeader = document.createElement('th');
    emptyHeader.textContent = '';
    headerRow.appendChild(emptyHeader);

    // Columnas de escala
    question.scale.forEach((value, index) => {
        const th = document.createElement('th');
        th.className = 'text-center text-sm';
        th.textContent = question.scaleLabels ? question.scaleLabels[index] : value;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Crear cuerpo de la tabla
    const tbody = document.createElement('tbody');

    question.items.forEach((item, itemIndex) => {
        const row = document.createElement('tr');

        // Primera columna con el texto del item
        const itemCell = document.createElement('td');
        itemCell.className = 'text-left';
        itemCell.textContent = item;
        row.appendChild(itemCell);

        // Columnas con radio buttons
        question.scale.forEach(value => {
            const cell = document.createElement('td');
            cell.className = 'text-center';

            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `dq${question.number}_${itemIndex}`;
            input.value = value;
            input.className = 'cursor-pointer';
            if (question.required && value === question.scale[0]) input.required = true;

            cell.appendChild(input);
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);

    return container;
}

// Función para recolectar las respuestas del formulario dinámico
function collectDynamicResponses() {
    const responses = {};

    dynamicQuestions.forEach(question => {
        const dynamicFieldName = `dq${question.number}`;  // ID real en el DOM
        const backendFieldName = `q${question.number}`;    // Formato esperado por backend

        if (question.type === 'matrix') {
            // Para matrices, recolectar todas las sub-respuestas
            const matrixResponses = {};
            question.items.forEach((item, index) => {
                const radioName = `${dynamicFieldName}_${index}`;
                const checked = document.querySelector(`input[name="${radioName}"]:checked`);
                if (checked) {
                    matrixResponses[item] = checked.value;
                }
            });
            if (Object.keys(matrixResponses).length > 0) {
                responses[backendFieldName] = matrixResponses;
            }
        } else if (question.type === 'radio' || question.type === 'scale') {
            // Para radio buttons y escalas
            const checked = document.querySelector(`input[name="${dynamicFieldName}"]:checked`);
            if (checked) {
                responses[backendFieldName] = checked.value;
            }
        } else {
            // Para otros tipos de campos (text, textarea, dropdown, date)
            const field = document.getElementById(dynamicFieldName);
            if (field && field.value) {
                responses[backendFieldName] = field.value;
            }
        }
    });

    // Agregar campos estáticos que pueden no estar en el formulario dinámico
    const staticFields = ['liderEntrenamiento'];
    staticFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (field && field.value) {
            responses[fieldName] = field.value;
        }
    });

    return responses;
}

// Función para validar el formulario dinámico
function validateDynamicQuestions(stepQuestions) {
    const errors = [];

    stepQuestions.forEach(question => {
        if (!question.required) return;

        const fieldName = `dq${question.number}`;

        if (question.type === 'matrix') {
            // Validar que cada item de la matriz tenga respuesta
            question.items.forEach((item, index) => {
                const radioName = `${fieldName}_${index}`;
                const checked = document.querySelector(`input[name="${radioName}"]:checked`);
                if (!checked) {
                    errors.push({
                        field: radioName,
                        label: `${question.question} - ${item}`,
                        element: document.querySelector(`input[name="${radioName}"]`)
                    });
                }
            });
        } else if (question.type === 'radio' || question.type === 'scale') {
            const checked = document.querySelector(`input[name="${fieldName}"]:checked`);
            if (!checked) {
                errors.push({
                    field: fieldName,
                    label: question.question,
                    element: document.querySelector(`input[name="${fieldName}"]`)
                });
            }
        } else {
            const field = document.getElementById(fieldName);
            if (field && !field.value.trim()) {
                errors.push({
                    field: fieldName,
                    label: question.question,
                    element: field
                });
            }
        }
    });

    return errors;
}

// Exportar funciones para usar en el HTML principal
window.dynamicFormUtils = {
    loadDynamicQuestions,
    renderDynamicQuestions,
    collectDynamicResponses,
    validateDynamicQuestions,
    dynamicQuestions: () => dynamicQuestions
};