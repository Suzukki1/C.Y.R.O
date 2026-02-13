/**
 * Google Sheets API integration
 * Reads spreadsheet data using OAuth 2.0 (shares auth with Google Calendar)
 */

const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/calendar.readonly";

let tokenClient = null;
let gapiInited = false;
let gisInited = false;
let accessToken = null;

/**
 * Initialize GAPI + GIS for Sheets (and Calendar)
 */
export async function initGoogleSheets(clientId) {
    if (!clientId) throw new Error("Client ID de Google no configurado.");

    // Init GAPI
    if (!gapiInited) {
        await new Promise((resolve, reject) => {
            if (typeof gapi === "undefined") {
                reject(new Error("Google API library not loaded."));
                return;
            }
            gapi.load("client", async () => {
                try {
                    await gapi.client.init({
                        discoveryDocs: [
                            "https://sheets.googleapis.com/$discovery/rest?version=v4",
                        ],
                    });
                    gapiInited = true;
                    resolve();
                } catch (err) {
                    reject(new Error(`GAPI init error: ${err.message}`));
                }
            });
        });
    }

    // Init GIS
    if (!gisInited) {
        await new Promise((resolve, reject) => {
            if (typeof google === "undefined" || !google.accounts) {
                reject(new Error("Google Identity Services not loaded."));
                return;
            }
            try {
                tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: SCOPES,
                    callback: () => { },
                });
                gisInited = true;
                resolve();
            } catch (err) {
                reject(new Error(`GIS init error: ${err.message}`));
            }
        });
    }
}

/**
 * Request access token via OAuth popup
 */
export function signInGoogleSheets() {
    return new Promise((resolve, reject) => {
        if (!gisInited || !tokenClient) {
            reject(new Error("Google Sheets no está inicializado."));
            return;
        }
        tokenClient.callback = (response) => {
            if (response.error) {
                reject(new Error(`Auth error: ${response.error}`));
                return;
            }
            accessToken = response.access_token;
            resolve(response.access_token);
        };
        tokenClient.error_callback = (err) => {
            reject(new Error(`Auth error: ${err.type || err.message || "unknown"}`));
        };
        tokenClient.requestAccessToken({ prompt: "" });
    });
}

export function isGoogleSheetsSignedIn() {
    return !!accessToken;
}

/**
 * Extract spreadsheet ID from a Google Sheets URL
 * Supports: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
 */
export function extractSpreadsheetId(urlOrId) {
    if (!urlOrId) return null;
    const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) return match[1];
    // If it's already just an ID
    if (/^[a-zA-Z0-9-_]+$/.test(urlOrId)) return urlOrId;
    return null;
}

/**
 * Fetch all sheet names from a spreadsheet
 */
export async function fetchSheetNames(spreadsheetId) {
    if (!accessToken) throw new Error("No autenticado con Google.");

    try {
        const response = await gapi.client.sheets.spreadsheets.get({
            spreadsheetId,
        });
        return response.result.sheets.map(s => s.properties.title);
    } catch (err) {
        const status = err?.status || err?.result?.error?.code;
        const msg = err?.result?.error?.message || err?.message || "Error desconocido";
        if (status === 403) {
            throw new Error("Acceso denegado (403). Habilitá la Google Sheets API en console.cloud.google.com/apis/library/sheets.googleapis.com");
        }
        if (status === 404) {
            throw new Error("Spreadsheet no encontrado. Verificá que el link sea correcto y tengas acceso.");
        }
        throw new Error(msg);
    }
}

/**
 * Fetch data from a specific sheet
 * Returns { headers, rows, rawText, sheetName }
 */
export async function fetchSheetData(spreadsheetId, sheetName) {
    if (!accessToken) throw new Error("No autenticado con Google.");

    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: sheetName,
        });

        const values = response.result.values || [];
        if (values.length < 2) {
            throw new Error("La hoja no tiene datos suficientes (necesita al menos header + 1 fila).");
        }

        const headers = values[0];
        const rows = values.slice(1).map(row => {
            const obj = {};
            headers.forEach((h, i) => {
                obj[h] = row[i] !== undefined ? row[i] : "";
            });
            return obj;
        });

        const rawText = [
            `Hoja: ${sheetName}`,
            `Columnas: ${headers.join(", ")}`,
            `Total filas: ${rows.length}`,
            "",
            headers.join("\t"),
            ...rows.map(r => headers.map(h => r[h]).join("\t"))
        ].join("\n");

        return { headers, rows, sheetName, rawText };
    } catch (err) {
        if (err.message && !err.status) throw err; // re-throw our own errors
        const status = err?.status || err?.result?.error?.code;
        const msg = err?.result?.error?.message || err?.message || "Error desconocido";
        if (status === 403) {
            throw new Error("Acceso denegado (403). Verificá permisos del spreadsheet.");
        }
        throw new Error(msg);
    }
}
