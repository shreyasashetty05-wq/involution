"use client";

import { useState, useEffect } from "react";

interface UseFetchReportResult<R, S> {
    report: R | null;
    startup: S | null;
    loading: boolean;
    error: string;
}

/**
 * Shared data-fetching hook for the startup AI sub-pages
 * (health, trust, compliance, due-diligence).
 *
 * All four pages fetch the exact same shape:
 *   GET /api/startups/:id/<module>
 *   → { success: boolean, report: R, startup: S, error?: string }
 */
export function useFetchReport<R = Record<string, any>, S = Record<string, any>>(
    id: string | undefined,
    module: string
): UseFetchReportResult<R, S> {
    const [report, setReport] = useState<R | null>(null);
    const [startup, setStartup] = useState<S | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        void fetch(`/api/startups/${id}/${module}`)
            .then(r => r.json())
            .then((data: Record<string, unknown>) => {
                if (data.success) {
                    setReport(data.report as R);
                    setStartup(data.startup as S);
                } else {
                    setError(String(data.error) || "Failed to load");
                }
                return undefined;
            })
            .catch(() => setError("Network error"))
            .finally(() => setLoading(false));
    }, [id, module]);

    return { report, startup, loading, error };
}
