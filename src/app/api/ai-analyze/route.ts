import { NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const analysisSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.INTEGER, description: "Overall Analysis Score from 0 to 100. Reduce significantly if fake or meaningless data." },
        executiveSummary: { type: Type.STRING, description: "A comprehensive executive summary of the business or idea." },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key strengths identified in the profile." },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key weaknesses or areas lacking detail." },
        businessRisks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Identified business risks." },
        improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Actionable suggestions for the founder." },
        investmentReadiness: { type: Type.STRING, description: "A brief statement on how ready this profile is for investment/incubation." },
    },
    required: ["score", "executiveSummary", "strengths", "weaknesses", "businessRisks", "improvementSuggestions", "investmentReadiness"],
};

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        
        const body = await req.json();
        
        // Support either startupId or incubationId (or generic id + type)
        const type = body.type || (body.incubationId ? 'incubation' : 'startup');
        const id = body.startupId || body.incubationId || body.id;

        if (!id) {
            return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
        }

        let profileData;
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

        if (type === 'incubation') {
            prompt = `
                Perform a comprehensive AI Analysis on the following Incubation/Student idea.
                
                Founder: ${record.full_name}
                Education: ${record.education_type} at ${record.institution_name}
                Project Name: ${record.project_name}
                Tagline: ${record.tagline}
                Industry: ${record.industry}
                Problem Statement: ${record.problem_statement}
                Proposed Solution: ${record.solution_description}
                Innovation/UVP: ${record.innovation_usp}
                Target Users: ${record.target_users}
                Stage: ${record.current_stage}
                Prototype Info: Available: ${record.prototype_available}, Link: ${record.prototype_link}
                Tech Used: ${JSON.stringify(record.technology_used)}
                Funding Required: ${record.funding_required ? record.ask_amount : 'No'}
                Support Needed: ${JSON.stringify(record.support_needed)}
                
                EVALUATION CRITERIA:
                Evaluate: Business Quality, Founder Credibility, Innovation, Market Opportunity, Business Feasibility, Growth Potential, Business Readiness, Investment Readiness, Overall Quality.
                
                INVALID DATA DETECTION (CRITICAL):
                If the inputs contain fake, spam, meaningless characters (like "ABCDE", "test", "asdfgh"), random characters, copy-pasted garbage, or very short meaningless answers, you MUST assign a VERY LOW score (e.g., below 30) and flag it in the weaknesses and risks. Reward detailed, realistic, professional answers.
            `;
        } else {
            prompt = `
                Perform a comprehensive AI Analysis on the following Startup.
                
                Startup Name: ${record.name}
                Sector: ${record.sector}
                Stage: ${record.stage}
                Business Model: ${record.business_model}
                Description: ${record.desc}
                Requested Funding: ₹${record.requested} for ${record.equity}% equity
                Revenue: ₹${record.revenue}
                Burn: ₹${record.burn}
                Target Market: ${record.business_info?.targetMarket || "Not provided"}
                Unique Value Proposition: ${record.business_info?.uvp || "Not provided"}
                
                EVALUATION CRITERIA:
                Evaluate: Business Quality, Founder Credibility, Innovation, Market Opportunity, Business Feasibility, Financial Strength, Growth Potential, Business Readiness, Investment Readiness, Overall Quality.
                
                INVALID DATA DETECTION (CRITICAL):
                If the inputs contain fake, spam, meaningless characters (like "ABCDE", "test", "asdfgh"), random characters, copy-pasted garbage, or very short meaningless answers, you MUST assign a VERY LOW score (e.g., below 30) and flag it in the weaknesses and risks. Reward detailed, realistic, professional answers.
            `;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: analysisSchema
            }
        });

        const analysisResult = JSON.parse(response.text || "{}");

        // Save back to the database using RPC to bypass RLS
        const { error: updateError } = await supabase.rpc('update_ai_analysis', {
            p_table_name: tableName,
            p_id: id,
            p_score: analysisResult.score || 0,
            p_summary: analysisResult.executiveSummary || "",
            p_strengths: analysisResult.strengths || [],
            p_weaknesses: analysisResult.weaknesses || [],
            p_risks: analysisResult.businessRisks || [],
            p_suggestions: analysisResult.improvementSuggestions || [],
            p_readiness: analysisResult.investmentReadiness || ""
        });

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            analysis: analysisResult
        });
    } catch (error: any) {
        console.error("AI Analyze Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
