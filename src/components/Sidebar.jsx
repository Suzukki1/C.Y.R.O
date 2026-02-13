import { useState } from "react";

const navItems = [
    { id: "dashboard", icon: "◉", label: "Dashboard" },
    { id: "clients", icon: "◈", label: "Clientes" },
    { id: "meetings_all", icon: "◎", label: "Reuniones" },
    { id: "playbooks", icon: "◇", label: "Playbooks" },
];

export default function Sidebar({ view, onNavigate, isOpen, onToggle }) {
    return (
        <div style={{
            width: isOpen ? 220 : 60, background: "var(--bg-secondary)",
            borderRight: "1px solid var(--border-primary)", display: "flex",
            flexDirection: "column", transition: "width var(--transition-normal)",
            flexShrink: 0, overflow: "hidden"
        }}>
            {/* Logo */}
            <div
                style={{
                    padding: "20px 16px", borderBottom: "1px solid var(--border-primary)",
                    display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                    minHeight: 62
                }}
                onClick={onToggle}
            >
                <div style={{
                    width: 28, height: 28, borderRadius: "var(--radius-md)",
                    background: "linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dim))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, flexShrink: 0, boxShadow: "0 2px 8px rgba(255,224,102,0.3)"
                }}>⚡</div>
                {isOpen && (
                    <span style={{
                        fontWeight: 700, fontSize: 15, color: "var(--accent-gold)",
                        fontFamily: "var(--font-display)", whiteSpace: "nowrap",
                        letterSpacing: 0.5
                    }}>ConsultorML</span>
                )}
            </div>

            {/* Navigation */}
            <nav style={{ padding: "12px 8px", flex: 1 }}>
                {navItems.map(item => {
                    const isActive = view === item.id ||
                        (item.id === "clients" && view === "client");

                    return (
                        <div
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            style={{
                                padding: isOpen ? "10px 12px" : "10px 0", marginBottom: 4,
                                borderRadius: "var(--radius-lg)", cursor: "pointer",
                                background: isActive ? "var(--border-primary)" : "transparent",
                                color: isActive ? "var(--accent-gold)" : "var(--text-muted)",
                                display: "flex", alignItems: "center", gap: 10, fontSize: 14,
                                transition: "all var(--transition-fast)",
                                justifyContent: isOpen ? "flex-start" : "center"
                            }}
                            onMouseEnter={e => {
                                if (!isActive) e.currentTarget.style.background = "rgba(30,30,53,0.5)";
                            }}
                            onMouseLeave={e => {
                                if (!isActive) e.currentTarget.style.background = "transparent";
                            }}
                        >
                            <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                            {isOpen && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            {isOpen && (
                <div style={{
                    padding: "12px 16px", borderTop: "1px solid var(--border-primary)",
                    fontSize: 11, color: "var(--text-faint)"
                }}>
                    MVP v1.0 — Feb 2026
                </div>
            )}
        </div>
    );
}
