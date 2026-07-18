-- Create negotiations table
CREATE TABLE public.negotiations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Waiting for Startup' CHECK (status IN ('Waiting for Startup', 'Waiting for Investor', 'Counter Offer Sent', 'Accepted', 'Rejected', 'Locked', 'Ready for Agreement')),
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create negotiation_versions table
CREATE TABLE public.negotiation_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    proposed_by_type TEXT NOT NULL CHECK (proposed_by_type IN ('startup', 'investor')),
    proposed_by_id TEXT NOT NULL,
    
    -- Terms
    investment_amount NUMERIC NOT NULL,
    valuation NUMERIC NOT NULL,
    equity NUMERIC NOT NULL,
    investment_type TEXT NOT NULL,
    funding_round TEXT NOT NULL,
    board_seat INTEGER NOT NULL,
    liquidation_preference TEXT NOT NULL,
    closing_date TEXT NOT NULL,
    
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected', 'Countered', 'Current')),
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create negotiation_discussions table
CREATE TABLE public.negotiation_discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('startup', 'investor')),
    sender_id TEXT NOT NULL,
    message TEXT NOT NULL,
    referenced_term TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
