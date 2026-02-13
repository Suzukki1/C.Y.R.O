import { phaseIcon, formatCurrency, priorityColorHex } from "../utils/formatters";
import { btnPrimary } from "../components/Field";

export default function ClientsList({ clients, tasks, onOpenClient, onNewClient }) {
    return (
        <div className="animate-fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h1 style={{ fontFamily: "var(--font-display)", color: "var(--accent-gold)", fontSize: 28, margin: 0 }}>Clientes</h1>
                <button style={btnPrimary} onClick={onNewClient}>+ Nuevo cliente</button>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
                {clients.map(c => {
                    const cTasks = tasks.filter(t => t.clientId === c.id);
                    const done = cTasks.filter(t => t.status === "Cumplida").length;
                    const total = cTasks.length;
                    return (
                        <div
                            key={c.id} onClick={() => onOpenClient(c.id)}
                            style={{
                                background: "var(--bg-card)", borderRadius: "var(--radius-xl)",
                                padding: "16px 20px", border: "1px solid var(--border-primary)",
                                cursor: "pointer", display: "flex", justifyContent: "space-between",
                                alignItems: "center", transition: "all var(--transition-fast)"
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = "var(--accent-gold)";
                                e.currentTarget.style.transform = "translateX(4px)";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = "var(--border-primary)";
                                e.currentTarget.style.transform = "translateX(0)";
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <span style={{ fontSize: 22 }}>{phaseIcon(c.phase)}</span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                        {c.nick_ml} · {c.country} · {c.level_ml}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                                {[
                                    { label: "Fase", value: c.phase },
                                    { label: "Ventas 30d", value: formatCurrency(c.kpis.ventas30d, c.country) },
                                    { label: "Conv.", value: `${c.kpis.conversion}%` },
                                    { label: "Tareas", value: `${done}/${total}` },
                                ].map((item, i) => (
                                    <div key={i} style={{ textAlign: "center", minWidth: 60 }}>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.label}</div>
                                        <div style={{ fontSize: 12, fontWeight: 600 }}>{item.value}</div>
                                    </div>
                                ))}
                                <span style={{
                                    width: 12, height: 12, borderRadius: "50%",
                                    background: priorityColorHex(c.priority), flexShrink: 0
                                }} />
                            </div>
                        </div>
                    );
                })}
                {clients.length === 0 && (
                    <div style={{ textAlign: "center", padding: 40, color: "var(--text-faint)" }}>
                        <p style={{ fontSize: 16, marginBottom: 12 }}>Sin clientes todavía</p>
                        <button style={btnPrimary} onClick={onNewClient}>+ Crear primer cliente</button>
                    </div>
                )}
            </div>
        </div>
    );
}
