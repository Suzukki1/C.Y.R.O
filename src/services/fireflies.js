/**
 * Fireflies.ai GraphQL API integration
 * Fetches meeting transcripts and matches them to clients
 */

const FIREFLIES_API_URL = "https://api.fireflies.ai/graphql";

/**
 * Execute a GraphQL query against Fireflies API
 */
async function firefliesQuery(apiKey, query, variables = {}) {
    const res = await fetch(FIREFLIES_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({ query, variables })
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Fireflies API error (${res.status}): ${text}`);
    }

    const data = await res.json();
    if (data.errors) {
        throw new Error(`Fireflies: ${data.errors[0]?.message || "Unknown error"}`);
    }
    return data.data;
}

/**
 * Fetch recent transcripts from Fireflies
 * @param {string} apiKey
 * @param {number} limit - Max transcripts to fetch
 * @returns {Promise<Array>} Array of transcript summaries
 */
export async function fetchTranscripts(apiKey, limit = 20) {
    const query = `
        query {
            transcripts(limit: ${limit}) {
                id
                title
                date
                duration
                organizer_email
                participants
                summary {
                    overview
                    action_items
                }
            }
        }
    `;

    const data = await firefliesQuery(apiKey, query);
    return (data.transcripts || []).map(t => ({
        id: t.id,
        title: t.title || "Sin título",
        date: t.date ? new Date(Number(t.date)).toISOString().split("T")[0] : "",
        time: t.date ? new Date(Number(t.date)).toTimeString().slice(0, 5) : "",
        duration: t.duration ? Math.round(t.duration / 60) : 0,
        organizerEmail: t.organizer_email || "",
        participants: t.participants || [],
        summary: t.summary?.overview || "",
        actionItems: t.summary?.action_items || "",
    }));
}

/**
 * Fetch full transcript detail (with sentences)
 */
export async function fetchTranscriptDetail(apiKey, transcriptId) {
    const query = `
        query {
            transcript(id: "${transcriptId}") {
                id
                title
                date
                duration
                organizer_email
                participants
                summary {
                    overview
                    action_items
                }
                sentences {
                    raw_text
                    speaker_name
                }
            }
        }
    `;

    const data = await firefliesQuery(apiKey, query);
    const t = data.transcript;
    if (!t) throw new Error("Transcripción no encontrada");

    const fullTranscript = (t.sentences || [])
        .map(s => `${s.speaker_name}: ${s.raw_text}`)
        .join("\n");

    return {
        id: t.id,
        title: t.title || "Sin título",
        date: t.date ? new Date(Number(t.date)).toISOString().split("T")[0] : "",
        time: t.date ? new Date(Number(t.date)).toTimeString().slice(0, 5) : "",
        duration: t.duration ? Math.round(t.duration / 60) : 0,
        organizerEmail: t.organizer_email || "",
        participants: t.participants || [],
        summary: t.summary?.overview || "",
        actionItems: t.summary?.action_items || "",
        transcript: fullTranscript,
    };
}

/**
 * Try to match a Fireflies transcript to a client
 * Matches by participant email or name against client name/email/nick
 */
export function matchTranscriptToClient(transcript, clients) {
    const participantsLower = transcript.participants.map(p => p.toLowerCase());
    const titleLower = (transcript.title || "").toLowerCase();

    for (const client of clients) {
        const nameL = client.name.toLowerCase();
        const emailL = (client.email || "").toLowerCase();
        const nickL = (client.nick_ml || "").toLowerCase();

        // Check if any participant matches client email
        if (emailL && participantsLower.some(p => p.includes(emailL) || emailL.includes(p))) {
            return client;
        }

        // Check if title or participants contain client name
        if (titleLower.includes(nameL) || participantsLower.some(p => p.includes(nameL))) {
            return client;
        }

        // Check nick
        if (nickL && (titleLower.includes(nickL) || participantsLower.some(p => p.includes(nickL)))) {
            return client;
        }
    }

    return null;
}
