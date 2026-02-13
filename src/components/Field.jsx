export default function Field({ label, children }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <label style={{
                display: "block", fontSize: 11, textTransform: "uppercase",
                letterSpacing: 1, color: "var(--text-muted)", marginBottom: 4,
                fontFamily: "var(--font-body)", fontWeight: 500
            }}>{label}</label>
            {children}
        </div>
    );
}

export const inputStyle = {
    width: "100%", padding: "8px 12px", background: "var(--bg-tertiary)",
    border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)",
    color: "var(--text-primary)", fontSize: 14, fontFamily: "var(--font-body)",
    boxSizing: "border-box", transition: "border-color var(--transition-fast)",
    outline: "none"
};

export const selectStyle = { ...inputStyle, appearance: "auto" };

export const btnPrimary = {
    padding: "10px 24px", background: "var(--accent-gold)", color: "var(--text-dark)",
    border: "none", borderRadius: "var(--radius-md)", fontWeight: 700,
    cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14,
    transition: "all var(--transition-fast)", letterSpacing: 0.3
};

export const btnSecondary = {
    ...btnPrimary, background: "var(--border-secondary)", color: "#ccc"
};
