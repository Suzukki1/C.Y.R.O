import { useState, useRef, useCallback } from "react";
import { parseExcelFile, getFileSummary } from "../utils/excelParser";
import { generateExcelAnalysis } from "../services/perplexity";
import { btnPrimary, btnSecondary } from "../components/Field";

export default function ExcelAnalysis({ apiKey }) {
    const [file, setFile] = useState(null);
    const [parsed, setParsed] = useState(null);
    const [error, setError] = useState("");
    const [analysis, setAnalysis] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [aiError, setAiError] = useState("");
    const [dragging, setDragging] = useState(false);
    const [copied, setCopied] = useState(false);
    const inputRef = useRef(null);

    const handleFile = useCallback(async (f) => {
        setError("");
        setAnalysis("");
        setAiError("");

        const validExts = [".xlsx", ".xls", ".csv"];
        const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
        if (!validExts.includes(ext)) {
            setError("Formato no soportado. Usá archivos .xlsx, .xls o .csv");
            return;
        }

        try {
            const result = await parseExcelFile(f);
            setFile(f);
            setParsed(result);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer?.files?.[0];
        if (f) handleFile(f);
    }, [handleFile]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => setDragging(false), []);

    const handleInputChange = (e) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
    };

    const handleAnalyze = async () => {
        if (!apiKey) {
            setAiError("⚙️ Configurá tu API key de Perplexity arriba a la derecha para usar esta función.");
            return;
        }
        if (!parsed) return;

        setAnalyzing(true);
        setAiError("");
        try {
            const result = await generateExcelAnalysis(apiKey, parsed.rawText, file.name);
            setAnalysis(result);
        } catch (err) {
            setAiError(`Error: ${err.message}`);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(analysis);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        setFile(null);
        setParsed(null);
        setError("");
        setAnalysis("");
        setAiError("");
        if (inputRef.current) inputRef.current.value = "";
    };

    const summary = parsed ? getFileSummary(parsed.headers, parsed.rows, parsed.sheetName) : null;

    return (
        <div className="animate-fade-in">
            <h1 style={{
                fontFamily: "var(--font-display)", color: "var(--accent-gold)",
                fontSize: 28, marginBottom: 4
            }}>
                📊 Excel → Análisis IA
            </h1>
            <p style={{ color: "var(--text-dim)", marginBottom: 24, fontSize: 14 }}>
                Cargá un archivo Excel con datos de la cuenta y obtené un análisis inteligente con Perplexity AI
            </p>

            {/* ─── Upload Zone ─── */}
            {!parsed && (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => inputRef.current?.click()}
                    style={{
                        background: dragging ? "rgba(255,224,102,0.08)" : "var(--bg-card)",
                        border: `2px dashed ${dragging ? "var(--accent-gold)" : "var(--border-secondary)"}`,
                        borderRadius: "var(--radius-xl)", padding: "60px 40px",
                        textAlign: "center", cursor: "pointer",
                        transition: "all var(--transition-normal)",
                        maxWidth: 600, margin: "0 auto"
                    }}
                >
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
                    <div style={{
                        fontSize: 16, fontWeight: 600, color: "var(--text-primary)",
                        marginBottom: 8
                    }}>
                        {dragging ? "Soltá el archivo aquí" : "Arrastrá un archivo Excel aquí"}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
                        o hacé clic para seleccionar
                    </div>
                    <div style={{
                        display: "inline-flex", gap: 8, flexWrap: "wrap", justifyContent: "center"
                    }}>
                        {[".xlsx", ".xls", ".csv"].map(ext => (
                            <span key={ext} style={{
                                padding: "4px 10px", background: "var(--border-primary)",
                                borderRadius: "var(--radius-pill)", fontSize: 11,
                                color: "var(--text-muted)", fontFamily: "monospace"
                            }}>{ext}</span>
                        ))}
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleInputChange}
                        style={{ display: "none" }}
                    />
                </div>
            )}

            {/* ─── Error ─── */}
            {error && (
                <div style={{
                    padding: "10px 14px", background: "rgba(231,76,60,0.1)",
                    borderRadius: "var(--radius-md)", color: "#e74c3c", fontSize: 13,
                    border: "1px solid rgba(231,76,60,0.2)", marginTop: 16,
                    maxWidth: 600, margin: "16px auto 0"
                }}>❌ {error}</div>
            )}

            {/* ─── Data Preview ─── */}
            {parsed && (
                <div style={{ marginTop: 8 }}>
                    {/* File info bar */}
                    <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        marginBottom: 16, flexWrap: "wrap", gap: 12
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <span style={{
                                padding: "5px 12px", background: "rgba(255,224,102,0.1)",
                                border: "1px solid rgba(255,224,102,0.2)",
                                borderRadius: "var(--radius-pill)", fontSize: 12,
                                color: "var(--accent-gold)", fontWeight: 600
                            }}>📄 {file.name}</span>
                            <span style={{
                                padding: "4px 10px", background: "var(--border-primary)",
                                borderRadius: "var(--radius-pill)", fontSize: 11, color: "var(--text-muted)"
                            }}>Hoja: {summary.sheetName}</span>
                            <span style={{
                                padding: "4px 10px", background: "var(--border-primary)",
                                borderRadius: "var(--radius-pill)", fontSize: 11, color: "var(--text-muted)"
                            }}>{summary.totalRows} filas · {summary.totalColumns} columnas</span>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button style={{ ...btnSecondary, fontSize: 12, padding: "6px 14px" }} onClick={handleReset}>
                                🔄 Cambiar archivo
                            </button>
                            <button
                                style={{
                                    ...btnPrimary, fontSize: 12, padding: "6px 16px",
                                    opacity: analyzing ? 0.7 : 1,
                                    ...(analyzing ? { animation: "pulse 1.5s infinite" } : {})
                                }}
                                onClick={handleAnalyze}
                                disabled={analyzing}
                            >
                                {analyzing ? "⏳ Analizando..." : "✨ Analizar con IA"}
                            </button>
                        </div>
                    </div>

                    {/* Data table */}
                    <div style={{
                        background: "var(--bg-card)", borderRadius: "var(--radius-xl)",
                        border: "1px solid var(--border-primary)", overflow: "hidden", marginBottom: 20
                    }}>
                        <div style={{ overflowX: "auto", maxHeight: 360 }}>
                            <table style={{
                                width: "100%", borderCollapse: "collapse", fontSize: 12,
                                fontFamily: "var(--font-body)"
                            }}>
                                <thead>
                                    <tr>
                                        <th style={{
                                            ...thStyle, background: "var(--bg-tertiary)",
                                            color: "var(--accent-gold)", width: 40, textAlign: "center"
                                        }}>#</th>
                                        {parsed.headers.map((h, i) => (
                                            <th key={i} style={{
                                                ...thStyle, background: "var(--bg-tertiary)",
                                                color: "var(--accent-gold)"
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsed.rows.slice(0, 50).map((row, ri) => (
                                        <tr key={ri} style={{
                                            borderBottom: "1px solid var(--border-primary)",
                                            transition: "background var(--transition-fast)"
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,224,102,0.03)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                        >
                                            <td style={{ ...tdStyle, color: "var(--text-faint)", textAlign: "center" }}>{ri + 1}</td>
                                            {parsed.headers.map((h, ci) => (
                                                <td key={ci} style={tdStyle}>
                                                    {row[h] !== undefined && row[h] !== null ? String(row[h]) : ""}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {parsed.rows.length > 50 && (
                            <div style={{
                                padding: "8px 16px", background: "var(--bg-tertiary)",
                                fontSize: 11, color: "var(--text-dim)", textAlign: "center"
                            }}>
                                Mostrando 50 de {parsed.rows.length} filas. Todas las filas serán incluidas en el análisis.
                            </div>
                        )}
                    </div>

                    {/* AI Error */}
                    {aiError && (
                        <div style={{
                            padding: "10px 14px", background: "rgba(231,76,60,0.1)",
                            borderRadius: "var(--radius-md)", color: "#e74c3c", fontSize: 13,
                            border: "1px solid rgba(231,76,60,0.2)", marginBottom: 16
                        }}>{aiError}</div>
                    )}

                    {/* Analysis Result */}
                    {analysis && (
                        <div style={{
                            background: "var(--bg-card)", borderRadius: "var(--radius-xl)",
                            border: "1px solid var(--border-primary)", overflow: "hidden"
                        }}>
                            <div style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                padding: "14px 20px", borderBottom: "1px solid var(--border-primary)",
                                background: "var(--bg-tertiary)"
                            }}>
                                <h3 style={{ margin: 0, fontSize: 15, color: "var(--accent-gold)" }}>
                                    🤖 Análisis IA — {file.name}
                                </h3>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        style={{ ...btnSecondary, fontSize: 11, padding: "5px 12px" }}
                                        onClick={handleCopy}
                                    >
                                        {copied ? "✅ Copiado" : "📋 Copiar"}
                                    </button>
                                    <button
                                        style={{
                                            ...btnPrimary, fontSize: 11, padding: "5px 12px",
                                            opacity: analyzing ? 0.7 : 1
                                        }}
                                        onClick={handleAnalyze}
                                        disabled={analyzing}
                                    >
                                        {analyzing ? "⏳..." : "🔄 Re-analizar"}
                                    </button>
                                </div>
                            </div>
                            <div style={{
                                padding: 20, fontSize: 13, color: "var(--text-secondary)",
                                lineHeight: 1.8, whiteSpace: "pre-wrap"
                            }}>
                                {analysis}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Table styles
const thStyle = {
    padding: "10px 14px", textAlign: "left", fontWeight: 600,
    fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5,
    whiteSpace: "nowrap", position: "sticky", top: 0, zIndex: 1
};

const tdStyle = {
    padding: "8px 14px", color: "var(--text-primary)",
    whiteSpace: "nowrap", maxWidth: 250, overflow: "hidden",
    textOverflow: "ellipsis"
};
