import { NextResponse } from 'next/server';
import { GoogleGenAI, Schema } from '@google/genai';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Connects to DB, fetches a startup by ID, and returns its serialized data string.
 * Returns a 404 NextResponse if the startup is not found.
 */
export async function fetchStartupById(
    id: string,
): Promise<{ startup: any; startupDataString: string } | NextResponse> {
    const { data: startup, error } = await supabase
        .from("startups")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error || !startup) {
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
