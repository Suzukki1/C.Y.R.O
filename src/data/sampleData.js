export const SAMPLE_CLIENTS = [
    {
        id: "c1", name: "TechStore BA", brand: "TechStore", country: "Argentina", contact: "+54 11 5555-1234",
        email: "info@techstore.com.ar", nick_ml: "TECHSTORE_BA", level_ml: "MercadoLíder Gold",
        category: "Electrónica", business_type: "Retail", phase: "Optimización", priority: "Alta",
        kpis: { ventas30d: 2850000, conversion: 8.2, acos: 18.5, tickets: 3 }
    },
    {
        id: "c2", name: "Moda Express MX", brand: "ModaEx", country: "México", contact: "+52 55 4444-5678",
        email: "ventas@modaex.mx", nick_ml: "MODAEXPRESS", level_ml: "Platinum",
        category: "Ropa y Accesorios", business_type: "Marca propia", phase: "Ads", priority: "Media",
        kpis: { ventas30d: 580000, conversion: 5.1, acos: 24.3, tickets: 7 }
    },
    {
        id: "c3", name: "HogarDeco CL", brand: "HogarDeco", country: "Chile", contact: "+56 9 3333-9012",
        email: "contacto@hogardeco.cl", nick_ml: "HOGARDECO_CL", level_ml: "MercadoLíder",
        category: "Hogar y Muebles", business_type: "Distribuidor", phase: "Onboarding", priority: "Alta",
        kpis: { ventas30d: 420000, conversion: 3.8, acos: 0, tickets: 12 }
    },
    {
        id: "c4", name: "FitPro AR", brand: "FitPro", country: "Argentina", contact: "+54 11 2222-3456",
        email: "hola@fitpro.com.ar", nick_ml: "FITPRO_AR", level_ml: "Gold",
        category: "Deportes", business_type: "Marca propia", phase: "Expansión", priority: "Baja",
        kpis: { ventas30d: 1200000, conversion: 11.4, acos: 12.1, tickets: 1 }
    }
];

export const SAMPLE_MEETINGS = [
    {
        id: "m1", clientId: "c1", date: "2026-02-14", time: "10:00", type: "Performance",
        link: "https://meet.google.com/abc",
        summary: "Revisar resultados de optimización de listings Q1. Conversión subió 1.2pp. Definir estrategia Ads para Hot Sale.",
        transcript: "", notes: "Buen progreso en SEO. Priorizar campañas para Hot Sale."
    },
    {
        id: "m2", clientId: "c3", date: "2026-02-12", time: "15:00", type: "Onboarding",
        link: "https://zoom.us/j/123",
        summary: "Primera reunión de onboarding. Relevamiento de cuenta y definición de objetivos iniciales.",
        transcript: "", notes: "Cuenta con muchos listings sin optimizar. 12 tickets abiertos urgentes."
    },
    {
        id: "m3", clientId: "c2", date: "2026-02-18", time: "11:30", type: "Estrategia",
        link: "https://meet.google.com/xyz",
        summary: "", transcript: "", notes: ""
    },
];

export const SAMPLE_OBJECTIVES = [
    { id: "o1", clientId: "c1", title: "Subir ventas 30% en 90 días", desc: "Incrementar ventas mensuales de $2.85M a $3.7M", kpi_initial: 2850000, kpi_target: 3700000, deadline: "2026-05-01", status: "En progreso" },
    { id: "o2", clientId: "c1", title: "Mantener ACOS < 15%", desc: "Optimizar campañas para reducir ACOS de 18.5% a menos de 15%", kpi_initial: 18.5, kpi_target: 15, deadline: "2026-04-01", status: "En progreso" },
    { id: "o3", clientId: "c2", title: "Bajar ACOS a < 20%", desc: "Reestructurar campañas y optimizar keywords", kpi_initial: 24.3, kpi_target: 20, deadline: "2026-03-15", status: "Pendiente" },
    { id: "o4", clientId: "c3", title: "Completar onboarding en 2 semanas", desc: "Auditoría completa + plan de acción", kpi_initial: 0, kpi_target: 100, deadline: "2026-02-26", status: "En progreso" },
    { id: "o5", clientId: "c3", title: "Resolver tickets abiertos", desc: "Bajar tickets de 12 a menos de 3", kpi_initial: 12, kpi_target: 3, deadline: "2026-02-20", status: "Pendiente" },
];

export const SAMPLE_TASKS = [
    { id: "t1", objectiveId: "o1", clientId: "c1", type: "SEO Listings", desc: "Optimizar top 20 listings por volumen de venta", responsible: "Consultor", deadline: "2026-02-20", status: "En progreso" },
    { id: "t2", objectiveId: "o1", clientId: "c1", type: "Ads", desc: "Crear campañas Product Ads para Hot Sale", responsible: "Consultor", deadline: "2026-02-25", status: "Pendiente" },
    { id: "t3", objectiveId: "o2", clientId: "c1", type: "Ads", desc: "Agregar keywords negativas en campañas activas", responsible: "Consultor", deadline: "2026-02-18", status: "Cumplida" },
    { id: "t4", objectiveId: "o3", clientId: "c2", type: "Ads", desc: "Auditar estructura de campañas actual", responsible: "Consultor", deadline: "2026-02-22", status: "Pendiente" },
    { id: "t5", objectiveId: "o4", clientId: "c3", type: "SEO Listings", desc: "Auditoría de 150 listings activos", responsible: "Equipo", deadline: "2026-02-17", status: "En progreso" },
    { id: "t6", objectiveId: "o4", clientId: "c3", type: "Logística", desc: "Evaluar opción de Fulfillment por ML", responsible: "Cliente", deadline: "2026-02-19", status: "Pendiente" },
    { id: "t7", objectiveId: "o5", clientId: "c3", type: "Atención al cliente", desc: "Responder 12 tickets abiertos de compradores", responsible: "Cliente", deadline: "2026-02-14", status: "Bloqueada" },
];
