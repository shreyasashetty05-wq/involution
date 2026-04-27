import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/database/mongodb";
import Startup from "@/database/models/Startup";
import { GoogleGenAI, Type, Schema } from '@google/genai';
import mongoose from 'mongoose';

// Initialize the Google Gen AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const healthSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        overallHealth: { type: Type.INTEGER, description: "A score from 0-100 indicating overall startup health" },
        healthLabel: { type: Type.STRING, description: "One of: Excellent, Good, Fair, Poor, Critical" },
        healthColor: { type: Type.STRING, description: "Color mapping: emerald, blue, yellow, orange, red" },
        pillars: {
            type: Type.ARRAY,
            description: "Exactly 6 pillars evaluating health",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "Pillar ID: 'burn', 'runway', 'revenue', 'churn', 'margin', 'growth'" },
                    label: { type: Type.STRING, description: "Pillar Label" },
                    score: { type: Type.INTEGER, description: "Score out of 100" },
                    description: { type: Type.STRING, description: "Short description of the metric (e.g. ₹500K monthly burn, 12 months remaining)" }
                },
                required: ["id", "label", "score", "description"]
            }
        },
        alerts: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    level: { type: Type.STRING, description: "One of: critical, warning, info" },
                    message: { type: Type.STRING, description: "Alert message" }
                },
                required: ["level", "message"]
            }
        },
        revenueTrend: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Last 6 months revenue array" },
        expenseTrend: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Last 6 months expense array" }
    },
    required: ["overallHealth", "healthLabel", "healthColor", "pillars", "alerts", "revenueTrend", "expenseTrend"]
};


/**
 * Analyzes a startup's financial and operational data to generate a health report and log AI predictions.
 * @example
 * GET(req, params)
 * { success: true, startup: { name: "Acme Inc", sector: "SaaS" }, report: { ... } }
 * @param {NextRequest} req - The incoming Next.js request object.
 * @param {{ params: Promise<{ id: string }> }} params - Route parameters containing the startup ID.
 * @returns {Promise<NextResponse>} A JSON response with the startup health report or an error response.
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

        // --- FINANCIAL ANOMALY DETECTOR ---
        let financialAnomaliesContext = "No significant financial anomalies detected in the last 6 months.";
        const revArray = (startup as any).aiReady?.last6MonthsRev;

        if (revArray && Array.isArray(revArray) && revArray.length > 1) {
            const anomalies: string[] = [];
            for (let i = 1; i < revArray.length; i+=1) {
                const prev = revArray[i - 1];
                const curr = revArray[i];
                if (prev > 0) {
                    const pctChange = ((curr - prev) / prev) * 100;
                    if (pctChange <= -30) {
                        anomalies.push(`CRITICAL DROP: Month ${i} to Month ${i + 1} saw a ${pctChange.toFixed(1)}% drop in revenue (from ${prev} to ${curr}).`);
                    } else if (pctChange >= 30) {
                        anomalies.push(`SUDDEN SPIKE: Month ${i} to Month ${i + 1} saw a ${pctChange.toFixed(1)}% spike in revenue (from ${prev} to ${curr}).`);
                    }
                }
            }

            if (anomalies.length > 0) {
                financialAnomaliesContext = `DETECTED FINANCIAL ANOMALIES:\n${anomalies.join('\n')}\n` +
                    `\nCRITICAL DIRECTIVE:\n` +
                    `- You MUST acknowledge these anomalies.\n` +
                    `- If there is a CRITICAL DROP in revenue, you MUST severely penalize the \`overallHealth\` score (pushing it towards Poor or Critical) and the 'growth' & 'revenue' pillars.\n` +
                    `- You MUST generate a 'critical' or 'warning' alert explicitly mentioning the revenue drop or spike.\n`;
            }
        }

        const prompt = `
            You are an expert startup financial analyst AI.
            Analyze the following startup data to assess the company's real-time operational health.
            
            Evaluate the startup across 6 operational pillars, scoring each from 0-100:
            1. Burn Efficiency (id: 'burn')
            2. Runway Safety (id: 'runway')
            3. Revenue Scale (id: 'revenue')
            4. Retention Health/Churn (id: 'churn')
            5. Profitability/Margin (id: 'margin')
            6. Growth Velocity (id: 'growth')

            Provide a short \`description\` for each pillar (e.g. "12 months remaining", "₹2L MRR", etc).
            Calculate an \`overallHealth\` score from 0-100 based on a weighted average of these pillars.
            Determine the \`healthLabel\` and \`healthColor\`:
            - 'Excellent' (emerald) for 80+
            - 'Good' (blue) for 65-79
            - 'Fair' (yellow) for 50-64
            - 'Poor' (orange) for 35-49
            - 'Critical' (red) for < 35

            Also generate an array of \`alerts\` (level: 'critical', 'warning', or 'info') if you spot extreme values (e.g., runway < 6 months, churn > 10%, high burn vs revenue, or strong MoM growth).
            Extract the \`revenueTrend\` (last6MonthsRev) and \`expenseTrend\` (last6MonthsExp) directly from the aiReady data if it exists, otherwise return empty arrays.

            ${financialAnomaliesContext}

            Startup Data:
            ${startupDataString}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: healthSchema,
                temperature: 0.2, // Low temperature for more deterministic/factual analysis
            }
        });

        if (!response.text) {
            throw new Error("Failed to generate report from Gemini");
        }

        const reportData = JSON.parse(response.text);
        reportData.generatedAt = new Date().toISOString();

        // -----------------------------------------------------
        // STEP 3: TRACK GROUND TRUTH (AI Predictions)
        // Log the AI's prediction for future verification
        // -----------------------------------------------------
        import('@/database/models/AIPrediction').then(async (AIPredictionModule) => {
            const AIPrediction = AIPredictionModule.default;

            // Log Overall Health Score
            await AIPrediction.create({
                startupId: id,
                predictedMetric: 'healthScore',
                predictedValue: reportData.overallHealth,
                status: 'pending'
            });

            // Try to extract runway months if available in pillars
            const runwayPillar = reportData.pillars.find((p: any) => p.id === 'runway');
            if (runwayPillar && runwayPillar.description) {
                // E.g. "12 months remaining" -> 12
                const match = runwayPillar.description.match(/(\d+)/);
                if (match) {
                    return AIPrediction.create({
                        startupId: id,
                        predictedMetric: 'runwayMonths',
                        predictedValue: parseInt(match[1], 10),
                        status: 'pending',
                        confidenceScore: runwayPillar.score
                    });
                }
            }
            return undefined;
        }).catch(err => console.error("Failed to log AI prediction asynchronously", err));

        return NextResponse.json({
            success: true,
            startup: {
                name: (startup as any).name,
                sector: (startup as any).sector
            },
            report: reportData
        });
    } catch (err: any) {
        console.error("Gemini Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
