import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface GeminiCallOptions {
    model: string;
    temperature: number;
    systemInstruction: string;
    userPrompt: string;
    responseMimeType?: "text/plain" | "application/json";
    /** Request timeout in milliseconds (default: 120_000 = 2 min) */
    timeoutMs?: number;
    /** Number of retries on timeout/deadline errors (default: 1) */
    retries?: number;
}

function isRetryableError(err: any): boolean {
    const msg = String(err?.message ?? "") + " " + String(err ?? "");
    return (
        err?.name === "AbortError" ||
        err?.code === 20 ||
        err?.code === "UND_ERR_HEADERS_TIMEOUT" ||
        err?.cause?.code === "UND_ERR_HEADERS_TIMEOUT" ||
        msg.includes("DEADLINE_EXCEEDED") ||
        msg.includes("aborted") ||
        msg.includes("503") ||
        msg.includes("UNAVAILABLE")
    );
}

/**
 * Call the Gemini API and return the raw text response.
 * Retries once on timeout / deadline errors by default.
 */
export async function callGemini({
    model,
    temperature,
    systemInstruction,
    userPrompt,
    responseMimeType,
    timeoutMs = 120_000,
    retries = 1,
}: GeminiCallOptions): Promise<string> {
    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model,
                config: {
                    temperature,
                    systemInstruction,
                    responseMimeType,
                    httpOptions: { timeout: timeoutMs },
                },
                contents: userPrompt,
            });

            const text = response.text;
            if (!text) throw new Error("Gemini returned an empty response");
            return text;
        } catch (err: any) {
            lastError = err;
            if (attempt < retries && isRetryableError(err)) {
                const delay = 2_000 * (attempt + 1); // 2s, 4s, ...
                console.warn(`callGemini attempt ${attempt + 1} failed (${err?.message}), retrying in ${delay}ms...`);
                await new Promise((r) => setTimeout(r, delay));
                continue;
            }
            throw err;
        }
    }

    throw lastError;
}
