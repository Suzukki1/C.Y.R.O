import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { priorityColorHex, phaseIcon, formatDateEs, getTodayString } from "../utils/formatters";

export default function Dashboard({ clients, tasks, meetings, onOpenClient, onNewMeeting, gcalClientId }) {
    const today = getTodayString();
    const highPriority = clients.filter(c => c.priority === "Alta").length;
    const pendingTasks = tasks.filter(t => t.status === "Pendiente" || t.status === "Bloqueada").length;
    const upcomingMeetings = meetings
        .filter(m => m.date >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    const overdueTasks = tasks.filter(t => t.status !== "Cumplida" && t.deadline < today);

    return (
        <div className="animate-fade-in">
            <h1 style={{ fontFamily: "var(--font-display)", color: "var(--accent-gold)", fontSize: 28, marginBottom: 4 }}>
                Dashboard
            </h1>
            <p style={{ color: "var(--text-dim)", marginBottom: 24 }}>{formatDateEs()}</p>

            {/* Stats Cards */}
            <div className="responsive-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
                <StatCard label="Clientes activos" value={clients.length} color="var(--accent-gold)" />
                <StatCard label="Prioridad alta" value={highPriority} color="var(--color-danger)" />
                <StatCard label="Tareas pendientes" value={pendingTasks} color="var(--color-warning)" />
                <StatCard label="Tareas vencidas" value={overdueTasks.length} color={overdueTasks.length > 0 ? "var(--color-danger)" : "var(--color-success)"} />
            </div>

            <div className="responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Upcoming Meetings */}
                <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20, border: "1px solid var(--border-primary)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <h3 style={{ margin: 0, fontSize: 15, color: "var(--accent-gold)" }}>📅 Próximas reuniones</h3>
                        <button
                            style={{
                                padding: "5px 12px", background: "var(--accent-gold)", color: "var(--text-dark)",
                                border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: "pointer",
                                fontFamily: "var(--font-body)", fontSize: 11
                            }}
                            onClick={onNewMeeting}
                        >+ Nueva</button>
                    </div>
                    {upcomingMeetings.length === 0 && (
                        <p style={{ color: "var(--text-faint)", fontSize: 13 }}>Sin reuniones próximas.</p>
                    )}
                    {upcomingMeetings.slice(0, 5).map(m => {
                        const cl = clients.find(c => c.id === m.clientId);
                        return (
                            <div key={m.id} style={{
                                padding: "10px 0", borderBottom: "1px solid var(--bg-tertiary)",
                                display: "flex", justifyContent: "space-between", alignItems: "center"
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{cl?.name || "—"}</div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.type} · {m.date} {m.time}</div>
                                </div>
                                <span style={{
                                    fontSize: 11, padding: "3px 8px", background: "var(--border-primary)",
                                    borderRadius: "var(--radius-sm)", color: "#ccc"
                                }}>{m.type}</span>
                            </div>
                        );
                    })}
                </div>

                {/* At-risk clients */}
                <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20, border: "1px solid var(--border-primary)" }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: 15, color: "var(--accent-gold)" }}>⚠️ Clientes en riesgo</h3>
                    {clients.filter(c => c.priority === "Alta" || c.kpis.tickets > 5).length === 0 && (
                        <p style={{ color: "var(--text-faint)", fontSize: 13 }}>Sin clientes en riesgo. ¡Todo bien! 🎉</p>
                    )}
                    {clients.filter(c => c.priority === "Alta" || c.kpis.tickets > 5).map(c => (
                        <div
                            key={c.id} onClick={() => onOpenClient(c.id)}
                            style={{
                                padding: "10px 0", borderBottom: "1px solid var(--bg-tertiary)",
                                cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                                transition: "padding-left var(--transition-fast)"
                            }}
                            onMouseEnter={e => e.currentTarget.style.paddingLeft = "8px"}
                            onMouseLeave={e => e.currentTarget.style.paddingLeft = "0"}
                        >
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.phase} · {c.country}</div>
                            </div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                {c.kpis.tickets > 5 && (
                                    <span style={{
                                        fontSize: 10, padding: "2px 6px", background: "rgba(231,76,60,0.15)",
                                        color: "#e74c3c", borderRadius: "var(--radius-sm)"
                                    }}>{c.kpis.tickets} tickets</span>
                                )}
                                <span style={{
                                    width: 10, height: 10, borderRadius: "50%",
                                    background: priorityColorHex(c.priority)
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Overdue Tasks */}
            {overdueTasks.length > 0 && (
                <div style={{
                    background: "rgba(231,76,60,0.05)", borderRadius: "var(--radius-xl)",
                    padding: 20, border: "1px solid rgba(231,76,60,0.2)", marginTop: 20
                }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "var(--color-danger)" }}>⚠ Tareas vencidas</h3>
                    {overdueTasks.map(t => {
                        const cl = clients.find(c => c.id === t.clientId);
                        return (
                            <div key={t.id} style={{
                                padding: "8px 0", borderBottom: "1px solid rgba(231,76,60,0.1)",
                                display: "flex", justifyContent: "space-between"
                            }}>
                                <div>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{t.desc}</span>
                                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 10 }}>({cl?.name})</span>
                                </div>
                                <span style={{ fontSize: 11, color: "#e74c3c" }}>Venció: {t.deadline}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
