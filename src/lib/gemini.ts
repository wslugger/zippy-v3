import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface GeminiCallOptions {
    model: string;
    temperature: number;
    systemInstruction: string;
    userPrompt: string;
}

/**
 * Call the Gemini API and return the raw text response.
 */
export async function callGemini({
    model,
    temperature,
    systemInstruction,
    userPrompt,
}: GeminiCallOptions): Promise<string> {
    const response = await ai.models.generateContent({
        model,
        config: {
            temperature,
            systemInstruction,
        },
        contents: userPrompt,
    });

    const text = response.text;
    if (!text) throw new Error("Gemini returned an empty response");
    return text;
}
