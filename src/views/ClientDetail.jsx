import { useState } from "react";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { btnPrimary, btnSecondary } from "../components/Field";
import { formatCurrency, phaseIcon, priorityColorHex, statusColorHex } from "../utils/formatters";
import { generateOptimizationAnalysis } from "../services/perplexity";

export default function ClientDetail({
    client, objectives, tasks, meetings,
    onBack, onEditClient, onNewObjective, onEditObjective,
    onNewTask, onEditTask, onToggleTaskStatus,
    onNewMeeting, onEditMeeting, apiKey
}) {
    const [aiAnalysis, setAiAnalysis] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [aiError, setAiError] = useState("");

    if (!client) return null;

    const handleAIAnalysis = async () => {
        if (!apiKey) {
            setAiError("Configura tu API key de Perplexity en el Dashboard (⚙️) para usar esta función.");
            return;
        }
        setAnalyzing(true);
        setAiError("");
        try {
            const result = await generateOptimizationAnalysis(apiKey, client);
            setAiAnalysis(result);
        } catch (err) {
            setAiError(`Error: ${err.message}`);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Back button */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                <button onClick={onBack} style={{
                    background: "none", border: "none", color: "var(--text-muted)",
                    cursor: "pointer", fontSize: 14, transition: "color var(--transition-fast)"
                }}
                    onMouseEnter={e => e.target.style.color = "var(--accent-gold)"}
                    onMouseLeave={e => e.target.style.color = "var(--text-muted)"}
                >← Clientes</button>
            </div>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", color: "var(--accent-gold)", fontSize: 28, margin: "8px 0 4px" }}>
                        {phaseIcon(client.phase)} {client.name}
                    </h1>
                    <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                        {client.nick_ml} · {client.level_ml} · {client.country} · {client.category}
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{
                        padding: "4px 12px", borderRadius: "var(--radius-pill)", fontSize: 12, fontWeight: 600,
                        background: priorityColorHex(client.priority) + "22",
                        color: priorityColorHex(client.priority),
                        border: `1px solid ${priorityColorHex(client.priority)}44`
                    }}>{client.priority}</span>
                    <span style={{
                        padding: "4px 12px", borderRadius: "var(--radius-pill)", fontSize: 12,
                        background: "var(--border-primary)", color: "#ccc"
                    }}>{client.phase}</span>
                    <button style={{ ...btnSecondary, fontSize: 12, padding: "6px 14px" }} onClick={onEditClient}>✏ Editar</button>
                </div>
            </div>

            {/* KPIs */}
            <div className="responsive-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                <StatCard label="Ventas 30 días" value={formatCurrency(client.kpis.ventas30d, client.country)} />
                <StatCard label="Conversión" value={`${client.kpis.conversion}%`} warn={client.kpis.conversion < 5} color={client.kpis.conversion < 5 ? "var(--color-danger)" : "var(--accent-gold)"} />
                <StatCard label="ACOS" value={client.kpis.acos ? `${client.kpis.acos}%` : "N/A"} warn={client.kpis.acos > 20} color={client.kpis.acos > 20 ? "var(--color-danger)" : "var(--accent-gold)"} />
                <StatCard label="Tickets abiertos" value={client.kpis.tickets} warn={client.kpis.tickets > 5} color={client.kpis.tickets > 5 ? "var(--color-danger)" : "var(--accent-gold)"} />
            </div>

            {/* AI Analysis Section */}
            <div style={{
                background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20,
                border: "1px solid var(--border-primary)", marginBottom: 16
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <h3 style={{ margin: 0, fontSize: 15, color: "var(--accent-gold)" }}>🤖 Análisis IA (Perplexity)</h3>
                    <button
                        style={{
                            ...btnPrimary, fontSize: 11, padding: "5px 12px",
                            opacity: analyzing ? 0.7 : 1,
                            ...(analyzing ? { animation: "pulse 1.5s infinite" } : {})
                        }}
                        onClick={handleAIAnalysis}
                        disabled={analyzing}
                    >
                        {analyzing ? "⏳ Analizando..." : "✨ Analizar cliente"}
                    </button>
                </div>
                {aiError && (
                    <div style={{
                        padding: "8px 12px", background: "rgba(231,76,60,0.1)",
                        borderRadius: "var(--radius-sm)", color: "#e74c3c", fontSize: 12,
                        border: "1px solid rgba(231,76,60,0.2)", marginBottom: 12
                    }}>{aiError}</div>
                )}
                {aiAnalysis ? (
                    <div style={{
                        padding: 16, background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)",
                        fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7,
                        whiteSpace: "pre-wrap", border: "1px solid var(--border-primary)"
                    }}>{aiAnalysis}</div>
                ) : (
                    <p style={{ color: "var(--text-faint)", fontSize: 13 }}>
                        Hacé clic en "Analizar cliente" para obtener diagnóstico, acciones prioritarias y oportunidades con IA.
                    </p>
                )}
            </div>

            {/* Objectives */}
            <div style={{
                background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20,
                border: "1px solid var(--border-primary)", marginBottom: 16
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <h3 style={{ margin: 0, fontSize: 15, color: "var(--accent-gold)" }}>🎯 Objetivos</h3>
                    <button
                        style={{ ...btnPrimary, fontSize: 11, padding: "5px 12px" }}
                        onClick={onNewObjective}
                    >+ Objetivo</button>
                </div>
                {objectives.length === 0 && <p style={{ color: "var(--text-faint)", fontSize: 13 }}>Sin objetivos aún.</p>}
                {objectives.map(o => {
                    const progress = o.kpi_target > 0 ? Math.min(100, Math.round((o.kpi_initial / o.kpi_target) * 100)) : 0;
                    return (
                        <div key={o.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--bg-tertiary)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{o.title}</div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{o.desc} · Límite: {o.deadline}</div>
                                </div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <StatusBadge status={o.status} />
                                    <button
                                        onClick={() => onEditObjective(o)}
                                        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12 }}
                                    >✏</button>
                                </div>
                            </div>
                            <div style={{ marginTop: 6, height: 4, background: "var(--border-primary)", borderRadius: 2, overflow: "hidden" }}>
                                <div style={{
                                    height: "100%", width: `${progress}%`,
                                    background: "var(--accent-gold)", borderRadius: 2,
                                    transition: "width var(--transition-slow)"
                                }} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tasks */}
            <div style={{
                background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20,
                border: "1px solid var(--border-primary)", marginBottom: 16
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <h3 style={{ margin: 0, fontSize: 15, color: "var(--accent-gold)" }}>✅ Tareas</h3>
                    <button
                        style={{ ...btnPrimary, fontSize: 11, padding: "5px 12px" }}
                        onClick={onNewTask}
                    >+ Tarea</button>
                </div>
                {tasks.length === 0 && <p style={{ color: "var(--text-faint)", fontSize: 13 }}>Sin tareas aún.</p>}
                {tasks.map(t => (
                    <div key={t.id} style={{
                        padding: "10px 0", borderBottom: "1px solid var(--bg-tertiary)",
                        display: "flex", justifyContent: "space-between", alignItems: "center"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <button
                                onClick={() => onToggleTaskStatus(t)}
                                style={{
                                    width: 20, height: 20, borderRadius: "var(--radius-sm)",
                                    border: `2px solid ${statusColorHex(t.status)}`,
                                    background: t.status === "Cumplida" ? "#27ae60" : "transparent",
                                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "#fff", fontSize: 11, flexShrink: 0,
                                    transition: "all var(--transition-fast)"
                                }}
                            >
                                {t.status === "Cumplida" && "✓"}
                            </button>
                            <div>
                                <div style={{
                                    fontSize: 13,
                                    textDecoration: t.status === "Cumplida" ? "line-through" : "none",
                                    color: t.status === "Cumplida" ? "var(--text-faint)" : "var(--text-primary)"
                                }}>{t.desc}</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                    {t.type} · {t.responsible} · {t.deadline}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <StatusBadge status={t.status} small />
                            <button
                                onClick={() => onEditTask(t)}
                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12 }}
                            >✏</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Meetings */}
            <div style={{
                background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20,
                border: "1px solid var(--border-primary)"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <h3 style={{ margin: 0, fontSize: 15, color: "var(--accent-gold)" }}>📅 Reuniones</h3>
                    <button
                        style={{ ...btnPrimary, fontSize: 11, padding: "5px 12px" }}
                        onClick={onNewMeeting}
                    >+ Reunión</button>
                </div>
                {meetings.length === 0 && <p style={{ color: "var(--text-faint)", fontSize: 13 }}>Sin reuniones aún.</p>}
                {meetings.map(m => (
                    <div key={m.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--bg-tertiary)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <span style={{ fontWeight: 600, fontSize: 13 }}>{m.type}</span>
                                <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 10 }}>{m.date} {m.time}</span>
                            </div>
                            <button
                                onClick={() => onEditMeeting(m)}
                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12 }}
                            >✏</button>
                        </div>
                        {m.summary && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.summary}</div>}
                        {m.notes && <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4, fontStyle: "italic" }}>📝 {m.notes}</div>}
                    </div>
                ))}
            </div>
        </div>
    );
}
