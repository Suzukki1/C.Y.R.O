/**
 * Perplexity API integration for ConsultorML
 * Used for meeting transcript analysis and optimization recommendations
 */

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

/**
 * Call Perplexity API with a prompt
 * @param {string} apiKey - Perplexity API key
 * @param {string} systemPrompt - System context
 * @param {string} userPrompt - User message
 * @returns {Promise<string>} - API response text
 */
async function callPerplexity(apiKey, systemPrompt, userPrompt) {
    const response = await fetch(PERPLEXITY_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "sonar",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            max_tokens: 1500,
            temperature: 0.3
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Perplexity API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Sin respuesta de la IA.";
}

/**
 * Generate a meeting summary from transcript
 */
export async function generateMeetingSummary(apiKey, transcript, clientName, meetingType) {
    const systemPrompt = `Eres un asistente experto en consultoría de MercadoLibre. 
Tu trabajo es analizar transcripciones de reuniones con clientes vendedores de MercadoLibre y generar resúmenes estructurados.
Responde SIEMPRE en español.`;

    const userPrompt = `Analiza esta transcripción de una reunión tipo "${meetingType}" con el cliente "${clientName}" de MercadoLibre.

TRANSCRIPCIÓN:
${transcript}

Genera un resumen estructurado con EXACTAMENTE estos apartados:
📋 RESUMEN: (2-3 oraciones del tema principal)
✅ ACUERDOS: (lista de acuerdos tomados)
📌 PRÓXIMOS PASOS: (acciones concretas con responsable)
⚠️ ALERTAS: (problemas o riesgos identificados)`;

    return callPerplexity(apiKey, systemPrompt, userPrompt);
}

/**
 * Generate optimization recommendations for a client
 */
export async function generateOptimizationAnalysis(apiKey, clientData) {
    const systemPrompt = `Eres un consultor experto en MercadoLibre con años de experiencia ayudando vendedores a optimizar sus ventas.
Tienes conocimiento profundo de SEO de listings, Product Ads, logística, atención al cliente y estrategias de crecimiento en MercadoLibre.
Responde SIEMPRE en español con accionables concretos.`;

    const userPrompt = `Analiza los datos de este cliente de MercadoLibre y genera recomendaciones accionables:

CLIENTE: ${clientData.name}
MARCA: ${clientData.brand}
PAÍS: ${clientData.country}
CATEGORÍA: ${clientData.category}
TIPO NEGOCIO: ${clientData.business_type}
NIVEL ML: ${clientData.level_ml}
FASE ACTUAL: ${clientData.phase}

KPIs ACTUALES:
- Ventas últimos 30 días: $${clientData.kpis?.ventas30d?.toLocaleString() || 0}
- Tasa de conversión: ${clientData.kpis?.conversion || 0}%
- ACOS (costo publicitario): ${clientData.kpis?.acos || 0}%
- Tickets abiertos: ${clientData.kpis?.tickets || 0}

Genera un análisis con EXACTAMENTE estos apartados:
🔍 DIAGNÓSTICO: (evaluación general en 2-3 oraciones)
🚀 ACCIONES PRIORITARIAS: (top 5 acciones concretas ordenadas por impacto)
📊 KPIs A MEJORAR: (métricas target realistas para los próximos 30 días)
💡 OPORTUNIDADES: (oportunidades de crecimiento específicas para esta categoría/país)
⚠️ RIESGOS: (problemas potenciales a vigilar)`;

    return callPerplexity(apiKey, systemPrompt, userPrompt);
}

/**
 * Generate actionable tasks from an analysis
 */
export async function generateActionableTasks(apiKey, clientData, analysisContext) {
    const systemPrompt = `Eres un consultor de MercadoLibre. Genera tareas específicas y accionables basándote en el análisis proporcionado.
Cada tarea debe ser concreta, medible y asignable. Responde SIEMPRE en español.`;

    const userPrompt = `Basándote en este análisis del cliente "${clientData.name}" (${clientData.category}, ${clientData.country}), genera tareas accionables:

CONTEXTO:
${analysisContext}

Genera EXACTAMENTE 5-7 tareas en formato:
Para cada tarea incluye:
- TIPO: (SEO Listings / Ads / Pricing / Logística / Atención al cliente / Otro)
- DESCRIPCIÓN: (acción concreta y específica)
- RESPONSABLE: (Consultor / Equipo / Cliente)
- PRIORIDAD: (Alta / Media / Baja)
- PLAZO SUGERIDO: (1 semana / 2 semanas / 1 mes)

Formato de respuesta: una tarea por línea con el formato:
[TIPO] | [DESCRIPCIÓN] | [RESPONSABLE] | [PRIORIDAD] | [PLAZO]`;

    return callPerplexity(apiKey, systemPrompt, userPrompt);
}

/**
 * Generate analysis from Excel account data
 */
export async function generateExcelAnalysis(apiKey, rawText, fileName) {
    const systemPrompt = `Eres un consultor senior experto en MercadoLibre con años de experiencia analizando datos de cuentas de vendedores.
Tu especialidad es interpretar datos de rendimiento, ventas, publicidad, logística y atención al cliente de MercadoLibre.
Analizas datos tabulares y generas insights accionables. Responde SIEMPRE en español con recomendaciones concretas y específicas.`;

    const userPrompt = `Analiza los siguientes datos extraídos del archivo "${fileName}" de una cuenta de MercadoLibre:

DATOS:
${rawText}

Genera un análisis completo con EXACTAMENTE estos apartados:
📊 RESUMEN DE DATOS: (descripción general de qué información contiene el archivo y métricas clave identificadas)
🔍 DIAGNÓSTICO: (evaluación del estado actual de la cuenta basándote en los datos)
🚀 ACCIONES PRIORITARIAS: (top 5 acciones concretas ordenadas por impacto, basadas en los datos)
📈 OPORTUNIDADES: (oportunidades de crecimiento o mejora detectadas en los datos)
⚠️ ALERTAS: (problemas, riesgos o métricas preocupantes encontradas en los datos)
💡 RECOMENDACIONES ADICIONALES: (sugerencias extra basadas en patrones observados)`;

    const response = await fetch(PERPLEXITY_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "sonar",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            max_tokens: 2500,
            temperature: 0.3
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Perplexity API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Sin respuesta de la IA.";
}
