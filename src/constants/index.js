export const PHASES = ["Onboarding", "Optimización", "Ads", "Expansión", "Mantenimiento"];
export const PRIORITIES = ["Alta", "Media", "Baja"];
export const TASK_TYPES = ["SEO Listings", "Ads", "Pricing", "Logística", "Atención al cliente", "Otro"];
export const TASK_STATES = ["Pendiente", "En progreso", "Bloqueada", "Cumplida"];
export const MEETING_TYPES = ["Onboarding", "Estrategia", "Performance", "Urgencia"];
export const ML_LEVELS = ["Free", "Gold", "Platinum", "MercadoLíder", "MercadoLíder Gold", "MercadoLíder Platinum"];
export const COUNTRIES = ["Argentina", "México", "Brasil", "Colombia", "Chile", "Uruguay", "Perú"];

export const PLAYBOOKS = [
    {
        id: "pb1", name: "Onboarding Full ML", type: "Onboarding",
        tasks: [
            { type: "SEO Listings", desc: "Auditoría inicial de listings activos", order: 1 },
            { type: "Ads", desc: "Revisión de campañas Product Ads existentes", order: 2 },
            { type: "Pricing", desc: "Análisis competitivo de precios por categoría", order: 3 },
            { type: "Logística", desc: "Evaluar tiempos de envío y fulfillment", order: 4 },
            { type: "Atención al cliente", desc: "Revisar métricas de atención y reputación", order: 5 },
        ]
    },
    {
        id: "pb2", name: "Optimización de Listings", type: "Optimización",
        tasks: [
            { type: "SEO Listings", desc: "Investigar keywords principales por producto", order: 1 },
            { type: "SEO Listings", desc: "Optimizar títulos con keywords de alto volumen", order: 2 },
            { type: "SEO Listings", desc: "Mejorar fichas técnicas y descripciones", order: 3 },
            { type: "SEO Listings", desc: "Actualizar fotos: fondo blanco + lifestyle", order: 4 },
            { type: "SEO Listings", desc: "Revisar preguntas frecuentes y responder pendientes", order: 5 },
        ]
    },
    {
        id: "pb3", name: "Auditoría de Ads", type: "Ads",
        tasks: [
            { type: "Ads", desc: "Analizar ACOS/TACOS por campaña", order: 1 },
            { type: "Ads", desc: "Identificar keywords negativas a excluir", order: 2 },
            { type: "Ads", desc: "Ajustar pujas por producto según rentabilidad", order: 3 },
            { type: "Ads", desc: "Evaluar Brand Ads vs Product Ads", order: 4 },
            { type: "Ads", desc: "Proponer estructura de campañas optimizada", order: 5 },
        ]
    },
    {
        id: "pb4", name: "Revisión Mensual KPIs", type: "Mantenimiento",
        tasks: [
            { type: "Otro", desc: "Actualizar ventas últimos 30 días", order: 1 },
            { type: "Otro", desc: "Comparar conversión vs mes anterior", order: 2 },
            { type: "Ads", desc: "Reportar ACOS y gasto publicitario", order: 3 },
            { type: "Atención al cliente", desc: "Revisar tickets abiertos y reputación", order: 4 },
            { type: "Otro", desc: "Definir objetivos para próximo mes", order: 5 },
        ]
    }
];
