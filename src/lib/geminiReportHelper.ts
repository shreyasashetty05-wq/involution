import { NextResponse } from 'next/server';
import { GoogleGenAI, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Calls the Gemini 2.5-flash model with the given prompt + schema and wraps
 * the result in the standard `{ success, startup, report }` NextResponse shape.
 *
 * @param prompt        - The full prompt string to send to Gemini.
 * @param schema        - The structured-output schema for the response.
 * @param startupName   - Startup name forwarded in the response envelope.
 * @param startupSector - Startup sector forwarded in the response envelope.
 */
export async function callGeminiReport(
    prompt: string,
    schema: Schema,
    startupName: string,
    startupSector: string,
): Promise<NextResponse> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            temperature: 0.2, // Low temperature for more deterministic/factual analysis
        },
    });

    if (!response.text) {
        throw new Error('Failed to generate report from Gemini');
    }

    const reportData = JSON.parse(response.text);
    reportData.generatedAt = new Date().toISOString();

    return NextResponse.json({
        success: true,
        startup: { name: startupName, sector: startupSector },
        report: reportData,
    });
}
