import { NextResponse } from 'next/server';
import dbConnect from "@/database/mongodb";
import Startup from "@/database/models/Startup";

export async function GET() {
    // Only allow in development
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEED) {
        return NextResponse.json({ success: false, error: 'Seeding not allowed in production' }, { status: 403 });
    }

    try {
        await dbConnect();

        // Delete existing Solaris AI if any
        await Startup.deleteMany({ name: "Solaris AI" });

        const dummyStartup = {
            name: "Solaris AI",
            ownerEmail: "founder@solaris.ai",
            sector: "CleanTech",
            stage: "Series A",
            businessModel: "SaaS + Hardware",
            desc: "Solaris AI uses proprietary neural networks to optimize grid energy distribution for renewable sources. We've scaled to 5 cities in 12 months with industry-leading efficiency gains.",
            requested: 50000000,
            equity: 12,
            revenue: 4500000,
            burn: 6000000,
            risk: "Medium",
            score: 85,
            videos: [
                {
                    title: "Solaris AI Product Demo",
                    thumb: "https://images.unsplash.com/photo-1509391366360-fe5bb6521e2c?auto=format&fit=crop&q=80&w=800",
                    url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
                }
            ],
            financials: {
                months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                revenue: [1200000, 1500000, 1800000, 2200000, 2500000, 2800000, 3200000, 3500000, 3800000, 4000000, 4200000, 4500000],
                netProfit: [-800000, -900000, -1000000, -1100000, -1200000, -1300000, -1400000, -1500000, -1500000, -1500000, -1500000, -1450000],
                roi: 420,
                cac: 12500,
                ltv: 75000
            },
            basicInfo: {
                founderNames: "Arjun Mehta, Sarah Chen",
                incorporationYear: 2022,
                companyType: "Private Ltd",
                location: "Bangalore, India",
                teamSize: 24
            },
            businessInfo: {
                revenueModel: "Subscription + Hardware Lease",
                targetMarket: "National Grid Operators",
                uvp: "Proprietary AI grid balancing algorithm",
                competitors: "GridLogic, PowerSync"
            },
            financialsMonthly: {
                revenue: 4500000,
                expenses: 6000000,
                cogs: 1200000,
                netProfit: -1500000,
                grossMargin: 73,
                netMargin: -33,
                burnRate: 1500000,
                runway: 32
            },
            financialsYearly: {
                annualRevenue: 48000000,
                annualExpenses: 65000000,
                ebitda: -17000000,
                assets: 85000000,
                liabilities: 12000000,
                cashInBank: 48000000,
                debt: 0
            },
            growthMetrics: {
                mau: 15400,
                churnRate: 1.2,
                conversionRate: 8.5,
                ordersPerMonth: 120,
                repeatCustomers: 92,
                appDownloads: 45000
            },
            credibility: {
                gstRegistered: true,
                panVerified: true,
                aadhaarVerified: true,
                bankVerified: true,
                incubatorBacked: true,
                gstSummaryUrl: "https://example.com/gst.pdf",
                bankStatementUrl: "https://example.com/bank.pdf",
                caCertificateUrl: "https://example.com/ca.pdf"
            },
            riskDisclosure: {
                legalCases: true,
                outstandingLoans: false,
                criminalRecord: false,
                revenueFluctuationExplanation: "Seasonal energy demand shifts."
            },
            aiReady: {
                last6MonthsRev: [3200000, 3500000, 3800000, 4000000, 4200000, 4500000],
                last6MonthsExp: [4000000, 4200000, 4500000, 5500000, 5800000, 6000000],
                growthRate: 15
            }
        };

        const created = await Startup.create(dummyStartup);

        return NextResponse.json({
            success: true,
            message: "Dummy startup 'Solaris AI' seeded successfully",
            id: created._id
        });
    } catch (error: any) {
        console.error("Seeding failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
