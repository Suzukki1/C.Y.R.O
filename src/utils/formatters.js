let nextId = 100;
export const genId = (prefix) => `${prefix}${nextId++}`;

export const formatCurrency = (val, country) => {
    if (!val && val !== 0) return "—";
    const currencies = {
        Argentina: "ARS", México: "MXN", Brasil: "BRL",
        Colombia: "COP", Chile: "CLP", Uruguay: "UYU", Perú: "PEN"
    };
    const cur = currencies[country] || "USD";
    return new Intl.NumberFormat("es-AR", {
        style: "currency", currency: cur, maximumFractionDigits: 0
    }).format(val);
};

export const priorityColor = (p) =>
    p === "Alta" ? "var(--color-danger)" :
        p === "Media" ? "var(--color-warning)" :
            "var(--color-success)";

export const priorityColorHex = (p) =>
    p === "Alta" ? "#e74c3c" :
        p === "Media" ? "#f39c12" :
            "#27ae60";

export const statusColor = (s) =>
    s === "Cumplida" || s === "Cumplido" ? "var(--color-success)" :
        s === "En progreso" ? "var(--color-info)" :
            s === "Bloqueada" ? "var(--color-danger)" :
                "var(--color-muted)";

export const statusColorHex = (s) =>
    s === "Cumplida" || s === "Cumplido" ? "#27ae60" :
        s === "En progreso" ? "#3498db" :
            s === "Bloqueada" ? "#e74c3c" :
                "#95a5a6";

export const phaseIcon = (p) =>
    p === "Onboarding" ? "🚀" :
        p === "Optimización" ? "🔧" :
            p === "Ads" ? "📢" :
                p === "Expansión" ? "🌎" :
                    "🛡️";

export const getTodayString = () => {
    const d = new Date();
    return d.toISOString().split("T")[0];
};

export const formatDateEs = () => {
    const now = new Date();
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    return `${days[now.getDay()]} ${now.getDate()} de ${months[now.getMonth()]}, ${now.getFullYear()}`;
};
