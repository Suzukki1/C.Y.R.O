import { useState } from "react";
import Field, { inputStyle, selectStyle, btnPrimary, btnSecondary } from "../components/Field";
import { TASK_TYPES, TASK_STATES } from "../constants";

export default function TaskForm({ task, clientId, objectives, onSave, onClose }) {
    const clientObjectives = objectives?.filter(o => o.clientId === clientId) || [];
    const [form, setForm] = useState(task || {
        clientId, objectiveId: clientObjectives[0]?.id || "", type: "SEO Listings",
        desc: "", responsible: "Consultor", deadline: (() => {
            const d = new Date(); d.setDate(d.getDate() + 14);
            return d.toISOString().split("T")[0];
        })(), status: "Pendiente"
    });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Objetivo vinculado">
                    <select style={selectStyle} value={form.objectiveId} onChange={e => set("objectiveId", e.target.value)}>
                        <option value="">Sin objetivo</option>
                        {clientObjectives.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                    </select>
                </Field>
                <Field label="Tipo">
                    <select style={selectStyle} value={form.type} onChange={e => set("type", e.target.value)}>
                        {TASK_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                </Field>
            </div>
            <Field label="Descripción">
                <textarea style={{ ...inputStyle, height: 60 }} value={form.desc} onChange={e => set("desc", e.target.value)} placeholder="Descripción concreta de la tarea..." />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <Field label="Responsable">
                    <select style={selectStyle} value={form.responsible} onChange={e => set("responsible", e.target.value)}>
                        <option>Consultor</option><option>Equipo</option><option>Cliente</option>
                    </select>
                </Field>
                <Field label="Fecha límite">
                    <input type="date" style={inputStyle} value={form.deadline} onChange={e => set("deadline", e.target.value)} />
                </Field>
                <Field label="Estado">
                    <select style={selectStyle} value={form.status} onChange={e => set("status", e.target.value)}>
                        {TASK_STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                </Field>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button style={btnSecondary} onClick={onClose}>Cancelar</button>
                <button style={btnPrimary} onClick={() => onSave({ ...form, clientId })}>
                    {task ? "Guardar" : "Crear tarea"}
                </button>
            </div>
        </div>
    );
}
