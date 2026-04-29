import { NextRequest, NextResponse } from 'next/server';
import { Type, Schema } from '@google/genai';
import { callGeminiReport, fetchStartupById } from '@/lib/geminiReportHelper';


const complianceSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        complianceScore: { type: Type.INTEGER, description: "A score from 0-100 indicating overall compliance" },
        complianceLabel: { type: Type.STRING, description: "One of: Fully Compliant, Mostly Compliant, Partial Compliance, Non-Compliant" },
        complianceColor: { type: Type.STRING, description: "Color mapping: emerald, blue, yellow, red" },
        compliantCount: { type: Type.INTEGER, description: "Number of fully compliant items" },
        totalItems: { type: Type.INTEGER, description: "Total number of compliance items evaluated" },
        criticalIssuesCount: { type: Type.INTEGER, description: "Number of non-compliant items with critical priority" },
        highIssuesCount: { type: Type.INTEGER, description: "Number of non-compliant items with high priority" },
        categories: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Unique list of categories evaluated" },
        investorNote: { type: Type.STRING, description: "A short summary note for the investor regarding compliance status" },
        items: {
            type: Type.ARRAY,
            description: "List of compliance items evaluated",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "Unique ID for the item" },
                    category: { type: Type.STRING, description: "Category (e.g. Tax Compliance, Legal Disclosure)" },
                    requirement: { type: Type.STRING, description: "The specific requirement (e.g. GST Registration)" },
                    status: { type: Type.STRING, description: "One of: compliant, non-compliant, partial, not-applicable" },
                    detail: { type: Type.STRING, description: "Explanation of the status" },
                    priority: { type: Type.STRING, description: "One of: critical, high, medium, low" }
                },
                required: ["id", "category", "requirement", "status", "detail", "priority"]
            }
        }
    },
    required: ["complianceScore", "complianceLabel", "complianceColor", "compliantCount", "totalItems", "criticalIssuesCount", "highIssuesCount", "categories", "investorNote", "items"]
};

/**
 * Generates a compliance report for a startup by fetching its data, analyzing legal, tax, KYC, and financial transparency using AI, and returning the computed compliance assessment.
 * @example
 * GET(req, { params: Promise.resolve({ id: 'startup_id' }) })
 * { success: true, startup: { name: 'Startup Name', sector: 'Fintech' }, report: { ... } }
 * @param {NextRequest} req - The incoming Next.js request object.
 * @param {{ params: Promise<{ id: string }> }} context - Route context containing the startup ID parameter.
 * @returns {NextResponse} A JSON response containing the compliance report or an error message.
 **/
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const result = await fetchStartupById(id);
        if (result instanceof NextResponse) return result;
        const { startup, startupDataString } = result;

        const prompt = `
            You are an expert legal and corporate compliance AI agent.
            Evaluate the compliance standing of the following startup based on tax, KYC, legal disclosures, and financial transparency.
            
            Evaluate at least the following standard compliance items:
            1. GST Registration (critical)
            2. PAN Verification (critical)
            3. Aadhaar Verification (high)
            4. Bank Account Verification (high)
            5. No Pending Litigation (critical) - Check riskDisclosure.legalCases
            6. No Criminal Record (critical) - Check riskDisclosure.criminalRecord
            7. Bank Statement Submission (medium)
            8. CA Certified Financials (medium)
            9. Entity Registration / Company Type (medium)

            For each item, determine the \`status\` (compliant, non-compliant, partial, not-applicable) and provide a \`detail\` explaining why.
            
            Calculate \`complianceScore\` (0-100) based on the percentage of compliant items.
            Determine \`complianceLabel\` and \`complianceColor\`:
            - 'Fully Compliant' (emerald) for 90+
            - 'Mostly Compliant' (blue) for 70-89
            - 'Partial Compliance' (yellow) for 50-69
            - 'Non-Compliant' (red) for < 50

            Calculate \`compliantCount\`, \`totalItems\`, \`criticalIssuesCount\`, and \`highIssuesCount\`.
            Provide an \`investorNote\` summarizing the biggest risks or giving an all-clear. Ensure it includes an alert emoji if there are critical issues.

            Startup Data:
            ${startupDataString}
        `;

        return callGeminiReport(
            prompt,
            complianceSchema,
            (startup as any).name,
            (startup as any).sector,
        );
    } catch (err: any) {
        console.error("Gemini Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
