import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AQ.Ab8RN6IOsRLKvgrifYOM6XG9g0mzbvw4RpqI5wQrbisHHRQziQ" });

async function run() {
    try {
        const promptText = `
You are a strict KYC Document Verifier.
Analyze the provided image and verify if it visually appears to be a PAN card.
You must check for the following elements:
1. PAN branding/logo is present.
2. A clearly visible PAN number exists in the correct format (five letters, four digits, one letter).
3. A person's photograph is present.
4. A person's name is present.

Do NOT verify authenticity. Just verify if the visual elements exist.

Respond strictly in JSON format:
{
    "valid": true/false,
    "reason": "If invalid, explain which element is missing."
}
`;
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: promptText },
                        { inlineData: { data: "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", mimeType: "image/gif" } }
                    ]
                }
            ],
            config: {
                temperature: 0.1,
                responseMimeType: "application/json"
            }
        });
        console.log("Success:", response.text);
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
