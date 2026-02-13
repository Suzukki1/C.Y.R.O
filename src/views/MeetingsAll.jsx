import { btnPrimary } from "../components/Field";

export default function MeetingsAll({ meetings, clients, onOpenClient, onNewMeeting, onEditMeeting }) {
    const sorted = [...meetings].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="animate-fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h1 style={{ fontFamily: "var(--font-display)", color: "var(--accent-gold)", fontSize: 28, margin: 0 }}>Reuniones</h1>
                <button style={btnPrimary} onClick={onNewMeeting}>+ Nueva reunión</button>
            </div>
            {sorted.length === 0 && (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-faint)" }}>
                    <p style={{ fontSize: 16, marginBottom: 12 }}>Sin reuniones todavía</p>
                    <button style={btnPrimary} onClick={onNewMeeting}>+ Crear primera reunión</button>
                </div>
            )}
            {sorted.map(m => {
                const cl = clients.find(c => c.id === m.clientId);
                return (
                    <div
                        key={m.id}
                        style={{
                            background: "var(--bg-card)", borderRadius: "var(--radius-xl)",
                            padding: "14px 20px", border: "1px solid var(--border-primary)",
                            marginBottom: 10, cursor: "pointer",
                            transition: "border-color var(--transition-fast)"
                        }}
                        onClick={() => onOpenClient(m.clientId)}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-gold)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-primary)"}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <span style={{ fontWeight: 700, fontSize: 14 }}>{cl?.name || "—"}</span>
                                <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 10 }}>
                                    {m.type} · {m.date} {m.time}
                                </span>
                            </div>
                            <button
                                onClick={e => { e.stopPropagation(); onEditMeeting(m); }}
                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12 }}
                            >✏</button>
                        </div>
                        {m.summary && (
                            <div style={{
                                fontSize: 12, color: "var(--text-secondary)", marginTop: 6,
                                lineHeight: 1.6, whiteSpace: "pre-wrap",
                                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                                overflow: "hidden"
                            }}>{m.summary}</div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
