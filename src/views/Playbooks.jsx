import { PLAYBOOKS } from "../constants";

export default function Playbooks() {
    return (
        <div className="animate-fade-in">
            <h1 style={{ fontFamily: "var(--font-display)", color: "var(--accent-gold)", fontSize: 28, marginBottom: 6 }}>
                Playbooks
            </h1>
            <p style={{ color: "var(--text-dim)", marginBottom: 20, fontSize: 13 }}>
                Plantillas de tareas predefinidas. Se aplican al crear un nuevo cliente.
            </p>
            <div className="responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {PLAYBOOKS.map(pb => (
                    <div
                        key={pb.id}
                        style={{
                            background: "var(--bg-card)", borderRadius: "var(--radius-xl)",
                            padding: 20, border: "1px solid var(--border-primary)",
                            transition: "border-color var(--transition-fast)"
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-gold)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-primary)"}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 16, color: "var(--accent-gold)" }}>{pb.name}</h3>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                                    Tipo: {pb.type} · {pb.tasks.length} tareas
                                </div>
                            </div>
                            <span style={{
                                fontSize: 10, padding: "3px 8px", background: "var(--accent-gold-bg)",
                                color: "var(--accent-gold)", borderRadius: "var(--radius-sm)", fontWeight: 600
                            }}>{pb.type}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                            {pb.tasks.map((t, i) => (
                                <div key={i} style={{
                                    padding: "6px 0",
                                    borderBottom: i < pb.tasks.length - 1 ? "1px solid var(--bg-tertiary)" : "none",
                                    display: "flex", gap: 8, alignItems: "flex-start"
                                }}>
                                    <span style={{ color: "var(--text-faint)", minWidth: 18, fontWeight: 600 }}>{t.order}.</span>
                                    <div>
                                        <span style={{ color: "#ccc" }}>{t.desc}</span>
                                        <span style={{ fontSize: 10, color: "var(--text-dim)", marginLeft: 6 }}>({t.type})</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
