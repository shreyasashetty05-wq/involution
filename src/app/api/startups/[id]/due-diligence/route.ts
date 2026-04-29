import { NextRequest, NextResponse } from 'next/server';
import { Type, Schema } from '@google/genai';
import { callGeminiReport, fetchStartupById } from '@/lib/geminiReportHelper';

const dueDiligenceSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        totalScore: { type: Type.INTEGER, description: "Score out of 100 based on all 4 sections" },
        verdict: {
            type: Type.OBJECT,
            properties: {
                label: { type: Type.STRING, description: "Verdict label: Strong Buy, Accumulate, Hold / Monitor, High Risk" },
                color: { type: Type.STRING, description: "Color associated with verdict: emerald, blue, yellow, red" }
            },
            required: ["label", "color"]
        },
        sections: {
            type: Type.ARRAY,
            description: "Exactly 4 sections: Financial Health, Growth Metrics, Team & Credibility, Risk & Legal",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "Section ID: 'financial', 'growth', 'credibility', 'risk'" },
                    label: { type: Type.STRING, description: "Section Label" },
                    score: { type: Type.INTEGER, description: "Section score" },
                    maxScore: { type: Type.INTEGER, description: "Max score for this section" },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of strengths for this section" },
                    flags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of red flags or concerns for this section" }
                },
                required: ["id", "label", "score", "maxScore", "strengths", "flags"]
            }
        },
        keyMetrics: {
            type: Type.OBJECT,
            properties: {
                revenue: { type: Type.NUMBER },
                burn: { type: Type.NUMBER },
                runway: { type: Type.NUMBER },
                netMargin: { type: Type.NUMBER },
                grossMargin: { type: Type.NUMBER },
                mau: { type: Type.NUMBER },
                churnRate: { type: Type.NUMBER, nullable: true },
                growthRate: { type: Type.NUMBER },
                teamSize: { type: Type.INTEGER },
                equity: { type: Type.NUMBER },
                valuation: { type: Type.NUMBER }
            },
            required: ["revenue", "burn", "runway", "netMargin", "grossMargin", "mau", "growthRate", "teamSize", "equity", "valuation"]
        }
    },
    required: ["totalScore", "verdict", "sections", "keyMetrics"]
};

/**
 * Generates an AI-powered due diligence report for a startup by ID.
 * @example
 * GET(req, { params })
 * { success: true, startup: { name, sector, stage }, report }
 * @param {NextRequest} req - The incoming Next.js request object.
 * @param {{ params: Promise<{ id: string }> }} { params } - Route parameters containing the startup ID.
 * @returns {Promise<NextResponse>} A JSON response containing the startup summary and generated due diligence report, or an error response.
 **/
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const result = await fetchStartupById(id);
        if (result instanceof NextResponse) return result;
        const { startup, startupDataString } = result;

        const prompt = `
            You are an expert venture capital analyst and AI due diligence engine.
            Analyze the following startup data and generate a comprehensive due diligence report.
            
            Evaluate the startup across 4 mandatory sections:
            1. Financial Health (id: 'financial', maxScore: 30)
            2. Growth Metrics (id: 'growth', maxScore: 20)
            3. Team & Credibility (id: 'credibility', maxScore: 25)
            4. Risk & Legal (id: 'risk', maxScore: 25)

            Assign points to each section based on the startup's data. Identify key strengths and flags for each section.
            Calculate the \`totalScore\` by summing the section scores (max 100).
            Determine the \`verdict\`:
            - 'Strong Buy' (emerald) for 80+
            - 'Accumulate' (blue) for 65-79
            - 'Hold / Monitor' (yellow) for 50-64
            - 'High Risk' (red) for < 50

            Extract the key metrics from the data to populate the \`keyMetrics\` object. If valuation isn't explicitly provided, calculate it as (requested_funding / (equity_offered / 100)).
            
            Startup Data:
            ${startupDataString}
        `;

        return callGeminiReport(
            prompt,
            dueDiligenceSchema,
            (startup as any).name,
            (startup as any).sector,
        );
    } catch (err: any) {
        console.error("Gemini Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
