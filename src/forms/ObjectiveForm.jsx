import { useState } from "react";
import Field, { inputStyle, selectStyle, btnPrimary, btnSecondary } from "../components/Field";

export default function ObjectiveForm({ objective, clientId, onSave, onClose }) {
    const [form, setForm] = useState(objective || {
        clientId, title: "", desc: "", kpi_initial: 0, kpi_target: 0,
        deadline: (() => {
            const d = new Date(); d.setMonth(d.getMonth() + 2);
            return d.toISOString().split("T")[0];
        })(),
        status: "Pendiente"
    });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <div>
            <Field label="Título">
                <input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Ej: Subir ventas 30% en 90 días" />
            </Field>
            <Field label="Descripción">
                <textarea style={{ ...inputStyle, height: 50 }} value={form.desc} onChange={e => set("desc", e.target.value)} placeholder="Describí el objetivo..." />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                <Field label="KPI Inicial">
                    <input type="number" style={inputStyle} value={form.kpi_initial} onChange={e => set("kpi_initial", parseFloat(e.target.value) || 0)} />
                </Field>
                <Field label="KPI Meta">
                    <input type="number" style={inputStyle} value={form.kpi_target} onChange={e => set("kpi_target", parseFloat(e.target.value) || 0)} />
                </Field>
                <Field label="Fecha límite">
                    <input type="date" style={inputStyle} value={form.deadline} onChange={e => set("deadline", e.target.value)} />
                </Field>
                <Field label="Estado">
                    <select style={selectStyle} value={form.status} onChange={e => set("status", e.target.value)}>
                        <option>Pendiente</option><option>En progreso</option><option>Cumplido</option>
                    </select>
                </Field>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button style={btnSecondary} onClick={onClose}>Cancelar</button>
                <button style={btnPrimary} onClick={() => onSave({ ...form, clientId })}>
                    {objective ? "Guardar" : "Crear objetivo"}
                </button>
            </div>
        </div>
    );
}
