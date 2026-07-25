import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AQ.Ab8RN6IOsRLKvgrifYOM6XG9g0mzbvw4RpqI5wQrbisHHRQziQ" });

async function run() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: "test" },
                        { inlineData: { data: "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", mimeType: "image/gif" } }
                    ]
                }
            ]
        });
        console.log("Success", response.text);
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
