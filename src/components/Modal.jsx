import { useState } from "react";

export default function Modal({ open, onClose, title, children, wide }) {
    if (!open) return null;

    return (
        <div
            className="animate-fade-in"
            style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
                zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
                padding: 20, backdropFilter: "blur(4px)"
            }}
            onClick={onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                className="animate-scale-in"
                style={{
                    background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
                    borderRadius: 12, width: wide ? 700 : 520, maxWidth: "95vw",
                    maxHeight: "85vh", overflow: "auto", padding: 0,
                    boxShadow: "0 24px 80px rgba(0,0,0,0.5)"
                }}
            >
                <div style={{
                    padding: "18px 24px", borderBottom: "1px solid var(--border-secondary)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    position: "sticky", top: 0, background: "var(--bg-secondary)", zIndex: 1
                }}>
                    <h3 style={{
                        margin: 0, color: "var(--accent-gold)", fontFamily: "var(--font-body)",
                        fontSize: 18, fontWeight: 700
                    }}>{title}</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none", border: "none", color: "var(--text-muted)",
                            fontSize: 22, cursor: "pointer", lineHeight: 1,
                            transition: "color var(--transition-fast)"
                        }}
                        onMouseEnter={e => e.target.style.color = "#fff"}
                        onMouseLeave={e => e.target.style.color = "var(--text-muted)"}
                    >✕</button>
                </div>
                <div style={{ padding: 24 }}>{children}</div>
            </div>
        </div>
    );
}
