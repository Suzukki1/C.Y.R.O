export default function StatCard({ label, value, color, warn }) {
    return (
        <div
            className="animate-slide-up"
            style={{
                background: "var(--bg-card)", borderRadius: "var(--radius-xl)",
                padding: "18px 20px",
                border: warn ? "1px solid rgba(231,76,60,0.3)" : "1px solid var(--border-primary)",
                transition: "transform var(--transition-fast), border-color var(--transition-fast)"
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                if (!warn) e.currentTarget.style.borderColor = "var(--border-hover)";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                if (!warn) e.currentTarget.style.borderColor = "var(--border-primary)";
            }}
        >
            <div style={{
                fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase",
                letterSpacing: 1, marginBottom: 6, fontWeight: 500
            }}>{label}</div>
            <div style={{
                fontSize: 32, fontWeight: 700, color: color || "var(--accent-gold)",
                fontFamily: "var(--font-display)", lineHeight: 1
            }}>{value}</div>
        </div>
    );
}
