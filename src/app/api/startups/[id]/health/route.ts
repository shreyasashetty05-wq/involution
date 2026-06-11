import { NextRequest, NextResponse } from 'next/server';
import { Type, Schema } from '@google/genai';
import { callGeminiReport } from '@/lib/geminiReportHelper';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

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

// --- Helpers ---

/**
* Detects significant revenue anomalies by identifying large month-over-month spikes or drops in a revenue array.
* @example
* detectRevenueAnomalies([100, 140, 90])
* "DETECTED FINANCIAL ANOMALIES:\nSUDDEN SPIKE: Month 1 to Month 2 saw a 40.0% spike in revenue (from 100 to 140).\nCRITICAL DROP: Month 2 to Month 3 saw a -35.7% drop in revenue (from 140 to 90).\n\nCRITICAL DIRECTIVE:\n- You MUST acknowledge these anomalies.\n- If there is a CRITICAL DROP in revenue, you MUST severely penalize the `overallHealth` score (pushing it towards Poor or Critical) and the 'growth' & 'revenue' pillars.\n- You MUST generate a 'critical' or 'warning' alert explicitly mentioning the revenue drop or spike.\n* @param {number[]} revArray - Array of monthly revenue values to analyze.
* @returns {string} A message describing detected anomalies or indicating that none were found.
**/
function detectRevenueAnomalies(revArray: number[]): string {
    if (!Array.isArray(revArray) || revArray.length <= 1) {
        return "No significant financial anomalies detected in the last 6 months.";
    }
    const anomalies: string[] = [];
    for (let i = 1; i < revArray.length; i += 1) {
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
    if (anomalies.length === 0) return "No significant financial anomalies detected in the last 6 months.";
    return (
        `DETECTED FINANCIAL ANOMALIES:\n${anomalies.join('\n')}\n` +
        `\nCRITICAL DIRECTIVE:\n` +
        `- You MUST acknowledge these anomalies.\n` +
        `- If there is a CRITICAL DROP in revenue, you MUST severely penalize the \`overallHealth\` score (pushing it towards Poor or Critical) and the 'growth' & 'revenue' pillars.\n` +
        `- You MUST generate a 'critical' or 'warning' alert explicitly mentioning the revenue drop or spike.\n`
    );
}

/**
 * Builds a prompt for analyzing startup financial health across operational pillars.
 * @example
 * buildHealthPrompt(startupDataString, financialAnomaliesContext)
 * "You are an expert startup financial analyst AI..."
 * @param {string} startupDataString - JSON/stringified startup data to be analyzed.
 * @param {string} financialAnomaliesContext - Additional context describing detected financial anomalies.
 * @returns {string} A formatted prompt string for the health analysis model.
 */
function buildHealthPrompt(startupDataString: string, financialAnomaliesContext: string): string {
    return `
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
}

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
        const { id } = await params;
        const { data: startup, error: startupError } = await supabase
            .from("startups")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (startupError || !startup) {
            return NextResponse.json({ success: false, error: 'Startup not found' }, { status: 404 });
        }

        const startupDataString = JSON.stringify(startup, null, 2);
        const last6MonthsRev = startup.ai_ready?.last6MonthsRev || startup.ai_ready?.last_6_months_rev || [];
        const financialAnomaliesContext = detectRevenueAnomalies(last6MonthsRev);
        const prompt = buildHealthPrompt(startupDataString, financialAnomaliesContext);

        const geminiResponse = await callGeminiReport(
            prompt,
            healthSchema,
            startup.name,
            startup.sector,
        );

        const reportData = (await geminiResponse.json()).report;

        // Fire-and-forget prediction logger
        (async () => {
            try {
                // Log Overall Health Score
                await supabase.from("ai_predictions").insert({
                    startup_id: id,
                    predicted_metric: 'healthScore',
                    predicted_value: reportData.overallHealth,
                    status: 'pending'
                });

                // Try to extract runway months if available in pillars
                const runwayPillar = reportData.pillars.find((p: any) => p.id === 'runway');
                if (runwayPillar && runwayPillar.description) {
                    const match = runwayPillar.description.match(/(\d+)/);
                    if (match) {
                        await supabase.from("ai_predictions").insert({
                            startup_id: id,
                            predicted_metric: 'runwayMonths',
                            predicted_value: parseInt(match[1], 10),
                            status: 'pending',
                            confidence_score: runwayPillar.score
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to log AI prediction asynchronously", err);
            }
        })();

        return NextResponse.json({
            success: true,
            startup: { name: startup.name, sector: startup.sector },
            report: reportData,
        });
    } catch (err: any) {
        console.error("Gemini Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
