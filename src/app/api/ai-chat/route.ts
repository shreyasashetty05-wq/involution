import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Helpers ---

function cosineSimilarity(a: number[], b: number[]) {
    if (!a.length || !b.length || a.length !== b.length) return 0;
    let dotProduct = 0;
    let mA = 0;
    let mB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        mA += a[i] * a[i];
        mB += b[i] * b[i];
    }
    mA = Math.sqrt(mA);
    mB = Math.sqrt(mB);
    if (mA === 0 || mB === 0) return 0;
    return dotProduct / (mA * mB);
}

/**
* Generates an embedding vector for a question string using the configured AI embedding model.
* @example
* getQuestionEmbedding("What is the capital of France?")
* [0.0123, -0.0456, 0.0789]
* @param {string} question - The question or context text to convert into an embedding.
* @returns {Promise<number[]>} A promise that resolves to an array of embedding values, or an empty array if embedding fails.
**/
async function getQuestionEmbedding(question: string): Promise<number[]> {
    try {
        const embedRes = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: `Question/Context: ${question}`
        });
        if (embedRes.embeddings?.[0]?.values) return embedRes.embeddings[0].values;
    } catch (embedErr) {
        console.error("Failed to embed question, falling back to standard search", embedErr);
    }
    return [];
}

/**
* Fetches up to three few-shot example feedback entries using vector search when an embedding is provided, or falls back to the latest matching upvoted chat feedback.
* @example
* fetchFewShotExamples([0.12, 0.34, 0.56])
* [{ context: '...', aiResponse: '...', score: 0.98 }]
* @param {number[]} embedding - Numeric embedding vector used to retrieve semantically similar feedback examples.
* @returns {Promise<any[]>} A promise that resolves to an array of few-shot example documents.
**/
async function fetchFewShotExamples(embedding: number[]): Promise<any[]> {
    const { data: feedbacks, error } = await supabase
        .from("ai_feedbacks")
        .select("*")
        .eq("module", "chat")
        .eq("feedback_type", "upvote")
        .not("context", "is", null)
        .neq("context", "");

    if (error || !feedbacks || feedbacks.length === 0) return [];

    if (embedding && embedding.length > 0) {
        return feedbacks
            .map((fb: any) => {
                let fbEmbedding: number[] = [];
                if (typeof fb.embedding === "string") {
                    try {
                        fbEmbedding = JSON.parse(fb.embedding);
                    } catch {
                        fbEmbedding = [];
                    }
                } else if (Array.isArray(fb.embedding)) {
                    fbEmbedding = fb.embedding;
                }
                const score = cosineSimilarity(embedding, fbEmbedding);
                return {
                    context: fb.context,
                    aiResponse: fb.ai_response,
                    score
                };
            })
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 3);
    }

    return feedbacks
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)
        .map((fb: any) => ({
            context: fb.context,
            aiResponse: fb.ai_response
        }));
}

/**
* Builds a formatted few-shot examples string from an array of example objects.
* @example
* buildFewShotString([{ context: "What is AI?", aiResponse: "AI is..." }])
* "--- EXAMPLES OF HIGHLY RATED PAST ANSWERS (Learn from these) --- ..."
* @param {any[]} examples - Array of example objects containing `context` and `aiResponse` fields.
* @returns {string} A formatted string containing the provided examples, or an empty string if no examples are supplied.
**/
function buildFewShotString(examples: any[]): string {
    if (!examples?.length) return "";
    let str = `
            --- EXAMPLES OF HIGHLY RATED PAST ANSWERS (Learn from these) ---
            The following are previous answers you gave that the investor explicitly rated as excellent. 
            Adopt a similar tone, detail level, and analytical rigor in your current response:
            
            `;
    examples.forEach((ex: any, idx: number) => {
        str += `[Example ${idx + 1}]\nQuestion: ${ex.context}\nYour Perfect Answer: ${ex.aiResponse}\n\n`;
    });
    return str;
}

/**
 * Builds a chat prompt string for the investment analyst AI using startup details, prior analysis, few-shot examples, and an investor question.
 * @example
 * buildChatPrompt(startup, "What is the growth potential?", fewShotString)
 * "You are the \"InVolution AI Analyst\"..."
 * @param {any} startup - Startup data object containing company, financial, and analysis information.
 * @param {string} question - The investor's question to be answered about the startup.
 * @param {string} fewShotString - A string containing few-shot examples or additional prompt context.
 * @returns {string} Formatted prompt string to be sent to the AI model.
 **/
function buildChatPrompt(startup: any, question: string, fewShotString: string): string {
    return `
            You are the "InVolution AI Analyst", an expert investment analyst AI assistant for an investor platform.
            
            Here is the core data and your previous analysis of a startup:
            ---
            Startup Name: ${startup.name}
            Sector: ${startup.sector}
            Stage: ${startup.stage}
            Requested Funding: ₹${startup.requested}
            Equity Offered: ${startup.equity}%
            Current Monthly Revenue: ₹${startup.revenue}
            Current Monthly Burn: ₹${startup.burn}
            Business Description: ${startup.desc}
            Target Market: ${startup.business_info?.targetMarket || "Not provided"}
            Marketing Strategies: ${startup.business_info?.marketingStrategy || "Not provided"}
            UVP: ${startup.business_info?.uvp || "Not provided"}
            
            Previous AI Analysis:
            ${startup.analysis || "No preliminary analysis was available."}
            ---
            ${fewShotString}
 
            An investor is asking you a question about this startup.
            Answer clearly, professionally, and accurately based ONLY on the provided startup information. If the information is not available, state that you do not have sufficient data.
            
            Investor Question:
            ${question}
        `;
}

/**
* Handles an AI chat request by validating input, retrieving startup data and relevant past feedback examples, then generating a contextual answer using the Gemini model.
* @example
* POST(req)
* { success: true, answer: "Based on the available startup data..." }
* @param {Request} req - Incoming request containing startupId, question, and optional history in the JSON body.
* @returns {Promise<Response>} JSON response with the generated answer on success or an error message on failure.
**/
export async function POST(req: Request) {
    try {
        const { startupId, question, history } = await req.json();

        if (!startupId || !question) {
            return NextResponse.json({ success: false, error: 'startupId and question are required' }, { status: 400 });
        }

        const { data: startup, error: startupError } = await supabase
            .from("startups")
            .select("*")
            .eq("id", startupId)
            .maybeSingle();

        if (startupError || !startup) {
            return NextResponse.json({ success: false, error: 'Startup not found' }, { status: 404 });
        }

        const embedding = await getQuestionEmbedding(question);
        const pastExamples = await fetchFewShotExamples(embedding);
        const fewShotString = buildFewShotString(pastExamples);
        const prompt = buildChatPrompt(startup, question, fewShotString);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.3 }
        });

        return NextResponse.json({ success: true, answer: response.text });
    } catch (error: any) {
        console.error("AI Chat Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
