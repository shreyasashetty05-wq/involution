import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import dbConnect from "@/database/mongodb";
import Startup from "@/database/models/Startup";
import AIFeedback from "@/database/models/AIFeedback";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Helpers ---

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

async function fetchFewShotExamples(embedding: number[]): Promise<any[]> {
    if (embedding.length > 0) {
        return AIFeedback.aggregate([
            {
                $vectorSearch: {
                    index: 'vector_index',
                    path: 'embedding',
                    queryVector: embedding,
                    numCandidates: 10,
                    limit: 3,
                    filter: { module: 'chat', feedbackType: 'upvote' }
                }
            },
            { $project: { context: 1, aiResponse: 1, score: { $meta: 'vectorSearchScore' } } }
        ]);
    }
    return AIFeedback.find({
        module: 'chat',
        feedbackType: 'upvote',
        context: { $exists: true, $ne: '' }
    }).sort({ createdAt: -1 }).limit(3).lean();
}

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
            Target Market: ${startup.businessInfo?.targetMarket || "Not provided"}
            Marketing Strategies: ${startup.businessInfo?.marketingStrategy || "Not provided"}
            UVP: ${startup.businessInfo?.uvp || "Not provided"}
            ${startup.isStudent ? `Founder Age: ${startup.founderAge} (Student Incube Startup)` : ""}
            
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
        await dbConnect();

        const { startupId, question, history } = await req.json();

        if (!startupId || !question) {
            return NextResponse.json({ success: false, error: 'startupId and question are required' }, { status: 400 });
        }

        const startup = await Startup.findById(startupId);
        if (!startup) {
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
