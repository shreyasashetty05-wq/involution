import { NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const startupSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        overallScore: { type: Type.INTEGER, description: "Overall Score from 0 to 100." },
        executiveSummary: { type: Type.STRING, description: "STRICTLY 3-5 lines only. Do NOT repeat form info." },
        scoreBreakdown: {
            type: Type.OBJECT,
            properties: {
                founderAndTeam: { type: Type.INTEGER, description: "Score out of 15" },
                businessIdea: { type: Type.INTEGER, description: "Score out of 20" },
                marketOpportunity: { type: Type.INTEGER, description: "Score out of 15" },
                businessModel: { type: Type.INTEGER, description: "Score out of 15" },
                financialHealth: { type: Type.INTEGER, description: "Score out of 15" },
                growthPotential: { type: Type.INTEGER, description: "Score out of 10" },
                businessVerification: { type: Type.INTEGER, description: "Score out of 5" },
                riskAssessment: { type: Type.INTEGER, description: "Score out of 5" }
            },
            required: ["founderAndTeam", "businessIdea", "marketOpportunity", "businessModel", "financialHealth", "growthPotential", "businessVerification", "riskAssessment"],
        },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Max 5 meaningful strengths." },
        improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Max 5 actionable improvements." },
        risks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Max 3 biggest business risks. One sentence each." },
        recommendation: { type: Type.STRING, description: "Must be: 'Investment Ready', 'Nearly Ready', 'Needs Improvement', or 'Not Investment Ready'." },
        confidence: { type: Type.STRING, description: "Must be: 'High', 'Medium', or 'Low' based on data completeness." }
    },
    required: ["overallScore", "executiveSummary", "scoreBreakdown", "strengths", "improvements", "risks", "recommendation", "confidence"],
};

const incubationSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        overallScore: { type: Type.INTEGER, description: "Overall Score from 0 to 100." },
        executiveSummary: { type: Type.STRING, description: "STRICTLY 3-5 lines only. Do NOT repeat form info." },
        scoreBreakdown: {
            type: Type.OBJECT,
            properties: {
                founderPotential: { type: Type.INTEGER, description: "Score out of 15" },
                innovation: { type: Type.INTEGER, description: "Score out of 20" },
                problemSolutionFit: { type: Type.INTEGER, description: "Score out of 20" },
                technicalFeasibility: { type: Type.INTEGER, description: "Score out of 15" },
                prototypeReadiness: { type: Type.INTEGER, description: "Score out of 10" },
                marketPotential: { type: Type.INTEGER, description: "Score out of 10" },
                incubationReadiness: { type: Type.INTEGER, description: "Score out of 5" },
                riskAssessment: { type: Type.INTEGER, description: "Score out of 5" }
            },
            required: ["founderPotential", "innovation", "problemSolutionFit", "technicalFeasibility", "prototypeReadiness", "marketPotential", "incubationReadiness", "riskAssessment"],
        },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Max 5 meaningful strengths." },
        improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Max 5 actionable improvements." },
        risks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Max 3 biggest business risks. One sentence each." },
        recommendation: { type: Type.STRING, description: "Must be: 'Highly Suitable', 'Suitable', 'Needs Improvement', or 'Not Suitable Yet'." },
        confidence: { type: Type.STRING, description: "Must be: 'High', 'Medium', or 'Low' based on data completeness." }
    },
    required: ["overallScore", "executiveSummary", "scoreBreakdown", "strengths", "improvements", "risks", "recommendation", "confidence"],
};

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        
        const body = await req.json();
        
        const type = body.type || (body.incubationId ? 'incubation' : 'startup');
        const id = body.startupId || body.incubationId || body.id;

        if (!id) {
            return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
        }

        let tableName = type === 'incubation' ? 'incubation_applications' : 'startups';

        const { data: record, error: fetchError } = await supabase
            .from(tableName)
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (fetchError || !record) {
            return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
        }

        let prompt = "";
        const schema = type === 'incubation' ? incubationSchema : startupSchema;

        if (type === 'incubation') {
            prompt = `
You are an experienced Incubation Mentor evaluating a student idea.
Analyze the following information. Do NOT evaluate based on startup revenue.

Founder: ${record.full_name || 'N/A'}
Education: ${record.education_type || 'N/A'} at ${record.institution_name || 'N/A'}
Project Name: ${record.project_name || 'N/A'}
Tagline: ${record.tagline || 'N/A'}
Industry: ${record.industry || 'N/A'}
Problem Statement: ${record.problem_statement || 'N/A'}
Proposed Solution: ${record.solution_description || 'N/A'}
Innovation: ${record.innovation_usp || 'N/A'}
Target Users: ${record.target_users || 'N/A'}
Current Stage: ${record.current_stage || 'N/A'}
Prototype: ${record.prototype_available ? 'Available' : 'Not Available'}
GitHub: ${record.github_repo || 'N/A'}
Website: ${record.website || 'N/A'}
Technology Used: ${JSON.stringify(record.technology_used || [])}
Funding Required: ${record.funding_required ? 'Yes' : 'No'}
Support Needed: ${JSON.stringify(record.support_needed || [])}
Team Members: ${JSON.stringify(record.team_members || [])}
Short Bio: ${record.short_bio || 'N/A'}

WORKFLOW INSTRUCTIONS:
1. Read & Analyze.
2. Cross-check & Validations: Compare Problem vs Solution, Prototype vs Stage, Technology vs Product. If information contradicts itself, reduce the score and explain why.
3. Spam Detection: Detect ABCDE, asdfgh, test, 123456, random symbols, copy-pasted garbage, meaningless answers, repeated text, contradictory info. If detected, significantly reduce the score and explain why.
4. Confidence Level: High if most important fields are completed, Medium if some are missing, Low if large amount missing.
5. Score Breakdown:
- Founder Potential (15)
- Innovation (20)
- Problem Solution Fit (20)
- Technical Feasibility (15)
- Prototype Readiness (10)
- Market Potential (10)
- Incubation Readiness (5)
- Risk Assessment (5)

Generate ONLY the strict JSON format requested.
`;
        } else {
            prompt = `
You are an experienced Angel Investor evaluating a startup.
Analyze the following business information strictly. Ignore KYC or unrelated media.

Founder: ${record.basic_info?.founderName || 'N/A'}
Founder Role: ${record.basic_info?.founderRole || 'N/A'}
Team Members: ${JSON.stringify(record.basic_info?.teamMembersData || [])}
Startup Name: ${record.name || 'N/A'}
Tagline: ${record.basic_info?.startupTagline || 'N/A'}
Industry: ${record.sector || 'N/A'}
Business Model: ${record.business_model || 'N/A'}
Target Market: ${record.business_info?.targetMarket || 'N/A'}
Problem Statement: ${record.business_info?.problemStatement || 'N/A'}
Solution: ${record.business_info?.solution || 'N/A'}
Unique Value Proposition: ${record.business_info?.uvp || 'N/A'}
Competitors: ${record.business_info?.competitors || 'N/A'}
Startup Description: ${record.desc || 'N/A'}
Investment Required: ${record.requested || 'N/A'}
Equity Offered: ${record.equity || 'N/A'}
Current Valuation: ${record.investment_details?.currentValuation || 'N/A'}
Use of Funds: ${JSON.stringify(record.investment_details?.useOfFunds || {})}
Monthly Revenue: ${record.revenue || 'N/A'}
Monthly Expenses: ${record.financials_monthly?.expenses || 'N/A'}
Monthly Profit: ${record.financials_monthly?.profit || 'N/A'}
Cash in Bank: ${record.financials_monthly?.cashInBank || 'N/A'}
Gross Burn Rate: ${record.financials_monthly?.grossBurnRate || 'N/A'}
Net Burn Rate: ${record.burn || record.financials_monthly?.monthlyBurnRate || 'N/A'}
Customers: ${record.growth_metrics?.totalCustomers || 'N/A'}
Monthly Active Users: ${record.growth_metrics?.mau || 'N/A'}
Growth Rate: ${record.growth_metrics?.momGrowthRate || 'N/A'}
Customer Retention: ${record.growth_metrics?.customerRetentionRate || 'N/A'}
Business Verification: ${JSON.stringify(record.credibility?.verification || {})}
Website: ${record.business_info?.website || 'N/A'}

WORKFLOW INSTRUCTIONS:
1. Read & Analyze.
2. Cross-check & Validations: Examples: Revenue vs Customers, Revenue vs Burn, Funding vs Equity, Funding vs Stage, Valuation vs Revenue, Business Model vs Description, Problem vs Solution, Growth vs Customers. If information contradicts itself, reduce the score and explain why.
3. Spam Detection: Detect ABCDE, asdfgh, test, 123456, random symbols, copy-pasted garbage, meaningless words, fake financial values. If detected, significantly reduce the score and explain why.
4. Confidence Level: High if most important fields are completed, Medium if some are missing, Low if large amount missing.
5. Score Breakdown:
- Founder & Team (15)
- Business Idea (20)
- Market Opportunity (15)
- Business Model (15)
- Financial Health (15)
- Growth Potential (10)
- Business Verification (5)
- Risk Assessment (5)

Generate ONLY the strict JSON format requested.
`;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.1, // lowered to enforce strictness
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const analysisResult = JSON.parse(response.text || "{}");

        // Save back to the database using the updated RPC to bypass RLS
        // Note: we map new JSON keys back to the database columns here
        const { error: updateError } = await supabase.rpc('update_ai_analysis', {
            p_table_name: tableName,
            p_id: id,
            p_score: analysisResult.overallScore || 0,
            p_summary: analysisResult.executiveSummary || "",
            p_strengths: analysisResult.strengths || [],
            p_weaknesses: [], // no longer used natively, but passing empty array
            p_risks: analysisResult.risks || [],
            p_suggestions: analysisResult.improvements || [],
            p_readiness: "", // we use recommendation for everything now, leave empty
            p_breakdown: analysisResult.scoreBreakdown || {},
            p_recommendation: analysisResult.recommendation || "",
            p_confidence: analysisResult.confidence || "Low"
        });

        if (updateError) {
            console.error("RPC Error Details:", updateError);
            throw updateError;
        }

        return NextResponse.json({
            success: true,
            analysis: analysisResult
        });
    } catch (error: any) {
        console.error("AI Analyze Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
