import { NextResponse } from 'next/server';
import { GoogleGenAI, Schema } from '@google/genai';
import dbConnect from '@/database/mongodb';
import Startup from '@/database/models/Startup';

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
/**
 * Connects to DB, fetches a startup by ID, and returns its serialized data string.
 * Returns a 404 NextResponse if the startup is not found.
 */
export async function fetchStartupById(
    id: string,
): Promise<{ startup: any; startupDataString: string } | NextResponse> {
    await dbConnect();
    const startup = await Startup.findById(id).lean();

    if (!startup) {
        return NextResponse.json({ success: false, error: 'Startup not found' }, { status: 404 });
    }

    return { startup, startupDataString: JSON.stringify(startup, null, 2) };
}

export async function callGeminiReport(
    prompt: string,
    schema: Schema,
    startupName: string,
    startupSector: string,
): Promise<NextResponse> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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

/**
 * Handles the complete lifecycle of a Gemini report request.
 * It fetches the startup, generates the prompt, and handles errors.
 */
export async function handleGeminiReportRequest(
    params: Promise<{ id: string }>,
    schema: Schema,
    promptBuilder: (startupDataString: string) => string
): Promise<NextResponse> {
    try {
        const { id } = await params;
        const result = await fetchStartupById(id);
        if (result instanceof NextResponse) return result;
        const { startup, startupDataString } = result;

        const prompt = promptBuilder(startupDataString);

        return await callGeminiReport(
            prompt,
            schema,
            (startup as any).name,
            (startup as any).sector,
        );
    } catch (err: any) {
        console.error("Gemini Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
