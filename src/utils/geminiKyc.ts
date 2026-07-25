import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KYC_API_KEY });

export async function verifyKycDocument(base64Image: string, mimeType: string, documentType: "Aadhaar" | "PAN"): Promise<{ valid: boolean; reason?: string }> {
    try {
        const promptText = documentType === "Aadhaar" ? `
You are a strict KYC Document Verifier.
Analyze the provided image and verify if it visually appears to be an Aadhaar card.
You must check for the following elements:
1. Aadhaar logo is present.
2. Aadhaar branding/text is present.
3. Government of India branding is present.
4. A clearly visible Aadhaar number exists in the expected Aadhaar number format (12 digits, allowing the standard spaced format).
5. A person's photograph is present.
6. A QR code is present.
7. A person's name is present.

Do NOT verify whether the Aadhaar is genuine, government records, QR authenticity, or detect forgery. Just verify if the visual elements exist.

Respond strictly in JSON format:
{
    "valid": true/false,
    "reason": "If invalid, explain which element is missing."
}
` : `
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
                        { inlineData: { data: base64Image, mimeType } }
                    ]
                }
            ],
            config: {
                temperature: 0.1,
                responseMimeType: "application/json"
            }
        });

        const resultText = response.text;
        if (!resultText) throw new Error("Empty response from AI");

        // Clean up markdown code blocks if the AI includes them
        const cleanedText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
        const result = JSON.parse(cleanedText);
        return {
            valid: result.valid === true,
            reason: result.reason
        };

    } catch (error: any) {
        console.error("Gemini KYC Verification Error:", error);
        fs.appendFileSync("kyc-error.log", new Date().toISOString() + " - " + documentType + " Error: " + (error.message || error.toString()) + "\nStack: " + error.stack + "\n\n");
        return { valid: false, reason: "AI verification failed due to an internal error." };
    }
}
