import { useState } from "react";
import Field, { inputStyle, selectStyle, btnPrimary, btnSecondary } from "../components/Field";
import { COUNTRIES, ML_LEVELS, PHASES, PRIORITIES, PLAYBOOKS } from "../constants";

export default function ClientForm({ client, onSave, onClose }) {
    const [form, setForm] = useState(client || {
        name: "", brand: "", country: "Argentina", contact: "", email: "",
        nick_ml: "", level_ml: "Free", category: "", business_type: "",
        phase: "Onboarding", priority: "Media",
        kpis: { ventas30d: 0, ventasUnidades: 0, conversion: 0, visitas: 0, precioPromedio: 0, consideracion: 0, tasaRecompra: 0, tickets: 0 }
    });
    const [playbook, setPlaybook] = useState("");
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const setKpi = (k, v) => setForm(f => ({ ...f, kpis: { ...f.kpis, [k]: parseFloat(v) || 0 } }));

    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Nombre"><input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ej: TechStore BA" /></Field>
                <Field label="Marca"><input style={inputStyle} value={form.brand} onChange={e => set("brand", e.target.value)} placeholder="Ej: TechStore" /></Field>
                <Field label="País"><select style={selectStyle} value={form.country} onChange={e => set("country", e.target.value)}>{COUNTRIES.map(c => <option key={c}>{c}</option>)}</select></Field>
                <Field label="Contacto"><input style={inputStyle} value={form.contact} onChange={e => set("contact", e.target.value)} placeholder="+54 11 ..." /></Field>
                <Field label="Email"><input style={inputStyle} value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@ejemplo.com" /></Field>
                <Field label="Nick MercadoLibre"><input style={inputStyle} value={form.nick_ml} onChange={e => set("nick_ml", e.target.value)} placeholder="NICK_ML" /></Field>
                <Field label="Nivel ML"><select style={selectStyle} value={form.level_ml} onChange={e => set("level_ml", e.target.value)}>{ML_LEVELS.map(l => <option key={l}>{l}</option>)}</select></Field>
                <Field label="Categoría principal"><input style={inputStyle} value={form.category} onChange={e => set("category", e.target.value)} placeholder="Ej: Electrónica" /></Field>
                <Field label="Tipo de negocio"><input style={inputStyle} value={form.business_type} onChange={e => set("business_type", e.target.value)} placeholder="Ej: Retail, Marca propia" /></Field>
                <Field label="Fase"><select style={selectStyle} value={form.phase} onChange={e => set("phase", e.target.value)}>{PHASES.map(p => <option key={p}>{p}</option>)}</select></Field>
                <Field label="Prioridad"><select style={selectStyle} value={form.priority} onChange={e => set("priority", e.target.value)}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></Field>
            </div>

            {/* KPIs */}
            <div style={{ marginTop: 16, padding: 14, background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)" }}>
                <div style={{ fontSize: 12, color: "var(--accent-gold)", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>KPIs Actuales</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                    <Field label="Ventas $"><input type="number" style={inputStyle} value={form.kpis.ventas30d} onChange={e => setKpi("ventas30d", e.target.value)} /></Field>
                    <Field label="Ventas (uds)"><input type="number" style={inputStyle} value={form.kpis.ventasUnidades} onChange={e => setKpi("ventasUnidades", e.target.value)} /></Field>
                    <Field label="Conversión %"><input type="number" step="0.1" style={inputStyle} value={form.kpis.conversion} onChange={e => setKpi("conversion", e.target.value)} /></Field>
                    <Field label="Visitas"><input type="number" style={inputStyle} value={form.kpis.visitas} onChange={e => setKpi("visitas", e.target.value)} /></Field>
                    <Field label="Precio Prom."><input type="number" style={inputStyle} value={form.kpis.precioPromedio} onChange={e => setKpi("precioPromedio", e.target.value)} /></Field>
                    <Field label="Consideración %"><input type="number" step="0.1" style={inputStyle} value={form.kpis.consideracion} onChange={e => setKpi("consideracion", e.target.value)} /></Field>
                    <Field label="Recompra %"><input type="number" step="0.1" style={inputStyle} value={form.kpis.tasaRecompra} onChange={e => setKpi("tasaRecompra", e.target.value)} /></Field>
                    <Field label="Tickets"><input type="number" style={inputStyle} value={form.kpis.tickets} onChange={e => setKpi("tickets", e.target.value)} /></Field>
                </div>
            </div>

            {/* Playbook selector (only for new clients) */}
            {!client && (
                <div style={{ marginTop: 16, padding: 14, background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)" }}>
                    <Field label="Aplicar Playbook (opcional)">
                        <select style={selectStyle} value={playbook} onChange={e => setPlaybook(e.target.value)}>
                            <option value="">Sin playbook</option>
                            {PLAYBOOKS.map(pb => <option key={pb.id} value={pb.id}>{pb.name}</option>)}
                        </select>
                    </Field>
                </div>
            )}

            <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button style={btnSecondary} onClick={onClose}>Cancelar</button>
                <button style={btnPrimary} onClick={() => onSave(form, playbook)}>
                    {client ? "Guardar" : "Crear cliente"}
                </button>
            </div>
        </div>
    );
}
