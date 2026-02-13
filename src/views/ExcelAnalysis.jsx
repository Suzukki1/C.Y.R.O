import { useState, useRef, useCallback } from "react";
import { parseExcelFile, getFileSummary } from "../utils/excelParser";
import { generateExcelAnalysis } from "../services/perplexity";
import { initGoogleSheets, signInGoogleSheets, isGoogleSheetsSignedIn, extractSpreadsheetId, fetchSheetNames, fetchSheetData } from "../services/googleSheets";
import { btnPrimary, btnSecondary, selectStyle, inputStyle } from "../components/Field";
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
/**
 * Parse a numeric value from a cell string (handles $, %, dots as thousands, commas as decimal)
 */
function parseNumericValue(val) {
    if (val == null || val === "" || val === "—" || val === "-") return null;
    const s = String(val).trim();
    // Remove currency symbols, spaces
    let clean = s.replace(/[$€\s]/g, "");
    // Handle percentage
    const isPct = clean.includes("%");
    clean = clean.replace(/%/g, "");
    // Handle Argentine format: 502.829.741 (dots as thousands) and 4,00 (comma as decimal)
    // If there's a comma and dots, dots are thousands separators
    if (clean.includes(",") && clean.includes(".")) {
        clean = clean.replace(/\./g, "").replace(",", ".");
    } else if (clean.includes(",")) {
        // Only comma: treat as decimal separator
        clean = clean.replace(",", ".");
    }
    // Remove any remaining non-numeric chars except dot and minus
    clean = clean.replace(/[^0-9.\-]/g, "");
    const num = parseFloat(clean);
    if (isNaN(num)) return null;
    return isPct ? num : num;
}

/**
 * Automatically extract KPI values from spreadsheet data.
 * Supports two formats:
 *   1. Column-based: KPI names are column headers, values in rows
 *   2. Row-based: KPI names are in a "names" column (e.g. NOMBRE VENDEDOR),
 *      values in a month/data column (e.g. ENERO 2026)
 */
function extractKpisFromData(headers, rows) {
    // KPI patterns
    const kpiPatterns = {
        ventas30d: ["venta $", "ventas $", "venta neto", "ventas neto", "gmv", "revenue", "facturaci"],
        conversion: ["conversión", "conversion", "conv %", "cvr", "tasa de conversión"],
        acos: ["acos", "costo publicitario", "advertising cost", "tacos"],
        tickets: ["tickets", "ticket", "reclamos", "claims", "mediaciones", "casos abiertos", "disputes"]
    };

    // ─── Strategy 1: Column-based (headers = KPI names) ───
    const colKpis = extractColumnBased(headers, rows, kpiPatterns);
    if (colKpis) return colKpis;

    // ─── Strategy 2: Row-based (rows = KPI names, columns = data) ───
    return extractRowBased(headers, rows, kpiPatterns);
}

function extractColumnBased(headers, rows, kpiPatterns) {
    const kpis = {};
    const lower = headers.map(h => h.toLowerCase().trim());

    for (const [kpiKey, keywords] of Object.entries(kpiPatterns)) {
        const colIdx = lower.findIndex(h => keywords.some(k => h.includes(k)));
        if (colIdx === -1) continue;

        const values = rows
            .map(r => parseNumericValue(r[headers[colIdx]]))
            .filter(v => v !== null);

        if (values.length === 0) continue;

        if (kpiKey === "ventas30d" || kpiKey === "tickets") {
            kpis[kpiKey] = Math.round(values.reduce((a, b) => a + b, 0));
        } else {
            kpis[kpiKey] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
        }
    }

    return Object.keys(kpis).length > 0 ? kpis : null;
}

function extractRowBased(headers, rows, kpiPatterns) {
    const lower = headers.map(h => h.toLowerCase().trim());

    // Find the "names" column (NOMBRE VENDEDOR, nombre, métrica, indicador, KPI, etc.)
    const namesColKeywords = ["nombre", "vendedor", "métrica", "metrica", "indicador", "kpi", "concepto", "item"];
    const namesColIdx = lower.findIndex(h => namesColKeywords.some(k => h.includes(k)));
    if (namesColIdx === -1) return null;
    const namesColHeader = headers[namesColIdx];

    // Find the best data column: prefer latest month, then "objetivo" columns, then first numeric column
    const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const currentMonth = new Date().getMonth(); // 0-indexed

    // Collect month columns with their month index
    const monthCols = [];
    lower.forEach((h, i) => {
        if (i === namesColIdx) return;
        const mi = monthNames.findIndex(m => h.includes(m));
        if (mi !== -1) monthCols.push({ idx: i, month: mi, header: headers[i] });
    });

    // Sort: prefer most recent month that is <= current month, then fallback to any
    let dataColIdx = -1;
    if (monthCols.length > 0) {
        // Pick the latest month <= current month, or the latest overall
        const pastMonths = monthCols.filter(m => m.month <= currentMonth).sort((a, b) => b.month - a.month);
        const chosen = pastMonths.length > 0 ? pastMonths[0] : monthCols[monthCols.length - 1];
        dataColIdx = chosen.idx;
    }

    // Fallback: look for "objetivo" column
    if (dataColIdx === -1) {
        dataColIdx = lower.findIndex(h => h.includes("objetivo"));
    }

    if (dataColIdx === -1) return null;
    const dataColHeader = headers[dataColIdx];

    // Scan rows for KPI matches
    const kpis = {};
    for (const row of rows) {
        const cellName = String(row[namesColHeader] || "").toLowerCase().trim()
            // Remove emojis
            .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}]/gu, "").trim();
        if (!cellName) continue;

        for (const [kpiKey, keywords] of Object.entries(kpiPatterns)) {
            if (kpis[kpiKey] !== undefined) continue; // already found
            if (keywords.some(k => cellName.includes(k))) {
                const val = parseNumericValue(row[dataColHeader]);
                if (val !== null) {
                    kpis[kpiKey] = kpiKey === "conversion" || kpiKey === "acos"
                        ? Math.round(val * 10) / 10
                        : Math.round(val);
                }
                break;
            }
        }
    }

    return Object.keys(kpis).length > 0 ? kpis : null;
}

export default function ExcelAnalysis({ apiKey, clients, gcalClientId, onUpdateKpis }) {
    // ─── State ───
    const [selectedClientId, setSelectedClientId] = useState("");
    const [parsed, setParsed] = useState(null);
    const [error, setError] = useState("");
    const [analysis, setAnalysis] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [aiError, setAiError] = useState("");
    const [copied, setCopied] = useState(false);
    const [viewingHistoryItem, setViewingHistoryItem] = useState(null);
    const [kpiUpdate, setKpiUpdate] = useState(null); // { ventas30d, conversion, etc }

    // Google Sheets state
    const [gsConnected, setGsConnected] = useState(false);
    const [gsConnecting, setGsConnecting] = useState(false);
    const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
    const [sheetNames, setSheetNames] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState("");
    const [gsLoading, setGsLoading] = useState(false);
    const [dataSource, setDataSource] = useState(""); // "sheets" or "file"

    // File upload state (fallback)
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef(null);

    // ─── Persisted history per client ───
    const [excelHistory, setExcelHistory] = useLocalStorage("cml_excel_history", {});

    const selectedClient = clients.find(c => c.id === selectedClientId);
    const clientHistory = (excelHistory[selectedClientId] || [])
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const historyByMonth = {};
    clientHistory.forEach(item => {
        const label = getMonthLabel(item.date);
        if (!historyByMonth[label]) historyByMonth[label] = [];
        historyByMonth[label].push(item);
    });

    // ─── Google Sheets: connect ───
    const handleConnectSheets = useCallback(async () => {
        if (!gcalClientId) {
            setError("Configurá tu Client ID de Google en ⚙️ Integraciones");
            return;
        }
        setGsConnecting(true);
        setError("");
        try {
            await initGoogleSheets(gcalClientId);
            await signInGoogleSheets();
            setGsConnected(true);
        } catch (err) {
            setError(`Error Google: ${err.message}`);
        } finally {
            setGsConnecting(false);
        }
    }, [gcalClientId]);

    // ─── Google Sheets: load spreadsheet ───
    const handleLoadSpreadsheet = useCallback(async () => {
        setError("");
        const id = extractSpreadsheetId(spreadsheetUrl);
        if (!id) {
            setError("URL o ID de spreadsheet no válido. Pegá el link completo de Google Sheets.");
            return;
        }
        setGsLoading(true);
        try {
            const names = await fetchSheetNames(id);
            setSheetNames(names);
            setSelectedSheet(names[0] || "");
        } catch (err) {
            setError(`Error al cargar spreadsheet: ${err.message}`);
        } finally {
            setGsLoading(false);
        }
    }, [spreadsheetUrl]);

    // ─── Google Sheets: load sheet data ───
    const handleLoadSheetData = useCallback(async () => {
        setError("");
        const id = extractSpreadsheetId(spreadsheetUrl);
        if (!id || !selectedSheet) return;
        setGsLoading(true);
        try {
            const data = await fetchSheetData(id, selectedSheet);
            setParsed(data);
            setDataSource("sheets");
            setFile(null);
            // Auto-extract KPIs
            if (selectedClientId && onUpdateKpis) {
                const kpis = extractKpisFromData(data.headers, data.rows);
                if (kpis) {
                    onUpdateKpis(selectedClientId, kpis);
                    setKpiUpdate(kpis);
                } else {
                    setKpiUpdate(null);
                }
            }
        } catch (err) {
            setError(`Error al leer datos: ${err.message}`);
        } finally {
            setGsLoading(false);
        }
    }, [spreadsheetUrl, selectedSheet, selectedClientId, onUpdateKpis]);

    // ─── File upload (fallback) ───
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
            setDataSource("file");
            // Auto-extract KPIs
            if (selectedClientId && onUpdateKpis) {
                const kpis = extractKpisFromData(result.headers, result.rows);
                if (kpis) {
                    onUpdateKpis(selectedClientId, kpis);
                    setKpiUpdate(kpis);
                } else {
                    setKpiUpdate(null);
                }
            }
        } catch (err) {
            setError(err.message);
        }
    }, [selectedClientId, onUpdateKpis]);

    const handleDrop = useCallback((e) => {
        e.preventDefault(); setDragging(false);
        const f = e.dataTransfer?.files?.[0];
        if (f) handleFile(f);
    }, [handleFile]);

    const handleDragOver = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
    const handleDragLeave = useCallback(() => setDragging(false), []);
    const handleInputChange = (e) => { const f = e.target.files?.[0]; if (f) handleFile(f); };

    // ─── AI Analysis ───
    const handleAnalyze = async () => {
        if (!apiKey) {
            setAiError("⚙️ Configurá tu API key de Perplexity en Integraciones.");
            return;
        }
        if (!parsed || !selectedClientId) return;

        setAnalyzing(true);
        setAiError("");
        try {
            const clientContext = selectedClient
                ? `\nCLIENTE: ${selectedClient.name} (${selectedClient.brand})\nPAÍS: ${selectedClient.country}\nCATEGORÍA: ${selectedClient.category}\nNIVEL ML: ${selectedClient.level_ml}\n`
                : "";
            const sourceName = dataSource === "sheets"
                ? `Google Sheets: ${selectedSheet}`
                : file?.name || "archivo";

            const result = await generateExcelAnalysis(apiKey, clientContext + parsed.rawText, sourceName);
            setAnalysis(result);

            const entry = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                fileName: sourceName,
                rowCount: parsed.rows.length,
                colCount: parsed.headers.length,
                headers: parsed.headers,
                analysis: result,
                source: dataSource,
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
        setFile(null); setParsed(null); setError(""); setAnalysis("");
        setAiError(""); setViewingHistoryItem(null); setSheetNames([]);
        setSelectedSheet(""); setDataSource(""); setKpiUpdate(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleDeleteHistory = (entryId) => {
        setExcelHistory(prev => ({
            ...prev,
            [selectedClientId]: (prev[selectedClientId] || []).filter(e => e.id !== entryId)
        }));
        if (viewingHistoryItem?.id === entryId) setViewingHistoryItem(null);
    };

    const summary = parsed ? { sheetName: parsed.sheetName, totalRows: parsed.rows.length, totalColumns: parsed.headers.length } : null;

    return (
        <div className="animate-fade-in">
            <h1 style={{ fontFamily: "var(--font-display)", color: "var(--accent-gold)", fontSize: 28, marginBottom: 4 }}>
                📊 Datos → Análisis IA
            </h1>
            <p style={{ color: "var(--text-dim)", marginBottom: 20, fontSize: 14 }}>
                Conectá Google Sheets o cargá un Excel por cliente para análisis mensual con IA
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
                    onChange={e => { setSelectedClientId(e.target.value); handleReset(); }}
                    style={{ ...selectStyle, maxWidth: 400 }}
                >
                    <option value="">— Elegí un cliente —</option>
                    {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} — {c.category} ({c.country})</option>
                    ))}
                </select>
            </div>

            {!selectedClientId && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-faint)", fontSize: 14 }}>
                    👆 Seleccioná un cliente para conectar datos
                </div>
            )}

            {/* ─── Client selected ─── */}
            {selectedClientId && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
                    {/* Left: Data source + Analysis */}
                    <div>
                        {/* Data source tabs (when no data loaded) */}
                        {!parsed && !viewingHistoryItem && (
                            <div>
                                {/* Google Sheets connection */}
                                <div style={{
                                    background: "var(--bg-card)", borderRadius: "var(--radius-xl)",
                                    border: "1px solid rgba(66,133,244,0.2)", padding: 20, marginBottom: 16
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                                        <span style={{ fontSize: 20 }}>📊</span>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                                                Google Sheets
                                            </div>
                                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                                Conectá directo a tu spreadsheet
                                            </div>
                                        </div>
                                        {!gsConnected && (
                                            <button
                                                style={{ ...btnPrimary, marginLeft: "auto", fontSize: 12, padding: "6px 14px", background: "#4285f4" }}
                                                onClick={handleConnectSheets}
                                                disabled={gsConnecting}
                                            >
                                                {gsConnecting ? "⏳ Conectando..." : "🔗 Conectar Google"}
                                            </button>
                                        )}
                                        {gsConnected && (
                                            <span style={{
                                                marginLeft: "auto", fontSize: 11, color: "#27ae60",
                                                fontWeight: 600, padding: "4px 10px",
                                                background: "rgba(39,174,96,0.1)", borderRadius: "var(--radius-pill)"
                                            }}>✅ Conectado</span>
                                        )}
                                    </div>

                                    {gsConnected && (
                                        <div>
                                            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                                                <input
                                                    type="text"
                                                    style={{ ...inputStyle, fontSize: 12, flex: 1 }}
                                                    value={spreadsheetUrl}
                                                    onChange={e => setSpreadsheetUrl(e.target.value)}
                                                    placeholder="Pegá la URL del Google Spreadsheet..."
                                                />
                                                <button
                                                    style={{ ...btnPrimary, fontSize: 12, padding: "6px 14px", whiteSpace: "nowrap" }}
                                                    onClick={handleLoadSpreadsheet}
                                                    disabled={gsLoading || !spreadsheetUrl}
                                                >
                                                    {gsLoading ? "⏳" : "📥 Cargar"}
                                                </button>
                                            </div>

                                            {sheetNames.length > 0 && (
                                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                    <select
                                                        style={{ ...selectStyle, fontSize: 12, flex: 1 }}
                                                        value={selectedSheet}
                                                        onChange={e => setSelectedSheet(e.target.value)}
                                                    >
                                                        {sheetNames.map(n => <option key={n} value={n}>{n}</option>)}
                                                    </select>
                                                    <button
                                                        style={{ ...btnPrimary, fontSize: 12, padding: "6px 14px" }}
                                                        onClick={handleLoadSheetData}
                                                        disabled={gsLoading}
                                                    >
                                                        {gsLoading ? "⏳" : "📄 Leer datos"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* File upload fallback */}
                                <div style={{
                                    position: "relative", textAlign: "center",
                                    color: "var(--text-faint)", fontSize: 11, marginBottom: 16
                                }}>
                                    <div style={{
                                        position: "absolute", top: "50%", left: 0, right: 0,
                                        borderTop: "1px solid var(--border-primary)"
                                    }} />
                                    <span style={{
                                        position: "relative", background: "var(--bg-primary)",
                                        padding: "0 12px"
                                    }}>o subí un archivo</span>
                                </div>

                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onClick={() => inputRef.current?.click()}
                                    style={{
                                        background: dragging ? "rgba(255,224,102,0.08)" : "var(--bg-card)",
                                        border: `2px dashed ${dragging ? "var(--accent-gold)" : "var(--border-secondary)"}`,
                                        borderRadius: "var(--radius-xl)", padding: "30px 20px",
                                        textAlign: "center", cursor: "pointer",
                                        transition: "all var(--transition-normal)"
                                    }}
                                >
                                    <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                                        {dragging ? "Soltá el archivo aquí" : "Arrastrá un archivo Excel"}
                                    </div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>
                                        .xlsx · .xls · .csv
                                    </div>
                                    <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleInputChange} style={{ display: "none" }} />
                                </div>
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

                        {/* KPI Update Banner */}
                        {kpiUpdate && (
                            <div style={{
                                padding: "12px 16px", background: "rgba(39,174,96,0.08)",
                                borderRadius: "var(--radius-lg)", border: "1px solid rgba(39,174,96,0.2)",
                                marginBottom: 14
                            }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#27ae60", marginBottom: 6 }}>
                                    📊 KPIs actualizados para {selectedClient?.name}
                                </div>
                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                    {kpiUpdate.ventas30d !== undefined && (
                                        <span style={kpiBadge}>Ventas: <strong>${kpiUpdate.ventas30d.toLocaleString()}</strong></span>
                                    )}
                                    {kpiUpdate.conversion !== undefined && (
                                        <span style={kpiBadge}>Conversión: <strong>{kpiUpdate.conversion}%</strong></span>
                                    )}
                                    {kpiUpdate.acos !== undefined && (
                                        <span style={kpiBadge}>ACOS: <strong>{kpiUpdate.acos}%</strong></span>
                                    )}
                                    {kpiUpdate.tickets !== undefined && (
                                        <span style={kpiBadge}>Tickets: <strong>{kpiUpdate.tickets}</strong></span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Data Preview */}
                        {parsed && (
                            <div>
                                <div style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    marginBottom: 14, flexWrap: "wrap", gap: 10
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                        <span style={{
                                            padding: "5px 12px",
                                            background: dataSource === "sheets" ? "rgba(66,133,244,0.1)" : "rgba(255,224,102,0.1)",
                                            border: `1px solid ${dataSource === "sheets" ? "rgba(66,133,244,0.2)" : "rgba(255,224,102,0.2)"}`,
                                            borderRadius: "var(--radius-pill)", fontSize: 12,
                                            color: dataSource === "sheets" ? "#4285f4" : "var(--accent-gold)", fontWeight: 600
                                        }}>{dataSource === "sheets" ? "📊" : "📄"} {dataSource === "sheets" ? selectedSheet : file?.name}</span>
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
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "var(--font-body)" }}>
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
                                        <div style={{ padding: "6px 16px", background: "var(--bg-tertiary)", fontSize: 11, color: "var(--text-dim)", textAlign: "center" }}>
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

                        {/* Analysis Result */}
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
                                            🤖 {viewingHistoryItem ? `Análisis — ${viewingHistoryItem.fileName}` : `Análisis — ${dataSource === "sheets" ? selectedSheet : file?.name}`}
                                        </h3>
                                        {viewingHistoryItem && (
                                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                                {formatAnalysisDate(viewingHistoryItem.date)} · {viewingHistoryItem.rowCount} filas
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <button style={{ ...btnSecondary, fontSize: 11, padding: "4px 10px" }}
                                            onClick={() => handleCopy(viewingHistoryItem?.analysis)}
                                        >{copied ? "✅" : "📋 Copiar"}</button>
                                        {viewingHistoryItem && (
                                            <button style={{ ...btnSecondary, fontSize: 11, padding: "4px 10px" }}
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
                            <h3 style={{ margin: 0, fontSize: 13, color: "var(--accent-gold)" }}>📅 Historial de análisis</h3>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{selectedClient?.name}</div>
                        </div>
                        <div style={{ maxHeight: 500, overflowY: "auto" }}>
                            {clientHistory.length === 0 && (
                                <div style={{ padding: "30px 16px", textAlign: "center", color: "var(--text-faint)", fontSize: 12 }}>
                                    Sin análisis previos.<br />Conectá un spreadsheet para comenzar.
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
                                        <div key={item.id} style={{
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
                                                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                                                        {item.source === "sheets" ? "📊" : "📄"} {item.fileName}
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

const kpiBadge = {
    padding: "4px 10px", background: "rgba(39,174,96,0.1)",
    borderRadius: "var(--radius-pill)", fontSize: 11, color: "#27ae60"
};
