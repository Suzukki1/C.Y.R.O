import { useState, useEffect, useCallback } from "react";
import { btnPrimary, btnSecondary } from "../components/Field";
import { fetchTranscripts, fetchTranscriptDetail, matchTranscriptToClient } from "../services/fireflies";
import { initGoogleCalendar, signInGoogle, signOutGoogle, isGoogleSignedIn, fetchUpcomingEvents, matchEventToClient } from "../services/googleCalendar";

export default function MeetingsAll({ meetings, clients, onOpenClient, onNewMeeting, onEditMeeting, firefliesKey, gcalClientId, onSaveMeeting }) {
    const sorted = [...meetings].sort((a, b) => new Date(b.date) - new Date(a.date));

    // ─── Fireflies state ───
    const [ffPanel, setFfPanel] = useState(false);
    const [ffLoading, setFfLoading] = useState(false);
    const [ffTranscripts, setFfTranscripts] = useState([]);
    const [ffError, setFfError] = useState("");
    const [ffImporting, setFfImporting] = useState({});

    // ─── Google Calendar state ───
    const [gcalEvents, setGcalEvents] = useState([]);
    const [gcalLoading, setGcalLoading] = useState(false);
    const [gcalConnected, setGcalConnected] = useState(false);
    const [gcalError, setGcalError] = useState("");

    // ─── Fireflies: fetch transcripts ───
    const handleFetchFireflies = useCallback(async () => {
        if (!firefliesKey) { setFfError("Configurá tu API key de Fireflies en ⚙️ Integraciones"); return; }
        setFfLoading(true); setFfError("");
        try {
            const data = await fetchTranscripts(firefliesKey, 20);
            // Match each to client
            const enriched = data.map(t => ({
                ...t,
                matchedClient: matchTranscriptToClient(t, clients),
                alreadyImported: meetings.some(m => m.firefliesId === t.id)
            }));
            setFfTranscripts(enriched);
            setFfPanel(true);
        } catch (err) {
            setFfError(`Error Fireflies: ${err.message}`);
        } finally { setFfLoading(false); }
    }, [firefliesKey, clients, meetings]);

    // ─── Fireflies: import single transcript ───
    const handleImportTranscript = useCallback(async (transcript, clientId) => {
        setFfImporting(prev => ({ ...prev, [transcript.id]: true }));
        try {
            const detail = await fetchTranscriptDetail(firefliesKey, transcript.id);
            const meeting = {
                id: `ff_${transcript.id}`,
                firefliesId: transcript.id,
                clientId: clientId || "",
                date: detail.date,
                time: detail.time,
                type: "Estrategia",
                link: "",
                summary: detail.summary || "",
                transcript: detail.transcript || "",
                notes: `Importado de Fireflies · ${detail.title} · ${detail.duration} min`,
                source: "fireflies",
            };
            onSaveMeeting(meeting);
            // Update local state
            setFfTranscripts(prev => prev.map(t =>
                t.id === transcript.id ? { ...t, alreadyImported: true } : t
            ));
        } catch (err) {
            setFfError(`Error al importar: ${err.message}`);
        } finally {
            setFfImporting(prev => ({ ...prev, [transcript.id]: false }));
        }
    }, [firefliesKey, onSaveMeeting]);

    // ─── Google Calendar: connect ───
    const handleConnectGcal = useCallback(async () => {
        if (!gcalClientId) { setGcalError("Configurá tu Client ID de Google en ⚙️ Integraciones"); return; }
        setGcalLoading(true); setGcalError("");
        try {
            await initGoogleCalendar(gcalClientId);
            await signInGoogle();
            setGcalConnected(true);
            const events = await fetchUpcomingEvents(14);
            const enriched = events.map(ev => ({
                ...ev,
                matchedClient: matchEventToClient(ev, clients)
            }));
            setGcalEvents(enriched);
        } catch (err) {
            setGcalError(`Error Google Calendar: ${err.message}`);
        } finally { setGcalLoading(false); }
    }, [gcalClientId, clients]);

    const handleRefreshGcal = useCallback(async () => {
        setGcalLoading(true);
        try {
            const events = await fetchUpcomingEvents(14);
            const enriched = events.map(ev => ({ ...ev, matchedClient: matchEventToClient(ev, clients) }));
            setGcalEvents(enriched);
        } catch (err) { setGcalError(`Error: ${err.message}`); }
        finally { setGcalLoading(false); }
    }, [clients]);

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h1 style={{ fontFamily: "var(--font-display)", color: "var(--accent-gold)", fontSize: 28, margin: 0 }}>Reuniones</h1>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        style={{ ...btnSecondary, fontSize: 12, padding: "6px 14px", color: "#f39c12", borderColor: "rgba(243,156,18,0.3)" }}
                        onClick={handleFetchFireflies}
                        disabled={ffLoading}
                    >
                        {ffLoading ? "⏳ Cargando..." : "🔥 Importar de Fireflies"}
                    </button>
                    <button
                        style={{ ...btnSecondary, fontSize: 12, padding: "6px 14px", color: "#4285f4", borderColor: "rgba(66,133,244,0.3)" }}
                        onClick={gcalConnected ? handleRefreshGcal : handleConnectGcal}
                        disabled={gcalLoading}
                    >
                        {gcalLoading ? "⏳..." : gcalConnected ? "🔄 Refrescar Calendar" : "📅 Conectar Google Calendar"}
                    </button>
                    <button style={btnPrimary} onClick={onNewMeeting}>+ Nueva reunión</button>
                </div>
            </div>

            {/* Errors */}
            {(ffError || gcalError) && (
                <div style={{
                    padding: "8px 14px", background: "rgba(231,76,60,0.1)",
                    borderRadius: "var(--radius-md)", color: "#e74c3c", fontSize: 12,
                    border: "1px solid rgba(231,76,60,0.2)", marginBottom: 12
                }}>❌ {ffError || gcalError}</div>
            )}

            {/* ─── Fireflies Import Panel ─── */}
            {ffPanel && ffTranscripts.length > 0 && (
                <div style={{
                    background: "var(--bg-card)", borderRadius: "var(--radius-xl)",
                    border: "1px solid rgba(243,156,18,0.2)", marginBottom: 20, overflow: "hidden"
                }}>
                    <div style={{
                        padding: "12px 18px", background: "rgba(243,156,18,0.06)",
                        borderBottom: "1px solid rgba(243,156,18,0.15)",
                        display: "flex", justifyContent: "space-between", alignItems: "center"
                    }}>
                        <h3 style={{ margin: 0, fontSize: 14, color: "#f39c12" }}>
                            🔥 Fireflies — {ffTranscripts.length} transcripciones encontradas
                        </h3>
                        <button style={{ ...btnSecondary, fontSize: 11, padding: "4px 10px" }} onClick={() => setFfPanel(false)}>✕ Cerrar</button>
                    </div>
                    <div style={{ maxHeight: 320, overflowY: "auto" }}>
                        {ffTranscripts.map(t => (
                            <div key={t.id} style={{
                                padding: "10px 18px", borderBottom: "1px solid var(--border-primary)",
                                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                                        {t.title}
                                    </div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                        {t.date} {t.time} · {t.duration} min ·{" "}
                                        {t.matchedClient
                                            ? <span style={{ color: "#27ae60" }}>➜ {t.matchedClient.name}</span>
                                            : <span style={{ color: "var(--text-faint)" }}>Sin cliente asociado</span>
                                        }
                                    </div>
                                    {t.summary && (
                                        <div style={{
                                            fontSize: 11, color: "var(--text-dim)", marginTop: 4,
                                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
                                        }}>{t.summary}</div>
                                    )}
                                </div>
                                <div>
                                    {t.alreadyImported ? (
                                        <span style={{ fontSize: 11, color: "#27ae60", fontWeight: 500 }}>✅ Importada</span>
                                    ) : (
                                        <button
                                            style={{ ...btnPrimary, fontSize: 11, padding: "5px 14px", opacity: ffImporting[t.id] ? 0.6 : 1 }}
                                            onClick={() => handleImportTranscript(t, t.matchedClient?.id)}
                                            disabled={ffImporting[t.id]}
                                        >
                                            {ffImporting[t.id] ? "⏳" : "📥 Importar"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Google Calendar Events ─── */}
            {gcalConnected && gcalEvents.length > 0 && (
                <div style={{
                    background: "var(--bg-card)", borderRadius: "var(--radius-xl)",
                    border: "1px solid rgba(66,133,244,0.2)", marginBottom: 20, overflow: "hidden"
                }}>
                    <div style={{
                        padding: "12px 18px", background: "rgba(66,133,244,0.06)",
                        borderBottom: "1px solid rgba(66,133,244,0.15)"
                    }}>
                        <h3 style={{ margin: 0, fontSize: 14, color: "#4285f4" }}>
                            📅 Próximas reuniones — Google Calendar ({gcalEvents.length})
                        </h3>
                    </div>
                    <div style={{ maxHeight: 280, overflowY: "auto" }}>
                        {gcalEvents.map(ev => (
                            <div key={ev.id} style={{
                                padding: "10px 18px", borderBottom: "1px solid var(--border-primary)",
                                display: "flex", justifyContent: "space-between", alignItems: "center"
                            }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                                        {ev.title}
                                    </div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                        {ev.date} · {ev.time}{ev.endTime ? ` – ${ev.endTime}` : ""} ·{" "}
                                        {ev.attendees.length} participantes ·{" "}
                                        {ev.matchedClient
                                            ? <span style={{ color: "#27ae60" }}>➜ {ev.matchedClient.name}</span>
                                            : <span style={{ color: "var(--text-faint)" }}>Sin cliente asociado</span>
                                        }
                                    </div>
                                </div>
                                {ev.link && (
                                    <a href={ev.link} target="_blank" rel="noopener" style={{
                                        ...btnSecondary, fontSize: 11, padding: "4px 10px", textDecoration: "none"
                                    }}>🔗 Join</a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Existing Meetings ─── */}
            {sorted.length === 0 && !gcalConnected && (
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
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {m.source === "fireflies" && (
                                    <span style={{
                                        fontSize: 9, padding: "2px 6px", borderRadius: "var(--radius-pill)",
                                        background: "rgba(243,156,18,0.1)", color: "#f39c12", fontWeight: 600
                                    }}>🔥 FF</span>
                                )}
                                <span style={{ fontWeight: 700, fontSize: 14 }}>{cl?.name || "—"}</span>
                                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
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
