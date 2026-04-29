import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import dbConnect from "@/database/mongodb";
import Startup from "@/database/models/Startup";

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
        await dbConnect();

        const { startupId } = await req.json();

        if (!startupId) {
            return NextResponse.json({ success: false, error: 'startupId is required' }, { status: 400 });
        }

        const startup = await Startup.findById(startupId);

        if (!startup) {
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
            Business Model: ${startup.businessModel}
            Description: ${startup.desc}
            Target Market: ${startup.businessInfo?.targetMarket || "Not provided"}
            Marketing Strategies: ${startup.businessInfo?.marketingStrategy || "Not provided"}
            Unique Value Proposition: ${startup.businessInfo?.uvp || "Not provided"}
            ${startup.isStudent ? `Founder Age: ${startup.founderAge} (Student Incube Startup)` : ""}

            Provide a concise analysis including:
            1. Financial health
            2. Risk level (and why)
            3. Short investment summary (overall verdict)
            
            Keep the response structured and easy to read for an investor.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: {
                temperature: 0.4,
            }
        });

        const analysisText = response.text || "Analysis could not be generated.";

        // Save back to the startup
        startup.analysis = analysisText;
        await startup.save();

        return NextResponse.json({
            success: true,
            analysis: analysisText
        });
    } catch (error: any) {
        console.error("AI Analyze Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
