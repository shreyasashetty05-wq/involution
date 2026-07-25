import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: "AQ.Ab8RN6IOsRLKvgrifYOM6XG9g0mzbvw4RpqI5wQrbisHHRQziQ" });
async function list() {
    const response = await ai.models.list();
    console.log("Keys:", Object.keys(response));
    for (const key of Object.keys(response)) {
        if (Array.isArray(response[key])) {
            console.log(response[key].map(r => r.name).join("\n"));
        }
    }
}
list();
