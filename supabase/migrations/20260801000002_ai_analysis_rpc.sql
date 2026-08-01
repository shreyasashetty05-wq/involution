-- This function allows the internal API to update AI fields by bypassing RLS.
-- It runs with SECURITY DEFINER privileges.

CREATE OR REPLACE FUNCTION update_ai_analysis(
    p_table_name text,
    p_id uuid,
    p_score numeric,
    p_summary text,
    p_strengths jsonb,
    p_weaknesses jsonb,
    p_risks jsonb,
    p_suggestions jsonb,
    p_readiness text
) RETURNS void AS $$
BEGIN
    IF p_table_name = 'startups' THEN
        UPDATE startups SET
            ai_analysis_score = p_score,
            ai_executive_summary = p_summary,
            ai_strengths = p_strengths,
            ai_weaknesses = p_weaknesses,
            ai_business_risks = p_risks,
            ai_improvement_suggestions = p_suggestions,
            ai_investment_readiness = p_readiness,
            ai_analysis_timestamp = now()
        WHERE id = p_id;
    ELSIF p_table_name = 'incubation_applications' THEN
        UPDATE incubation_applications SET
            ai_analysis_score = p_score,
            ai_executive_summary = p_summary,
            ai_strengths = p_strengths,
            ai_weaknesses = p_weaknesses,
            ai_business_risks = p_risks,
            ai_improvement_suggestions = p_suggestions,
            ai_investment_readiness = p_readiness,
            ai_analysis_timestamp = now()
        WHERE id = p_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
