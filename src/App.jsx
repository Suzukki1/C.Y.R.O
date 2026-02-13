import { useState } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { PLAYBOOKS } from "./constants";
import { SAMPLE_CLIENTS, SAMPLE_MEETINGS, SAMPLE_OBJECTIVES, SAMPLE_TASKS } from "./data/sampleData";
import { genId } from "./utils/formatters";

// Components
import Sidebar from "./components/Sidebar";
import Modal from "./components/Modal";

// Forms
import ClientForm from "./forms/ClientForm";
import MeetingForm from "./forms/MeetingForm";
import TaskForm from "./forms/TaskForm";
import ObjectiveForm from "./forms/ObjectiveForm";

// Views
import Dashboard from "./views/Dashboard";
import ClientsList from "./views/ClientsList";
import ClientDetail from "./views/ClientDetail";
import MeetingsAll from "./views/MeetingsAll";
import Playbooks from "./views/Playbooks";
import ExcelAnalysis from "./views/ExcelAnalysis";

import { inputStyle } from "./components/Field";

export default function App() {
  // ─── State ───
  const [view, setView] = useState("dashboard");
  const [clients, setClients] = useLocalStorage("cml_clients", SAMPLE_CLIENTS);
  const [meetings, setMeetings] = useLocalStorage("cml_meetings", SAMPLE_MEETINGS);
  const [objectives, setObjectives] = useLocalStorage("cml_objectives", SAMPLE_OBJECTIVES);
  const [tasks, setTasks] = useLocalStorage("cml_tasks", SAMPLE_TASKS);
  const [selectedClient, setSelectedClient] = useState(null);
  const [modal, setModal] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [apiKey, setApiKey] = useLocalStorage("cml_perplexity_key", "");
  const [showApiKey, setShowApiKey] = useState(false);

  // ─── Navigation ───
  const openClient = (id) => { setSelectedClient(id); setView("client"); };
  const navigate = (viewId) => { setView(viewId); setSelectedClient(null); };

  // ─── Current client data ───
  const client = clients.find(c => c.id === selectedClient);
  const clientMeetings = meetings
    .filter(m => m.clientId === selectedClient)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const clientObjectives = objectives.filter(o => o.clientId === selectedClient);
  const clientTasks = tasks.filter(t => t.clientId === selectedClient);

  // ─── CRUD Handlers ───
  const saveClient = (formData, playbookId) => {
    const id = formData.id || genId("c");
    const newClient = { ...formData, id };

    setClients(prev => {
      const exists = prev.find(c => c.id === id);
      return exists ? prev.map(c => c.id === id ? newClient : c) : [...prev, newClient];
    });

    // Apply playbook
    if (playbookId) {
      const pb = PLAYBOOKS.find(p => p.id === playbookId);
      if (pb) {
        const newObj = {
          id: genId("o"), clientId: id, title: pb.name,
          desc: `Objetivo generado por playbook: ${pb.name}`,
          kpi_initial: 0, kpi_target: 100,
          deadline: (() => { const d = new Date(); d.setMonth(d.getMonth() + 2); return d.toISOString().split("T")[0]; })(),
          status: "En progreso"
        };
        setObjectives(prev => [...prev, newObj]);
        const newTasks = pb.tasks.map(t => ({
          id: genId("t"), objectiveId: newObj.id, clientId: id,
          type: t.type, desc: t.desc, responsible: "Consultor",
          deadline: (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split("T")[0]; })(),
          status: "Pendiente"
        }));
        setTasks(prev => [...prev, ...newTasks]);
      }
    }
    setModal(null);
  };

  const saveMeeting = (m) => {
    const id = m.id || genId("m");
    const meeting = { ...m, id };
    setMeetings(prev => {
      const exists = prev.find(x => x.id === id);
      return exists ? prev.map(x => x.id === id ? meeting : x) : [...prev, meeting];
    });
    setModal(null);
  };

  const saveTask = (t) => {
    const id = t.id || genId("t");
    const task = { ...t, id };
    setTasks(prev => {
      const exists = prev.find(x => x.id === id);
      return exists ? prev.map(x => x.id === id ? task : x) : [...prev, task];
    });
    setModal(null);
  };

  const saveObjective = (o) => {
    const id = o.id || genId("o");
    const objective = { ...o, id };
    setObjectives(prev => {
      const exists = prev.find(x => x.id === id);
      return exists ? prev.map(x => x.id === id ? objective : x) : [...prev, objective];
    });
    setModal(null);
  };

  const toggleTaskStatus = (task) => {
    const next = task.status === "Cumplida" ? "Pendiente" :
      task.status === "Pendiente" ? "En progreso" :
        task.status === "En progreso" ? "Cumplida" : task.status;
    setTasks(prev => prev.map(x => x.id === task.id ? { ...x, status: next } : x));
  };

  // ─── Render ───
  return (
    <div style={{
      display: "flex", height: "100vh", background: "var(--bg-primary)",
      color: "var(--text-primary)", fontFamily: "var(--font-body)", overflow: "hidden"
    }}>
      {/* Sidebar */}
      <Sidebar
        view={view}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "24px 32px", position: "relative" }}>
        {/* API Key config toggle */}
        <div style={{ position: "absolute", top: 16, right: 24, zIndex: 10 }}>
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            style={{
              background: apiKey ? "rgba(39,174,96,0.15)" : "rgba(255,224,102,0.1)",
              border: `1px solid ${apiKey ? "rgba(39,174,96,0.3)" : "rgba(255,224,102,0.2)"}`,
              borderRadius: "var(--radius-md)", padding: "6px 12px",
              color: apiKey ? "#27ae60" : "var(--accent-gold)",
              cursor: "pointer", fontSize: 12, fontFamily: "var(--font-body)",
              transition: "all var(--transition-fast)"
            }}
          >
            {apiKey ? "🟢 Perplexity IA" : "⚙️ Config IA"}
          </button>

          {showApiKey && (
            <div style={{
              position: "absolute", top: "100%", right: 0, marginTop: 8,
              background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-lg)", padding: 16, width: 320,
              boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
              animation: "slideDown 0.2s ease-out"
            }}>
              <div style={{
                fontSize: 12, color: "var(--accent-gold)", marginBottom: 8,
                fontWeight: 600, textTransform: "uppercase", letterSpacing: 1
              }}>Perplexity API Key</div>
              <input
                type="password"
                style={{ ...inputStyle, fontSize: 12 }}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="pplx-..."
              />
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 6 }}>
                Obtené tu key en{" "}
                <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener">
                  perplexity.ai/settings/api
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ─── Views ─── */}
        {view === "dashboard" && (
          <Dashboard
            clients={clients} tasks={tasks} meetings={meetings}
            onOpenClient={openClient}
            onNewMeeting={() => setModal("newMeeting")}
          />
        )}

        {view === "clients" && (
          <ClientsList
            clients={clients} tasks={tasks}
            onOpenClient={openClient}
            onNewClient={() => setModal("newClient")}
          />
        )}

        {view === "client" && client && (
          <ClientDetail
            client={client}
            objectives={clientObjectives}
            tasks={clientTasks}
            meetings={clientMeetings}
            apiKey={apiKey}
            onBack={() => setView("clients")}
            onEditClient={() => setModal("editClient")}
            onNewObjective={() => setModal("newObjective")}
            onEditObjective={(o) => setModal({ type: "editObjective", data: o })}
            onNewTask={() => setModal("newTask")}
            onEditTask={(t) => setModal({ type: "editTask", data: t })}
            onToggleTaskStatus={toggleTaskStatus}
            onNewMeeting={() => setModal("newMeetingClient")}
            onEditMeeting={(m) => setModal({ type: "editMeeting", data: m })}
          />
        )}

        {view === "meetings_all" && (
          <MeetingsAll
            meetings={meetings} clients={clients}
            onOpenClient={openClient}
            onNewMeeting={() => setModal("newMeeting")}
            onEditMeeting={(m) => setModal({ type: "editMeeting", data: m })}
          />
        )}

        {view === "excel" && <ExcelAnalysis apiKey={apiKey} />}

        {view === "playbooks" && <Playbooks />}
      </div>

      {/* ─── Modals ─── */}
      <Modal open={modal === "newClient"} onClose={() => setModal(null)} title="Nuevo cliente" wide>
        <ClientForm onSave={saveClient} onClose={() => setModal(null)} />
      </Modal>

      <Modal open={modal === "editClient"} onClose={() => setModal(null)} title="Editar cliente" wide>
        {client && <ClientForm client={client} onSave={saveClient} onClose={() => setModal(null)} />}
      </Modal>

      <Modal open={modal === "newMeeting" || modal === "newMeetingClient"} onClose={() => setModal(null)} title="Nueva reunión" wide>
        <MeetingForm
          clientId={modal === "newMeetingClient" ? selectedClient : null}
          clients={clients}
          onSave={saveMeeting}
          onClose={() => setModal(null)}
          apiKey={apiKey}
        />
      </Modal>

      <Modal open={modal?.type === "editMeeting"} onClose={() => setModal(null)} title="Editar reunión" wide>
        {modal?.data && (
          <MeetingForm
            meeting={modal.data}
            clientId={modal.data.clientId}
            clients={clients}
            onSave={saveMeeting}
            onClose={() => setModal(null)}
            apiKey={apiKey}
          />
        )}
      </Modal>

      <Modal open={modal === "newTask"} onClose={() => setModal(null)} title="Nueva tarea">
        <TaskForm
          clientId={selectedClient}
          objectives={objectives}
          onSave={saveTask}
          onClose={() => setModal(null)}
        />
      </Modal>

      <Modal open={modal?.type === "editTask"} onClose={() => setModal(null)} title="Editar tarea">
        {modal?.data && (
          <TaskForm
            task={modal.data}
            clientId={modal.data.clientId}
            objectives={objectives}
            onSave={saveTask}
            onClose={() => setModal(null)}
          />
        )}
      </Modal>

      <Modal open={modal === "newObjective"} onClose={() => setModal(null)} title="Nuevo objetivo">
        <ObjectiveForm
          clientId={selectedClient}
          onSave={saveObjective}
          onClose={() => setModal(null)}
        />
      </Modal>

      <Modal open={modal?.type === "editObjective"} onClose={() => setModal(null)} title="Editar objetivo">
        {modal?.data && (
          <ObjectiveForm
            objective={modal.data}
            clientId={modal.data.clientId}
            onSave={saveObjective}
            onClose={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}
