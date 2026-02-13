import { useState, useRef, useCallback } from "react";
import { parseExcelFile, getFileSummary } from "../utils/excelParser";
import { generateExcelAnalysis } from "../services/perplexity";
import { btnPrimary, btnSecondary, selectStyle } from "../components/Field";
import { useLocalStorage } from "../hooks/useLocalStorage";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function formatAnalysisDate(iso) {
    const d = new Date(iso);
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} — ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getMonthLabel(iso) {
    const d = new Date(iso);
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function ExcelAnalysis({ apiKey, clients }) {
    // ─── State ───
    const [selectedClientId, setSelectedClientId] = useState("");
    const [file, setFile] = useState(null);
    const [parsed, setParsed] = useState(null);
    const [error, setError] = useState("");
    const [analysis, setAnalysis] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [aiError, setAiError] = useState("");
    const [dragging, setDragging] = useState(false);
    const [copied, setCopied] = useState(false);
    const [viewingHistoryItem, setViewingHistoryItem] = useState(null);
    const inputRef = useRef(null);

    // ─── Persisted history per client ───
    const [excelHistory, setExcelHistory] = useLocalStorage("cml_excel_history", {});

    const selectedClient = clients.find(c => c.id === selectedClientId);
    const clientHistory = (excelHistory[selectedClientId] || [])
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Group history by month
    const historyByMonth = {};
    clientHistory.forEach(item => {
        const label = getMonthLabel(item.date);
        if (!historyByMonth[label]) historyByMonth[label] = [];
        historyByMonth[label].push(item);
    });

    // ─── File handling ───
    const handleFile = useCallback(async (f) => {
        setError("");
        setAnalysis("");
        setAiError("");
        setViewingHistoryItem(null);

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

    // ─── AI Analysis ───
    const handleAnalyze = async () => {
        if (!apiKey) {
            setAiError("⚙️ Configurá tu API key de Perplexity arriba a la derecha para usar esta función.");
            return;
        }
        if (!parsed || !selectedClientId) return;

        setAnalyzing(true);
        setAiError("");
        try {
            const clientContext = selectedClient
                ? `\nCLIENTE: ${selectedClient.name} (${selectedClient.brand})\nPAÍS: ${selectedClient.country}\nCATEGORÍA: ${selectedClient.category}\nNIVEL ML: ${selectedClient.level_ml}\n`
                : "";

            const result = await generateExcelAnalysis(apiKey, clientContext + parsed.rawText, file.name);
            setAnalysis(result);

            // Save to history
            const entry = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                fileName: file.name,
                rowCount: parsed.rows.length,
                colCount: parsed.headers.length,
                headers: parsed.headers,
                analysis: result,
            };
            setExcelHistory(prev => ({
                ...prev,
                [selectedClientId]: [...(prev[selectedClientId] || []), entry]
            }));
        } catch (err) {
            setAiError(`Error: ${err.message}`);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text || analysis);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        setFile(null);
        setParsed(null);
        setError("");
        setAnalysis("");
        setAiError("");
        setViewingHistoryItem(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleDeleteHistory = (entryId) => {
        setExcelHistory(prev => ({
            ...prev,
            [selectedClientId]: (prev[selectedClientId] || []).filter(e => e.id !== entryId)
        }));
        if (viewingHistoryItem?.id === entryId) setViewingHistoryItem(null);
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
            <p style={{ color: "var(--text-dim)", marginBottom: 20, fontSize: 14 }}>
                Cargá archivos Excel por cliente para hacer un seguimiento mensual con análisis de IA
            </p>

            {/* ─── Client Selector ─── */}
            <div style={{
                background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20,
                border: "1px solid var(--border-primary)", marginBottom: 20
            }}>
                <div style={{
                    fontSize: 11, textTransform: "uppercase", letterSpacing: 1,
                    color: "var(--text-muted)", marginBottom: 8, fontWeight: 500
                }}>Seleccioná un cliente</div>
                <select
                    value={selectedClientId}
                    onChange={e => {
                        setSelectedClientId(e.target.value);
                        handleReset();
                    }}
                    style={{ ...selectStyle, maxWidth: 400 }}
                >
                    <option value="">— Elegí un cliente —</option>
                    {clients.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.name} — {c.category} ({c.country})
                        </option>
                    ))}
                </select>
            </div>

            {/* ─── No client selected ─── */}
            {!selectedClientId && (
                <div style={{
                    textAlign: "center", padding: "60px 20px", color: "var(--text-faint)", fontSize: 14
                }}>
                    👆 Seleccioná un cliente para cargar un Excel y ver el historial de análisis
                </div>
            )}

            {/* ─── Client selected ─── */}
            {selectedClientId && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
                    {/* Left: Upload + Analysis */}
                    <div>
                        {/* Upload Zone (only when no file loaded) */}
                        {!parsed && !viewingHistoryItem && (
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => inputRef.current?.click()}
                                style={{
                                    background: dragging ? "rgba(255,224,102,0.08)" : "var(--bg-card)",
                                    border: `2px dashed ${dragging ? "var(--accent-gold)" : "var(--border-secondary)"}`,
                                    borderRadius: "var(--radius-xl)", padding: "50px 40px",
                                    textAlign: "center", cursor: "pointer",
                                    transition: "all var(--transition-normal)"
                                }}
                            >
                                <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
                                <div style={{
                                    fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6
                                }}>
                                    {dragging ? "Soltá el archivo aquí" : `Cargá Excel para ${selectedClient?.name}`}
                                </div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
                                    Arrastrá o hacé clic para seleccionar
                                </div>
                                <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                                    {[".xlsx", ".xls", ".csv"].map(ext => (
                                        <span key={ext} style={{
                                            padding: "3px 8px", background: "var(--border-primary)",
                                            borderRadius: "var(--radius-pill)", fontSize: 10,
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

                        {/* Error */}
                        {error && (
                            <div style={{
                                padding: "10px 14px", background: "rgba(231,76,60,0.1)",
                                borderRadius: "var(--radius-md)", color: "#e74c3c", fontSize: 13,
                                border: "1px solid rgba(231,76,60,0.2)", marginTop: 12
                            }}>❌ {error}</div>
                        )}

                        {/* Data Preview */}
                        {parsed && (
                            <div>
                                {/* File info bar */}
                                <div style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    marginBottom: 14, flexWrap: "wrap", gap: 10
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                        <span style={{
                                            padding: "5px 12px", background: "rgba(255,224,102,0.1)",
                                            border: "1px solid rgba(255,224,102,0.2)",
                                            borderRadius: "var(--radius-pill)", fontSize: 12,
                                            color: "var(--accent-gold)", fontWeight: 600
                                        }}>📄 {file.name}</span>
                                        <span style={badgeStyle}>{summary.sheetName}</span>
                                        <span style={badgeStyle}>{summary.totalRows} filas · {summary.totalColumns} col</span>
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button style={{ ...btnSecondary, fontSize: 11, padding: "5px 12px" }} onClick={handleReset}>
                                            🔄 Cambiar
                                        </button>
                                        <button
                                            style={{
                                                ...btnPrimary, fontSize: 11, padding: "5px 14px",
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

                                {/* Table */}
                                <div style={{
                                    background: "var(--bg-card)", borderRadius: "var(--radius-xl)",
                                    border: "1px solid var(--border-primary)", overflow: "hidden", marginBottom: 16
                                }}>
                                    <div style={{ overflowX: "auto", maxHeight: 300 }}>
                                        <table style={{
                                            width: "100%", borderCollapse: "collapse", fontSize: 12,
                                            fontFamily: "var(--font-body)"
                                        }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ ...thStyle, background: "var(--bg-tertiary)", color: "var(--accent-gold)", width: 36, textAlign: "center" }}>#</th>
                                                    {parsed.headers.map((h, i) => (
                                                        <th key={i} style={{ ...thStyle, background: "var(--bg-tertiary)", color: "var(--accent-gold)" }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parsed.rows.slice(0, 50).map((row, ri) => (
                                                    <tr key={ri} style={{ borderBottom: "1px solid var(--border-primary)" }}
                                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,224,102,0.03)"}
                                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                                    >
                                                        <td style={{ ...tdStyle, color: "var(--text-faint)", textAlign: "center" }}>{ri + 1}</td>
                                                        {parsed.headers.map((h, ci) => (
                                                            <td key={ci} style={tdStyle}>{row[h] != null ? String(row[h]) : ""}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {parsed.rows.length > 50 && (
                                        <div style={{
                                            padding: "6px 16px", background: "var(--bg-tertiary)",
                                            fontSize: 11, color: "var(--text-dim)", textAlign: "center"
                                        }}>
                                            Mostrando 50 de {parsed.rows.length} filas
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* AI Error */}
                        {aiError && (
                            <div style={{
                                padding: "10px 14px", background: "rgba(231,76,60,0.1)",
                                borderRadius: "var(--radius-md)", color: "#e74c3c", fontSize: 13,
                                border: "1px solid rgba(231,76,60,0.2)", marginBottom: 16
                            }}>{aiError}</div>
                        )}

                        {/* Analysis Result (new or from history) */}
                        {(analysis || viewingHistoryItem) && (
                            <div style={{
                                background: "var(--bg-card)", borderRadius: "var(--radius-xl)",
                                border: "1px solid var(--border-primary)", overflow: "hidden"
                            }}>
                                <div style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "12px 18px", borderBottom: "1px solid var(--border-primary)",
                                    background: "var(--bg-tertiary)", flexWrap: "wrap", gap: 8
                                }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 14, color: "var(--accent-gold)" }}>
                                            🤖 {viewingHistoryItem ? `Análisis — ${viewingHistoryItem.fileName}` : `Análisis — ${file?.name}`}
                                        </h3>
                                        {viewingHistoryItem && (
                                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                                {formatAnalysisDate(viewingHistoryItem.date)} · {viewingHistoryItem.rowCount} filas
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <button
                                            style={{ ...btnSecondary, fontSize: 11, padding: "4px 10px" }}
                                            onClick={() => handleCopy(viewingHistoryItem?.analysis)}
                                        >
                                            {copied ? "✅" : "📋 Copiar"}
                                        </button>
                                        {viewingHistoryItem && (
                                            <button
                                                style={{ ...btnSecondary, fontSize: 11, padding: "4px 10px" }}
                                                onClick={() => setViewingHistoryItem(null)}
                                            >✕ Cerrar</button>
                                        )}
                                    </div>
                                </div>
                                <div style={{
                                    padding: 18, fontSize: 13, color: "var(--text-secondary)",
                                    lineHeight: 1.8, whiteSpace: "pre-wrap", maxHeight: 500, overflowY: "auto"
                                }}>
                                    {viewingHistoryItem ? viewingHistoryItem.analysis : analysis}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: History Sidebar */}
                    <div style={{
                        background: "var(--bg-card)", borderRadius: "var(--radius-xl)",
                        border: "1px solid var(--border-primary)", overflow: "hidden",
                        position: "sticky", top: 24
                    }}>
                        <div style={{
                            padding: "14px 16px", borderBottom: "1px solid var(--border-primary)",
                            background: "var(--bg-tertiary)"
                        }}>
                            <h3 style={{ margin: 0, fontSize: 13, color: "var(--accent-gold)" }}>
                                📅 Historial de cargas
                            </h3>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                {selectedClient?.name}
                            </div>
                        </div>
                        <div style={{ maxHeight: 500, overflowY: "auto" }}>
                            {clientHistory.length === 0 && (
                                <div style={{
                                    padding: "30px 16px", textAlign: "center",
                                    color: "var(--text-faint)", fontSize: 12
                                }}>
                                    Sin cargas previas.<br />Subí un Excel para comenzar.
                                </div>
                            )}
                            {Object.entries(historyByMonth).map(([month, items]) => (
                                <div key={month}>
                                    <div style={{
                                        padding: "8px 16px", fontSize: 10, fontWeight: 700,
                                        textTransform: "uppercase", letterSpacing: 1,
                                        color: "var(--accent-gold)", background: "rgba(255,224,102,0.04)",
                                        borderBottom: "1px solid var(--border-primary)"
                                    }}>{month}</div>
                                    {items.map(item => (
                                        <div
                                            key={item.id}
                                            style={{
                                                padding: "10px 16px", borderBottom: "1px solid var(--border-primary)",
                                                cursor: "pointer",
                                                background: viewingHistoryItem?.id === item.id ? "rgba(255,224,102,0.06)" : "transparent",
                                                transition: "background var(--transition-fast)"
                                            }}
                                            onMouseEnter={e => { if (viewingHistoryItem?.id !== item.id) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                                            onMouseLeave={e => { if (viewingHistoryItem?.id !== item.id) e.currentTarget.style.background = "transparent"; }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div onClick={() => { setViewingHistoryItem(item); setAnalysis(""); setParsed(null); setFile(null); }} style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                                                        📄 {item.fileName}
                                                    </div>
                                                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                                                        {formatAnalysisDate(item.date)} · {item.rowCount} filas
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteHistory(item.id); }}
                                                    style={{
                                                        background: "none", border: "none", color: "var(--text-faint)",
                                                        cursor: "pointer", fontSize: 12, padding: "2px 4px",
                                                        opacity: 0.5, transition: "opacity var(--transition-fast)"
                                                    }}
                                                    onMouseEnter={e => e.target.style.opacity = 1}
                                                    onMouseLeave={e => e.target.style.opacity = 0.5}
                                                    title="Eliminar"
                                                >🗑</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Table styles
const thStyle = {
    padding: "8px 12px", textAlign: "left", fontWeight: 600,
    fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5,
    whiteSpace: "nowrap", position: "sticky", top: 0, zIndex: 1
};

const tdStyle = {
    padding: "6px 12px", color: "var(--text-primary)",
    whiteSpace: "nowrap", maxWidth: 220, overflow: "hidden",
    textOverflow: "ellipsis"
};

const badgeStyle = {
    padding: "4px 10px", background: "var(--border-primary)",
    borderRadius: "var(--radius-pill)", fontSize: 11, color: "var(--text-muted)"
};
