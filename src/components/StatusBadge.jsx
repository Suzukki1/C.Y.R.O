import { statusColorHex } from "../utils/formatters";

export default function StatusBadge({ status, small }) {
    const color = statusColorHex(status);
    return (
        <span style={{
            fontSize: small ? 10 : 11,
            padding: small ? "2px 6px" : "3px 8px",
            borderRadius: "var(--radius-sm)",
            background: color + "22",
            color: color,
            fontWeight: 600,
            whiteSpace: "nowrap"
        }}>{status}</span>
    );
}
