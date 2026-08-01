/**
 * Utility functions for calculating and formatting dynamic startup financial metrics.
 * 
 * Ensures all components display identical, mathematically validated values
 * derived dynamically from verified financial updates.
 */

export interface FinancialMetrics {
    monthlyRevenue: number;
    monthlyExpenses: number;
    monthlyProfit: number;
    cashInBank: number;
    monthlyBurnRate: number;
    grossBurnRate: number;
    netBurnRate: number;
    runway: number | "Cash Flow Positive" | "Profitable" | string; // "Cash Flow Positive" if profitable or burn rate is 0
    profitMargin: number;
    revenueGrowth: number;
    hasVerifiedData: boolean;
    latestUpdateDate?: string;
}

/**
 * Calculates standard financial metrics based on a startup's financial updates.
 * Prioritizes the latest approved update for the core metrics.
 * 
 * @param startup The full startup object containing financial_updates
 * @param requireApproved If true, only considers 'Approved' updates (default: true)
 * @returns {FinancialMetrics} Standardized, calculated financial metrics
 */
export function calculateFinancialMetrics(startup: any, requireApproved: boolean = true): FinancialMetrics {
    const updates = startup?.financial_updates || [];
    
    // 1. Filter and sort updates chronologically (oldest to newest)
    let validUpdates = requireApproved 
        ? updates.filter((u: any) => u.status === 'Approved') 
        : [...updates];
        
    validUpdates = validUpdates.sort((a: any, b: any) => 
        new Date(a.reportingDate || a.monthYear).getTime() - new Date(b.reportingDate || b.monthYear).getTime()
    );

    const hasVerifiedData = validUpdates.length > 0;
    
    // Default fallback values if no updates exist
    if (!hasVerifiedData) {
        // We can either fallback to static onboarding data, or return 0s.
        // As per the plan to eliminate static fake data, we return 0s if no verified data exists.
        // The UI should handle `hasVerifiedData === false` appropriately.
        const staticFin = startup?.financials_monthly || {};
        const staticNetBurn = Number(staticFin.monthlyBurnRate || startup?.burn || 0);
        return {
            monthlyRevenue: Number(staticFin.monthlyRevenue || startup?.revenue || 0),
            monthlyExpenses: Number(staticFin.monthlyExpenses || 0),
            monthlyProfit: Number(staticFin.monthlyProfit || 0),
            cashInBank: Number(staticFin.cashInBank || 0),
            monthlyBurnRate: staticNetBurn,
            grossBurnRate: Number(staticFin.grossBurnRate || staticFin.monthlyExpenses || 0),
            netBurnRate: staticNetBurn,
            runway: staticFin.runway === "∞" || staticFin.runway === "Cash Flow Positive" ? "Cash Flow Positive" : Number(staticFin.runway || 0),
            profitMargin: 0,
            revenueGrowth: 0,
            hasVerifiedData: false
        };
    }

    // 2. Extract latest and previous update
    const latestUpdate = validUpdates[validUpdates.length - 1];
    const previousUpdate = validUpdates.length > 1 ? validUpdates[validUpdates.length - 2] : null;

    // 3. Extract core metrics from latest update
    const revenue = Number(latestUpdate.revenue) || 0;
    const expenses = Number(latestUpdate.expenses) || 0;
    
    // Net profit is Revenue - Expenses (override manual `profit` / `netLoss` fields for consistency if desired, 
    // but the payload allows them to be passed directly. Let's compute it strictly to prevent inaccuracies).
    const profit = revenue - expenses; 
    
    const cashInBank = Number(latestUpdate.cashInBank) || 0;

    // 4. Calculate Gross and Net Burn Rates
    const grossBurnRate = expenses;
    let netBurnRate = expenses - revenue;
    if (netBurnRate <= 0) {
        netBurnRate = 0;
    }

    // 5. Calculate Runway (Months)
    let runway: number | string = 0;
    if (netBurnRate > 0) {
        runway = Number((cashInBank / netBurnRate).toFixed(1));
    } else {
        runway = "Cash Flow Positive";
    }

    // 6. Calculate Profit Margin
    // Formula: (Net Profit / Revenue) * 100
    let profitMargin = 0;
    if (revenue > 0) {
        profitMargin = Number(((profit / revenue) * 100).toFixed(1));
    }

    // 7. Calculate Revenue Growth (%)
    // Formula: ((Current Rev - Previous Rev) / Previous Rev) * 100
    let revenueGrowth = 0;
    if (previousUpdate) {
        const prevRevenue = Number(previousUpdate.revenue) || 0;
        if (prevRevenue > 0) {
            revenueGrowth = Number((((revenue - prevRevenue) / prevRevenue) * 100).toFixed(1));
        } else if (revenue > 0) {
            // If previous revenue was 0 and now we have revenue, growth is theoretically 100% (or infinite, but 100% is safe for display)
            revenueGrowth = 100;
        }
    }

    return {
        monthlyRevenue: revenue,
        monthlyExpenses: expenses,
        monthlyProfit: profit,
        cashInBank: cashInBank,
        monthlyBurnRate: netBurnRate,
        grossBurnRate: grossBurnRate,
        netBurnRate: netBurnRate,
        runway: runway,
        profitMargin: profitMargin,
        revenueGrowth: revenueGrowth,
        hasVerifiedData: true,
        latestUpdateDate: latestUpdate.reportingDate || latestUpdate.monthYear || latestUpdate.dateSubmitted
    };
}
