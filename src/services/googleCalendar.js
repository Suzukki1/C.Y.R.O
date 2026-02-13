/**
 * Google Calendar API integration (client-side via GIS)
 * Uses Google Identity Services for OAuth 2.0
 */

let tokenClient = null;
let gapiInited = false;
let gisInited = false;
let accessToken = null;

const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

/**
 * Initialize the Google API client
 */
function initGapiClient() {
    return new Promise((resolve, reject) => {
        if (typeof gapi === "undefined") {
            reject(new Error("Google API library not loaded. Check index.html scripts."));
            return;
        }
        gapi.load("client", async () => {
            try {
                await gapi.client.init({
                    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
                });
                gapiInited = true;
                resolve();
            } catch (err) {
                reject(new Error(`GAPI init error: ${err.message}`));
            }
        });
    });
}

/**
 * Initialize Google Identity Services token client
 */
function initGisClient(clientId) {
    return new Promise((resolve, reject) => {
        if (typeof google === "undefined" || !google.accounts) {
            reject(new Error("Google Identity Services not loaded. Check index.html scripts."));
            return;
        }
        try {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: SCOPES,
                callback: () => { }, // will be overridden per-request
            });
            gisInited = true;
            resolve();
        } catch (err) {
            reject(new Error(`GIS init error: ${err.message}`));
        }
    });
}

/**
 * Initialize both GAPI + GIS
 */
export async function initGoogleCalendar(clientId) {
    if (!clientId) throw new Error("Client ID de Google no configurado.");
    await initGapiClient();
    await initGisClient(clientId);
}

/**
 * Request access token via OAuth popup
 */
export function signInGoogle() {
    return new Promise((resolve, reject) => {
        if (!gisInited || !tokenClient) {
            reject(new Error("Google Calendar no está inicializado. Verificá el Client ID."));
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
        tokenClient.requestAccessToken({ prompt: "consent" });
    });
}

/**
 * Check if user is currently signed in
 */
export function isGoogleSignedIn() {
    return !!accessToken;
}

/**
 * Sign out (revoke token)
 */
export function signOutGoogle() {
    if (accessToken) {
        google.accounts.oauth2.revoke(accessToken);
        accessToken = null;
    }
}

/**
 * Fetch upcoming calendar events
 * @param {number} days - How many days ahead to fetch
 * @returns {Promise<Array>} Formatted events
 */
export async function fetchUpcomingEvents(days = 14) {
    if (!gapiInited || !accessToken) {
        throw new Error("No estás conectado a Google Calendar.");
    }

    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + days);

    const response = await gapi.client.calendar.events.list({
        calendarId: "primary",
        timeMin: now.toISOString(),
        timeMax: future.toISOString(),
        showDeleted: false,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 50,
    });

    return (response.result.items || []).map(event => ({
        id: event.id,
        title: event.summary || "Sin título",
        date: event.start?.dateTime
            ? event.start.dateTime.split("T")[0]
            : event.start?.date || "",
        time: event.start?.dateTime
            ? event.start.dateTime.split("T")[1]?.slice(0, 5)
            : "Todo el día",
        endTime: event.end?.dateTime
            ? event.end.dateTime.split("T")[1]?.slice(0, 5)
            : "",
        link: event.hangoutLink || event.htmlLink || "",
        attendees: (event.attendees || []).map(a => ({
            email: a.email,
            name: a.displayName || a.email,
            status: a.responseStatus,
        })),
        description: event.description || "",
        source: "google_calendar",
    }));
}

/**
 * Try to match a Google Calendar event to a client
 */
export function matchEventToClient(event, clients) {
    const titleLower = event.title.toLowerCase();
    const attendeeEmails = event.attendees.map(a => a.email.toLowerCase());
    const attendeeNames = event.attendees.map(a => (a.name || "").toLowerCase());

    for (const client of clients) {
        const nameL = client.name.toLowerCase();
        const emailL = (client.email || "").toLowerCase();
        const nickL = (client.nick_ml || "").toLowerCase();

        if (emailL && attendeeEmails.some(e => e.includes(emailL) || emailL.includes(e))) {
            return client;
        }
        if (titleLower.includes(nameL) || attendeeNames.some(n => n.includes(nameL))) {
            return client;
        }
        if (nickL && titleLower.includes(nickL)) {
            return client;
        }
    }
    return null;
}
