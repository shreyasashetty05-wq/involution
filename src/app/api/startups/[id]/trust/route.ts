import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/database/mongodb";
import Startup from "@/database/models/Startup";
import { Type, Schema } from '@google/genai';
import { callGeminiReport } from '@/lib/geminiReportHelper';



const trustSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        totalTrust: { type: Type.INTEGER, description: "A score from 0-100 indicating overall trust and reputation" },
        trustLabel: { type: Type.STRING, description: "One of: Highly Trusted, Trusted, Partially Verified, Limited Trust, Unverified" },
        trustColor: { type: Type.STRING, description: "Color mapping: emerald, blue, yellow, orange, red" },
        tier: { type: Type.STRING, description: "One of: Platinum, Gold, Silver, Bronze" },
        factors: {
            type: Type.ARRAY,
            description: "Exactly 5 factors evaluating trust",
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING, description: "Factor Label (e.g. Identity & Tax Verification)" },
                    earned: { type: Type.INTEGER, description: "Score earned for this factor" },
                    max: { type: Type.INTEGER, description: "Max score possible for this factor" },
                    verified: { type: Type.BOOLEAN, description: "Whether this factor meets the minimum verified threshold" },
                    detail: { type: Type.STRING, description: "Short summary of what was verified or missing" }
                },
                required: ["label", "earned", "max", "verified", "detail"]
            }
        },
        verifiedCount: { type: Type.INTEGER, description: "Number of factors where verified is true" },
        totalFactors: { type: Type.INTEGER, description: "Total number of factors (should be 5)" }
    },
    required: ["totalTrust", "trustLabel", "trustColor", "tier", "factors", "verifiedCount", "totalFactors"]
};

/**
* Generates a trust analysis report for a startup by fetching its data, sending it to an AI model for evaluation, and returning the resulting trust score and breakdown.
* @example
* GET(req, { params })
* { success: true, startup: { name: "Acme", sector: "SaaS" }, report: { totalTrust: 82 } }
* @param {NextRequest} req - The incoming Next.js request object.
* @param {{ params: Promise<{ id: string }> }} context - Route context containing the startup ID parameter.
* @returns {Promise<NextResponse>} A JSON response with the trust report or an error message.
**/
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const startup = await Startup.findById(id).lean();

        if (!startup) {
            return NextResponse.json({ success: false, error: 'Startup not found' }, { status: 404 });
        }

        const startupDataString = JSON.stringify(startup, null, 2);

        const prompt = `
            You are an expert AI trust and reputation analyst.
            Evaluate the credibility, verification status, and disclosure integrity of the following startup to generate a trust score.
            
            Evaluate the startup across exactly 5 trust factors:
            1. Identity & Tax Verification (max: 30 pts)
            2. Financial Transparency (max: 25 pts)
            3. External Backing & Funding (max: 20 pts)
            4. Risk Disclosure Integrity (max: 15 pts) - Penalize for legal cases, criminal records, or undisclosed loans.
            5. Profile Completeness (max: 10 pts)

            For each factor, assess pts \`earned\`, the \`max\` possible, whether it meets the \`verified\` threshold (usually >= 60-70% of max), and provide a short \`detail\` string summarizing what was found.

            Calculate \`totalTrust\` by summing the earned points (max 100).
            Determine the \`trustLabel\`, \`trustColor\`, and \`tier\`:
            - 'Highly Trusted' (emerald) / Platinum for 80+
            - 'Trusted' (blue) / Gold for 65-79
            - 'Partially Verified' (yellow) / Silver for 50-64
            - 'Limited Trust' (orange) / Bronze for 35-49
            - 'Unverified' (red) / Bronze for < 35

            Also calculate \`verifiedCount\` (number of fully verified factors) and \`totalFactors\` (5).

            Startup Data:
            ${startupDataString}
        `;

        return callGeminiReport(
            prompt,
            trustSchema,
            (startup as any).name,
            (startup as any).sector,
        );
    } catch (err: any) {
        console.error("Gemini Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
