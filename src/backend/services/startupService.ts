import Startup from "@/database/models/Startup";
import { extractYoutubeId } from "@/backend/utils/youtube";

/**
 * Creates and persists a new startup record from the provided payload, calculating derived financial values and normalizing video links.
 * @example
 * sync(body, ownerEmail)
 * createdStartup
 * @param {any} body - Startup input payload containing company details, funding data, metrics, and media links.
 * @param {string} ownerEmail - Email address of the startup owner to associate with the record.
 * @returns {Promise<any>} A promise that resolves to the created startup record.
 **/
export const publishStartup = async (body: any, ownerEmail: string) => {
    const targetRev = Number(body.mrr);
    const profitMargin = Number(body.netProfitMargin) / 100;
    const targetProfit = targetRev * profitMargin;

    // Generate a 12-month curve leading up to the target metrics
    const generatedMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const generatedRev = [];
    const generatedProfit = [];
    for (let i = 0; i < 12; i+=1) {
        const growthFactor = Math.pow(1.05, i - 11);
        generatedRev.push(targetRev * growthFactor);
        generatedProfit.push((targetRev * growthFactor) * profitMargin);
    }

    const newStartupData = {
        name: body.name,
        ownerEmail: ownerEmail,
        sector: body.sector,
        businessModel: body.businessModel,
        desc: body.description,
        requested: Number(body.fundingRequired),
        equity: Number(body.equityForSale),
        revenue: targetRev,
        burn: targetRev - targetProfit,
        risk: "Medium",
        score: 80,
        isStudent: body.isStudent || false,
        founderAge: body.founderAge,
        videos: body.videos.filter((v: string) => v.trim() !== "").map((url: string) => {
            const yId = extractYoutubeId(url);
            return {
                title: "Pitch Video",
                thumb: yId ? `https://img.youtube.com/vi/${yId}/hqdefault.jpg` : "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800",
                url: yId ? `https://www.youtube.com/embed/${yId}` : url
            }
        }),
        financials: {
            months: generatedMonths,
            revenue: generatedRev,
            netProfit: generatedProfit,
            roi: Number(body.projectedROI) || 0,
            cac: Number(body.cac) || 0,
            ltv: Number(body.ltv) || 0
        },
        basicInfo: body.basicInfo || {},
        businessInfo: body.businessInfo || {},
        financialsMonthly: body.financialsMonthly || {},
        financialsYearly: body.financialsYearly || {},
        investmentDetails: body.investmentDetails || {},
        growthMetrics: body.growthMetrics || {},
        operationalMetrics: body.operationalMetrics || {},
        credibility: body.credibility || {},
        riskDisclosure: body.riskDisclosure || {},
        aiReady: body.aiReady || {}
    };

    return await Startup.create(newStartupData);
};
