import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Analyzes a startup for investors using AI, saves the generated analysis, and returns it.
 * @example
 * POST(req)
 * { success: true, analysis: "..." }
 * @param {Request} req - The incoming request containing a JSON body with startupId.
 * @returns {Promise<Response>} A JSON response with the analysis or an error message.
 **/
export async function POST(req: Request) {
    try {
        const { startupId } = await req.json();

        if (!startupId) {
            return NextResponse.json({ success: false, error: 'startupId is required' }, { status: 400 });
        }

        const { data: startup, error: fetchError } = await supabase
            .from("startups")
            .select("*")
            .eq("id", startupId)
            .maybeSingle();

        if (fetchError || !startup) {
            return NextResponse.json({ success: false, error: 'Startup not found' }, { status: 404 });
        }

        // We already have a specific GenAI model configured for this app
        const prompt = `
            Analyze this startup for investors.

            Startup Name: ${startup.name}
            Sector: ${startup.sector}
            Stage: ${startup.stage}
            Requested Funding: ₹${startup.requested}
            Equity Offered: ${startup.equity}%
            Current Monthly Revenue: ₹${startup.revenue}
            Current Monthly Burn: ₹${startup.burn}
            Business Model: ${startup.business_model}
            Description: ${startup.desc}
            Target Market: ${startup.business_info?.targetMarket || "Not provided"}
            Marketing Strategies: ${startup.business_info?.marketingStrategy || "Not provided"}
            Unique Value Proposition: ${startup.business_info?.uvp || "Not provided"}

            Provide a concise analysis including:
            1. Financial health
            2. Risk level (and why)
            3. Short investment summary (overall verdict)
            
            Keep the response structured and easy to read for an investor.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.4,
            }
        });

        const analysisText = response.text || "Analysis could not be generated.";

        // Save back to the startup
        const { error: updateError } = await supabase
            .from("startups")
            .update({ analysis: analysisText })
            .eq("id", startupId);

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            analysis: analysisText
        });
    } catch (error: any) {
        console.error("AI Analyze Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
