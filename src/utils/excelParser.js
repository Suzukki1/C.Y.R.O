import * as XLSX from "xlsx";

/**
 * Parse an Excel/CSV file and return structured data
 * @param {File} file - The uploaded file
 * @returns {Promise<{headers: string[], rows: object[], rawText: string, sheetName: string}>}
 */
export async function parseExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });

                // Use the first sheet
                const sheetName = workbook.SheetNames[0];
                if (!sheetName) {
                    reject(new Error("El archivo no contiene hojas de cálculo."));
                    return;
                }

                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

                if (jsonData.length === 0) {
                    reject(new Error("La hoja de cálculo está vacía."));
                    return;
                }

                const headers = Object.keys(jsonData[0]);
                const rows = jsonData;

                // Build a text representation for AI prompt
                const rawText = buildRawText(headers, rows);

                resolve({ headers, rows, rawText, sheetName });
            } catch (err) {
                reject(new Error(`Error al leer el archivo: ${err.message}`));
            }
        };

        reader.onerror = () => reject(new Error("Error al leer el archivo."));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Build a formatted text table from parsed data
 */
function buildRawText(headers, rows) {
    const lines = [];
    lines.push(`COLUMNAS: ${headers.join(" | ")}`);
    lines.push("─".repeat(60));

    rows.forEach((row, i) => {
        const values = headers.map(h => {
            const val = row[h];
            return val !== undefined && val !== null ? String(val) : "";
        });
        lines.push(`Fila ${i + 1}: ${values.join(" | ")}`);
    });

    lines.push("─".repeat(60));
    lines.push(`Total: ${rows.length} filas, ${headers.length} columnas`);

    return lines.join("\n");
}

/**
 * Get a summary of the file for display
 */
export function getFileSummary(headers, rows, sheetName) {
    return {
        sheetName,
        totalRows: rows.length,
        totalColumns: headers.length,
        columns: headers,
    };
}
