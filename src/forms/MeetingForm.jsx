import { useState } from "react";
import Field, { inputStyle, selectStyle, btnPrimary, btnSecondary } from "../components/Field";
import { MEETING_TYPES } from "../constants";
import { generateMeetingSummary } from "../services/perplexity";

export default function MeetingForm({ meeting, clientId, clients, onSave, onClose, apiKey }) {
    const [form, setForm] = useState(meeting || {
        clientId: clientId || "", date: new Date().toISOString().split("T")[0],
        time: "10:00", type: "Estrategia",
        link: "", summary: "", transcript: "", notes: ""
    });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const [processing, setProcessing] = useState(false);
    const [aiError, setAiError] = useState("");

    const clientName = clients?.find(c => c.id === (clientId || form.clientId))?.name || "Cliente";

    const handleAISummary = async () => {
        if (!form.transcript.trim()) return;
        setAiError("");

        if (!apiKey) {
            setAiError("Configura tu API key de Perplexity en el Dashboard (⚙️) para usar esta función.");
            return;
        }

        setProcessing(true);
        try {
            const summary = await generateMeetingSummary(apiKey, form.transcript, clientName, form.type);
            set("summary", summary);
        } catch (err) {
            setAiError(`Error IA: ${err.message}`);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {!clientId && (
                    <Field label="Cliente">
                        <select style={selectStyle} value={form.clientId} onChange={e => set("clientId", e.target.value)}>
                            <option value="">Seleccionar...</option>
                            {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </Field>
                )}
                <Field label="Fecha"><input type="date" style={inputStyle} value={form.date} onChange={e => set("date", e.target.value)} /></Field>
                <Field label="Hora"><input type="time" style={inputStyle} value={form.time} onChange={e => set("time", e.target.value)} /></Field>
                <Field label="Tipo">
                    <select style={selectStyle} value={form.type} onChange={e => set("type", e.target.value)}>
                        {MEETING_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                </Field>
                <Field label="Link (Zoom/Meet)"><input style={inputStyle} value={form.link} onChange={e => set("link", e.target.value)} placeholder="https://..." /></Field>
            </div>

            <Field label="Notas del consultor">
                <textarea style={{ ...inputStyle, height: 70, resize: "vertical" }} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Bullets rápidos..." />
            </Field>

            {/* AI Transcript Section */}
            <div style={{
                padding: 14, background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)", marginTop: 10,
                border: "1px solid var(--border-primary)"
            }}>
                <div style={{
                    fontSize: 12, color: "var(--accent-gold)", marginBottom: 8,
                    fontWeight: 600, textTransform: "uppercase", letterSpacing: 1
                }}>🤖 Análisis con Perplexity IA</div>
                <Field label="Pegar transcripción">
                    <textarea
                        style={{ ...inputStyle, height: 80, resize: "vertical" }}
                        value={form.transcript}
                        onChange={e => set("transcript", e.target.value)}
                        placeholder="Pegar transcripción de Otter, Fireflies, Google Meet, etc..."
                    />
                </Field>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                        style={{
                            ...btnSecondary, fontSize: 12, padding: "6px 14px",
                            opacity: processing ? 0.7 : 1,
                            ...(processing ? { animation: "pulse 1.5s infinite" } : {})
                        }}
                        onClick={handleAISummary}
                        disabled={processing || !form.transcript.trim()}
                    >
                        {processing ? "⏳ Analizando con Perplexity..." : "✨ Generar resumen con IA"}
                    </button>
                    <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
                        Extrae resumen, acuerdos y próximos pasos
                    </span>
                </div>
                {aiError && (
                    <div style={{
                        marginTop: 8, padding: "8px 12px", background: "rgba(231,76,60,0.1)",
                        borderRadius: "var(--radius-sm)", color: "#e74c3c", fontSize: 12,
                        border: "1px solid rgba(231,76,60,0.2)"
                    }}>{aiError}</div>
                )}
            </div>

            <Field label="Resumen">
                <textarea
                    style={{ ...inputStyle, height: 100, resize: "vertical", marginTop: 8 }}
                    value={form.summary}
                    onChange={e => set("summary", e.target.value)}
                    placeholder="Resumen manual o generado por IA..."
                />
            </Field>

            <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button style={btnSecondary} onClick={onClose}>Cancelar</button>
                <button style={btnPrimary} onClick={() => onSave({ ...form, clientId: clientId || form.clientId })}>
                    {meeting ? "Guardar" : "Crear reunión"}
                </button>
            </div>
        </div>
    );
}
