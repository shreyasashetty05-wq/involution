-- Add action column to negotiation_versions
ALTER TABLE public.negotiation_versions ADD COLUMN IF NOT EXISTS action TEXT DEFAULT 'Counter Offer' CHECK (action IN ('Initial Offer', 'Counter Offer', 'Accepted', 'Rejected'));

-- Update the negotiations status constraint to include the new states
ALTER TABLE public.negotiations DROP CONSTRAINT IF EXISTS negotiations_status_check;
ALTER TABLE public.negotiations ADD CONSTRAINT negotiations_status_check CHECK (
    status IN (
        'Initial Offer Available',
        'Pending Startup Confirmation',
        'Waiting for Investor Response',
        'Waiting for Startup Response',
        'Counter Offer Sent',
        'Negotiation Accepted',
        'Negotiation Rejected',
        'Negotiation Locked',
        -- keep old ones
        'Waiting for Startup',
        'Waiting for Investor',
        'Accepted',
        'Rejected',
        'Locked',
        'Ready for Agreement'
    )
);
