import mongoose, { Schema, Document } from 'mongoose';

export interface IVideo {
    title: string;
    thumb: string;
    url?: string;
}

export interface IFinancialUpdate {
    monthYear: string;
    revenue: number;
    profit: number;
    documentUrl?: string;
    aiConfidenceScore: number;
    dateSubmitted: Date;
}

export interface IFinancials {
    months: string[];
    revenue: number[];
    netProfit: number[];
    roi: number;
    cac: number;
    ltv: number;
}

export interface IStartup extends Document {
    name: string;
    ownerEmail: string;
    sector: string;
    stage: string;
    businessModel: string;
    requested: number;
    equity: number;
    risk: string;
    score: number;
    revenue: number;
    burn: number;
    desc: string;
    videos: IVideo[];
    financials: IFinancials;
    financialUpdates: IFinancialUpdate[];
    analysis?: string;

    // New Professional Domains
    basicInfo?: {
        founderNames: string;
        incorporationYear: number;
        companyType: string;
        location: string;
        teamSize: number;
    };
    businessInfo?: {
        revenueModel: string;
        targetMarket: string;
        uvp: string;
        competitors: string;
    };
    financialsMonthly?: {
        revenue: number;
        expenses: number;
        cogs: number;
        netProfit: number;
        grossMargin: number;
        netMargin: number;
        burnRate: number;
        runway: number;
    };
    financialsYearly?: {
        annualRevenue: number;
        annualExpenses: number;
        ebitda: number;
        assets: number;
        liabilities: number;
        cashInBank: number;
        debt: number;
    };
    investmentDetails?: {
        previousFunding: boolean;
        previousInvestors: string;
    };
    growthMetrics?: {
        mau: number;
        churnRate: number;
        conversionRate: number;
        ordersPerMonth: number;
        repeatCustomers: number;
        appDownloads: number;
    };
    operationalMetrics?: {
        skus: number;
        productionCapacity: string;
        inventoryStatus: string;
        supplyChain: string;
        deliveryTime: string;
        vendorCount: number;
    };
    credibility?: {
        gstRegistered: boolean;
        panVerified: boolean;
        aadhaarVerified: boolean;
        bankVerified: boolean;
        incubatorBacked: boolean;
        gstSummaryUrl: string;
        bankStatementUrl: string;
        caCertificateUrl: string;
    };
    riskDisclosure?: {
        legalCases: boolean;
        outstandingLoans: boolean;
        criminalRecord: boolean;
        revenueFluctuationExplanation: string;
    };
    aiReady?: {
        last6MonthsRev: number[];
        last6MonthsExp: number[];
        growthRate: number;
    };
}

const VideoSchema: Schema = new Schema({
    title: { type: String, required: true },
    thumb: { type: String, required: true },
    url: { type: String }
});

const FinancialUpdateSchema: Schema = new Schema({
    monthYear: { type: String, required: true },
    revenue: { type: Number, required: true },
    profit: { type: Number, required: true },
    documentUrl: { type: String },
    aiConfidenceScore: { type: Number, required: true },
    dateSubmitted: { type: Date, default: Date.now }
});

const FinancialsSchema: Schema = new Schema({
    months: { type: [String], default: [] },
    revenue: { type: [Number], default: [] },
    netProfit: { type: [Number], default: [] },
    roi: { type: Number, default: 0 },
    cac: { type: Number, default: 0 },
    ltv: { type: Number, default: 0 }
});

const StartupSchema: Schema = new Schema({
    name: { type: String, required: true },
    ownerEmail: { type: String, required: true },
    sector: { type: String, required: true },
    stage: { type: String, enum: ['Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B+'], default: 'Seed' },
    businessModel: { type: String, default: "B2B SaaS" },
    requested: { type: Number, required: true },
    equity: { type: Number, required: true },
    risk: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    score: { type: Number, default: 80 },
    revenue: { type: Number, required: true },
    burn: { type: Number, required: true },
    desc: { type: String, required: true },
    videos: { type: [VideoSchema], default: [] },
    financials: { type: FinancialsSchema, default: {} },
    financialUpdates: { type: [FinancialUpdateSchema], default: [] },
    analysis: { type: String, default: "" },

    // New Domains
    basicInfo: {
        founderNames: { type: String, default: "" },
        incorporationYear: { type: Number, default: new Date().getFullYear() },
        companyType: { type: String, default: "Private Ltd" },
        location: { type: String, default: "" },
        teamSize: { type: Number, default: 1 }
    },
    businessInfo: {
        revenueModel: { type: String, default: "Subscription" },
        targetMarket: { type: String, default: "" },
        uvp: { type: String, default: "" },
        competitors: { type: String, default: "" }
    },
    financialsMonthly: {
        revenue: { type: Number, default: 0 },
        expenses: { type: Number, default: 0 },
        cogs: { type: Number, default: 0 },
        netProfit: { type: Number, default: 0 },
        grossMargin: { type: Number, default: 0 },
        netMargin: { type: Number, default: 0 },
        burnRate: { type: Number, default: 0 },
        runway: { type: Number, default: 0 }
    },
    financialsYearly: {
        annualRevenue: { type: Number, default: 0 },
        annualExpenses: { type: Number, default: 0 },
        ebitda: { type: Number, default: 0 },
        assets: { type: Number, default: 0 },
        liabilities: { type: Number, default: 0 },
        cashInBank: { type: Number, default: 0 },
        debt: { type: Number, default: 0 }
    },
    investmentDetails: {
        previousFunding: { type: Boolean, default: false },
        previousInvestors: { type: String, default: "" }
    },
    growthMetrics: {
        mau: { type: Number, default: 0 },
        churnRate: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 },
        ordersPerMonth: { type: Number, default: 0 },
        repeatCustomers: { type: Number, default: 0 },
        appDownloads: { type: Number, default: 0 }
    },
    operationalMetrics: {
        skus: { type: Number, default: 0 },
        productionCapacity: { type: String, default: "" },
        inventoryStatus: { type: String, default: "" },
        supplyChain: { type: String, default: "" },
        deliveryTime: { type: String, default: "" },
        vendorCount: { type: Number, default: 0 }
    },
    credibility: {
        gstRegistered: { type: Boolean, default: false },
        panVerified: { type: Boolean, default: false },
        aadhaarVerified: { type: Boolean, default: false },
        bankVerified: { type: Boolean, default: false },
        incubatorBacked: { type: Boolean, default: false },
        gstSummaryUrl: { type: String, default: "" },
        bankStatementUrl: { type: String, default: "" },
        caCertificateUrl: { type: String, default: "" }
    },
    riskDisclosure: {
        legalCases: { type: Boolean, default: false },
        outstandingLoans: { type: Boolean, default: false },
        criminalRecord: { type: Boolean, default: false },
        revenueFluctuationExplanation: { type: String, default: "" }
    },
    aiReady: {
        last6MonthsRev: { type: [Number], default: [0, 0, 0, 0, 0, 0] },
        last6MonthsExp: { type: [Number], default: [0, 0, 0, 0, 0, 0] },
        growthRate: { type: Number, default: 0 }
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Avoid recompiling model during Next.js Hot Reloads
export default mongoose.models.Startup || mongoose.model<IStartup>('Startup', StartupSchema);
